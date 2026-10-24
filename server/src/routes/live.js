const express = require("express");
const { LiveSession } = require("../models");
const { requireAuth } = require("../middleware/auth");
const { clamp } = require("../utils/helpers");
const { buildRoute } = require("../geo");

const router = express.Router();

// Full route takes this long at 1× speed — same value as the client
// (client/src/lib/liveTracking.js SIM_BASE_DURATION_MS).
const SIM_BASE_DURATION_MS = 120000;

function statusLabelFor(progress) {
  const p = clamp(Number(progress) || 0, 0, 1);
  if (p >= 1) return "Delivered";
  if (p >= 0.92) return "Out for delivery";
  if (p >= 0.35) return "In transit";
  if (p >= 0.12) return "Picked up";
  return "Preparing pickup";
}

// The simulation advances by elapsed time, not by ticks: while the
// status is "running" progress = baseProgress + elapsed * speed / BASE.
const nowMs = () => Date.now();

function elapsedSince(session) {
  if (!session.baseAt) return 0;
  const elapsed = nowMs() - new Date(session.baseAt).getTime();
  // Clamp so a sleeping backend / clock jump cannot teleport the parcel.
  return clamp(elapsed, 0, 2000 * 60);
}

// Compute the effective progress & status for the stored session row.
function snapshot(session) {
  if (session.status === "running") {
    const elapsed = elapsedSince(session);
    const progress = clamp(
      (session.baseProgress || 0) +
        (elapsed * (session.speed || 1)) / SIM_BASE_DURATION_MS,
      0,
      1
    );
    session.progress = progress;
    if (progress >= 1) {
      session.status = "completed";
      session.baseProgress = 1;
    }
  }
  return session;
}

function serialize(session) {
  const s = snapshot(session);
  const finished = s.status === "completed";
  return {
    status: s.status,
    trackNumber: s.trackNumber,
    shipmentId: s.shipmentId,
    origin: s.origin,
    destination: s.destination,
    route: s.route || [],
    progress: Number(s.progress) || 0,
    speed: Number(s.speed) || 1,
    statusLabel: s.status === "idle" ? "Idle" : statusLabelFor(s.progress),
    startedAt: s.startedAt,
    updatedAt: s.updatedAt,
  };
}

async function getSession() {
  let session = await LiveSession.findByPk(1);
  if (!session) {
    session = await LiveSession.create({ id: 1, status: "idle" });
  }

  // Persist the finished state the first time it crosses 100%.
  const before = session.status;
  const snap = snapshot(session);
  if (before === "running" && snap.status === "completed") {
    await session.save();
    await completeLinkedShipment(snap);
  }
  return session;
}

// -------------------------------------------------------------------
// When the simulation completes, write the delivery back onto the
// linked shipment so the tracking timeline matches the map.
// -------------------------------------------------------------------
async function completeLinkedShipment(session) {
  try {
    const {
      Shipment,
      ShipmentEvent,
    } = require("../models");
    const shipmentsApi = require("./shipments");

    let shipment = null;
    if (session.shipmentId) {
      shipment = await Shipment.findByPk(session.shipmentId);
    } else if (session.trackNumber) {
      shipment = await Shipment.findOne({
        where: { trackingNumber: String(session.trackNumber).trim() },
      });
    }
    if (!shipment) return;
    if (shipment.status === "Delivered") return;

    shipment.status = "Delivered";
    await shipment.save();

    const event = await ShipmentEvent.create({
      shipmentId: shipment.id,
      status: "Delivered",
      location: session.destination || shipment.destination,
      description: "Delivered — live route simulation completed",
      createdBy: "Live simulation",
    });

    if (typeof shipmentsApi.notifySubscribers === "function") {
      shipmentsApi.notifySubscribers(shipment, event);
    }
  } catch (err) {
    console.error("[live completion]", err.message);
  }
}

async function saveCurrentProgress(session) {
  // Freeze progress where it is: set the base to the current point.
  snapshot(session);
  session.baseProgress = Number(session.progress) || 0;
  session.baseAt = new Date();
  await session.save();
}

// --- GET /api/live (PUBLIC) — current simulation state --------------
router.get("/", async (req, res) => {
  try {
    res.json(serialize(await getSession()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- POST /api/live/start {trackNumber, shipmentId, origin, destination, speed}
router.post("/start", requireAuth, async (req, res) => {
  try {
    const { trackNumber, shipmentId, origin, destination } = req.body ?? {};

    if (!String(origin ?? "").trim() || !String(destination ?? "").trim()) {
      return res
        .status(400)
        .json({ error: "Origin and destination are required." });
    }

    const speedRaw = Number(req.body?.speed);
    const speed = clamp(Number.isFinite(speedRaw) && speedRaw > 0 ? speedRaw : 0.5, 0.5, 20);

    const session = await getSession();
    session.set({
      status: "running",
      trackNumber: trackNumber ? String(trackNumber).trim() : null,
      shipmentId: shipmentId ?? null,
      origin: String(origin).trim(),
      destination: String(destination).trim(),
      route: buildRoute(session.origin, session.destination),
      progress: 0,
      baseProgress: 0,
      baseAt: new Date(),
      speed,
      startedAt: new Date(),
    });
    await session.save();

    res.json(serialize(session));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- POST /api/live/pause -------------------------------------------
router.post("/pause", requireAuth, async (req, res) => {
  try {
    const session = await getSession();
    if (session.status !== "running") {
      return res.status(400).json({ error: "No running simulation to pause." });
    }
    await saveCurrentProgress(session);
    session.status = "paused";
    await session.save();
    res.json(serialize(session));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- POST /api/live/resume ------------------------------------------
router.post("/resume", requireAuth, async (req, res) => {
  try {
    const session = await getSession();
    if (session.status !== "paused") {
      return res.status(400).json({ error: "No paused simulation to resume." });
    }
    session.status = "running";
    session.baseProgress = session.progress;
    session.baseAt = new Date();
    await session.save();
    res.json(serialize(session));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- POST /api/live/stop --------------------------------------------
router.post("/stop", requireAuth, async (req, res) => {
  try {
    const session = await getSession();
    if (session.status === "idle") {
      return res.status(400).json({ error: "There is no active simulation." });
    }
    await saveCurrentProgress(session);
    session.status = "stopped";
    await session.save();
    res.json(serialize(session));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- POST /api/live/reset — clear the map entirely -------------------
router.post("/reset", requireAuth, async (req, res) => {
  try {
    const session = await getSession();
    session.set({
      status: "idle",
      trackNumber: null,
      shipmentId: null,
      origin: "",
      destination: "",
      route: [],
      progress: 0,
      baseProgress: 0,
      baseAt: null,
      startedAt: null,
    });
    await session.save();
    res.json(serialize(session));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- POST /api/live/speed {speed} — change on the fly ---------------
// Freezes progress at the current point, then continues from there.
router.post("/speed", requireAuth, async (req, res) => {
  try {
    const session = await getSession();
    if (session.status === "running") {
      await saveCurrentProgress(session);
    }
    const speedRaw = Number(req.body?.speed);
    if (!Number.isFinite(speedRaw)) {
      return res.status(400).json({ error: "Speed must be a number." });
    }
    session.speed = clamp(speedRaw, 0.5, 20);
    session.baseAt = new Date();
    await session.save();
    res.json(serialize(session));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// -------------------------------------------------------------------
// Live tracking (several concurrent runs)
// -------------------------------------------------------------------
// The admin can start more than one simulated route at the same time.
// Every run is a row in MySQL, so all visitors (including customers on
// another device) see the same positions. Progress is derived from time
// on the server, which keeps moving even if the admin closes the tab.
//
//   GET    /api/live                 -> { runs: [...], serverTime }  (public)
//   POST   /api/live/start           -> create a run                 (admin)
//   POST   /api/live/:id/pause       -> pause a run                  (admin)
//   POST   /api/live/:id/resume      -> resume a run                 (admin)
//   POST   /api/live/:id/stop        -> stop a run                   (admin)
//   PATCH  /api/live/:id/speed       -> { transportMode }            (admin)
//   DELETE /api/live/:id             -> remove a run                 (admin)
//   POST   /api/live/reset           -> remove every run             (admin)
// -------------------------------------------------------------------

const express = require("express");
const { Op } = require("sequelize");
const { LiveRun, Shipment, Courier } = require("../models");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
  asyncHandler,
  badRequest,
  notFound,
  conflict,
} = require("../utils/errors");
const { validate, assertValid } = require("../utils/validation");
const { geocodePlace, validCoords, manualCoords } = require("../utils/geocode");
const {
  TRANSPORT_SPEED_KMH,
  DEFAULT_TRANSPORT_MODE,
  normalizeTransportMode,
  distanceKmBetween,
  durationMsFor,
} = require("../utils/travel");

const router = express.Router();

// Legacy runs (created before real speeds) used a 2-minute multiplier.
const LEGACY_DURATION_MS = 120000;

const STATUS_LABEL = {
  running: "Live",
  paused: "Paused",
  stopped: "Stopped",
  completed: "Delivered",
};

const courierInclude = {
  model: Courier,
  as: "deliveryPerson",
  required: false,
  attributes: ["id", "name", "phone", "vehicle"],
};

const runInclude = [
  {
    model: Shipment,
    as: "shipment",
    required: false,
    include: [courierInclude],
  },
];

const clean = (value, max) => String(value ?? "").trim().slice(0, max);

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function speedKmhForMode(mode) {
  return TRANSPORT_SPEED_KMH[mode] || TRANSPORT_SPEED_KMH[DEFAULT_TRANSPORT_MODE];
}

// New runs store their duration explicitly. Rows written by older versions
// have durationMs = 0, so they keep their old multiplier-based timing.
function durationMsOf(run) {
  const explicit = Number(run.durationMs);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const legacy = Math.min(
    20,
    Math.max(0.1, Number(run.speed) || 1)
  );
  return LEGACY_DURATION_MS / legacy;
}

function travelFor(body, originCoords, destinationCoords, fallbackMode) {
  const mode = normalizeTransportMode(
    body.transportMode || body.mode,
    fallbackMode || DEFAULT_TRANSPORT_MODE
  );
  const speedKmh = speedKmhForMode(mode);
  const distanceKm = distanceKmBetween(originCoords, destinationCoords);
  return {
    mode,
    speedKmh,
    distanceKm,
    durationMs: durationMsFor(distanceKm, speedKmh),
  };
}

function progressOf(run, now = Date.now()) {
  let progress = Number(run.baseProgress) || 0;

  if (run.status === "running" && run.runningSince) {
    const since = new Date(run.runningSince).getTime();
    const duration = durationMsOf(run);
    if (Number.isFinite(since) && duration > 0) {
      progress += Math.max(0, now - since) / duration;
    }
  }

  return Math.max(0, Math.min(1, progress));
}

// Mark a run completed in the database the first time its progress passes
// the finish line. Called by reads and actions, not by every timer tick.
async function normalizeRun(run, now = Date.now()) {
  if (run.status === "running" && progressOf(run, now) >= 1) {
    run.status = "completed";
    run.baseProgress = 1;
    run.runningSince = null;
    await run.save();
  }
  return run;
}

function serializeRun(run, now = Date.now()) {
  const progress = progressOf(run, now);
  const shipment = run.shipment;
  const courier = shipment?.deliveryPerson;

  return {
    id: run.id,
    status: run.status,
    statusLabel: STATUS_LABEL[run.status] || run.status,
    trackNumber: run.trackNumber,
    shipmentId: run.shipmentId,
    shipmentStatus: shipment?.status || null,
    origin: run.origin,
    destination: run.destination,
    originLat: toNumber(run.originLat),
    originLng: toNumber(run.originLng),
    destinationLat: toNumber(run.destinationLat),
    destinationLng: toNumber(run.destinationLng),
    progress: Number(progress.toFixed(4)),
    transportMode: run.transportMode || DEFAULT_TRANSPORT_MODE,
    speedKmh: Number(run.speedKmh) || speedKmhForMode(run.transportMode),
    speed: Number(run.speed) || Number(run.speedKmh) || 70,
    distanceKm: Number(run.distanceKm) || 0,
    durationMs: Number(run.durationMs) || 0,
    courier: courier
      ? {
          id: courier.id,
          name: courier.name,
          phone: courier.phone,
          vehicle: courier.vehicle,
        }
      : null,
    startedAt: run.startedAt,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

async function loadRun(id) {
  return LiveRun.findByPk(id, { include: runInclude });
}

async function getRunOr404(id) {
  const run = await LiveRun.findByPk(id);
  if (!run) throw notFound("Live run not found");
  return run;
}

async function respondWithRun(res, id) {
  const run = await loadRun(id);
  res.json(serializeRun(run));
}

async function findShipment(body) {
  if (body.shipmentId !== undefined && clean(body.shipmentId) !== "") {
    const id = Number(body.shipmentId);
    if (!Number.isInteger(id) || id <= 0) {
      throw badRequest("Choose a valid shipment.");
    }
    const shipment = await Shipment.findByPk(id, { include: [courierInclude] });
    if (!shipment) throw badRequest("The selected shipment does not exist.");
    return shipment;
  }

  if (clean(body.trackNumber) !== "") {
    const shipment = await Shipment.findOne({
      where: { trackingNumber: clean(body.trackNumber, 40).toUpperCase() },
      include: [courierInclude],
    });
    if (shipment) return shipment;
  }

  return null;
}

async function resolveEndpointCoords(body, shipment, prefix) {
  const manual = validCoords(body[`${prefix}Lat`], body[`${prefix}Lng`]);
  if (manual) return manual;

  if (
    shipment &&
    toNumber(shipment[`${prefix}Lat`]) !== null &&
    toNumber(shipment[`${prefix}Lng`]) !== null
  ) {
    return {
      lat: Number(shipment[`${prefix}Lat`]),
      lng: Number(shipment[`${prefix}Lng`]),
    };
  }

  return geocodePlace({
    city: shipment?.[prefix] || body[prefix],
    address: shipment?.[`${prefix}Address`] || body[`${prefix}Address`] || "",
    region: shipment?.[`${prefix}Region`] || body[`${prefix}Region`] || "",
    postalCode:
      shipment?.[`${prefix}PostalCode`] || body[`${prefix}PostalCode`] || "",
    country: shipment?.[`${prefix}Country`] || body[`${prefix}Country`] || "",
  });
}

// GET /api/live - public
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const now = Date.now();
    const where = {};
    if (clean(req.query.trackNumber) !== "") {
      where.trackNumber = clean(req.query.trackNumber, 40).toUpperCase();
    }

    const rows = await LiveRun.findAll({
      where,
      include: runInclude,
      order: [
        ["createdAt", "ASC"],
        ["id", "ASC"],
      ],
    });

    await Promise.all(rows.map((row) => normalizeRun(row, now)));

    res.json({
      runs: rows.map((row) => serializeRun(row, now)),
      serverTime: new Date(now).toISOString(),
    });
  })
);

// POST /api/live/start - admin
router.post(
  "/start",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const errors = validate(req.body, {
      trackNumber: { maxLength: 40, label: "Tracking number" },
      origin: { maxLength: 160, label: "Origin" },
      destination: { maxLength: 160, label: "Destination" },
    });
    assertValid(errors);

    const shipment = await findShipment(req.body);

    if (shipment) {
      const active = await LiveRun.findOne({
        where: {
          shipmentId: shipment.id,
          status: { [Op.in]: ["running", "paused"] },
        },
        order: [["createdAt", "DESC"]],
      });
      if (active) {
        await normalizeRun(active);
        if (active.status === "running" || active.status === "paused") {
          throw conflict(
            `${shipment.trackingNumber} already has an active simulation. Pause it, stop it, or remove it before starting again.`
          );
        }
      }
    }

    const origin = clean(
      shipment?.origin || req.body.origin,
      160
    );
    const destination = clean(
      shipment?.destination || req.body.destination,
      160
    );

    if (!origin || !destination) {
      throw badRequest("Origin and destination are required.");
    }

    if (
      (clean(req.body.originLat) !== "" && clean(req.body.originLng) === "") ||
      (clean(req.body.originLat) === "" && clean(req.body.originLng) !== "")
    ) {
      throw badRequest("Enter both origin latitude and longitude.");
    }
    if (
      (clean(req.body.destinationLat) !== "" &&
        clean(req.body.destinationLng) === "") ||
      (clean(req.body.destinationLat) === "" &&
        clean(req.body.destinationLng) !== "")
    ) {
      throw badRequest("Enter both destination latitude and longitude.");
    }

    const originCoords = await resolveEndpointCoords(
      req.body,
      shipment,
      "origin"
    );
    const destinationCoords = await resolveEndpointCoords(
      req.body,
      shipment,
      "destination"
    );

    // If an older shipment has no stored coordinates, keep the newly
    // resolved ones so the tracking page can use them later as well.
    if (shipment) {
      const patch = {};
      if (originCoords && toNumber(shipment.originLat) === null) {
        patch.originLat = originCoords.lat;
        patch.originLng = originCoords.lng;
      }
      if (destinationCoords && toNumber(shipment.destinationLat) === null) {
        patch.destinationLat = destinationCoords.lat;
        patch.destinationLng = destinationCoords.lng;
      }
      if (Object.keys(patch).length > 0) await shipment.update(patch);
    }

    const travel = travelFor(req.body, originCoords, destinationCoords);
    const now = new Date();
    const run = await LiveRun.create({
      status: "running",
      trackNumber: shipment
        ? shipment.trackingNumber
        : clean(req.body.trackNumber, 40) || null,
      shipmentId: shipment ? shipment.id : null,
      origin,
      destination,
      originLat: originCoords?.lat ?? null,
      originLng: originCoords?.lng ?? null,
      destinationLat: destinationCoords?.lat ?? null,
      destinationLng: destinationCoords?.lng ?? null,
      baseProgress: 0,
      transportMode: travel.mode,
      speedKmh: travel.speedKmh,
      speed: travel.speedKmh,
      distanceKm: travel.distanceKm,
      durationMs: travel.durationMs,
      runningSince: now,
      startedAt: now,
    });

    const loaded = await loadRun(run.id);
    res.status(201).json(serializeRun(loaded));
  })
);

// Pause a run.
router.post(
  "/:id/pause",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const run = await getRunOr404(req.params.id);
    await normalizeRun(run);

    if (run.status === "running") {
      run.baseProgress = progressOf(run);
      run.status = "paused";
      run.runningSince = null;
      await run.save();
    } else if (run.status === "stopped") {
      throw badRequest("This run was stopped. Start a new one instead.");
    }

    await respondWithRun(res, run.id);
  })
);

// Resume a paused run.
router.post(
  "/:id/resume",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const run = await getRunOr404(req.params.id);
    await normalizeRun(run);

    if (run.status === "completed") {
      throw conflict("This run has already been delivered.");
    }
    if (run.status === "stopped") {
      throw badRequest("This run was stopped. Start a new one instead.");
    }

    if (run.status === "paused") {
      if (progressOf(run) >= 1) {
        run.status = "completed";
        run.baseProgress = 1;
        run.runningSince = null;
      } else {
        run.status = "running";
        run.runningSince = new Date();
      }
      await run.save();
    }

    await respondWithRun(res, run.id);
  })
);

// Stop a run (keeps it on the map until the admin removes it).
router.post(
  "/:id/stop",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const run = await getRunOr404(req.params.id);
    await normalizeRun(run);

    if (run.status !== "completed") {
      run.baseProgress = progressOf(run);
      run.status = "stopped";
      run.runningSince = null;
      await run.save();
    }

    await respondWithRun(res, run.id);
  })
);

// Change the transport mode while running: checkpoint the progress first so
// the already-covered distance is not recalculated with the new speed.
router.patch(
  "/:id/speed",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const run = await getRunOr404(req.params.id);
    await normalizeRun(run);

    if (run.status === "completed") {
      throw conflict("This run has already been delivered.");
    }
    if (run.status === "stopped") {
      throw badRequest("This run was stopped. Start a new one instead.");
    }

    const travel = travelFor(
      req.body,
      { lat: Number(run.originLat), lng: Number(run.originLng) },
      { lat: Number(run.destinationLat), lng: Number(run.destinationLng) },
      run.transportMode
    );
    const distanceKm =
      Number(run.distanceKm) > 0 ? Number(run.distanceKm) : travel.distanceKm;

    if (run.status === "running") {
      run.baseProgress = progressOf(run);
      run.runningSince = new Date();
    }
    run.transportMode = travel.mode;
    run.speedKmh = travel.speedKmh;
    run.speed = travel.speedKmh;
    run.distanceKm = distanceKm;
    run.durationMs = durationMsFor(distanceKm, travel.speedKmh);
    await run.save();

    await respondWithRun(res, run.id);
  })
);

// Remove a run from the map entirely.
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const run = await getRunOr404(req.params.id);
    await run.destroy();
    res.json({ deleted: true, id: Number(req.params.id) });
  })
);

// Remove every run (handy "Clear all" button).
router.post(
  "/reset",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await LiveRun.destroy({ where: {} });
    res.json({ runs: [] });
  })
);

module.exports = router;

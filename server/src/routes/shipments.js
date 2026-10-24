const express = require("express");
const { Shipment, ShipmentEvent } = require("../models");
const { requireAuth } = require("../middleware/auth");
const {
  STATUSES,
  PHONE_RE,
  generateTrackingNumber,
} = require("../utils/helpers");

const router = express.Router();

// Serialise a shipment + its events (includes handle it cleanly).
function serializeShipment(shipment) {
  const json = shipment.toJSON();
  json.events = (json.events || [])
    .map((event) => ({
      id: event.id,
      status: event.status,
      location: event.location,
      description: event.description || "",
      createdAt: event.createdAt,
    }))
    // Oldest first so the timeline reads top-down.
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return json;
}

async function loadShipment(trackingNumber) {
  return Shipment.findOne({
    where: { trackingNumber: String(trackingNumber).trim() },
    include: { model: ShipmentEvent, as: "events" },
  });
}

// --- GET /api/shipments (ADMIN) — full list, newest first -----------
router.get("/", requireAuth, async (req, res) => {
  try {
    const shipments = await Shipment.findAll({
      include: { model: ShipmentEvent, as: "events" },
      order: [["createdAt", "DESC"]],
    });
    res.json(shipments.map(serializeShipment));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- POST /api/shipments (ADMIN) — create a shipment ----------------
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      senderName,
      receiverName,
      receiverPhone,
      origin,
      destination,
      weight,
      description,
    } = req.body ?? {};

    const errors = [];
    if (!String(senderName ?? "").trim()) errors.push("Sender name is required.");
    if (!String(receiverName ?? "").trim()) errors.push("Receiver name is required.");
    if (!String(receiverPhone ?? "").trim()) {
      errors.push("Receiver phone is required.");
    } else if (!PHONE_RE.test(String(receiverPhone).trim())) {
      errors.push("Enter a valid phone number.");
    }
    if (!String(origin ?? "").trim()) errors.push("Origin is required.");
    if (!String(destination ?? "").trim()) errors.push("Destination is required.");
    if (weight === undefined || weight === "" || isNaN(Number(weight))) {
      errors.push("Weight must be a number.");
    } else if (Number(weight) <= 0) {
      errors.push("Weight must be greater than zero.");
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(" ") });
    }

    // Tracking numbers must be unique — retry in the unlikely case of a
    // collision with one of the 33^9 combos.
    let shipment;
    for (let attempt = 0; attempt < 5 && !shipment; attempt += 1) {
      try {
        shipment = await Shipment.create({
          trackingNumber: generateTrackingNumber(),
          senderName: String(senderName).trim(),
          receiverName: String(receiverName).trim(),
          receiverPhone: String(receiverPhone).trim(),
          origin: String(origin).trim(),
          destination: String(destination).trim(),
          weight: Number(weight),
          description: String(description ?? "").trim(),
          status: "Created",
        });
      } catch (err) {
        if (attempt === 4) throw err;
        // Collision on trackingNumber — retry with a new code.
      }
    }

    await ShipmentEvent.create({
      shipmentId: shipment.id,
      status: "Created",
      location: shipment.origin,
      description: "Shipment created",
    });

    const fresh = await loadShipment(shipment.trackingNumber);
    res.status(201).json(serializeShipment(fresh));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- GET /api/shipments/:trackingNumber (PUBLIC) — tracking lookup --
router.get("/:trackingNumber", async (req, res) => {
  try {
    const shipment = await loadShipment(req.params.trackingNumber);
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }
    res.json(serializeShipment(shipment));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- POST /api/shipments/:trackingNumber/events (ADMIN) ------------
// Adds a tracking update; the shipment status moves to the event status.
router.post("/:trackingNumber/events", requireAuth, async (req, res) => {
  try {
    const { status, location, description } = req.body ?? {};

    if (!STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${STATUSES.join(", ")}.`,
      });
    }
    if (!String(location ?? "").trim()) {
      return res.status(400).json({ error: "Location is required." });
    }

    const shipment = await loadShipment(req.params.trackingNumber);
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    await ShipmentEvent.create({
      shipmentId: shipment.id,
      status,
      location: String(location).trim(),
      description: String(description ?? "").trim(),
    });

    // Adding an update also moves the shipment to that status.
    shipment.status = status;
    await shipment.save();

    const fresh = await loadShipment(shipment.trackingNumber);
    res.json(serializeShipment(fresh));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

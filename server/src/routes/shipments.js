const express = require("express");
const crypto = require("crypto");
const { Shipment, ShipmentEvent, Subscription } = require("../models");
const { requireAuth } = require("../middleware/auth");
const { STATUSES, PHONE_RE } = require("../utils/helpers");
const mailer = require("../mailer");

const router = express.Router();

function serializeShipment(shipment) {
  const json = shipment.toJSON();
  json.events = (json.events || [])
    .map((event) => ({
      id: event.id,
      status: event.status,
      location: event.location,
      description: event.description || "",
      createdBy: event.createdBy || null,
      createdAt: event.createdAt,
    }))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return json;
}

async function loadShipment(trackingNumber) {
  return Shipment.findOne({
    where: { trackingNumber: String(trackingNumber).trim() },
    include: { model: ShipmentEvent, as: "events" },
  });
}

// -------------------------------------------------------------------
// Status transition rules (Tier-3 item): Delivered is terminal, a
// parcel normally moves forward, and Delayed can resume to any
// non-delivered stage.
// -------------------------------------------------------------------
const FORWARD = {
  Created: ["Picked up", "In transit", "Out for delivery", "Delayed"],
  "Picked up": ["In transit", "Out for delivery", "Delayed"],
  "In transit": ["Out for delivery", "Delayed"],
  "Out for delivery": ["Delivered", "Delayed"],
  Delayed: ["Picked up", "In transit", "Out for delivery"],
  Delivered: [],
};

function allowedNext(status) {
  return FORWARD[status] || [];
}

// Exported so the live simulation (routes/live.js) can reuse the same
// rules when it completes a run.
// Best-effort email to every subscriber of this shipment.
async function notifySubscribers(shipment, event) {
  try {
    const subs = await Subscription.findAll({
      where: { shipmentId: shipment.id, active: true },
    });
    for (const sub of subs) {
      const appUrl = process.env.APP_URL || "";
      const unsubscribeUrl = appUrl
        ? `${appUrl}/track/${shipment.trackingNumber}?unsubscribe=${sub.unsubscribeToken}`
        : "";
      await mailer.sendStatusUpdate(
        sub.email,
        shipment,
        event,
        unsubscribeUrl || "reply to this message to unsubscribe"
      );
    }
  } catch (err) {
    console.error("[notifySubscribers]", err.message);
  }
}

exports.notifySubscribers = notifySubscribers;

// -------------------------------------------------------------------
// ADMIN endpoints
// -------------------------------------------------------------------

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
      serviceLevel,
      carrier,
      cost,
      scheduledDeliveryAt,
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
    const level = String(serviceLevel ?? "standard").toLowerCase();
    if (!["standard", "express"].includes(level)) {
      errors.push("Service level must be standard or express.");
    }
    if (cost !== undefined && cost !== "" && cost !== null && isNaN(Number(cost))) {
      errors.push("Cost must be a number.");
    }
    if (scheduledDeliveryAt && isNaN(new Date(scheduledDeliveryAt).getTime())) {
      errors.push("Scheduled delivery date is invalid.");
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(" ") });
    }

    let shipment;
    for (let attempt = 0; attempt < 5 && !shipment; attempt += 1) {
      try {
        shipment = await Shipment.create({
          trackingNumber: generateTracking(),
          senderName: String(senderName).trim(),
          receiverName: String(receiverName).trim(),
          receiverPhone: String(receiverPhone).trim(),
          origin: String(origin).trim(),
          destination: String(destination).trim(),
          weight: Number(weight),
          description: String(description ?? "").trim(),
          serviceLevel: level,
          carrier: String(carrier ?? "").trim() || null,
          cost: cost === undefined || cost === "" || cost === null ? null : Number(cost),
          scheduledDeliveryAt: scheduledDeliveryAt
            ? new Date(scheduledDeliveryAt)
            : null,
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
      createdBy: req.admin.name,
    });

    const fresh = await loadShipment(shipment.trackingNumber);
    res.status(201).json(serializeShipment(fresh));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

function generateTracking() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
  let code = "";
  for (let i = 0; i < 9; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TRK${code}`;
}

// --- PATCH /api/shipments/:trackingNumber (ADMIN) — edit -----------
const EDITABLE = [
  "senderName",
  "receiverName",
  "receiverPhone",
  "origin",
  "destination",
  "weight",
  "description",
  "serviceLevel",
  "carrier",
  "cost",
  "scheduledDeliveryAt",
];

router.patch("/:trackingNumber", requireAuth, async (req, res) => {
  try {
    const shipment = await loadShipment(req.params.trackingNumber);
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    const updates = {};
    for (const field of EDITABLE) {
      if (req.body?.[field] === undefined) continue;
      updates[field] = req.body[field];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nothing to update." });
    }

    // Route cannot change once the parcel has been delivered.
    const routingChanged =
      (updates.origin !== undefined ||
        updates.destination !== undefined);
    if (routingChanged && shipment.status === "Delivered") {
      return res.status(400).json({
        error: "Delivered shipments cannot be rerouted.",
      });
    }

    if (updates.origin !== undefined) {
      if (!String(updates.origin).trim()) {
        return res.status(400).json({ error: "Origin is required." });
      }
      updates.origin = String(updates.origin).trim();
    }
    if (updates.destination !== undefined) {
      if (!String(updates.destination).trim()) {
        return res.status(400).json({ error: "Destination is required." });
      }
      updates.destination = String(updates.destination).trim();
    }
    if (updates.receiverPhone !== undefined) {
      const phone = String(updates.receiverPhone).trim();
      if (!PHONE_RE.test(phone)) {
        return res.status(400).json({ error: "Enter a valid phone number." });
      }
      updates.receiverPhone = phone;
    }
    if (updates.weight !== undefined) {
      const w = Number(updates.weight);
      if (!Number.isFinite(w) || w <= 0) {
        return res.status(400).json({ error: "Weight must be a number > 0." });
      }
      updates.weight = w;
    }
    if (updates.cost !== undefined) {
      updates.cost =
        updates.cost === "" || updates.cost === null ? null : Number(updates.cost);
      if (updates.cost !== null && !Number.isFinite(updates.cost)) {
        return res.status(400).json({ error: "Cost must be a number." });
      }
    }
    if (updates.serviceLevel !== undefined) {
      const level = String(updates.serviceLevel).toLowerCase();
      if (!["standard", "express"].includes(level)) {
        return res.status(400).json({
          error: "Service level must be standard or express.",
        });
      }
      updates.serviceLevel = level;
    }
    if (updates.scheduledDeliveryAt !== undefined) {
      if (updates.scheduledDeliveryAt === "" || updates.scheduledDeliveryAt === null) {
        updates.scheduledDeliveryAt = null;
      } else {
        const d = new Date(updates.scheduledDeliveryAt);
        if (isNaN(d.getTime())) {
          return res.status(400).json({ error: "Scheduled delivery date is invalid." });
        }
        updates.scheduledDeliveryAt = d;
      }
    }
    if (updates.carrier !== undefined) {
      updates.carrier = String(updates.carrier).trim() || null;
    }

    await shipment.update(updates);
    await shipment.save();

    const fresh = await loadShipment(shipment.trackingNumber);
    res.json(serializeShipment(fresh));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DELETE /api/shipments/:trackingNumber (ADMIN) ------------------
router.delete("/:trackingNumber", requireAuth, async (req, res) => {
  try {
    const shipment = await loadShipment(req.params.trackingNumber);
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }
    await Subscription.destroy({ where: { shipmentId: shipment.id } });
    await ShipmentEvent.destroy({ where: { shipmentId: shipment.id } });
    await shipment.destroy();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    // Terminal: no further scans after delivery.
    if (shipment.status === "Delivered") {
      return res.status(400).json({
        error: "This shipment is already delivered. No further updates are allowed.",
      });
    }

    // Allowed transitions only.
    const allowed = allowedNext(shipment.status);
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot move from "${shipment.status}" to "${status}". Allowed next: ${
          allowed.length > 0 ? allowed.join(", ") : "none (terminal)"
        }.`,
      });
    }

    const event = await ShipmentEvent.create({
      shipmentId: shipment.id,
      status,
      location: String(location).trim(),
      description: String(description ?? "").trim(),
      createdBy: req.admin.name,
    });

    shipment.status = status;
    await shipment.save();

    // Best-effort email to subscribers ("Notify me" feature).
    notifySubscribers(shipment, event);

    const fresh = await loadShipment(shipment.trackingNumber);
    res.json(serializeShipment(fresh));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, allowedNext, notifySubscribers };

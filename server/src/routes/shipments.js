const express = require("express");
const crypto = require("crypto");
const { Shipment, ShipmentEvent } = require("../models");
const { STATUSES } = require("../lib");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

const withEvents = (trackingNumber) =>
  Shipment.findOne({
    where: { trackingNumber: String(trackingNumber).toUpperCase() },
    include: { model: ShipmentEvent, as: "events" },
    order: [[{ model: ShipmentEvent, as: "events" }, "createdAt", "ASC"]],
  });

// List all shipments, newest first (admin)
router.get("/", requireAdmin, async (req, res) => {
  const shipments = await Shipment.findAll({
    include: { model: ShipmentEvent, as: "events" },
    order: [
      ["createdAt", "DESC"],
      [{ model: ShipmentEvent, as: "events" }, "createdAt", "ASC"],
    ],
  });
  res.json(shipments);
});

// Create a shipment (admin)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const b = req.body || {};
    const trackingNumber = "TRK" + crypto.randomBytes(5).toString("hex").toUpperCase();
    const shipment = await Shipment.create({
      trackingNumber,
      senderName: b.senderName,
      receiverName: b.receiverName,
      receiverPhone: b.receiverPhone,
      origin: b.origin,
      destination: b.destination,
      weight: b.weight === undefined || b.weight === "" ? null : Number(b.weight),
      description: b.description || "",
      status: "Created",
    });
    await ShipmentEvent.create({
      shipmentId: shipment.id,
      status: "Created",
      location: b.origin,
      description: "Shipment created",
    });
    res.status(201).json(await withEvents(trackingNumber));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add a tracking event (admin); returns the updated shipment
router.post("/:trackingNumber/events", requireAdmin, async (req, res) => {
  try {
    const shipment = await withEvents(req.params.trackingNumber);
    if (!shipment) return res.status(404).json({ error: "Shipment not found" });
    const { status, location, description } = req.body || {};
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${STATUSES.join(", ")}` });
    }
    if (!location) return res.status(400).json({ error: "Location is required" });
    await ShipmentEvent.create({
      shipmentId: shipment.id,
      status,
      location,
      description: description || "",
    });
    shipment.status = status;
    await shipment.save();
    res.json(await withEvents(req.params.trackingNumber));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Track a shipment (public)
router.get("/:trackingNumber", async (req, res) => {
  const shipment = await withEvents(req.params.trackingNumber);
  if (!shipment) return res.status(404).json({ error: "Shipment not found" });
  res.json(shipment);
});

module.exports = router;

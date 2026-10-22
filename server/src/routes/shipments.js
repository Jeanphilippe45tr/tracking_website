const express = require("express");
const crypto = require("crypto");
const { Shipment, ShipmentEvent } = require("../models");

const router = express.Router();

// Create a shipment
router.post("/", async (req, res) => {
  try {
    const trackingNumber = "TRK" + crypto.randomBytes(5).toString("hex").toUpperCase();
    const shipment = await Shipment.create({ ...req.body, trackingNumber });
    await ShipmentEvent.create({
      shipmentId: shipment.id,
      status: "Created",
      location: req.body.origin,
      description: "Shipment created",
    });
    res.status(201).json(shipment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Track a shipment
router.get("/:trackingNumber", async (req, res) => {
  const shipment = await Shipment.findOne({
    where: { trackingNumber: req.params.trackingNumber.toUpperCase() },
    include: { model: ShipmentEvent, as: "events" },
    order: [[{ model: ShipmentEvent, as: "events" }, "createdAt", "ASC"]],
  });
  if (!shipment) return res.status(404).json({ error: "Shipment not found" });
  res.json(shipment);
});

module.exports = router;
// -------------------------------------------------------------------
// Delivery people (couriers)
// -------------------------------------------------------------------
// Simple staff records the admin can assign to a shipment:
//   GET    /api/couriers          -> list (including inactive)
//   POST   /api/couriers          -> create
//   PATCH  /api/couriers/:id      -> edit / activate / deactivate
//   DELETE /api/couriers/:id      -> deactivate (keeps shipment history)
// -------------------------------------------------------------------

const express = require("express");
const { Courier, Shipment } = require("../models");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { asyncHandler, notFound } = require("../utils/errors");
const { validate, assertValid } = require("../utils/validation");

const router = express.Router();

const clean = (value, max) => String(value ?? "").trim().slice(0, max);

function validateCourier(body, { partial = false } = {}) {
  const rules = {
    name: partial
      ? { minLength: 2, label: "Name" }
      : { required: true, minLength: 2, label: "Name" },
    phone: { maxLength: 40, label: "Phone" },
    email: { type: "email", maxLength: 160, label: "Email" },
    vehicle: { maxLength: 120, label: "Vehicle" },
  };
  const errors = validate(body, rules);
  assertValid(errors);
}

router.get(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const couriers = await Courier.findAll({
      order: [
        ["isActive", "DESC"],
        ["name", "ASC"],
      ],
    });
    res.json(couriers);
  })
);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    validateCourier(req.body);

    const courier = await Courier.create({
      name: clean(req.body.name, 120),
      phone: clean(req.body.phone, 40),
      email: clean(req.body.email, 160),
      vehicle: clean(req.body.vehicle, 120),
      isActive: req.body.isActive !== false,
    });

    res.status(201).json(courier);
  })
);

router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const courier = await Courier.findByPk(req.params.id);
    if (!courier) throw notFound("Delivery person not found");

    validateCourier(req.body, { partial: true });

    if (req.body.name !== undefined) courier.name = clean(req.body.name, 120);
    if (req.body.phone !== undefined) courier.phone = clean(req.body.phone, 40);
    if (req.body.email !== undefined) courier.email = clean(req.body.email, 160);
    if (req.body.vehicle !== undefined) {
      courier.vehicle = clean(req.body.vehicle, 120);
    }
    if (req.body.isActive !== undefined) {
      courier.isActive = Boolean(req.body.isActive);
    }

    await courier.save();
    res.json(courier);
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const courier = await Courier.findByPk(req.params.id);
    if (!courier) throw notFound("Delivery person not found");

    const assigned = await Shipment.count({
      where: { deliveryPersonId: courier.id },
    });
    if (assigned > 0) {
      // Keep the record so past shipments still show who delivered them.
      courier.isActive = false;
      await courier.save();
      return res.json({
        deactivated: true,
        id: courier.id,
        message:
          "This delivery person is assigned to a shipment, so the record was deactivated instead of deleted.",
      });
    }

    await courier.destroy();
    return res.json({ deleted: true, id: Number(req.params.id) });
  })
);

module.exports = router;

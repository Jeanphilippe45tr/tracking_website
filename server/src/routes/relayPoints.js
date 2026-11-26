// -------------------------------------------------------------------
// Relay points
// -------------------------------------------------------------------
//   GET    /api/relay-points?q=city      public (active only)
//   GET    /api/relay-points/admin       admin (all, including hidden)
//   POST   /api/relay-points             admin create
//   PATCH  /api/relay-points/:id         admin edit / hide / show
//   DELETE /api/relay-points/:id         admin hide
// -------------------------------------------------------------------

const express = require("express");
const { Op } = require("sequelize");
const { RelayPoint } = require("../models");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { asyncHandler, badRequest, notFound } = require("../utils/errors");
const { validate, assertValid } = require("../utils/validation");
const { geocodePlace, validCoords } = require("../utils/geocode");

const router = express.Router();

const clean = (value, max) => String(value ?? "").trim().slice(0, max);

function hasField(body, key) {
  return Boolean(body) && Object.prototype.hasOwnProperty.call(body, key);
}

function readManualCoords(body) {
  const latGiven = clean(body?.lat) !== "";
  const lngGiven = clean(body?.lng) !== "";
  if (!latGiven && !lngGiven) return null;
  if (latGiven !== lngGiven) {
    throw badRequest("Enter both latitude and longitude, or leave both empty.");
  }
  const coords = validCoords(body.lat, body.lng);
  if (!coords) {
    throw badRequest(
      "Latitude must be between -90 and 90 and longitude between -180 and 180."
    );
  }
  return coords;
}

async function resolveCoords(parts) {
  const manual = readManualCoords(parts);
  if (manual) return manual;
  return geocodePlace({
    address: parts.address,
    city: parts.city,
    region: parts.region,
    postalCode: parts.postalCode,
    country: parts.country,
  });
}

function applyBody(target, body, { partial = false } = {}) {
  if (body.name !== undefined || !partial) {
    target.name = clean(body.name, 160);
  }
  if (body.address !== undefined || !partial) {
    target.address = clean(body.address, 255);
  }
  if (body.city !== undefined || !partial) {
    target.city = clean(body.city, 120);
  }
  if (body.region !== undefined || !partial) {
    target.region = clean(body.region, 120);
  }
  if (body.postalCode !== undefined || !partial) {
    target.postalCode = clean(body.postalCode, 30);
  }
  if (body.country !== undefined || !partial) {
    target.country = clean(body.country, 120);
  }
  if (body.hours !== undefined || !partial) {
    target.hours = clean(body.hours, 120);
  }
  if (body.distance !== undefined || !partial) {
    target.distance = Number(body.distance) || 0;
  }
  if (body.isActive !== undefined) target.isActive = Boolean(body.isActive);
}

function validateBody(body, { partial = false } = {}) {
  const errors = validate(body, {
    name: partial
      ? { minLength: 2, label: "Name" }
      : { required: true, minLength: 2, label: "Name" },
    address: partial
      ? { minLength: 3, label: "Address" }
      : { required: true, minLength: 3, label: "Address" },
    city: partial
      ? { minLength: 2, label: "City" }
      : { required: true, minLength: 2, label: "City" },
    region: { maxLength: 120, label: "Region" },
    postalCode: { maxLength: 30, label: "Postal code" },
    country: { maxLength: 120, label: "Country" },
    hours: { maxLength: 120, label: "Opening hours" },
    distance: { type: "number", min: 0, label: "Distance" },
  });
  assertValid(errors);
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim();
    const where = { isActive: true };

    if (q) {
      const like = `%${q}%`;
      where[Op.or] = [
        { name: { [Op.like]: like } },
        { city: { [Op.like]: like } },
        { region: { [Op.like]: like } },
        { postalCode: { [Op.like]: like } },
        { address: { [Op.like]: like } },
        { country: { [Op.like]: like } },
      ];
    }

    const points = await RelayPoint.findAll({
      where,
      order: [["id", "ASC"]],
    });
    res.json(points);
  })
);

// Admin list must be declared before any "/:id" routes.
router.get(
  "/admin",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const points = await RelayPoint.findAll({
      order: [
        ["isActive", "DESC"],
        ["city", "ASC"],
        ["name", "ASC"],
      ],
    });
    res.json(points);
  })
);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    validateBody(req.body);

    const coords = await resolveCoords(req.body);

    const point = await RelayPoint.create({
      name: clean(req.body.name, 160),
      address: clean(req.body.address, 255),
      city: clean(req.body.city, 120),
      region: clean(req.body.region, 120),
      postalCode: clean(req.body.postalCode, 30),
      country: clean(req.body.country, 120),
      hours: clean(req.body.hours, 120),
      distance: Number(req.body.distance) || 0,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      isActive: req.body.isActive !== false,
    });

    res.status(201).json(point);
  })
);

router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const point = await RelayPoint.findByPk(req.params.id);
    if (!point) throw notFound("Relay point not found");

    validateBody(req.body, { partial: true });

    const addressKeys = [
      "name",
      "address",
      "city",
      "region",
      "postalCode",
      "country",
      "lat",
      "lng",
    ];
    const addressTouched = addressKeys.some((key) => hasField(req.body, key));

    applyBody(point, req.body, { partial: true });

    if (addressTouched) {
      const merged = {
        address: point.address,
        city: point.city,
        region: point.region,
        postalCode: point.postalCode,
        country: point.country,
        lat: hasField(req.body, "lat") ? req.body.lat : point.lat,
        lng: hasField(req.body, "lng") ? req.body.lng : point.lng,
      };
      const manualSent = hasField(req.body, "lat") || hasField(req.body, "lng");
      const coords = manualSent
        ? readManualCoords(req.body)
        : await resolveCoords(merged);
      point.lat = coords?.lat ?? null;
      point.lng = coords?.lng ?? null;
    }

    await point.save();
    res.json(point);
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const point = await RelayPoint.findByPk(req.params.id);
    if (!point) throw notFound("Relay point not found");

    // Hide rather than delete, so it can be restored from the admin page.
    point.isActive = false;
    await point.save();
    res.json({ hidden: true, id: point.id });
  })
);

module.exports = router;

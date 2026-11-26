// -------------------------------------------------------------------
// Shipment routes
// -------------------------------------------------------------------
// Matches the API contract the frontend uses:
//   GET    /api/shipments                -> all shipments (admin)
//   POST   /api/shipments                -> create shipment (admin)
//   PATCH  /api/shipments/:trackingNumber -> edit / assign a courier (admin)
//   GET    /api/shipments/:trackingNumber -> get one (public)
//   POST   /api/shipments/:trackingNumber/events -> add event (admin)
//
// Origin and destination accept a city plus optional street address,
// region/state, postal code and country. The server geocodes them with
// OpenStreetMap Nominatim (no API key) and stores latitude/longitude, so
// the maps can show any address - not only the demo cities.
// -------------------------------------------------------------------

const express = require("express");
const crypto = require("crypto");
const { Shipment, ShipmentEvent, Courier } = require("../models");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { asyncHandler, badRequest, notFound } = require("../utils/errors");
const { validate, assertValid } = require("../utils/validation");
const { SHIPMENT_STATUSES } = require("../config/constants");
const { geocodePlace, geocodeText, validCoords } = require("../utils/geocode");

const router = express.Router();

const courierInclude = {
  model: Courier,
  as: "deliveryPerson",
  required: false,
  attributes: ["id", "name", "phone", "vehicle", "isActive"],
};

function generateTrackingNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
  let code = "";
  for (let i = 0; i < 9; i += 1) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return `TRK${code}`;
}

function serializeShipment(shipment) {
  const json = typeof shipment.toJSON === "function" ? shipment.toJSON() : shipment;
  if (json.events) {
    json.events = json.events
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  return json;
}

function clean(value, maxLength) {
  const text = String(value ?? "").trim();
  return maxLength ? text.slice(0, maxLength) : text;
}

function hasField(body, key) {
  return Boolean(body) && Object.prototype.hasOwnProperty.call(body, key);
}

function hasAnyField(body, keys) {
  return keys.some((key) => hasField(body, key));
}

function hasManualCoords(body, prefix) {
  return (
    clean(body?.[`${prefix}Lat`]) !== "" ||
    clean(body?.[`${prefix}Lng`]) !== ""
  );
}

// Validate a pair of manual coordinates coming from the form. Both are
// optional, but when one is given both must be valid.
function readManualCoords(body, prefix) {
  const latGiven = clean(body?.[`${prefix}Lat`]) !== "";
  const lngGiven = clean(body?.[`${prefix}Lng`]) !== "";
  if (!latGiven && !lngGiven) return null;
  if (latGiven !== lngGiven) {
    throw badRequest(
      `Enter both latitude and longitude for the ${prefix}, or leave both empty.`
    );
  }
  const coords = validCoords(body[`${prefix}Lat`], body[`${prefix}Lng`]);
  if (!coords) {
    throw badRequest(
      `The ${prefix} latitude must be between -90 and 90 and the longitude between -180 and 180.`
    );
  }
  return coords;
}

function addressParts(body, prefix) {
  return {
    city: body?.[prefix],
    address: body?.[`${prefix}Address`],
    region: body?.[`${prefix}Region`],
    postalCode: body?.[`${prefix}PostalCode`],
    country: body?.[`${prefix}Country`],
  };
}

async function resolveAddress(body, prefix) {
  const manual = readManualCoords(body, prefix);
  const geo = await geocodePlace({
    ...addressParts(body, prefix),
    ...(manual ? { lat: manual.lat, lng: manual.lng } : {}),
  });
  return { manual, geo };
}

function copyAddressFields(target, body, prefix, geo, manual) {
  target[prefix] = clean(body[prefix], 120);
  target[`${prefix}Address`] = clean(body[`${prefix}Address`], 255);
  target[`${prefix}Region`] = clean(body[`${prefix}Region`], 120);
  target[`${prefix}PostalCode`] = clean(body[`${prefix}PostalCode`], 30);
  target[`${prefix}Country`] = clean(body[`${prefix}Country`], 120);
  target[`${prefix}Lat`] = manual?.lat ?? geo?.lat ?? null;
  target[`${prefix}Lng`] = manual?.lng ?? geo?.lng ?? null;
}

// Load a shipment with the relations the UI needs.
function shipmentIncludes() {
  return [
    { model: ShipmentEvent, as: "events", required: false },
    courierInclude,
  ];
}

async function findByTrackingNumber(trackingNumber) {
  const shipment = await Shipment.findOne({
    where: { trackingNumber },
    include: shipmentIncludes(),
    order: [[{ model: ShipmentEvent, as: "events" }, "createdAt", "ASC"]],
  });
  return shipment;
}

// GET /api/shipments - admin list
router.get(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const shipments = await Shipment.findAll({
      include: shipmentIncludes(),
      order: [
        ["createdAt", "DESC"],
        [{ model: ShipmentEvent, as: "events" }, "createdAt", "ASC"],
      ],
    });
    res.json(shipments.map(serializeShipment));
  })
);

// POST /api/shipments - admin create
router.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const errors = validate(req.body, {
      senderName: { required: true, minLength: 2, label: "Sender name" },
      receiverName: { required: true, minLength: 2, label: "Receiver name" },
      receiverPhone: { minLength: 7, label: "Receiver phone" },
      origin: { required: true, minLength: 2, label: "Origin city" },
      destination: { required: true, minLength: 2, label: "Destination city" },
      originAddress: { maxLength: 255, label: "Origin address" },
      originRegion: { maxLength: 120, label: "Origin region" },
      originPostalCode: { maxLength: 30, label: "Origin postal code" },
      originCountry: { maxLength: 120, label: "Origin country" },
      destinationAddress: { maxLength: 255, label: "Destination address" },
      destinationRegion: { maxLength: 120, label: "Destination region" },
      destinationPostalCode: { maxLength: 30, label: "Destination postal code" },
      destinationCountry: { maxLength: 120, label: "Destination country" },
      weight: { required: true, type: "number", min: 0, label: "Weight" },
      description: { maxLength: 500, label: "Description" },
    });
    assertValid(errors);

    let deliveryPersonId = null;
    if (clean(req.body.deliveryPersonId) !== "") {
      const courierId = Number(req.body.deliveryPersonId);
      if (!Number.isInteger(courierId) || courierId <= 0) {
        throw badRequest("Choose a valid delivery person.");
      }
      const courier = await Courier.findByPk(courierId);
      if (!courier) throw badRequest("The selected delivery person does not exist.");
      deliveryPersonId = courier.id;
    }

    // Geocode both endpoints. Nominatim calls are queued one second apart
    // when a full street address is supplied.
    const origin = await resolveAddress(req.body, "origin");
    const destination = await resolveAddress(req.body, "destination");

    // Generate a tracking number that isn't taken.
    let trackingNumber = generateTrackingNumber();
    for (let attempts = 0; attempts < 10; attempts += 1) {
      const exists = await Shipment.findOne({ where: { trackingNumber } });
      if (!exists) break;
      trackingNumber = generateTrackingNumber();
    }

    const shipment = await Shipment.create({
      trackingNumber,
      senderName: clean(req.body.senderName, 120),
      receiverName: clean(req.body.receiverName, 120),
      receiverPhone: clean(req.body.receiverPhone, 40),
      origin: clean(req.body.origin, 120),
      destination: clean(req.body.destination, 120),
      weight: Number(req.body.weight),
      description: clean(req.body.description, 500),
      status: "Created",
      createdById: req.auth.id,
      deliveryPersonId,
    });

    copyAddressFields(shipment, req.body, "origin", origin.geo, origin.manual);
    copyAddressFields(
      shipment,
      req.body,
      "destination",
      destination.geo,
      destination.manual
    );
    await shipment.save();

    await ShipmentEvent.create({
      shipmentId: shipment.id,
      status: "Created",
      location: shipment.origin,
      description: "Shipment created",
      lat: shipment.originLat,
      lng: shipment.originLng,
    });

    const created = await findByTrackingNumber(shipment.trackingNumber);
    const payload = serializeShipment(created);
    payload.geocoding = {
      origin: origin.manual ? "manual" : origin.geo?.source || null,
      destination: destination.manual
        ? "manual"
        : destination.geo?.source || null,
    };

    res.status(201).json(payload);
  })
);

// PATCH /api/shipments/:trackingNumber - admin edit / assign a courier.
router.patch(
  "/:trackingNumber",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const trackingNumber = String(req.params.trackingNumber || "").toUpperCase();
    const shipment = await Shipment.findOne({ where: { trackingNumber } });
    if (!shipment) throw notFound("Shipment not found");

    const errors = validate(req.body, {
      senderName: { minLength: 2, label: "Sender name" },
      receiverName: { minLength: 2, label: "Receiver name" },
      receiverPhone: { minLength: 7, label: "Receiver phone" },
      origin: { minLength: 2, label: "Origin city" },
      destination: { minLength: 2, label: "Destination city" },
      originAddress: { maxLength: 255, label: "Origin address" },
      originRegion: { maxLength: 120, label: "Origin region" },
      originPostalCode: { maxLength: 30, label: "Origin postal code" },
      originCountry: { maxLength: 120, label: "Origin country" },
      destinationAddress: { maxLength: 255, label: "Destination address" },
      destinationRegion: { maxLength: 120, label: "Destination region" },
      destinationPostalCode: { maxLength: 30, label: "Destination postal code" },
      destinationCountry: { maxLength: 120, label: "Destination country" },
      weight: { type: "number", min: 0, label: "Weight" },
      description: { maxLength: 500, label: "Description" },
    });
    assertValid(errors);

    if (hasField(req.body, "deliveryPersonId")) {
      if (clean(req.body.deliveryPersonId) === "") {
        shipment.deliveryPersonId = null;
      } else {
        const courierId = Number(req.body.deliveryPersonId);
        if (!Number.isInteger(courierId) || courierId <= 0) {
          throw badRequest("Choose a valid delivery person.");
        }
        const courier = await Courier.findByPk(courierId);
        if (!courier) {
          throw badRequest("The selected delivery person does not exist.");
        }
        shipment.deliveryPersonId = courier.id;
      }
    }

    if (hasField(req.body, "senderName")) {
      shipment.senderName = clean(req.body.senderName, 120);
    }
    if (hasField(req.body, "receiverName")) {
      shipment.receiverName = clean(req.body.receiverName, 120);
    }
    if (hasField(req.body, "receiverPhone")) {
      shipment.receiverPhone = clean(req.body.receiverPhone, 40);
    }
    if (hasField(req.body, "weight")) shipment.weight = Number(req.body.weight);
    if (hasField(req.body, "description")) {
      shipment.description = clean(req.body.description, 500);
    }

    // Only re-geocode an endpoint when one of its address fields was sent.
    for (const prefix of ["origin", "destination"]) {
      const keys = [
        prefix,
        `${prefix}Address`,
        `${prefix}Region`,
        `${prefix}PostalCode`,
        `${prefix}Country`,
        `${prefix}Lat`,
        `${prefix}Lng`,
      ];
      if (!hasAnyField(req.body, keys)) continue;

      const merged = {
        [prefix]: hasField(req.body, prefix)
          ? req.body[prefix]
          : shipment[prefix],
        [`${prefix}Address`]: hasField(req.body, `${prefix}Address`)
          ? req.body[`${prefix}Address`]
          : shipment[`${prefix}Address`],
        [`${prefix}Region`]: hasField(req.body, `${prefix}Region`)
          ? req.body[`${prefix}Region`]
          : shipment[`${prefix}Region`],
        [`${prefix}PostalCode`]: hasField(req.body, `${prefix}PostalCode`)
          ? req.body[`${prefix}PostalCode`]
          : shipment[`${prefix}PostalCode`],
        [`${prefix}Country`]: hasField(req.body, `${prefix}Country`)
          ? req.body[`${prefix}Country`]
          : shipment[`${prefix}Country`],
        [`${prefix}Lat`]: hasField(req.body, `${prefix}Lat`)
          ? req.body[`${prefix}Lat`]
          : shipment[`${prefix}Lat`],
        [`${prefix}Lng`]: hasField(req.body, `${prefix}Lng`)
          ? req.body[`${prefix}Lng`]
          : shipment[`${prefix}Lng`],
      };

      if (clean(merged[prefix]) === "") {
        throw badRequest(
          `${prefix === "origin" ? "Origin" : "Destination"} city is required.`
        );
      }

      // Re-use the manual coordinates only if the form sent them; otherwise
      // geocode the (possibly new) address.
      const manualSent = hasField(req.body, `${prefix}Lat`) || hasField(req.body, `${prefix}Lng`);
      const manual = manualSent
        ? readManualCoords(req.body, prefix)
        : null;
      const geo = await geocodePlace({
        city: merged[prefix],
        address: merged[`${prefix}Address`],
        region: merged[`${prefix}Region`],
        postalCode: merged[`${prefix}PostalCode`],
        country: merged[`${prefix}Country`],
        ...(manual ? { lat: manual.lat, lng: manual.lng } : {}),
      });

      copyAddressFields(shipment, merged, prefix, geo, manual);
    }

    await shipment.save();

    const updated = await findByTrackingNumber(trackingNumber);
    res.json(serializeShipment(updated));
  })
);

// GET /api/shipments/:trackingNumber - public track
router.get(
  "/:trackingNumber",
  asyncHandler(async (req, res) => {
    const trackingNumber = String(req.params.trackingNumber || "").toUpperCase();
    const shipment = await findByTrackingNumber(trackingNumber);
    if (!shipment) throw notFound("Shipment not found");
    res.json(serializeShipment(shipment));
  })
);

// POST /api/shipments/:trackingNumber/events - admin add event
router.post(
  "/:trackingNumber/events",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const trackingNumber = String(req.params.trackingNumber || "").toUpperCase();
    const shipment = await Shipment.findOne({ where: { trackingNumber } });
    if (!shipment) throw notFound("Shipment not found");

    const errors = validate(req.body, {
      status: {
        required: true,
        label: "Status",
        oneOf: SHIPMENT_STATUSES,
      },
      location: { required: true, minLength: 2, label: "Location" },
      description: { maxLength: 500, label: "Description" },
    });
    assertValid(errors);

    const latGiven = clean(req.body.lat) !== "";
    const lngGiven = clean(req.body.lng) !== "";
    if (latGiven !== lngGiven) {
      throw badRequest("Enter both event latitude and longitude, or neither.");
    }
    const manual = latGiven ? validCoords(req.body.lat, req.body.lng) : null;
    if (latGiven && !manual) {
      throw badRequest(
        "Event latitude must be between -90 and 90 and longitude between -180 and 180."
      );
    }
    const geo = manual ? null : await geocodeText(req.body.location);
    const coords = manual || geo;

    await ShipmentEvent.create({
      shipmentId: shipment.id,
      status: req.body.status,
      location: clean(req.body.location, 160),
      description: clean(req.body.description, 500),
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    });

    // Mirror the status on the shipment header like the mock API does.
    await shipment.update({ status: req.body.status });

    const updated = await findByTrackingNumber(trackingNumber);
    res.status(201).json(serializeShipment(updated));
  })
);

module.exports = router;

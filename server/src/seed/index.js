// -------------------------------------------------------------------
// Idempotent database seeding.
// -------------------------------------------------------------------
// Running the server (or `npm run db:seed`) fills an empty database with
// demo content. Existing rows are never duplicated or overwritten.
// -------------------------------------------------------------------

const {
  sequelize,
  User,
  Courier,
  Shipment,
  ShipmentEvent,
  RelayPoint,
  Conversation,
  Message,
  syncModels,
} = require("../models");
const { DEFAULT_PREFS } = require("../config/constants");
const { coordsForPlace } = require("../utils/cityCoords");
const {
  couriers,
  shipments,
  relayPoints,
  demoConversation,
  hoursAgo,
} = require("./data");

const DEFAULT_ADMIN = {
  name: "Admin",
  email: "admin@example.com",
  password: "admin123",
  phone: "+1 (212) 555-0142",
  role: "admin",
  prefs: { ...DEFAULT_PREFS },
};

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000);

async function seedAdmin() {
  const existing = await User.findOne({
    where: { email: DEFAULT_ADMIN.email },
  });
  if (existing) return existing;

  return User.create({
    name: DEFAULT_ADMIN.name,
    email: DEFAULT_ADMIN.email,
    phone: DEFAULT_ADMIN.phone,
    role: DEFAULT_ADMIN.role,
    prefs: DEFAULT_ADMIN.prefs,
    passwordHash: await User.hashPassword(DEFAULT_ADMIN.password),
  });
}

async function seedCouriers() {
  const count = await Courier.count();
  if (count === 0) {
    await Courier.bulkCreate(couriers);
  }
  return Courier.findAll({ order: [["id", "ASC"]] });
}

async function seedRelayPoints() {
  const count = await RelayPoint.count();
  if (count > 0) return count;
  await RelayPoint.bulkCreate(relayPoints);
  return relayPoints.length;
}

async function seedShipments(admin, deliveryPeople = []) {
  const count = await Shipment.count();
  if (count > 0) return count;

  for (let index = 0; index < shipments.length; index += 1) {
    const item = shipments[index];
    const createdAt = hoursAgo(item.createdHoursAgo);
    const updatedAt = hoursAgo(item.updatedHoursAgo);
    const courier = deliveryPeople.length
      ? deliveryPeople[index % deliveryPeople.length]
      : null;

    const shipment = await Shipment.create(
      {
        trackingNumber: item.trackingNumber,
        senderName: item.senderName,
        receiverName: item.receiverName,
        receiverPhone: item.receiverPhone,
        origin: item.origin,
        originAddress: item.originAddress || "",
        originRegion: item.originRegion || "",
        originPostalCode: item.originPostalCode || "",
        originCountry: item.originCountry || "",
        originLat: item.originLat ?? null,
        originLng: item.originLng ?? null,
        destination: item.destination,
        destinationAddress: item.destinationAddress || "",
        destinationRegion: item.destinationRegion || "",
        destinationPostalCode: item.destinationPostalCode || "",
        destinationCountry: item.destinationCountry || "",
        destinationLat: item.destinationLat ?? null,
        destinationLng: item.destinationLng ?? null,
        weight: item.weight,
        description: item.description,
        status: item.status,
        createdById: admin?.id || null,
        deliveryPersonId: courier?.id || null,
        createdAt,
        updatedAt,
      },
      { silent: true }
    );

    await ShipmentEvent.bulkCreate(
      item.events.map((event) => {
        const coords = coordsForPlace(event.location);
        return {
          shipmentId: shipment.id,
          status: event.status,
          location: event.location,
          description: event.description,
          lat: coords ? coords[0] : null,
          lng: coords ? coords[1] : null,
          createdAt: hoursAgo(event.hoursAgo),
        };
      }),
      { silent: true }
    );
  }

  return shipments.length;
}

// Existing demo databases predate the address/courier fields. Fill in the
// coordinates we can infer from the city so old rows also appear on the map.
async function backfillCoordinates() {
  const rows = await Shipment.findAll();
  let updated = 0;

  for (const shipment of rows) {
    const patch = {};
    if (shipment.originLat == null || shipment.originLng == null) {
      const coords = coordsForPlace(shipment.origin);
      if (coords) {
        patch.originLat = coords[0];
        patch.originLng = coords[1];
      }
    }
    if (shipment.destinationLat == null || shipment.destinationLng == null) {
      const coords = coordsForPlace(shipment.destination);
      if (coords) {
        patch.destinationLat = coords[0];
        patch.destinationLng = coords[1];
      }
    }
    if (Object.keys(patch).length > 0) {
      await shipment.update(patch, { silent: true });
      updated += 1;
    }
  }

  return updated;
}

async function backfillEventCoordinates() {
  const events = await ShipmentEvent.findAll({ where: { lat: null } });
  let updated = 0;

  for (const event of events) {
    const coords = coordsForPlace(event.location);
    if (coords) {
      await event.update(
        { lat: coords[0], lng: coords[1] },
        { silent: true }
      );
      updated += 1;
    }
  }

  return updated;
}

async function backfillRelayPoints() {
  const points = await RelayPoint.findAll();
  let updated = 0;

  for (const point of points) {
    const patch = {};
    const seeded = relayPoints.find((item) => item.name === point.name);

    if (point.lat == null || point.lng == null) {
      if (seeded && seeded.lat != null) {
        patch.lat = seeded.lat;
        patch.lng = seeded.lng;
      } else {
        const coords = coordsForPlace(point.city);
        if (coords) {
          // Small deterministic offset so points in one city do not stack.
          patch.lat = coords[0] + (point.id % 10) * 0.002;
          patch.lng = coords[1] + (point.id % 10) * 0.002;
        }
      }
    }

    if (!point.region && seeded?.region) patch.region = seeded.region;
    if (!point.country && seeded?.country) patch.country = seeded.country;

    if (Object.keys(patch).length > 0) {
      await point.update(patch, { silent: true });
      updated += 1;
    }
  }

  return updated;
}

async function seedDemoConversation() {
  const count = await Conversation.count();
  if (count > 0) return count;

  const lastMessageAt = minutesAgo(9);
  const conversation = await Conversation.create(
    {
      visitorId: demoConversation.visitorId,
      visitorName: demoConversation.visitorName,
      visitorEmail: demoConversation.visitorEmail,
      subject: demoConversation.subject,
      lastMessageAt,
      createdAt: minutesAgo(48),
      updatedAt: lastMessageAt,
    },
    { silent: true }
  );

  await Message.bulkCreate(
    demoConversation.messages.map((message) => ({
      conversationId: conversation.id,
      sender: message.sender,
      body: message.body,
      readByAdmin: message.readByAdmin,
      readByCustomer: message.readByCustomer,
      createdAt: minutesAgo(message.minutesAgo),
    })),
    { silent: true }
  );

  return 1;
}

async function seedAll({ reset = false } = {}) {
  // `reset` drops and recreates every table managed by Sequelize. It is
  // only used by the explicit `npm run db:reset` command.
  if (reset) {
    await syncModels({ force: true });
  } else {
    await syncModels();
  }

  const admin = await seedAdmin();
  const deliveryPeople = await seedCouriers();
  const relayCount = await seedRelayPoints();
  const shipmentCount = await seedShipments(admin, deliveryPeople);

  // Updates for databases created before the address/map features existed.
  await backfillCoordinates();
  await backfillEventCoordinates();
  await backfillRelayPoints();

  const conversationCount = await seedDemoConversation();

  return {
    admin: admin.email,
    couriers: deliveryPeople.length,
    relayPoints: relayCount,
    shipments: shipmentCount,
    conversations: conversationCount,
  };
}

module.exports = {
  seedAll,
  seedAdmin,
  seedCouriers,
  DEFAULT_ADMIN,
};

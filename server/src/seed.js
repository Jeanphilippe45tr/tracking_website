// -------------------------------------------------------------------
// Seed data — mirrors client/src/api/mockData.js so both demo modes
// show the same numbers. Runs on boot only when the DB is empty.
// -------------------------------------------------------------------

const bcrypt = require("bcryptjs");
const {
  Shipment,
  ShipmentEvent,
  AdminUser,
  RelayPoint,
} = require("./models");
const { defaultPrefs } = require("./middleware/auth");
const { fold } = require("./utils/helpers");

const hoursAgo = (hours) =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

function seedShipment(data) {
  const { events, ...shipment } = data;
  return { shipment, events };
}

const SEED_SHIPMENTS = [
  seedShipment({
    id: 1,
    trackingNumber: "TRK000000001",
    senderName: "Jordan Lee",
    receiverName: "Maya Chen",
    receiverPhone: "+1 617 555 0184",
    origin: "New York",
    destination: "Boston",
    weight: 2.5,
    description: "Documents",
    status: "Delivered",
    createdAt: hoursAgo(72),
    updatedAt: hoursAgo(4),
    events: [
      { status: "Created", location: "New York", description: "Shipment created", createdAt: hoursAgo(72) },
      { status: "Picked up", location: "New York", description: "Parcel collected by our courier", createdAt: hoursAgo(66) },
      { status: "In transit", location: "New York Hub", description: "Departed the sorting centre", createdAt: hoursAgo(48) },
      { status: "Out for delivery", location: "Boston", description: "On the delivery van", createdAt: hoursAgo(10) },
      { status: "Delivered", location: "Boston", description: "Delivered and signed by the receiver", createdAt: hoursAgo(4) },
    ],
  }),
  seedShipment({
    id: 2,
    trackingNumber: "TRK3F9A12BC7D",
    senderName: "Alice Morgan",
    receiverName: "Oliver Hayes",
    receiverPhone: "+44 20 7946 0321",
    origin: "New York",
    destination: "London",
    weight: 5.1,
    description: "Handmade crafts",
    status: "In transit",
    createdAt: hoursAgo(40),
    updatedAt: hoursAgo(6),
    events: [
      { status: "Created", location: "New York", description: "Shipment created", createdAt: hoursAgo(40) },
      { status: "Picked up", location: "New York", description: "Parcel collected by our courier", createdAt: hoursAgo(34) },
      { status: "In transit", location: "New York JFK International Hub", description: "Arrived at the international hub", createdAt: hoursAgo(6) },
    ],
  }),
  seedShipment({
    id: 3,
    trackingNumber: "TRK5B7C9D2EF1A",
    senderName: "Marc Dubois",
    receiverName: "Sophie Laurent",
    receiverPhone: "+33 6 12 34 56 78",
    origin: "London",
    destination: "Paris",
    weight: 1.2,
    description: "Books",
    status: "Out for delivery",
    createdAt: hoursAgo(30),
    updatedAt: hoursAgo(2),
    events: [
      { status: "Created", location: "London", description: "Shipment created", createdAt: hoursAgo(30) },
      { status: "Picked up", location: "London Hub", description: "Parcel collected", createdAt: hoursAgo(26) },
      { status: "In transit", location: "Paris Sorting Centre", description: "Processing at the sorting centre", createdAt: hoursAgo(8) },
      { status: "Out for delivery", location: "Paris", description: "Out for delivery on the van", createdAt: hoursAgo(2) },
    ],
  }),
  seedShipment({
    id: 4,
    trackingNumber: "TRK8A1B2C3D4E",
    senderName: "Berlin Tech Store",
    receiverName: "Nina Weber",
    receiverPhone: "+49 30 555 0192",
    origin: "Berlin",
    destination: "Amsterdam",
    weight: 12.0,
    description: "Electronic accessories",
    status: "Delayed",
    createdAt: hoursAgo(52),
    updatedAt: hoursAgo(9),
    events: [
      { status: "Created", location: "Berlin", description: "Shipment created", createdAt: hoursAgo(52) },
      { status: "Picked up", location: "Berlin", description: "Parcel collected", createdAt: hoursAgo(48) },
      { status: "In transit", location: "Berlin Hub", description: "In transit to the destination city", createdAt: hoursAgo(24) },
      { status: "Delayed", location: "Amsterdam Ring Road", description: "Delay due to a road closure on the A10", createdAt: hoursAgo(9) },
    ],
  }),
  seedShipment({
    id: 5,
    trackingNumber: "TRK9C8B7A6D5F",
    senderName: "Pacific Seafood Co",
    receiverName: "Ava Thompson",
    receiverPhone: "+1 206 555 0117",
    origin: "Seattle",
    destination: "San Francisco",
    weight: 8.4,
    description: "Frozen seafood (insulated)",
    status: "Picked up",
    createdAt: hoursAgo(14),
    updatedAt: hoursAgo(11),
    events: [
      { status: "Created", location: "Seattle", description: "Shipment created", createdAt: hoursAgo(14) },
      { status: "Picked up", location: "Seattle", description: "Parcel collected by our courier", createdAt: hoursAgo(11) },
    ],
  }),
  seedShipment({
    id: 6,
    trackingNumber: "TRK2E4F6A8B0C",
    senderName: "Toronto Textiles",
    receiverName: "Ibrahim Khan",
    receiverPhone: "+1 416 555 0136",
    origin: "Toronto",
    destination: "New York",
    weight: 20.0,
    description: "Fabric rolls",
    status: "Created",
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(6),
    events: [
      { status: "Created", location: "Toronto", description: "Shipment created, waiting for pickup", createdAt: hoursAgo(6) },
    ],
  }),
  seedShipment({
    id: 7,
    trackingNumber: "TRK7D5E3F1A9B",
    senderName: "Milan Boutique",
    receiverName: "Chloe Martin",
    receiverPhone: "+33 6 98 76 54 32",
    origin: "Milan",
    destination: "Singapore",
    weight: 3.3,
    description: "Cosmetics",
    status: "In transit",
    createdAt: hoursAgo(60),
    updatedAt: hoursAgo(20),
    events: [
      { status: "Created", location: "Milan", description: "Shipment created", createdAt: hoursAgo(60) },
      { status: "Picked up", location: "Milan", description: "Parcel collected", createdAt: hoursAgo(54) },
      { status: "In transit", location: "Singapore Changi", description: "Handed to the air freight partner", createdAt: hoursAgo(20) },
    ],
  }),
];

const SEED_RELAY_POINTS = [
  { name: "Relay Point Midtown Manhattan", address: "245 Madison Avenue, New York, NY 10016", city: "New York", postalCode: "10016", hours: "Mon-Sat 08:00-20:00", distance: 0.8 },
  { name: "Relay Point Brooklyn Heights", address: "128 Montague Street, Brooklyn, NY 11201", city: "New York", postalCode: "11201", hours: "Mon-Sat 08:00-19:00", distance: 2.4 },
  { name: "Relay Point Canary Wharf", address: "15 Cabot Square, London E14 4QS", city: "London", postalCode: "E14", hours: "Mon-Sat 08:00-20:00", distance: 0.6 },
  { name: "Relay Point Shoreditch", address: "86 Great Eastern Street, London EC2A 3JL", city: "London", postalCode: "EC2A", hours: "Mon-Sun 09:00-21:00", distance: 1.1 },
  { name: "Relay Point Paris 11", address: "56 Rue de la Roquette, 75011 Paris", city: "Paris", postalCode: "75011", hours: "Mon-Sat 09:00-20:00", distance: 0.6 },
  { name: "Relay Point Berlin Mitte", address: "Torstraße 140, 10119 Berlin", city: "Berlin", postalCode: "10119", hours: "Mon-Sat 08:00-20:00", distance: 1.4 },
  { name: "Relay Point Marina Bay", address: "8 Marina Boulevard, Singapore 018981", city: "Singapore", postalCode: "018981", hours: "Mon-Sat 08:30-19:00", distance: 0.9 },
  { name: "Relay Point Queen West", address: "478 Queen Street West, Toronto, ON M5V 2B2", city: "Toronto", postalCode: "M5V 2B2", hours: "Mon-Sat 09:00-19:30", distance: 1.7 },
];

async function seed() {
  // --- Admin account -------------------------------------------------
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const existingAdmin = await AdminUser.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await AdminUser.create({
      name: "Admin",
      email: adminEmail,
      phone: "+1 (212) 555-0142",
      role: "admin",
      passwordHash: await bcrypt.hash(adminPassword, 10),
      prefs: defaultPrefs(),
    });
    console.log(`Seeded admin account: ${adminEmail}`);
  }

  // --- Shipments -----------------------------------------------------
  if ((await Shipment.count()) === 0) {
    for (const { shipment, events } of SEED_SHIPMENTS) {
      const payload = { ...shipment };
      // createdAt/updatedAt must match the fixed demo timeline.
      const fixed = [
        payload.createdAt,
        payload.updatedAt,
      ];
      const fresh = await Shipment.create(payload, { silent: true });
      await Shipment.update(
        { createdAt: fixed[0], updatedAt: fixed[1] },
        { where: { id: fresh.id }, silent: true }
      );
      for (const event of events) {
        const created = await ShipmentEvent.create({
          shipmentId: fresh.id,
          status: event.status,
          location: event.location,
          description: event.description,
        });
        await ShipmentEvent.update(
          { createdAt: event.createdAt, updatedAt: event.createdAt },
          { where: { id: created.id }, silent: true }
        );
      }
    }
    console.log(`Seeded ${SEED_SHIPMENTS.length} shipments.`);
  }

  // --- Relay points ---------------------------------------------------
  if ((await RelayPoint.count()) === 0) {
    for (const point of SEED_RELAY_POINTS) {
      await RelayPoint.create({
        ...point,
        searchName: fold(point.name),
        searchAddress: fold(point.address),
        searchCity: fold(point.city),
        searchPostal: fold(point.postalCode),
      });
    }
    console.log(`Seeded ${SEED_RELAY_POINTS.length} relay points.`);
  }
}

module.exports = { seed };

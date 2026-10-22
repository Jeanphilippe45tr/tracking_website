// -------------------------------------------------------------------
// MOCK DATA — used only when VITE_USE_MOCK=true.
// -------------------------------------------------------------------
// This file holds fake shipments, events and relay points so the whole
// frontend works without a backend. The data shape matches EXACTLY the
// API contract, so when you switch to the real backend nothing changes
// in the pages.
//
// The arrays below are module-level (a single shared instance). That is
// intentional: when we "create a shipment" or "add an event" we mutate
// these arrays, and the UI updates during the session.
// -------------------------------------------------------------------

// Allowed status values (exact strings — keep in sync with the backend).
export const STATUSES = [
  "Created",
  "Picked up",
  "In transit",
  "Out for delivery",
  "Delivered",
  "Delayed",
];

// Small helper so every tracking number looks the same:
// TRK + 9 random uppercase letters/digits, e.g. TRK3F9A12BC7D.
export function generateTrackingNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789"; // no confusing O/0/I
  let code = "";
  for (let i = 0; i < 9; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TRK${code}`;
}

// Helper to build ISO date strings relative to "now" minus N hours.
// Using relative dates keeps the mock data looking fresh whenever you
// open the app.
function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

// -------------------------------------------------------------------
// 7 mock shipments with different statuses + realistic events.
// TRK000000001 is the easy-to-test tracking number (Delivered, 5 events).
// -------------------------------------------------------------------
export const mockShipments = [
  {
    id: 1,
    trackingNumber: "TRK000000001",
    senderName: "John",
    receiverName: "Marie",
    receiverPhone: "+237600000000",
    origin: "Douala",
    destination: "Yaoundé",
    weight: 2.5,
    description: "Documents",
    status: "Delivered",
    createdAt: hoursAgo(72),
    updatedAt: hoursAgo(4),
    events: [
      {
        id: 101,
        status: "Created",
        location: "Douala",
        description: "Shipment created",
        createdAt: hoursAgo(72),
      },
      {
        id: 102,
        status: "Picked up",
        location: "Douala",
        description: "Parcel collected by our courier",
        createdAt: hoursAgo(66),
      },
      {
        id: 103,
        status: "In transit",
        location: "Douala Hub",
        description: "Departed the sorting centre",
        createdAt: hoursAgo(48),
      },
      {
        id: 104,
        status: "Out for delivery",
        location: "Yaoundé",
        description: "On the delivery van",
        createdAt: hoursAgo(10),
      },
      {
        id: 105,
        status: "Delivered",
        location: "Yaoundé",
        description: "Delivered and signed by the receiver",
        createdAt: hoursAgo(4),
      },
    ],
  },
  {
    id: 2,
    trackingNumber: "TRK3F9A12BC7D",
    senderName: "Alice Ngono",
    receiverName: "Paul Biya Jr",
    receiverPhone: "+237677123456",
    origin: "Yaoundé",
    destination: "Paris",
    weight: 5.1,
    description: "Handmade crafts",
    status: "In transit",
    createdAt: hoursAgo(40),
    updatedAt: hoursAgo(6),
    events: [
      {
        id: 201,
        status: "Created",
        location: "Yaoundé",
        description: "Shipment created",
        createdAt: hoursAgo(40),
      },
      {
        id: 202,
        status: "Picked up",
        location: "Yaoundé",
        description: "Parcel collected by our courier",
        createdAt: hoursAgo(34),
      },
      {
        id: 203,
        status: "In transit",
        location: "Douala International Hub",
        description: "Arrived at the international hub",
        createdAt: hoursAgo(6),
      },
    ],
  },
  {
    id: 3,
    trackingNumber: "TRK5B7C9D2EF1A",
    senderName: "Marc Tchoua",
    receiverName: "Sophie Durand",
    receiverPhone: "+33612345678",
    origin: "Paris",
    destination: "Lyon",
    weight: 1.2,
    description: "Books",
    status: "Out for delivery",
    createdAt: hoursAgo(30),
    updatedAt: hoursAgo(2),
    events: [
      {
        id: 301,
        status: "Created",
        location: "Paris",
        description: "Shipment created",
        createdAt: hoursAgo(30),
      },
      {
        id: 302,
        status: "Picked up",
        location: "Paris Agence",
        description: "Parcel collected",
        createdAt: hoursAgo(26),
      },
      {
        id: 303,
        status: "In transit",
        location: "Lyon Sorting Centre",
        description: "Processing at the sorting centre",
        createdAt: hoursAgo(8),
      },
      {
        id: 304,
        status: "Out for delivery",
        location: "Lyon",
        description: "Out for delivery on the van",
        createdAt: hoursAgo(2),
      },
    ],
  },
  {
    id: 4,
    trackingNumber: "TRK8A1B2C3D4E",
    senderName: "Bafoussam Store",
    receiverName: "Ngo Bell",
    receiverPhone: "+237655998877",
    origin: "Bafoussam",
    destination: "Bamenda",
    weight: 12.0,
    description: "Electronic accessories",
    status: "Delayed",
    createdAt: hoursAgo(52),
    updatedAt: hoursAgo(9),
    events: [
      {
        id: 401,
        status: "Created",
        location: "Bafoussam",
        description: "Shipment created",
        createdAt: hoursAgo(52),
      },
      {
        id: 402,
        status: "Picked up",
        location: "Bafoussam",
        description: "Parcel collected",
        createdAt: hoursAgo(48),
      },
      {
        id: 403,
        status: "In transit",
        location: "Bafoussam Hub",
        description: "In transit to the destination city",
        createdAt: hoursAgo(24),
      },
      {
        id: 404,
        status: "Delayed",
        location: "Bamenda Road",
        description: "Delay due to bad weather on the road",
        createdAt: hoursAgo(9),
      },
    ],
  },
  {
    id: 5,
    trackingNumber: "TRK9C8B7A6D5F",
    senderName: "Kribi Fish Co",
    receiverName: "Awa Fotso",
    receiverPhone: "+237699445566",
    origin: "Kribi",
    destination: "Douala",
    weight: 8.4,
    description: "Frozen seafood (insulated)",
    status: "Picked up",
    createdAt: hoursAgo(14),
    updatedAt: hoursAgo(11),
    events: [
      {
        id: 501,
        status: "Created",
        location: "Kribi",
        description: "Shipment created",
        createdAt: hoursAgo(14),
      },
      {
        id: 502,
        status: "Picked up",
        location: "Kribi",
        description: "Parcel collected by our courier",
        createdAt: hoursAgo(11),
      },
    ],
  },
  {
    id: 6,
    trackingNumber: "TRK2E4F6A8B0C",
    senderName: "Garoua Textiles",
    receiverName: "Ibrahim Moussa",
    receiverPhone: "+237680112233",
    origin: "Garoua",
    destination: "Yaoundé",
    weight: 20.0,
    description: "Fabric rolls",
    status: "Created",
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(6),
    events: [
      {
        id: 601,
        status: "Created",
        location: "Garoua",
        description: "Shipment created, waiting for pickup",
        createdAt: hoursAgo(6),
      },
    ],
  },
  {
    id: 7,
    trackingNumber: "TRK7D5E3F1A9B",
    senderName: "Lyon Boutique",
    receiverName: "Chantal Mbarga",
    receiverPhone: "+237671887744",
    origin: "Lyon",
    destination: "Douala",
    weight: 3.3,
    description: "Cosmetics",
    status: "In transit",
    createdAt: hoursAgo(60),
    updatedAt: hoursAgo(20),
    events: [
      {
        id: 701,
        status: "Created",
        location: "Lyon",
        description: "Shipment created",
        createdAt: hoursAgo(60),
      },
      {
        id: 702,
        status: "Picked up",
        location: "Lyon",
        description: "Parcel collected",
        createdAt: hoursAgo(54),
      },
      {
        id: 703,
        status: "In transit",
        location: "Paris Charles de Gaulle",
        description: "Handed to the air freight partner",
        createdAt: hoursAgo(20),
      },
    ],
  },
];

// -------------------------------------------------------------------
// 8 mock relay points (Cameroon + France).
// -------------------------------------------------------------------
export const mockRelayPoints = [
  {
    id: 1,
    name: "Relay Point Akwa",
    address: "12 Boulevard de la Liberte, Akwa, Douala",
    city: "Douala",
    postalCode: "00000",
    hours: "Mon-Sat 08:00-19:00",
    distance: 1.2,
  },
  {
    id: 2,
    name: "Relay Point Bonapriso",
    address: "45 Rue Njo-Njo, Bonapriso, Douala",
    city: "Douala",
    postalCode: "00000",
    hours: "Mon-Fri 09:00-18:30",
    distance: 2.8,
  },
  {
    id: 3,
    name: "Relay Point Bastos",
    address: "8 Avenue Charles de Gaulle, Bastos, Yaoundé",
    city: "Yaoundé",
    postalCode: "00001",
    hours: "Mon-Sat 08:30-19:00",
    distance: 0.9,
  },
  {
    id: 4,
    name: "Relay Point Centre Ville",
    address: "20 Avenue Kennedy, Centre, Yaoundé",
    city: "Yaoundé",
    postalCode: "00001",
    hours: "Mon-Sat 08:00-18:00",
    distance: 3.4,
  },
  {
    id: 5,
    name: "Relay Point Bafoussam Gare",
    address: "3 Rue du Marche, Bafoussam",
    city: "Bafoussam",
    postalCode: "00002",
    hours: "Mon-Sat 07:30-18:00",
    distance: 1.7,
  },
  {
    id: 6,
    name: "Relay Point Paris 11",
    address: "56 Rue de la Roquette, 75011 Paris",
    city: "Paris",
    postalCode: "75011",
    hours: "Mon-Sat 09:00-20:00",
    distance: 0.6,
  },
  {
    id: 7,
    name: "Relay Point Lyon Part-Dieu",
    address: "17 Rue du Docteur Bouchut, 69003 Lyon",
    city: "Lyon",
    postalCode: "69003",
    hours: "Mon-Fri 08:30-19:30",
    distance: 1.1,
  },
  {
    id: 8,
    name: "Relay Point Bamenda Commercial Ave",
    address: "9 Commercial Avenue, Bamenda",
    city: "Bamenda",
    postalCode: "00003",
    hours: "Mon-Sat 08:00-18:00",
    distance: 2.2,
  },
];

// -------------------------------------------------------------------
// Mock admin user (used by the mock login).
// -------------------------------------------------------------------
export const mockUser = {
  id: 1,
  email: "admin@example.com",
  name: "Admin",
  role: "admin",
};

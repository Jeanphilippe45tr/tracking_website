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

// Delivery people available in mock mode. They mirror the server seed.
export const mockCouriers = [
  {
    id: 1,
    name: "Diego Alvarez",
    phone: "+1 (212) 555-0175",
    email: "diego@swifttrack.example",
    vehicle: "Cargo van - NYC-14",
    isActive: true,
  },
  {
    id: 2,
    name: "Amara Okafor",
    phone: "+44 20 7946 0588",
    email: "amara@swifttrack.example",
    vehicle: "Electric van - LDN-07",
    isActive: true,
  },
  {
    id: 3,
    name: "Lucas Moreau",
    phone: "+33 6 45 78 12 90",
    email: "lucas@swifttrack.example",
    vehicle: "Scooter - PAR-21",
    isActive: true,
  },
  {
    id: 4,
    name: "Sofia Rossi",
    phone: "+49 30 555 0164",
    email: "sofia@swifttrack.example",
    vehicle: "Cargo bike - BER-03",
    isActive: true,
  },
];

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
      {
        id: 101,
        status: "Created",
        location: "New York",
        description: "Shipment created",
        createdAt: hoursAgo(72),
      },
      {
        id: 102,
        status: "Picked up",
        location: "New York",
        description: "Parcel collected by our courier",
        createdAt: hoursAgo(66),
      },
      {
        id: 103,
        status: "In transit",
        location: "New York Hub",
        description: "Departed the sorting centre",
        createdAt: hoursAgo(48),
      },
      {
        id: 104,
        status: "Out for delivery",
        location: "Boston",
        description: "On the delivery van",
        createdAt: hoursAgo(10),
      },
      {
        id: 105,
        status: "Delivered",
        location: "Boston",
        description: "Delivered and signed by the receiver",
        createdAt: hoursAgo(4),
      },
    ],
  },
  {
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
      {
        id: 201,
        status: "Created",
        location: "New York",
        description: "Shipment created",
        createdAt: hoursAgo(40),
      },
      {
        id: 202,
        status: "Picked up",
        location: "New York",
        description: "Parcel collected by our courier",
        createdAt: hoursAgo(34),
      },
      {
        id: 203,
        status: "In transit",
        location: "New York JFK International Hub",
        description: "Arrived at the international hub",
        createdAt: hoursAgo(6),
      },
    ],
  },
  {
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
      {
        id: 301,
        status: "Created",
        location: "London",
        description: "Shipment created",
        createdAt: hoursAgo(30),
      },
      {
        id: 302,
        status: "Picked up",
        location: "London Hub",
        description: "Parcel collected",
        createdAt: hoursAgo(26),
      },
      {
        id: 303,
        status: "In transit",
        location: "Paris Sorting Centre",
        description: "Processing at the sorting centre",
        createdAt: hoursAgo(8),
      },
      {
        id: 304,
        status: "Out for delivery",
        location: "Paris",
        description: "Out for delivery on the van",
        createdAt: hoursAgo(2),
      },
    ],
  },
  {
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
      {
        id: 401,
        status: "Created",
        location: "Berlin",
        description: "Shipment created",
        createdAt: hoursAgo(52),
      },
      {
        id: 402,
        status: "Picked up",
        location: "Berlin",
        description: "Parcel collected",
        createdAt: hoursAgo(48),
      },
      {
        id: 403,
        status: "In transit",
        location: "Berlin Hub",
        description: "In transit to the destination city",
        createdAt: hoursAgo(24),
      },
      {
        id: 404,
        status: "Delayed",
        location: "Amsterdam Ring Road",
        description: "Delay due to a road closure on the A10",
        createdAt: hoursAgo(9),
      },
    ],
  },
  {
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
      {
        id: 501,
        status: "Created",
        location: "Seattle",
        description: "Shipment created",
        createdAt: hoursAgo(14),
      },
      {
        id: 502,
        status: "Picked up",
        location: "Seattle",
        description: "Parcel collected by our courier",
        createdAt: hoursAgo(11),
      },
    ],
  },
  {
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
      {
        id: 601,
        status: "Created",
        location: "Toronto",
        description: "Shipment created, waiting for pickup",
        createdAt: hoursAgo(6),
      },
    ],
  },
  {
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
      {
        id: 701,
        status: "Created",
        location: "Milan",
        description: "Shipment created",
        createdAt: hoursAgo(60),
      },
      {
        id: 702,
        status: "Picked up",
        location: "Milan",
        description: "Parcel collected",
        createdAt: hoursAgo(54),
      },
      {
        id: 703,
        status: "In transit",
        location: "Singapore Changi",
        description: "Handed to the air freight partner",
        createdAt: hoursAgo(20),
      },
    ],
  },
];

// Address details and coordinates for the demo shipments. Keeping them in
// the mock data means the maps work immediately in mock mode too.
const mockShipmentExtras = {
  TRK000000001: {
    originAddress: "350 5th Avenue",
    originRegion: "NY",
    originPostalCode: "10118",
    originCountry: "United States",
    originLat: 40.7484,
    originLng: -73.9857,
    destinationAddress: "1 City Hall Square",
    destinationRegion: "MA",
    destinationPostalCode: "02201",
    destinationCountry: "United States",
    destinationLat: 42.3604,
    destinationLng: -71.0589,
  },
  TRK3F9A12BC7D: {
    originLat: 40.7128,
    originLng: -74.006,
    destinationLat: 51.5072,
    destinationLng: -0.1276,
  },
  TRK5B7C9D2EF1A: {
    originAddress: "15 Cabot Square",
    originRegion: "Greater London",
    originPostalCode: "E14 4QS",
    originCountry: "United Kingdom",
    originLat: 51.5054,
    originLng: -0.0203,
    destinationAddress: "56 Rue de la Roquette",
    destinationRegion: "Ile-de-France",
    destinationPostalCode: "75011",
    destinationCountry: "France",
    destinationLat: 48.8566,
    destinationLng: 2.3772,
  },
  TRK8A1B2C3D4E: {
    originLat: 52.52,
    originLng: 13.405,
    destinationLat: 52.3676,
    destinationLng: 4.9041,
  },
  TRK9C8B7A6D5F: {
    originAddress: "1201 Western Avenue",
    originRegion: "WA",
    originPostalCode: "98101",
    originCountry: "United States",
    originLat: 47.6062,
    originLng: -122.3321,
    destinationAddress: "1 Ferry Building",
    destinationRegion: "CA",
    destinationPostalCode: "94111",
    destinationCountry: "United States",
    destinationLat: 37.7955,
    destinationLng: -122.3937,
  },
  TRK2E4F6A8B0C: {
    originLat: 43.6532,
    originLng: -79.3832,
    destinationLat: 40.7128,
    destinationLng: -74.006,
  },
  TRK7D5E3F1A9B: {
    originAddress: "Via Monte Napoleone 8",
    originRegion: "MI",
    originPostalCode: "20121",
    originCountry: "Italy",
    originLat: 45.4685,
    originLng: 9.1914,
    destinationAddress: "10 Bayfront Avenue",
    destinationRegion: "Central Region",
    destinationPostalCode: "018956",
    destinationCountry: "Singapore",
    destinationLat: 1.283,
    destinationLng: 103.855,
  },
};

mockShipments.forEach((shipment, index) => {
  Object.assign(shipment, mockShipmentExtras[shipment.trackingNumber] || {});
  // Leave the last two shipments unassigned so the UI shows both states.
  shipment.deliveryPersonId =
    index < 5 ? mockCouriers[index % mockCouriers.length].id : null;
});

// -------------------------------------------------------------------
// 8 mock relay points (Americas, Europe and Asia-Pacific).
// -------------------------------------------------------------------
export const mockRelayPoints = [
  {
    id: 1,
    name: "Relay Point Midtown Manhattan",
    address: "245 Madison Avenue, New York, NY 10016",
    city: "New York",
    postalCode: "10016",
    hours: "Mon-Sat 08:00-20:00",
    distance: 0.8,
  },
  {
    id: 2,
    name: "Relay Point Brooklyn Heights",
    address: "128 Montague Street, Brooklyn, NY 11201",
    city: "New York",
    postalCode: "11201",
    hours: "Mon-Sat 08:00-19:00",
    distance: 2.4,
  },
  {
    id: 3,
    name: "Relay Point Canary Wharf",
    address: "15 Cabot Square, London E14 4QS",
    city: "London",
    postalCode: "E14",
    hours: "Mon-Sat 08:00-20:00",
    distance: 0.6,
  },
  {
    id: 4,
    name: "Relay Point Shoreditch",
    address: "86 Great Eastern Street, London EC2A 3JL",
    city: "London",
    postalCode: "EC2A",
    hours: "Mon-Sun 09:00-21:00",
    distance: 1.1,
  },
  {
    id: 5,
    name: "Relay Point Paris 11",
    address: "56 Rue de la Roquette, 75011 Paris",
    city: "Paris",
    postalCode: "75011",
    hours: "Mon-Sat 09:00-20:00",
    distance: 0.6,
  },
  {
    id: 6,
    name: "Relay Point Berlin Mitte",
    address: "Torstraße 140, 10119 Berlin",
    city: "Berlin",
    postalCode: "10119",
    hours: "Mon-Sat 08:00-20:00",
    distance: 1.4,
  },
  {
    id: 7,
    name: "Relay Point Marina Bay",
    address: "8 Marina Boulevard, Singapore 018981",
    city: "Singapore",
    postalCode: "018981",
    hours: "Mon-Sat 08:30-19:00",
    distance: 0.9,
  },
  {
    id: 8,
    name: "Relay Point Queen West",
    address: "478 Queen Street West, Toronto, ON M5V 2B2",
    city: "Toronto",
    postalCode: "M5V 2B2",
    hours: "Mon-Sat 09:00-19:30",
    distance: 1.7,
  },
];

// Coordinates and structured address fields for the mock relay points.
const mockRelayMeta = {
  "Relay Point Midtown Manhattan": {
    region: "NY",
    country: "United States",
    lat: 40.7502,
    lng: -73.9844,
  },
  "Relay Point Brooklyn Heights": {
    region: "NY",
    country: "United States",
    lat: 40.6957,
    lng: -73.9943,
  },
  "Relay Point Canary Wharf": {
    region: "Greater London",
    country: "United Kingdom",
    lat: 51.5054,
    lng: -0.0203,
  },
  "Relay Point Shoreditch": {
    region: "Greater London",
    country: "United Kingdom",
    lat: 51.5255,
    lng: -0.0795,
  },
  "Relay Point Paris 11": {
    region: "Ile-de-France",
    country: "France",
    lat: 48.8566,
    lng: 2.3772,
  },
  "Relay Point Berlin Mitte": {
    region: "Berlin",
    country: "Germany",
    lat: 52.5298,
    lng: 13.4006,
  },
  "Relay Point Marina Bay": {
    region: "Central Region",
    country: "Singapore",
    lat: 1.283,
    lng: 103.855,
  },
  "Relay Point Queen West": {
    region: "ON",
    country: "Canada",
    lat: 43.647,
    lng: -79.396,
  },
};

mockRelayPoints.forEach((point) => {
  Object.assign(point, mockRelayMeta[point.name] || {});
  point.isActive = true;
});

// -------------------------------------------------------------------
// Mock admin user (used by the mock login).
// -------------------------------------------------------------------
export const mockUser = {
  id: 1,
  email: "admin@example.com",
  name: "Admin",
  role: "admin",
};

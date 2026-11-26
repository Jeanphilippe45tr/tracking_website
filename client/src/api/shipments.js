// -------------------------------------------------------------------
// Shipment API functions.
// -------------------------------------------------------------------
// Every page/component calls THESE functions — never axios directly.
// Each function checks USE_MOCK (from .env):
//   - true  -> returns fake data from mockData.js after a short delay
//   - false -> calls the real backend with axios
//
// Because the two branches return the SAME shape, the UI code does not
// care which mode is active. To use the real backend, just set
// VITE_USE_MOCK=false in client/.env.
// -------------------------------------------------------------------

import apiClient, { USE_MOCK, delay } from "./client";
import {
  mockShipments,
  mockRelayPoints,
  mockCouriers,
  generateTrackingNumber,
  STATUSES,
} from "./mockData";

// --- Shared helpers ------------------------------------------------

// A tiny helper that clones data so the UI cannot accidentally mutate
// the mock arrays through the objects it received.
const clone = (value) => JSON.parse(JSON.stringify(value));

// Lower-case and strip the accents so that "São Paulo" also finds
// "Sao Paulo" (the spelling used in the shipped data).
const fold = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// Find one shipment in the mock array by tracking number.
function findMockShipment(trackingNumber) {
  return mockShipments.find(
    (s) =>
      s.trackingNumber.toLowerCase() === String(trackingNumber).toLowerCase()
  );
}

// Attach the delivery-person record the same way the backend does.
function withCourier(shipment) {
  const courier = mockCouriers.find(
    (item) => item.id === Number(shipment.deliveryPersonId)
  );
  return { ...shipment, deliveryPerson: courier || null };
}

// --- GET /shipments/:trackingNumber (PUBLIC) -----------------------
// Used by the public tracking page.
export async function getShipmentByTrackingNumber(trackingNumber) {
  if (USE_MOCK) {
    await delay(500);
    const shipment = findMockShipment(trackingNumber);
    if (!shipment) {
      const err = new Error("Shipment not found");
      err.status = 404;
      throw err;
    }
    return clone(withCourier(shipment));
  }

  const { data } = await apiClient.get(`/shipments/${trackingNumber}`);
  return data;
}

// --- GET /shipments (ADMIN) ----------------------------------------
// Returns the full list for the dashboard and shipments table.
export async function getShipments() {
  if (USE_MOCK) {
    await delay(500);
    // Newest first.
    const sorted = [...mockShipments].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    return clone(sorted.map(withCourier));
  }

  const { data } = await apiClient.get("/shipments");
  return data;
}

// --- POST /shipments (ADMIN) ---------------------------------------
// Creates a shipment. The backend normally generates the tracking
// number; in mock mode we generate one locally.
export async function createShipment(payload) {
  if (USE_MOCK) {
    await delay(600);
    const now = new Date().toISOString();

    const newShipment = {
      id: Math.max(0, ...mockShipments.map((s) => s.id)) + 1,
      trackingNumber: generateTrackingNumber(),
      senderName: payload.senderName,
      receiverName: payload.receiverName,
      receiverPhone: payload.receiverPhone,
      origin: payload.origin,
      originAddress: payload.originAddress || "",
      originRegion: payload.originRegion || "",
      originPostalCode: payload.originPostalCode || "",
      originCountry: payload.originCountry || "",
      originLat: payload.originLat !== "" ? Number(payload.originLat) || null : null,
      originLng: payload.originLng !== "" ? Number(payload.originLng) || null : null,
      destination: payload.destination,
      destinationAddress: payload.destinationAddress || "",
      destinationRegion: payload.destinationRegion || "",
      destinationPostalCode: payload.destinationPostalCode || "",
      destinationCountry: payload.destinationCountry || "",
      destinationLat:
        payload.destinationLat !== "" ? Number(payload.destinationLat) || null : null,
      destinationLng:
        payload.destinationLng !== "" ? Number(payload.destinationLng) || null : null,
      weight: Number(payload.weight),
      description: payload.description || "",
      status: "Created",
      deliveryPersonId: payload.deliveryPersonId
        ? Number(payload.deliveryPersonId)
        : null,
      createdAt: now,
      updatedAt: now,
      events: [
        {
          id: Date.now(),
          status: "Created",
          location: payload.origin,
          description: "Shipment created",
          lat: payload.originLat !== "" ? Number(payload.originLat) || null : null,
          lng: payload.originLng !== "" ? Number(payload.originLng) || null : null,
          createdAt: now,
        },
      ],
    };

    // Unshift puts it at the top of the in-memory array so the admin
    // list shows it immediately during the session.
    mockShipments.unshift(newShipment);
    return clone(withCourier(newShipment));
  }

  const { data } = await apiClient.post("/shipments", payload);
  return data;
}

// --- PATCH /shipments/:trackingNumber (ADMIN) ----------------------
// Used by the shipment detail page to assign / change a delivery person
// and to correct address details.
export async function updateShipment(trackingNumber, patch) {
  if (USE_MOCK) {
    await delay(400);
    const shipment = findMockShipment(trackingNumber);
    if (!shipment) {
      const err = new Error("Shipment not found");
      err.status = 404;
      throw err;
    }

    const editable = [
      "senderName",
      "receiverName",
      "receiverPhone",
      "weight",
      "description",
      "origin",
      "originAddress",
      "originRegion",
      "originPostalCode",
      "originCountry",
      "originLat",
      "originLng",
      "destination",
      "destinationAddress",
      "destinationRegion",
      "destinationPostalCode",
      "destinationCountry",
      "destinationLat",
      "destinationLng",
      "deliveryPersonId",
    ];
    editable.forEach((key) => {
      if (patch[key] !== undefined) {
        shipment[key] =
          key.endsWith("Lat") || key.endsWith("Lng") || key === "weight"
            ? patch[key] === "" || patch[key] === null
              ? null
              : Number(patch[key])
            : patch[key];
      }
    });
    shipment.updatedAt = new Date().toISOString();
    return clone(withCourier(shipment));
  }

  const { data } = await apiClient.patch(
    `/shipments/${trackingNumber}`,
    patch
  );
  return data;
}

// --- POST /shipments/:trackingNumber/events (ADMIN) ----------------
// Adds a tracking update and returns the UPDATED shipment.
export async function addShipmentEvent(trackingNumber, event) {
  if (USE_MOCK) {
    await delay(500);
    const shipment = findMockShipment(trackingNumber);
    if (!shipment) {
      const err = new Error("Shipment not found");
      err.status = 404;
      throw err;
    }

    const now = new Date().toISOString();
    const newEvent = {
      id: Date.now(),
      status: event.status,
      location: event.location,
      description: event.description || "",
      createdAt: now,
    };

    shipment.events.push(newEvent);
    // Adding an update also moves the shipment to that status.
    shipment.status = event.status;
    shipment.updatedAt = now;

    return clone(shipment);
  }

  const { data } = await apiClient.post(
    `/shipments/${trackingNumber}/events`,
    event
  );
  return data;
}

// --- GET /relay-points?q=city (PUBLIC) -----------------------------
// Returns relay points, optionally filtered by city or postal code.
export async function getRelayPoints(query = "") {
  if (USE_MOCK) {
    await delay(400);
    const q = fold(query.trim());
    if (!q) return clone(mockRelayPoints);

    const results = mockRelayPoints.filter(
      (p) =>
        fold(p.city).includes(q) ||
        fold(p.postalCode).includes(q) ||
        fold(p.name).includes(q) ||
        fold(p.address).includes(q)
    );
    return clone(results);
  }

  const { data } = await apiClient.get("/relay-points", { params: { q: query } });
  return data;
}

// Exported for convenience so components can build status <select>s.
export { STATUSES };

// --- Admin relay-point management ----------------------------------
// The public getRelayPoints() above only returns active points. These
// helpers include hidden points and let the admin create / hide them.
export async function getAdminRelayPoints() {
  if (USE_MOCK) {
    await delay(300);
    return clone(
      [...mockRelayPoints].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return String(a.city).localeCompare(String(b.city));
      })
    );
  }

  const { data } = await apiClient.get("/relay-points/admin");
  return data;
}

export async function createRelayPoint(payload) {
  if (USE_MOCK) {
    await delay(450);
    const point = {
      id: Math.max(0, ...mockRelayPoints.map((p) => p.id)) + 1,
      name: payload.name,
      address: payload.address,
      city: payload.city,
      region: payload.region || "",
      postalCode: payload.postalCode || "",
      country: payload.country || "",
      hours: payload.hours || "",
      distance: Number(payload.distance) || 0,
      lat: payload.lat !== "" ? Number(payload.lat) || null : null,
      lng: payload.lng !== "" ? Number(payload.lng) || null : null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockRelayPoints.push(point);
    return clone(point);
  }

  const { data } = await apiClient.post("/relay-points", payload);
  return data;
}

export async function updateRelayPoint(id, patch) {
  if (USE_MOCK) {
    await delay(350);
    const point = mockRelayPoints.find((item) => item.id === Number(id));
    if (!point) {
      const err = new Error("Relay point not found");
      err.status = 404;
      throw err;
    }
    Object.assign(point, patch, { updatedAt: new Date().toISOString() });
    return clone(point);
  }

  const { data } = await apiClient.patch(`/relay-points/${id}`, patch);
  return data;
}

export async function deleteRelayPoint(id) {
  if (USE_MOCK) {
    await delay(300);
    const point = mockRelayPoints.find((item) => item.id === Number(id));
    if (!point) {
      const err = new Error("Relay point not found");
      err.status = 404;
      throw err;
    }
    point.isActive = false;
    return { hidden: true, id: Number(id) };
  }

  const { data } = await apiClient.delete(`/relay-points/${id}`);
  return data;
}

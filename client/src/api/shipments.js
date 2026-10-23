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
  generateTrackingNumber,
  STATUSES,
} from "./mockData";

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
    return clone(shipment);
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
    return clone(sorted);
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
      destination: payload.destination,
      weight: Number(payload.weight),
      description: payload.description || "",
      status: "Created",
      createdAt: now,
      updatedAt: now,
      events: [
        {
          id: Date.now(),
          status: "Created",
          location: payload.origin,
          description: "Shipment created",
          createdAt: now,
        },
      ],
    };

    // Unshift puts it at the top of the in-memory array so the admin
    // list shows it immediately during the session.
    mockShipments.unshift(newShipment);
    return clone(newShipment);
  }

  const { data } = await apiClient.post("/shipments", payload);
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

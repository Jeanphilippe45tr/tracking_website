// -------------------------------------------------------------------
// Delivery people (couriers) API.
// -------------------------------------------------------------------
// These are staff records (not login accounts) that the admin can assign
// to shipments. In mock mode the same functions mutate mockCouriers so
// the demo UI works without a server.
// -------------------------------------------------------------------

import apiClient, { USE_MOCK, delay } from "./client";
import { mockCouriers } from "./mockData";

const clone = (value) => JSON.parse(JSON.stringify(value));
const newId = () => Math.max(0, ...mockCouriers.map((c) => c.id)) + 1;

export async function getCouriers() {
  if (USE_MOCK) {
    await delay(250);
    return clone(
      [...mockCouriers].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
    );
  }

  const { data } = await apiClient.get("/couriers");
  return data;
}

export async function createCourier(payload) {
  if (USE_MOCK) {
    await delay(400);
    const courier = {
      id: newId(),
      name: String(payload.name || "").trim(),
      phone: String(payload.phone || "").trim(),
      email: String(payload.email || "").trim(),
      vehicle: String(payload.vehicle || "").trim(),
      isActive: payload.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockCouriers.push(courier);
    return clone(courier);
  }

  const { data } = await apiClient.post("/couriers", payload);
  return data;
}

export async function updateCourier(id, patch) {
  if (USE_MOCK) {
    await delay(350);
    const courier = mockCouriers.find((item) => item.id === Number(id));
    if (!courier) {
      const err = new Error("Delivery person not found");
      err.status = 404;
      throw err;
    }
    Object.assign(courier, patch, { updatedAt: new Date().toISOString() });
    return clone(courier);
  }

  const { data } = await apiClient.patch(`/couriers/${id}`, patch);
  return data;
}

export async function deleteCourier(id) {
  if (USE_MOCK) {
    await delay(300);
    const index = mockCouriers.findIndex((item) => item.id === Number(id));
    if (index === -1) {
      const err = new Error("Delivery person not found");
      err.status = 404;
      throw err;
    }
    mockCouriers[index].isActive = false;
    return { deactivated: true, id: Number(id) };
  }

  const { data } = await apiClient.delete(`/couriers/${id}`);
  return data;
}

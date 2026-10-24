// -------------------------------------------------------------------
// Live Tracking API functions.
// -------------------------------------------------------------------
// Real API calls for the live tracking simulation. In mock mode, the
// client uses localStorage (lib/liveTracking.js).
// -------------------------------------------------------------------

import apiClient, { USE_MOCK, delay } from "./client";

// --- GET /api/live ---
export async function getLiveSession() {
  if (USE_MOCK) {
    await delay(300);
    throw new Error("Not implemented in mock mode");
  }

  const { data } = await apiClient.get("/live");
  return data;
}

// --- POST /api/live/start ---
export async function startLiveSession(payload) {
  if (USE_MOCK) {
    await delay(400);
    throw new Error("Not implemented in mock mode");
  }

  const { data } = await apiClient.post("/live/start", payload);
  return data;
}

// --- POST /api/live/pause ---
export async function pauseLiveSession() {
  if (USE_MOCK) {
    await delay(300);
    throw new Error("Not implemented in mock mode");
  }

  const { data } = await apiClient.post("/live/pause");
  return data;
}

// --- POST /api/live/resume ---
export async function resumeLiveSession() {
  if (USE_MOCK) {
    await delay(300);
    throw new Error("Not implemented in mock mode");
  }

  const { data } = await apiClient.post("/live/resume");
  return data;
}

// --- POST /api/live/stop ---
export async function stopLiveSession() {
  if (USE_MOCK) {
    await delay(300);
    throw new Error("Not implemented in mock mode");
  }

  const { data } = await apiClient.post("/live/stop");
  return data;
}

// --- POST /api/live/reset ---
export async function resetLiveSession() {
  if (USE_MOCK) {
    await delay(300);
    throw new Error("Not implemented in mock mode");
  }

  const { data } = await apiClient.post("/live/reset");
  return data;
}

// --- POST /api/live/speed ---
export async function setLiveSpeed(speed) {
  if (USE_MOCK) {
    await delay(300);
    throw new Error("Not implemented in mock mode");
  }

  const { data } = await apiClient.post("/live/speed", { speed });
  return data;
}
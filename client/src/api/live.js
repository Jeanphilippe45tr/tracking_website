// -------------------------------------------------------------------
// Live tracking API (several concurrent runs).
// -------------------------------------------------------------------
// The admin can start more than one simulation at the same time. Every
// run is stored in the backend, so every visitor — on any device — sees
// the same moving parcels.
//
//   getLiveState()            -> { runs: [...], serverTime }
//   startLive(payload)        -> the new run
//   pauseLive(id)             -> one run
//   resumeLive(id)            -> one run
//   stopLive(id)              -> one run
//   setLiveTransport(id, mode) -> one run
//   removeLive(id)            -> { deleted: true, id }
//   resetLiveState()          -> { runs: [] }
// -------------------------------------------------------------------

import apiClient from "./client";

export async function getLiveState() {
  const { data } = await apiClient.get("/live");
  return data;
}

export async function startLive(payload) {
  const { data } = await apiClient.post("/live/start", payload);
  return data;
}

export async function pauseLive(id) {
  const { data } = await apiClient.post(`/live/${id}/pause`);
  return data;
}

export async function resumeLive(id) {
  const { data } = await apiClient.post(`/live/${id}/resume`);
  return data;
}

export async function stopLive(id) {
  const { data } = await apiClient.post(`/live/${id}/stop`);
  return data;
}

export async function setLiveTransport(id, transportMode) {
  const { data } = await apiClient.patch(`/live/${id}/speed`, {
    transportMode,
  });
  return data;
}

export async function removeLive(id) {
  const { data } = await apiClient.delete(`/live/${id}`);
  return data;
}

export async function resetLiveState() {
  const { data } = await apiClient.post("/live/reset");
  return data;
}

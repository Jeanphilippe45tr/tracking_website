// -------------------------------------------------------------------
// Live tracking simulation.
// -------------------------------------------------------------------
// Gives the admin a real control panel (start / pause / stop / reset)
// for a moving parcel. In real mode, state is synced with the server
// via polling. In mock mode, state lives in localStorage.
// -------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import { USE_MOCK } from "../api/client";
import { createPersistentStore } from "./persistentStore";
import { coordsFor, DEFAULT_CENTER } from "../data/geo";
import * as liveApi from "../api/live";

// Full route takes this long at 1× speed (2 minutes).
export const SIM_BASE_DURATION_MS = 120000;
export const SPEED_OPTIONS = [1, 2, 5, 10];

export const LIVE_STATUS = {
  IDLE: "idle",
  RUNNING: "running",
  PAUSED: "paused",
  STOPPED: "stopped",
  COMPLETED: "completed",
};

function initialState() {
  return {
    status: LIVE_STATUS.IDLE,
    trackNumber: null,
    shipmentId: null,
    origin: "",
    destination: "",
    route: [],
    progress: 0,
    speed: 2,
    statusLabel: "Idle",
    startedAt: null,
    updatedAt: null,
    lastTick: null,
    hostId: null,
  };
}

// Create the appropriate store implementation at module level
let _liveStoreImpl;

if (USE_MOCK) {
  // Mock mode: localStorage store
  _liveStoreImpl = createPersistentStore("swifttrack.live.v2", initialState);
} else {
  // Real mode: API-backed store with polling
  let cache = initialState();
  const listeners = new Set();

  function emit() {
    listeners.forEach((listener) => listener());
  }

  _liveStoreImpl = {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return cache;
    },
    async refresh() {
      try {
        const data = await liveApi.getLiveSession();
        cache = { ...cache, ...data };
        emit();
      } catch (err) {
        console.error("Failed to fetch live session:", err);
      }
    },
    async start(payload) {
      const data = await liveApi.startLiveSession(payload);
      cache = { ...cache, ...data };
      emit();
    },
    async pause() {
      const data = await liveApi.pauseLiveSession();
      cache = { ...cache, ...data };
      emit();
    },
    async resume() {
      const data = await liveApi.resumeLiveSession();
      cache = { ...cache, ...data };
      emit();
    },
    async stop() {
      const data = await liveApi.stopLiveSession();
      cache = { ...cache, ...data };
      emit();
    },
    async reset() {
      const data = await liveApi.resetLiveSession();
      cache = { ...cache, ...data };
      emit();
    },
    async setSpeed(speed) {
      const data = await liveApi.setLiveSpeed(speed);
      cache = { ...cache, ...data };
      emit();
    },
  };

  // Start polling every 2 seconds
  let pollInterval = null;
  function startPolling() {
    if (pollInterval) return;
    pollInterval = setInterval(() => _liveStoreImpl.refresh(), 2000);
    _liveStoreImpl.refresh(); // initial fetch
  }
  startPolling();
}

// Export liveStore for mock mode timer access (alias to _liveStoreImpl in mock mode)
export const liveStore = _liveStoreImpl;
export const liveStoreImpl = _liveStoreImpl;

// Unified hook - always call useSyncExternalStore in the same order
export function useLiveTrackingStore() {
  return useSyncExternalStore(
    liveStoreImpl.subscribe,
    liveStoreImpl.getSnapshot,
    liveStoreImpl.getSnapshot
  );
}

// -------------------------------------------------------------------
// Geometry helpers (shared between mock and real modes)
// -------------------------------------------------------------------

// Build a gentle 3-point curve between two cities so the moving marker
// does not simply slide along a boring straight line.
export function buildRoute(origin, destination) {
  const a = coordsFor(origin) || DEFAULT_CENTER;
  const b = coordsFor(destination) || DEFAULT_CENTER;

  // Origin and destination are the same city: draw a small loop.
  if (Math.abs(a[0] - b[0]) < 0.0001 && Math.abs(a[1] - b[1]) < 0.0001) {
    return [a, [a[0] + 0.02, a[1] + 0.025], b];
  }

  const latSpan = b[0] - a[0];
  const lngSpan = b[1] - a[1];
  const middle = [
    (a[0] + b[0]) / 2 - lngSpan * 0.1,
    (a[1] + b[1]) / 2 + latSpan * 0.1,
  ];

  return [a, middle, b];
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Approximate segment length in degrees — good enough for interpolation
// on a map at this scale.
function segmentLength(a, b) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

// Convert progress (0..1) into a {lat,lng} on the polyline.
export function positionAt(route, progress) {
  if (!route || route.length === 0) return null;
  if (route.length === 1) {
    return { lat: route[0][0], lng: route[0][1] };
  }

  const p = clamp(Number(progress) || 0, 0, 1);
  const lengths = [];
  let total = 0;
  for (let i = 0; i < route.length - 1; i += 1) {
    const length = segmentLength(route[i], route[i + 1]);
    lengths.push(length);
    total += length;
  }

  if (total === 0) return { lat: route[0][0], lng: route[0][1] };

  let target = total * p;
  for (let i = 0; i < lengths.length; i += 1) {
    if (target <= lengths[i] || i === lengths.length - 1) {
      const ratio = lengths[i] === 0 ? 0 : clamp(target / lengths[i], 0, 1);
      const from = route[i];
      const to = route[i + 1];
      return {
        lat: from[0] + (to[0] - from[0]) * ratio,
        lng: from[1] + (to[1] - from[1]) * ratio,
      };
    }
    target -= lengths[i];
  }

  const last = route[route.length - 1];
  return { lat: last[0], lng: last[1] };
}

// The portion of the route already covered (for the solid "travelled"
// line on the map).
export function trailAt(route, progress) {
  if (!route || route.length === 0) return [];

  const p = clamp(Number(progress) || 0, 0, 1);
  const trail = [route[0]];

  if (p === 0) return trail;

  const lengths = [];
  let total = 0;
  for (let i = 0; i < route.length - 1; i += 1) {
    const length = segmentLength(route[i], route[i + 1]);
    lengths.push(length);
    total += length;
  }
  if (total === 0) return trail;

  let target = total * p;
  for (let i = 0; i < lengths.length; i += 1) {
    const ratio = lengths[i] === 0 ? 0 : clamp(target / lengths[i], 0, 1);
    const from = route[i];
    const to = route[i + 1];
    trail.push([
      from[0] + (to[0] - from[0]) * ratio,
      from[1] + (to[1] - from[1]) * ratio,
    ]);
    if (target <= lengths[i]) break;
    target -= lengths[i];
  }

  return trail;
}

// Human label shown next to the live marker.
export function statusLabelFor(progress) {
  const p = clamp(Number(progress) || 0, 0, 1);
  if (p >= 1) return "Delivered";
  if (p >= 0.92) return "Out for delivery";
  if (p >= 0.35) return "In transit";
  if (p >= 0.12) return "Picked up";
  return "Preparing pickup";
}

export const resetLive = () => {
  if (USE_MOCK) {
    liveStoreImpl.reset();
  } else {
    liveStoreImpl.reset();
  }
};
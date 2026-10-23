// -------------------------------------------------------------------
// Live tracking simulation.
// -------------------------------------------------------------------
// Gives the admin a real control panel (start / pause / stop / reset)
// for a moving parcel. The state lives in localStorage, so the public
// Live Map page (and even a second browser tab) sees the same movement.
//
// The simulation advances by elapsed time rather than by tick count, so
// it stays accurate even when the tab is throttled in the background.
// -------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import { createPersistentStore } from "./persistentStore";
import { coordsFor, DEFAULT_CENTER } from "../data/geo";

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

export const liveStore = createPersistentStore(
  "swifttrack.live.v2",
  initialState
);

export function useLiveTrackingStore() {
  return useSyncExternalStore(
    liveStore.subscribe,
    liveStore.getSnapshot,
    liveStore.getSnapshot
  );
}

// -------------------------------------------------------------------
// Geometry helpers
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

export const resetLive = () => liveStore.reset();

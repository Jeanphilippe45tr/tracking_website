// -------------------------------------------------------------------
// Live tracking simulation (several runs at the same time).
// -------------------------------------------------------------------
// Real mode keeps every run in the backend; mock mode keeps an array of
// runs in localStorage so the demo works without a server.
//
// The simulation advances by elapsed time rather than by tick count, so
// it stays accurate even when the tab is throttled in the background.
// -------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import { createPersistentStore } from "./persistentStore";
import { coordsFor, DEFAULT_CENTER } from "../data/geo";

// Real-world cruising speeds used by the simulation. The journey time is
// calculated from the actual distance between the two saved points, so a
// ship crossing an ocean really does take days.
export const TRANSPORT_MODES = [
  { id: "road", label: "Road", speedKmh: 70, note: "truck / courier" },
  { id: "rail", label: "Rail", speedKmh: 80, note: "train freight" },
  { id: "air", label: "Air", speedKmh: 800, note: "cargo flight" },
  { id: "ship", label: "Ship", speedKmh: 35, note: "sea freight" },
];
export const DEFAULT_TRANSPORT_MODE = "road";

export function transportModeById(id) {
  return (
    TRANSPORT_MODES.find((mode) => mode.id === String(id || "").toLowerCase()) ||
    TRANSPORT_MODES.find((mode) => mode.id === DEFAULT_TRANSPORT_MODE)
  );
}

// Only used for old runs saved before real-world speeds were introduced.
export const SIM_BASE_DURATION_MS = 120000;

export const LIVE_STATUS = {
  IDLE: "idle",
  RUNNING: "running",
  PAUSED: "paused",
  STOPPED: "stopped",
  COMPLETED: "completed",
};

// Stable colours so a run keeps the same line colour while it moves.
export const RUN_COLORS = [
  "#0f766e",
  "#c2410c",
  "#2563eb",
  "#9333ea",
  "#b91c1c",
  "#0369a1",
  "#a16207",
  "#15803d",
];

export function runColor(run, index = 0) {
  if (run?.color) return run.color;
  const numeric = Number(run?.id);
  const seed = Number.isFinite(numeric) ? Math.abs(numeric) : index;
  return RUN_COLORS[seed % RUN_COLORS.length];
}

function initialState() {
  return {
    runs: [],
    lastTick: null,
    hostId: null,
  };
}

export const liveStore = createPersistentStore(
  "swifttrack.live.v3",
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

export function validCoords(lat, lng) {
  const a = Number(lat);
  const b = Number(lng);
  return (
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    a >= -90 &&
    a <= 90 &&
    b >= -180 &&
    b <= 180 &&
    !(a === 0 && b === 0)
  );
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Great-circle distance in kilometres between two [lat, lng] points.
export function distanceKmBetween(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const lat1 = toRad(Number(a[0]));
  const lat2 = toRad(Number(b[0]));
  const dLat = lat2 - lat1;
  const dLng = toRad(Number(b[1]) - Number(a[1]));
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Journey time at a real cruising speed. Very short hops still get a
// visible one-minute simulation instead of finishing instantly.
export function durationMsFor(distanceKm, speedKmh) {
  const km = Math.max(0, Number(distanceKm) || 0);
  const speed = Math.max(1, Number(speedKmh) || 1);
  return Math.max(60_000, Math.round((km / speed) * 3_600_000));
}

// Duration for a new run, and a safe fallback for runs created by older
// versions of the app (which stored a multiplier in `speed`).
export function durationMsOf(run) {
  const explicit = Number(run?.durationMs);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const legacySpeed = clamp(Number(run?.speed) || 1, 0.1, 20);
  return SIM_BASE_DURATION_MS / legacySpeed;
}

// Build the visible line between the two saved points. Stored coordinates
// (entered in the admin form or resolved by the server geocoder) always win
// over the built-in city lookup, so the map shows the exact same place the
// admin saved — not an approximate city centre.
export function buildRoute(origin, destination, originCoords, destinationCoords) {
  const a = validCoords(originCoords?.[0], originCoords?.[1])
    ? [Number(originCoords[0]), Number(originCoords[1])]
    : coordsFor(origin) || DEFAULT_CENTER;
  const b = validCoords(destinationCoords?.[0], destinationCoords?.[1])
    ? [Number(destinationCoords[0]), Number(destinationCoords[1])]
    : coordsFor(destination) || DEFAULT_CENTER;

  // Origin and destination are the same place: draw a small loop so the
  // marker still has a visible path to follow.
  if (Math.abs(a[0] - b[0]) < 0.0001 && Math.abs(a[1] - b[1]) < 0.0001) {
    return [a, [a[0] + 0.02, a[1] + 0.025], b];
  }

  return [a, b];
}

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

// How long until the parcel arrives, at the current transport speed.
export function etaMsFor(run) {
  const progress = clamp(Number(run?.progress) || 0, 0, 1);
  if (run?.status === LIVE_STATUS.COMPLETED) return 0;
  if (progress >= 1) return 0;
  return Math.round((1 - progress) * durationMsOf(run));
}

// Add the derived map/card fields to a run that came from the backend or
// from the mock store. Kept pure so React can memoize it.
export function normalizeRun(run, index = 0) {
  if (!run) return null;
  const progress = clamp(Number(run.progress) || 0, 0, 1);
  const route = buildRoute(
    run.origin,
    run.destination,
    [run.originLat, run.originLng],
    [run.destinationLat, run.destinationLng]
  );

  // Running runs get a progress-aware label ("In transit", "Out for
  // delivery"…). The backend only knows the generic "Live" state.
  const statusLabel =
    run.status === LIVE_STATUS.RUNNING
      ? statusLabelFor(progress)
      : run.status === LIVE_STATUS.PAUSED
        ? "Paused"
        : run.statusLabel || statusLabelFor(progress);

  // The straight connector between the two saved endpoints. Kept separate
  // from the route so every map can draw the same origin → destination line
  // even when the travelled trail is still empty.
  const link = route.length >= 2 ? [route[0], route[route.length - 1]] : null;

  return {
    ...run,
    progress,
    route,
    link,
    position: positionAt(route, progress),
    trail: trailAt(route, progress),
    statusLabel,
    color: runColor(run, index),
  };
}

export const resetLive = () => liveStore.reset();

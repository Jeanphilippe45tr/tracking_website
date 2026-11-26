// -------------------------------------------------------------------
// Real-world travel speeds for the live simulation.
// -------------------------------------------------------------------
// A run's duration is the great-circle distance between its saved
// origin/destination divided by the selected cruising speed. The client
// uses the same numbers so mock mode and the backend stay in sync.
// -------------------------------------------------------------------

const TRANSPORT_SPEED_KMH = Object.freeze({
  road: 70,
  rail: 80,
  air: 800,
  ship: 35,
});

const DEFAULT_TRANSPORT_MODE = "road";
const TRANSPORT_MODES = Object.keys(TRANSPORT_SPEED_KMH);

function normalizeTransportMode(value, fallback = DEFAULT_TRANSPORT_MODE) {
  const mode = String(value || "").toLowerCase();
  return Object.prototype.hasOwnProperty.call(TRANSPORT_SPEED_KMH, mode)
    ? mode
    : fallback;
}

// Great-circle distance in kilometres between two {lat, lng} points.
function distanceKmBetween(a, b) {
  if (!a || !b) return 0;
  const lat1 = toRad(Number(a.lat));
  const lat2 = toRad(Number(b.lat));
  if (!Number.isFinite(lat1) || !Number.isFinite(lat2)) return 0;

  const dLat = lat2 - lat1;
  const dLng = toRad(Number(b.lng) - Number(a.lng));
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRad(degrees) {
  return (Number(degrees) * Math.PI) / 180;
}

// Even a very short hop gets a visible one-minute simulation rather than
// finishing in a single poll.
function durationMsFor(distanceKm, speedKmh) {
  const km = Math.max(0, Number(distanceKm) || 0);
  const speed = Math.max(1, Number(speedKmh) || 1);
  return Math.max(60_000, Math.round((km / speed) * 3_600_000));
}

module.exports = {
  TRANSPORT_SPEED_KMH,
  TRANSPORT_MODES,
  DEFAULT_TRANSPORT_MODE,
  normalizeTransportMode,
  distanceKmBetween,
  durationMsFor,
};

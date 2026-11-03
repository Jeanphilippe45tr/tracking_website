// -------------------------------------------------------------------
// Geocoding + routing for the live map.
// -------------------------------------------------------------------
// The admin can type a full address (e.g. "324 N 1st Ave, Fairview,
// Oklahoma, 73737") into the origin/destination fields. We resolve it:
//   1. geocode  — Nominatim (OpenStreetMap), free, no API key
//   2. route    — OSRM public server, real road-following polyline
// Falls back to the built-in city table + gentle curve when either
// service is unreachable, so the feature degrades gracefully offline.
// Every successful lookup is cached in the GeoCache table (key = up to
// a full address pair), so repeat runs are instant and we stay well
// below the free services' rate limits.
// -------------------------------------------------------------------

const { GeoCache } = require("./models");

const CITY_COORDS = {
  "new york": [40.7128, -74.006],
  nyc: [40.7128, -74.006],
  manhattan: [40.7831, -73.9712],
  brooklyn: [40.6782, -73.9442],
  boston: [42.3601, -71.0589],
  chicago: [41.8781, -87.6298],
  "los angeles": [34.0522, -118.2437],
  "san francisco": [37.7749, -122.4194],
  seattle: [47.6062, -122.3321],
  miami: [25.7617, -80.1918],
  toronto: [43.6532, -79.3832],
  vancouver: [49.2827, -123.1207],
  "mexico city": [19.4326, -99.1332],
  "sao paulo": [-23.5558, -46.6396],
  "são paulo": [-23.5558, -46.6396],
  london: [51.5072, -0.1276],
  paris: [48.8566, 2.3522],
  lyon: [45.764, 4.8357],
  berlin: [52.52, 13.405],
  amsterdam: [52.3676, 4.9041],
  rotterdam: [51.9244, 4.4777],
  madrid: [40.4168, -3.7038],
  rome: [41.9028, 12.4964],
  milan: [45.4642, 9.19],
  brussels: [50.8503, 4.3517],
  dubai: [25.2048, 55.2708],
  singapore: [1.3521, 103.8198],
  tokyo: [35.6762, 139.6503],
  shanghai: [31.2304, 121.4737],
  "hong kong": [22.3193, 114.1694],
  mumbai: [19.076, 72.8777],
  sydney: [-33.8688, 151.2093],
  melbourne: [-37.8136, 144.9631],
};

const DEFAULT_CENTER = [40.7128, -74.006];

// Nominatim usage policy: identify ourselves; 1 req/sec max — the DB
// cache + sequential (not parallel) lookups keep us far below that.
const USER_AGENT = process.env.GEO_USER_AGENT || "SwiftTrack/1.0 (tracking server)";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";
const FETCH_TIMEOUT_MS = 8000;

function coordsFor(place) {
  if (!place) return null;
  const key = String(place).trim().toLowerCase();
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  const found = Object.keys(CITY_COORDS).find((name) => key.includes(name));
  return found ? CITY_COORDS[found] : null;
}

// Tests run without network access — skip the outbound calls entirely.
function offlineMode() {
  return process.env.NODE_ENV === "test" || process.env.GEO_OFFLINE === "1";
}

function fetchJson(url, headers = {}) {
  return new Promise((resolve) => {
    const controller = new AbortController();
    // fetch is global in Node >= 18 (this project requires >= 18 anyway).
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    fetch(url, {
      headers: { "User-Agent": USER_AGENT, ...headers },
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        clearTimeout(timer);
        resolve(json);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(null);
      });
  });
}

function geoCacheGet(key) {
  return GeoCache.findByPk(key)
    .then((row) => (row ? row.data : null))
    .catch(() => null);
}

function geoCachePut(key, data) {
  return GeoCache.upsert({ key, data }).catch(() => {});
}

// -------------------------------------------------------------------
// geocode(query) -> { lat, lng, label } | null
// -------------------------------------------------------------------
async function geocode(query) {
  const text = String(query || "").trim();
  if (!text) return null;

  const key = `geo:${text.toLowerCase()}`;
  const cached = await geoCacheGet(key);
  if (cached) return cached;

  // Local fallback: the built-in city table also serves as an offline
  // geocoder for well-known city names.
  let result = null;
  if (!offlineMode()) {
    const url = `${NOMINATIM_URL}?q=${encodeURIComponent(text)}&format=json&limit=1&addressdetails=0`;
    const rows = await fetchJson(url);
    const hit = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (hit) {
      result = {
        lat: Number(hit.lat),
        lng: Number(hit.lon),
        label: hit.display_name || text,
      };
    }
  }
  if (!result) {
    const fallback = coordsFor(text);
    if (fallback) {
      result = { lat: fallback[0], lng: fallback[1], label: text };
    }
  }
  if (result) await geoCachePut(key, result);
  return result;
}

// -------------------------------------------------------------------
// roadRoute(a, b) -> { points: [[lat,lng]...], distanceKm } | null
// Real road-following polyline between two [lat,lng] points.
// -------------------------------------------------------------------
async function roadRoute(a, b) {
  const key = `route:${a.lat},${a.lng}|${b.lat},${b.lng}`;
  const cached = await geoCacheGet(key);
  if (cached) return cached;

  if (offlineMode()) return null;

  const url = `${OSRM_URL}/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
  const json = await fetchJson(url);
  const route = json && json.code === "Ok" && json.routes?.[0];
  if (!route?.geometry?.coordinates?.length) return null;

  // OSRM returns [lng, lat]; our map talks [lat, lng].
  const points = route.geometry.coordinates
    // Thin out very long polylines: ~600 waypoints keeps the map
    // snappy and the JSON row small while being visually identical.
    .filter((_, i, all) =>
      all.length <= 700 || i % Math.ceil(all.length / 700) === 0 || i === all.length - 1
    )
    .map(([lng, lat]) => [lat, lng]);

  const result = {
    points,
    distanceKm: Math.round((route.distance / 1000) * 10) / 10,
  };
  await geoCachePut(key, result);
  return result;
}

// Gentle 3-point curve origin -> destination (same formula as the
// client) used when the road routing service is unavailable.
function curveFallback(a, b) {
  if (Math.abs(a.lat - b.lat) < 0.0001 && Math.abs(a.lng - b.lng) < 0.0001) {
    return [
      [a.lat, a.lng],
      [a.lat + 0.02, a.lng + 0.025],
      [b.lat, b.lng],
    ];
  }
  const latSpan = b.lat - a.lat;
  const lngSpan = b.lng - a.lng;
  const middle = [
    (a.lat + b.lat) / 2 - lngSpan * 0.1,
    (a.lng + b.lng) / 2 + latSpan * 0.1,
  ];
  return [[a.lat, a.lng], middle, [b.lat, b.lng]];
}

// Haversine distance in km.
function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// -------------------------------------------------------------------
// buildRoute(origin, destination) — the async, address-aware version.
// Returns { points, distanceKm, suggestedSpeed, origin: pt|null,
//           destination: pt|null }
// `points` is [lat,lng][] — route.field assignment keeps working.
// -------------------------------------------------------------------
async function buildRoute(origin, destination) {
  // Sequential on purpose (Nominatim rate policy: 1 req/sec).
  const originPt = await geocode(origin);
  const destinationPt = await geocode(destination);

  const a = originPt
    ? { lat: originPt.lat, lng: originPt.lng }
    : coordsFor(origin);
  const b = destinationPt
    ? { lat: destinationPt.lat, lng: destinationPt.lng }
    : coordsFor(destination);
  const from = a || { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] };
  const to = b || { lat: DEFAULT_CENTER[0] + 0.05, lng: DEFAULT_CENTER[1] + 0.05 };

  let points;
  let distanceKm = 0;

  const road = await roadRoute(from, to);
  if (road) {
    points = road.points;
    distanceKm = road.distanceKm;
  } else {
    points = curveFallback(from, to);
    distanceKm = Math.round(haversineKm(from, to) * 1.25 * 10) / 10; // road-ish factor
  }

  // Realistic animation speed: long hauls should feel slower than a
  // hop across town. Calibrated so ~75 km ≈ 2×; clamped to the same
  // 0.5–20 range as the manual control.
  const raw = 150 / Math.max(distanceKm, 1);
  const suggestedSpeed =
    Math.round(Math.min(20, Math.max(0.5, raw)) * 10) / 10;

  return {
    points,
    distanceKm,
    suggestedSpeed,
    origin: originPt,
    destination: destinationPt,
  };
}

module.exports = { CITY_COORDS, DEFAULT_CENTER, coordsFor, buildRoute, geocode, roadRoute };

// -------------------------------------------------------------------
// Free address geocoding (OpenStreetMap Nominatim).
// -------------------------------------------------------------------
// No API key is needed, but Nominatim asks clients to make at most one
// request per second. All lookups therefore go through a small queue, and
// results are cached in memory. If the service is unavailable (or
// GEOCODE_ENABLED=false) we fall back to the built-in city list so the map
// still has a sensible position.
// -------------------------------------------------------------------

const env = require("../config/env");
const { coordsForPlace } = require("./cityCoords");

const cache = new Map();
let queue = Promise.resolve();
let lastRequestAt = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function validCoords(lat, lng) {
  const a = toNumber(lat);
  const b = toNumber(lng);
  if (a === null || b === null) return null;
  if (a < -90 || a > 90 || b < -180 || b > 180) return null;
  return { lat: a, lng: b };
}

function manualCoords(parts = {}) {
  const coords = validCoords(parts.lat, parts.lng);
  if (!coords) return null;
  return { ...coords, source: "manual" };
}

function buildQuery(parts = {}) {
  return [parts.address, parts.city, parts.region, parts.postalCode, parts.country]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}

function hasAddressDetail(parts = {}) {
  return [parts.address, parts.region, parts.postalCode, parts.country].some(
    (part) => String(part || "").trim() !== ""
  );
}

function cityFallback(parts = {}, query = "") {
  const local = coordsForPlace(parts.city) || coordsForPlace(query);
  return local ? { lat: local[0], lng: local[1], source: "city" } : null;
}

async function requestNominatim(query) {
  const url = new URL(env.geocode.url);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    headers: {
      "User-Agent": env.geocode.userAgent,
      Accept: "application/json",
      "Accept-Language": "en",
    },
    signal: AbortSignal.timeout(env.geocode.timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Nominatim returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const hit = Array.isArray(data) ? data[0] : null;
  if (!hit) return null;

  const coords = validCoords(hit.lat, hit.lon);
  if (!coords) return null;

  return {
    ...coords,
    displayName: hit.display_name || "",
    source: "nominatim",
  };
}

// Run geocoding operations one after another with the required delay.
function enqueue(task) {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

// One queued lookup. Requests are serialised and spaced out because
// Nominatim allows at most about one request per second.
async function lookup(query) {
  return enqueue(async () => {
    const wait = env.geocode.minIntervalMs - (Date.now() - lastRequestAt);
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();

    try {
      return await requestNominatim(query);
    } catch (err) {
      console.warn(`[geocode] "${query}" failed: ${err.message}`);
      return null;
    }
  });
}

async function geocodePlace(parts = {}) {
  const manual = manualCoords(parts);
  if (manual) return manual;

  const query = buildQuery(parts);
  if (!query) return null;

  // A plain city we already know does not need a network request.
  if (!hasAddressDetail(parts)) {
    const local = cityFallback(parts);
    if (local) return local;
  }

  if (!env.geocode.enabled) return cityFallback(parts, query);

  const key = query.toLowerCase();
  if (cache.has(key)) return cache.get(key);

  let result = await lookup(query);

  // If we already know the city, use that immediately after a failed
  // lookup instead of issuing a second network request.
  const fallback = cityFallback(parts, query);
  if (!result && fallback) {
    cache.set(key, fallback);
    return fallback;
  }

  // A very detailed address can miss. Try the city + country before
  // giving up, so the parcel still appears in the right area.
  if (!result && hasAddressDetail(parts) && parts.city) {
    const simple = [parts.city, parts.country]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(", ");
    if (simple && simple.toLowerCase() !== key) {
      result = await lookup(simple);
    }
  }

  if (result) {
    cache.set(key, result);
    return result;
  }

  return null;
}

// Geocode a free-text location such as an event scan ("Paris Sorting
// Centre"). Short city-like labels stay offline; anything with a comma or
// street detail is sent to Nominatim.
async function geocodeText(text) {
  const query = String(text || "").trim();
  if (!query) return null;

  if (query.length <= 24 && !query.includes(",")) {
    const local = coordsForPlace(query);
    if (local) return { lat: local[0], lng: local[1], source: "city" };
  }

  return geocodePlace({ address: query });
}

module.exports = {
  geocodePlace,
  geocodeText,
  validCoords,
  manualCoords,
};

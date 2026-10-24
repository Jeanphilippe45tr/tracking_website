// City coordinates used to draw the live route on the map.
// Mirrors client/src/data/geo.js so both ends agree on the geometry.

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

function coordsFor(place) {
  if (!place) return null;
  const key = String(place).trim().toLowerCase();
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  const found = Object.keys(CITY_COORDS).find((name) => key.includes(name));
  return found ? CITY_COORDS[found] : null;
}

// Gentle 3-point curve origin -> destination (same formula as the client)
// so the moving marker does not slide along a plain straight line.
function buildRoute(origin, destination) {
  const a = coordsFor(origin) || DEFAULT_CENTER;
  const b = coordsFor(destination) || DEFAULT_CENTER;

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

module.exports = { CITY_COORDS, DEFAULT_CENTER, coordsFor, buildRoute };

// -------------------------------------------------------------------
// Offline city lookup used as a fallback when geocoding is unavailable.
// -------------------------------------------------------------------
// This mirrors client/src/data/geo.js. Keeping a copy on the server means
// a shipment for a well-known city always gets coordinates, even if the
// Nominatim service is blocked or offline.
// -------------------------------------------------------------------

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
  lisbon: [38.7223, -9.1393],
  porto: [41.1579, -8.6291],
  rome: [41.9028, 12.4964],
  milan: [45.4642, 9.19],
  brussels: [50.8503, 4.3517],
  vienna: [48.2082, 16.3738],
  prague: [50.0755, 14.4378],
  copenhagen: [55.6761, 12.5683],
  stockholm: [59.3293, 18.0686],
  oslo: [59.9139, 10.7522],
  helsinki: [60.1699, 24.9384],
  reykjavik: [64.1466, -21.9426],
  dublin: [53.3498, -6.2603],
  edinburgh: [55.9533, -3.1883],
  athens: [37.9838, 23.7275],
  istanbul: [41.0082, 28.9784],
  zurich: [47.3769, 8.5417],
  geneva: [46.2044, 6.1432],
  munich: [48.1351, 11.582],
  hamburg: [53.5511, 9.9937],
  frankfurt: [50.1109, 8.6821],
  dubai: [25.2048, 55.2708],
  singapore: [1.3521, 103.8198],
  tokyo: [35.6762, 139.6503],
  osaka: [34.6937, 135.5023],
  seoul: [37.5665, 126.978],
  beijing: [39.9042, 116.4074],
  shanghai: [31.2304, 121.4737],
  "hong kong": [22.3193, 114.1694],
  mumbai: [19.076, 72.8777],
  delhi: [28.7041, 77.1025],
  bangalore: [12.9716, 77.5946],
  bangkok: [13.7563, 100.5018],
  "kuala lumpur": [3.139, 101.6869],
  jakarta: [-6.2088, 106.8456],
  manila: [14.5995, 120.9842],
  sydney: [-33.8688, 151.2093],
  melbourne: [-37.8136, 144.9631],
  auckland: [-36.8485, 174.7633],
  wellington: [-41.2866, 174.7756],
  "cape town": [-33.9249, 18.4241],
  johannesburg: [-26.2041, 28.0473],
  nairobi: [-1.2921, 36.8219],
  lagos: [6.5244, 3.3792],
  accra: [5.6037, -0.187],
  cairo: [30.0444, 31.2357],
  casablanca: [33.5731, -7.5898],
  "buenos aires": [-34.6037, -58.3816],
  santiago: [-33.4489, -70.6693],
  lima: [-12.0464, -77.0428],
  bogota: [4.711, -74.0721],
  "rio de janeiro": [-22.9068, -43.1729],
};

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Returns [lat, lng] or null. Matches exact names first, then a city name
// contained in a longer label such as "New York JFK International Hub".
function coordsForPlace(place) {
  if (!place) return null;
  const key = normalize(place);
  if (!key) return null;

  if (CITY_COORDS[key]) return CITY_COORDS[key];

  const found = Object.keys(CITY_COORDS).find((name) => key.includes(name));
  return found ? CITY_COORDS[found] : null;
}

module.exports = { CITY_COORDS, coordsForPlace };

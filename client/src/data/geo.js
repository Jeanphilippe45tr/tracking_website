// -------------------------------------------------------------------
// Small geo lookup used by the maps.
// -------------------------------------------------------------------
// The API only stores city names, so we translate them into coordinates
// here. That is enough to draw a sensible route on the map without
// adding a heavy geocoding dependency.
// -------------------------------------------------------------------

export const CITY_COORDS = {
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

// Fallback centre of the map when a city is unknown.
export const DEFAULT_CENTER = [40.7128, -74.006];

// Normalise a place name so "New York" and "new york" both work.
export function coordsFor(place) {
  if (!place) return null;
  const key = String(place).trim().toLowerCase();
  if (CITY_COORDS[key]) return CITY_COORDS[key];

  // Try to find the city inside a longer label such as
  // "New York JFK International Hub" or "Berlin Sorting Centre".
  const found = Object.keys(CITY_COORDS).find((name) => key.includes(name));
  return found ? CITY_COORDS[found] : null;
}

// Approximate coordinates for the relay points (used when the API does
// not provide any).
export const RELAY_COORDS = {
  "Relay Point Midtown Manhattan": [40.7549, -73.984],
  "Relay Point Brooklyn Heights": [40.6955, -73.9932],
  "Relay Point Canary Wharf": [51.5054, -0.0203],
  "Relay Point Shoreditch": [51.5255, -0.0815],
  "Relay Point Paris 11": [48.8578, 2.3795],
  "Relay Point Berlin Mitte": [52.5295, 13.401],
  "Relay Point Marina Bay": [1.283, 103.8607],
  "Relay Point Queen West": [43.647, -79.403],
};

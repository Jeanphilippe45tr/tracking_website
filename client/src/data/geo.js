// -------------------------------------------------------------------
// Small geo lookup used by the maps.
// -------------------------------------------------------------------
// The API only stores city names, so we translate them into coordinates
// here. That is enough to draw a sensible route on the map without
// adding a heavy geocoding dependency.
// -------------------------------------------------------------------

export const CITY_COORDS = {
  douala: [4.0511, 9.7679],
  akwa: [4.0479, 9.7024],
  bonanjo: [4.0486, 9.6961],
  bastos: [3.8953, 11.5124],
  yaounde: [3.848, 11.5021],
  yaoundé: [3.848, 11.5021],
  bafoussam: [5.4781, 10.4176],
  bamenda: [5.9597, 10.1494],
  kribi: [2.9408, 9.9101],
  garoua: [9.3017, 13.3921],
  paris: [48.8566, 2.3522],
  lyon: [45.764, 4.8357],
  marseille: [43.2965, 5.3698],
  dschang: [5.4471, 10.0562],
  abidjan: [5.36, -4.0083],
  accra: [5.6037, -0.187],
  brussels: [50.8503, 4.3517],
  london: [51.5072, -0.1276],
  berlin: [52.52, 13.405],
  madrid: [40.4168, -3.7038],
  dubai: [25.2048, 55.2708],
  nairobi: [-1.2921, 36.8219],
};

// Fallback centre of the map when a city is unknown.
export const DEFAULT_CENTER = [4.0511, 9.7679];

// Normalise a place name so "Douala" and "douala" both work.
export function coordsFor(place) {
  if (!place) return null;
  const key = String(place).trim().toLowerCase();
  if (CITY_COORDS[key]) return CITY_COORDS[key];

  // Try to find the city inside a longer label such as
  // "Douala International Hub" or "Bafoussam Gare".
  const found = Object.keys(CITY_COORDS).find((name) => key.includes(name));
  return found ? CITY_COORDS[found] : null;
}

// Approximate coordinates for the relay points (used when the API does
// not provide any).
export const RELAY_COORDS = {
  "Relay Point Akwa": [4.0479, 9.7024],
  "Relay Point Bonapriso": [4.0206, 9.6969],
  "Relay Point Bastos": [3.8937, 11.5142],
  "Relay Point Centre Ville": [3.8517, 11.5083],
  "Relay Point Bafoussam Gare": [5.4802, 10.4157],
  "Relay Point Paris 11": [48.8578, 2.3795],
  "Relay Point Lyon Part-Dieu": [45.7605, 4.8558],
  "Relay Point Bamenda Commercial Ave": [5.9619, 10.1471],
};

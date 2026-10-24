// -------------------------------------------------------------------
// Shared helpers
// -------------------------------------------------------------------

// Allowed shipment statuses — must match the client exactly
// (client/src/api/mockData.js STATUSES).
const STATUSES = [
  "Created",
  "Picked up",
  "In transit",
  "Out for delivery",
  "Delivered",
  "Delayed",
];

const PHONE_RE = /^[0-9+()\-\s]{6,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Tracking number: TRK + 9 chars, no confusing O/0/I
// (same alphabet as client/src/api/mockData.js).
const TRACK_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";

function generateTrackingNumber() {
  let code = "";
  for (let i = 0; i < 9; i += 1) {
    code += TRACK_CHARS[Math.floor(Math.random() * TRACK_CHARS.length)];
  }
  return `TRK${code}`;
}

// Lower-case + strip accents, so "São Paulo" also finds "Sao Paulo".
function fold(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

module.exports = { STATUSES, PHONE_RE, EMAIL_RE, generateTrackingNumber, fold, clamp };

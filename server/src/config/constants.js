// -------------------------------------------------------------------
// Shared constants used by models, validation and seed data.
// -------------------------------------------------------------------

// Exactly the strings the frontend renders in badges and selects.
const SHIPMENT_STATUSES = [
  "Created",
  "Picked up",
  "In transit",
  "Out for delivery",
  "Delivered",
  "Delayed",
];

const DEFAULT_PREFS = {
  defaultSpeed: 2, // legacy multiplier, no longer used by the dashboard
  defaultTransportMode: "road",
  chatWelcome:
    "Hi! Welcome to SwiftTrack. Tell us your tracking number and how we can help — a human replies here in a few minutes.",
  supportEmail: "support@swifttrack.com",
  notifyNewMessages: true,
  notifyStatusChanges: true,
};

// Only these keys can be written through PATCH /auth/preferences.
const PREFERENCE_KEYS = [
  "defaultSpeed",
  "defaultTransportMode",
  "chatWelcome",
  "supportEmail",
  "notifyNewMessages",
  "notifyStatusChanges",
];

// Preferences that are safe to expose on the public website.
const PUBLIC_PREFERENCE_KEYS = ["chatWelcome", "supportEmail"];

const RELATIONSHIP = {
  CUSTOMER: "customer",
  ADMIN: "admin",
};

module.exports = {
  SHIPMENT_STATUSES,
  DEFAULT_PREFS,
  PREFERENCE_KEYS,
  PUBLIC_PREFERENCE_KEYS,
  RELATIONSHIP,
};

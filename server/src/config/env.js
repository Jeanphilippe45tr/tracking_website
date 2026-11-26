// -------------------------------------------------------------------
// Environment configuration
// -------------------------------------------------------------------
// Everything the server needs is read once here, with sensible local
// development defaults. A missing JWT_SECRET is only tolerated outside
// production so a fresh clone runs out of the box.
// -------------------------------------------------------------------

require("dotenv").config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const jwtSecret = process.env.JWT_SECRET || "";
if (!jwtSecret) {
  if (isProduction) {
    throw new Error("JWT_SECRET must be set in production.");
  }
  console.warn(
    "[config] JWT_SECRET is not set - using an insecure development secret."
  );
}

module.exports = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT) || 5000,
  db: {
    // A single connection string takes priority. Railway's MySQL plugin
    // exposes DATABASE_URL (or MYSQL_URL) plus individual MYSQL* variables;
    // all of them are accepted so either style works without renaming.
    url: process.env.DATABASE_URL || process.env.MYSQL_URL || "",
    name: process.env.DB_NAME || process.env.MYSQLDATABASE || "tracking_db",
    user: process.env.DB_USER || process.env.MYSQLUSER || "root",
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "",
    host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
    // Most hosted MySQL providers require an encrypted connection.
    ssl: ["true", "1", "require", "required"].includes(
      String(process.env.DB_SSL || "").toLowerCase()
    ),
  },
  jwt: {
    secret: jwtSecret || "swifttrack-development-secret-change-me",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  // "*" allows every origin (fine for local development). In production
  // set CORS_ORIGIN=https://your-site.com,https://admin.your-site.com
  corsOrigin: process.env.CORS_ORIGIN || "*",
  // Seed the database with demo data the first time the server starts.
  seedOnStart: process.env.SEED_ON_START !== "false",
  // Create missing tables automatically (safe to leave on in development).
  syncDatabase: process.env.SYNC_DATABASE !== "false",
  // Address lookup for shipment origins, destinations, events and relay
  // points. Nominatim is free and needs no API key. Set GEOCODE_ENABLED=false
  // to rely only on the built-in city list (no outbound requests).
  geocode: {
    enabled: process.env.GEOCODE_ENABLED !== "false",
    url:
      process.env.GEOCODE_URL ||
      "https://nominatim.openstreetmap.org/search",
    userAgent:
      process.env.GEOCODE_USER_AGENT ||
      "SwiftTrack-Demo/1.0 (support@swifttrack.com)",
    minIntervalMs: Number(process.env.GEOCODE_MIN_INTERVAL_MS) || 1100,
    // 5s keeps a two-address shipment well inside common host timeouts.
    timeoutMs: Number(process.env.GEOCODE_TIMEOUT_MS) || 5000,
  },
};

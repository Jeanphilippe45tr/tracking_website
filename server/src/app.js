// -------------------------------------------------------------------
// Express application configuration
// -------------------------------------------------------------------

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const env = require("./config/env");
const { sequelize } = require("./models");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();

app.disable("x-powered-by");
app.use(helmet());

// CORS: "*" in development, or a comma-separated allow-list in prod.
const corsOrigin =
  env.corsOrigin === "*"
    ? true
    : env.corsOrigin.split(",").map((origin) => origin.trim());
app.use(cors({ origin: corsOrigin }));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

if (!env.isProduction) {
  app.use(morgan("dev"));
}

// Friendly index so opening /api in a browser explains what lives here.
// (The real endpoints are documented below; this is not used by the app.)
app.get("/api", (req, res) => {
  res.json({
    name: "SwiftTrack API",
    status: "running",
    health: "/api/health",
    public: [
      "GET /api/shipments/TRK000000001",
      "GET /api/relay-points?q=London",
      "GET /api/settings/public",
      "GET /api/live",
    ],
    auth: [
      "POST /api/auth/login",
      "GET /api/auth/me",
      "PATCH /api/auth/me",
      "POST /api/auth/change-password",
      "PATCH /api/auth/preferences",
    ],
    admin: [
      "GET /api/shipments  (needs Bearer token)",
      "POST /api/shipments",
      "PATCH /api/shipments/:trackingNumber  (edit / assign courier)",
      "POST /api/shipments/:trackingNumber/events",
      "GET /api/couriers",
      "POST /api/couriers",
      "POST /api/relay-points",
      "POST /api/live/start  (start a live run, repeatable)",
      "POST /api/live/:id/pause | /resume | /stop",
      "PATCH /api/live/:id/speed",
      "DELETE /api/live/:id",
    ],
    note: "Login is POST, so opening /api/auth/login in a browser (GET) returns 404. Use the app or an API client.",
  });
});

// Liveness/readiness probe (also verifies the MySQL connection).
app.get("/api/health", async (req, res) => {
  const health = { status: "ok", uptime: process.uptime() };
  try {
    await sequelize.authenticate();
    health.database = "connected";
  } catch (err) {
    health.status = "degraded";
    health.database = "unavailable";
    return res.status(503).json(health);
  }
  return res.json(health);
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/shipments", require("./routes/shipments"));
app.use("/api/relay-points", require("./routes/relayPoints"));
app.use("/api/couriers", require("./routes/couriers"));
app.use("/api/live", require("./routes/live"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/settings", require("./routes/settings"));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

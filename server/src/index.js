require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const sequelize = require("./db");
require("./models");
const { seed } = require("./seed");

const app = express();

// -------------------------------------------------------------------
// Security middleware
// -------------------------------------------------------------------
// Helmet: API-only service, so CSP etc. are left as helmet defaults.
app.use(helmet());

// CORS allow-list — ALLOWED_ORIGIN is a comma-separated list of the
// exact origins allowed to call the API (the deployed Netlify/Render
// frontend). Unset (local dev) = open to all origins.
const allowedOrigins = (process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (allowedOrigins.length > 0) {
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
      },
    })
  );
} else {
  app.use(cors());
}

app.use(express.json());

// Gentle floor for the whole API, then tighter limits where abuse is
// cheap (login brute force, form spam).
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests — please slow down." },
});const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Try again in 15 minutes." },
});
const formLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many submissions. Try again later." },
});

app.use("/api/", apiLimiter);

app.post(
  "/api/shipments",
  (req, res, next) => {
    if (!req.headers.authorization) return res.status(401).json({ error: "You must be signed in as an admin." });
    next();
  },
  (req, res, next) => next()
);


// -------------------------------------------------------------------
// Routes
// -------------------------------------------------------------------
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/shipments", require("./routes/shipments").router);
app.use("/api/relay-points", require("./routes/relayPoints"));
app.use("/api/chat", formLimiter, require("./routes/chat"));
app.use("/api/live", require("./routes/live"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/notifications", require("./routes/notifications"));

// Unknown /api route → JSON 404 (the client shows the .error message).
app.use("/api", (req, res) => {
  res.status(404).json({ error: `Endpoint ${req.method} ${req.path} not found` });
});

// Central error handler — guarantees the { error } shape.
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body." });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

const PORT = process.env.PORT || 5000;

sequelize
  .sync()
  .then(async () => {
    console.log("Database connected");
    // Sync creates missing tables; ensureSchema adds columns that were
    // introduced after an existing table was created (see migrate.js).
    const { ensureSchema } = require("./migrate");
    await ensureSchema();
    await seed();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Database error:", err.message);
    process.exit(1);
  });

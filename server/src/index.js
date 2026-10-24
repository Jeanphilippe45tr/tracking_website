require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./db");
require("./models");
const { seed } = require("./seed");

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------------------------------------------
// Routes
// -------------------------------------------------------------------
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/shipments", require("./routes/shipments"));
app.use("/api/relay-points", require("./routes/relayPoints"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/live", require("./routes/live"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/contact", require("./routes/contact"));

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
    await seed();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Database error:", err.message);
    process.exit(1);
  });

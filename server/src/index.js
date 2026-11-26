require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./db");
const { RelayPoint, AdminUser, defaultPrefs } = require("./models");
const { hashPassword } = require("./lib");
const relayPoints = require("./data/relayPoints.json");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/relay-points", require("./routes/relayPoints"));
app.use("/api/shipments", require("./routes/shipments"));

// Seed relay points once, and create the first admin from env vars.
async function seed() {
  if ((await RelayPoint.count()) === 0) {
    await RelayPoint.bulkCreate(relayPoints.map(({ id, ...rest }) => rest));
  }
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password && (await AdminUser.count()) === 0) {
    await AdminUser.create({
      email,
      passwordHash: hashPassword(password),
      prefs: defaultPrefs,
    });
    console.log("Created initial admin user");
  }
}

sequelize
  .sync({ alter: true })
  .then(seed)
  .then(() => {
    console.log("Database connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Database error:", err.message);
    process.exit(1);
  });

const express = require("express");
const { RelayPoint } = require("../models");
const { fold } = require("../utils/helpers");

const router = express.Router();

// --- GET /api/relay-points?q= (PUBLIC) ------------------------------
// Empty query returns the full list; a query matches city, postal code,
// name or address, ignoring case and accents.
router.get("/", async (req, res) => {
  try {
    const rows = await RelayPoint.findAll();
    const list = rows.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      city: row.city,
      postalCode: row.postalCode,
      hours: row.hours,
      distance: row.distance,
    }));

    const q = fold(req.query.q ?? "");
    if (!q) return res.json(list);

    const results = list.filter(
      (p) =>
        fold(p.city).includes(q) ||
        fold(p.postalCode).includes(q) ||
        fold(p.name).includes(q) ||
        fold(p.address).includes(q)
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

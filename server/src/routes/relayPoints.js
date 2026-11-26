const express = require("express");
const { RelayPoint } = require("../models");
const { fold } = require("../lib");

const router = express.Router();

router.get("/", async (req, res) => {
  const all = await RelayPoint.findAll({ order: [["id", "ASC"]] });
  const q = fold(String(req.query.q || "").trim());
  if (!q) return res.json(all);
  res.json(
    all.filter((p) =>
      [p.city, p.postalCode, p.name, p.address].some((f) => fold(f).includes(q))
    )
  );
});

module.exports = router;

const express = require("express");
const { AdminUser, defaultPrefs } = require("../models");
const { hashPassword, verifyPassword } = require("../lib");
const { signToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  joinedAt: u.createdAt,
});

router.post("/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const user = await AdminUser.findOne({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.patch("/me", requireAdmin, async (req, res) => {
  try {
    const { name, email, phone } = req.body || {};
    if (name !== undefined) req.user.name = String(name).trim();
    if (email !== undefined) req.user.email = String(email).trim().toLowerCase();
    if (phone !== undefined) req.user.phone = String(phone).trim();
    await req.user.save();
    res.json(publicUser(req.user));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/change-password", requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!verifyPassword(String(currentPassword || ""), req.user.passwordHash)) {
    return res.status(400).json({ error: "Your current password is incorrect." });
  }
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters." });
  }
  req.user.passwordHash = hashPassword(String(newPassword));
  req.user.passwordChangedAt = new Date();
  await req.user.save();
  res.json({ ok: true });
});

router.patch("/preferences", requireAdmin, async (req, res) => {
  req.user.prefs = { ...defaultPrefs, ...(req.user.prefs || {}), ...(req.body || {}) };
  await req.user.save();
  res.json(req.user.prefs);
});

module.exports = router;

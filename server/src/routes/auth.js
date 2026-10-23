const express = require("express");
const bcrypt = require("bcryptjs");
const { AdminUser } = require("../models");
const { requireAuth, signToken, toPublicUser, defaultPrefs } = require("../middleware/auth");
const { EMAIL_RE } = require("../utils/helpers");

const router = express.Router();

// --- POST /api/auth/login {email, password} -------------------------
router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await AdminUser.findOne({ where: { email } });

    // Same error for unknown email and wrong password.
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    return res.json({ token: signToken(user), user: toPublicUser(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- GET /api/auth/me ----------------------------------------------
// Lets the client validate a stored token on refresh.
router.get("/me", requireAuth, (req, res) => {
  res.json(toPublicUser(req.admin));
});

// --- PATCH /api/auth/me {name?, email?, phone?} ---------------------
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const user = req.admin;
    const { name, email, phone } = req.body ?? {};

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ error: "Your name is required." });
      }
      user.name = String(name).trim();
    }

    if (email !== undefined) {
      const nextEmail = String(email).trim().toLowerCase();
      if (!EMAIL_RE.test(nextEmail)) {
        return res.status(400).json({ error: "Enter a valid email address." });
      }
      if (nextEmail !== user.email) {
        const taken = await AdminUser.findOne({ where: { email: nextEmail } });
        if (taken) {
          return res.status(400).json({ error: "This email is already in use." });
        }
        user.email = nextEmail;
      }
    }

    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }

    await user.save();
    // The client signs in again with the updated email.
    return res.json({ ...toPublicUser(user), token: signToken(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- POST /api/auth/change-password {currentPassword, newPassword} --
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};
    const user = req.admin;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both passwords are required." });
    }

    const ok = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!ok) {
      return res
        .status(400)
        .json({ error: "Your current password is incorrect." });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: "Use at least 8 characters." });
    }
    if (String(currentPassword) === String(newPassword)) {
      return res
        .status(400)
        .json({ error: "The new password must be different." });
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    user.passwordChangedAt = new Date();
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- PATCH /api/auth/preferences (chat/notify/simulation settings) --
router.patch("/preferences", requireAuth, async (req, res) => {
  try {
    const user = req.admin;
    const current = { ...defaultPrefs(), ...(user.prefs || {}) };

    const patch = {};
    const allowed = [
      "chatWelcome",
      "supportEmail",
      "notifyNewMessages",
      "notifyStatusChanges",
      "defaultSpeed",
    ];
    for (const key of allowed) {
      if (req.body?.[key] !== undefined) patch[key] = req.body[key];
    }

    if (patch.chatWelcome !== undefined && !String(patch.chatWelcome).trim()) {
      return res
        .status(400)
        .json({ error: "The welcome message cannot be empty." });
    }
    if (patch.supportEmail !== undefined && patch.supportEmail !== "" && !EMAIL_RE.test(patch.supportEmail)) {
      return res.status(400).json({ error: "Enter a valid support email." });
    }
    if (patch.defaultSpeed !== undefined) {
      const speed = Number(patch.defaultSpeed);
      if (![1, 2, 5, 10].includes(speed)) {
        return res
          .status(400)
          .json({ error: "Default speed must be 1, 2, 5 or 10." });
      }
      patch.defaultSpeed = speed;
    }

    user.prefs = { ...current, ...patch };
    await user.save();

    return res.json(user.prefs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// -------------------------------------------------------------------
// Authentication routes
// -------------------------------------------------------------------
// Matches the API contract the frontend uses:
//   POST  /api/auth/login           -> { token, user }
//   GET   /api/auth/me              -> current user (token check)
//   PATCH /api/auth/me              -> update name/email/phone
//   POST  /api/auth/change-password -> { ok: true }
//   PATCH /api/auth/preferences     -> updated preferences
// -------------------------------------------------------------------

const express = require("express");
const { User } = require("../models");
const { signToken, requireAuth } = require("../middleware/auth");
const { asyncHandler, badRequest, unauthorized, conflict } = require("../utils/errors");
const { validate, assertValid, pick, EMAIL_RE } = require("../utils/validation");
const { DEFAULT_PREFS, PREFERENCE_KEYS } = require("../config/constants");
const { normalizePrefs } = require("../utils/prefs");
const { TRANSPORT_MODES } = require("../utils/travel");

const router = express.Router();

// POST /api/auth/login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const errors = validate(req.body, {
      email: { required: true, type: "email", label: "Email" },
      password: { required: true, label: "Password" },
    });
    assertValid(errors);

    const email = String(req.body.email).trim().toLowerCase();
    const user = await User.findOne({ where: { email } });

    // Same message for "no such user" and "wrong password" on purpose.
    if (!user || !(await user.verifyPassword(req.body.password))) {
      throw unauthorized("Invalid email or password");
    }

    res.json({ token: signToken(user), user: user.toJSON() });
  })
);

// GET /api/auth/me - lets the frontend validate a saved token on refresh.
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.auth.id);
    if (!user) throw unauthorized("Your account no longer exists.");
    res.json(user.toJSON());
  })
);

// PATCH /api/auth/me - update the admin profile.
router.patch(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.auth.id);
    if (!user) throw unauthorized("Your account no longer exists.");

    const errors = validate(req.body, {
      name: { minLength: 2, maxLength: 120, label: "Name" },
      email: { type: "email", label: "Email" },
      phone: { maxLength: 40, label: "Phone" },
    });
    assertValid(errors);

    if (req.body.name !== undefined) user.name = String(req.body.name).trim();
    if (req.body.phone !== undefined) user.phone = String(req.body.phone).trim();

    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      if (!EMAIL_RE.test(email)) throw badRequest("Enter a valid email address.", {
        email: "Enter a valid email address.",
      });
      const taken = await User.findOne({ where: { email } });
      if (taken && taken.id !== user.id) {
        throw conflict("That email address is already in use.");
      }
      user.email = email;
    }

    await user.save();
    res.json(user.toJSON());
  })
);

// POST /api/auth/change-password
router.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const errors = validate(req.body, {
      currentPassword: { required: true, label: "Current password" },
      newPassword: {
        required: true,
        minLength: 8,
        label: "New password",
        minLengthMessage: "Your new password must be at least 8 characters.",
      },
    });
    assertValid(errors);

    const user = await User.findByPk(req.auth.id);
    if (!user) throw unauthorized("Your account no longer exists.");

    if (!(await user.verifyPassword(req.body.currentPassword))) {
      throw badRequest("Your current password is incorrect.", {
        currentPassword: "Your current password is incorrect.",
      });
    }

    user.passwordHash = await User.hashPassword(req.body.newPassword);
    user.passwordChangedAt = new Date();
    await user.save();

    res.json({ ok: true });
  })
);

// PATCH /api/auth/preferences - chat, notification and simulation prefs.
router.patch(
  "/preferences",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.auth.id);
    if (!user) throw unauthorized("Your account no longer exists.");

    const incoming = req.body || {};
    const prefs = normalizePrefs(user.prefs);

    for (const key of PREFERENCE_KEYS) {
      if (incoming[key] === undefined) continue;

      if (key === "defaultTransportMode") {
        const mode = String(incoming[key] || "").toLowerCase();
        if (!TRANSPORT_MODES.includes(mode)) {
          throw badRequest("Choose a valid transport mode.");
        }
        prefs[key] = mode;
        continue;
      }

      if (key === "defaultSpeed") {
        const speed = Number(incoming[key]);
        if (!Number.isFinite(speed)) {
          throw badRequest("Default speed must be a number.");
        }
        prefs[key] = Math.min(20, Math.max(0.5, speed));
        continue;
      }

      if (key === "notifyNewMessages" || key === "notifyStatusChanges") {
        prefs[key] = Boolean(incoming[key]);
        continue;
      }

      if (typeof incoming[key] === "string") {
        const text = incoming[key].trim();
        if (
          key === "supportEmail" &&
          text &&
          !EMAIL_RE.test(text)
        ) {
          throw badRequest("Enter a valid support email.", {
            supportEmail: "Enter a valid support email.",
          });
        }
        prefs[key] = text;
        continue;
      }

      prefs[key] = incoming[key];
    }

    user.prefs = prefs;
    await user.save();

    res.json(normalizePrefs(user.prefs));
  })
);

module.exports = router;

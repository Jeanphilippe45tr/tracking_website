// -------------------------------------------------------------------
// Public settings (for the chat widget)
// -------------------------------------------------------------------
// GET /api/settings/public -> { chatWelcome, supportEmail }
// The admin preferences live behind auth in /auth/preferences.
// -------------------------------------------------------------------

const express = require("express");
const { User } = require("../models");
const { asyncHandler } = require("../utils/errors");
const { DEFAULT_PREFS, PUBLIC_PREFERENCE_KEYS } = require("../config/constants");
const { normalizePrefs } = require("../utils/prefs");

const router = express.Router();

router.get(
  "/public",
  asyncHandler(async (req, res) => {
    // Use the first admin's prefs as the site-wide defaults shown in
    // the chat widget. Falls back to DEFAULT_PREFS if none exist.
    const admin = await User.findOne({ where: { role: "admin" } });
    const prefs = normalizePrefs(admin?.prefs);
    const result = {};
    for (const key of PUBLIC_PREFERENCE_KEYS) result[key] = prefs[key];
    res.json(result);
  })
);

module.exports = router;

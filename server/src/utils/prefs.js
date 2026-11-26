const { DEFAULT_PREFS } = require("../config/constants");

// MariaDB returns JSON columns as strings to mysql2, while MySQL may
// return parsed objects. This normalises both shapes and fills in any
// preference the stored object does not have yet.
//
// It also ignores unknown keys. Older versions could accidentally save a
// spread string ({"0":"{","1":"\"",...}) into the column; only the known
// preference keys are copied out, so that junk cannot come back.
function normalizePrefs(value) {
  let parsed = value;

  // Some drivers double-encode the value, so try twice.
  for (let attempt = 0; attempt < 2 && typeof parsed === "string"; attempt += 1) {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = null;
      break;
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ...DEFAULT_PREFS };
  }

  const prefs = { ...DEFAULT_PREFS };
  for (const key of Object.keys(DEFAULT_PREFS)) {
    if (parsed[key] !== undefined) prefs[key] = parsed[key];
  }
  return prefs;
}

module.exports = { normalizePrefs };

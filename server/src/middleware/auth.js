const jwt = require("jsonwebtoken");
const { AdminUser } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// Signs a standard auth token. 7 days keeps the admin session usable
// while still expiring eventually. The token embeds the admin's
// tokenVersion so changing the password invalidates old tokens.
function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      ver: user.tokenVersion ?? 0,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Express middleware — attaches the admin user or answers 401.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "You must be signed in as an admin." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await AdminUser.findByPk(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "Session is no longer valid." });
    }
    if ((user.tokenVersion ?? 0) !== (payload.ver ?? 0)) {
      return res
        .status(401)
        .json({ error: "Signed out after a password change. Please sign in again." });
    }
    req.admin = user;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please sign in again." });
  }
}

// Public profile — the password hash never leaves the server.
function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    joinedAt: user.createdAt,
  };
}

function defaultPrefs() {
  return {
    defaultSpeed: 2,
    chatWelcome:
      "Hi! You are chatting with the SwiftTrack team. Tell us your tracking number and how we can help — a human replies here in a few minutes.",
    supportEmail: "support@swifttrack.com",
    notifyNewMessages: true,
    notifyStatusChanges: true,
  };
}

module.exports = { signToken, requireAuth, toPublicUser, defaultPrefs, JWT_SECRET };

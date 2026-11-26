const jwt = require("jsonwebtoken");
const env = require("../config/env");

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    const error = new Error("Please sign in to continue.");
    error.status = 401;
    return next(error);
  }

  try {
    req.auth = verifyToken(token);
    return next();
  } catch (err) {
    const error = new Error("Your session has expired or is invalid.");
    error.status = 401;
    return next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.auth?.role !== "admin") {
    const error = new Error("You do not have access to this resource.");
    error.status = 403;
    return next(error);
  }
  return next();
}

module.exports = { signToken, verifyToken, requireAuth, requireAdmin };

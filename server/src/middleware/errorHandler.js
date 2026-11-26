// -------------------------------------------------------------------
// Central error handler
// -------------------------------------------------------------------
// Returns JSON shaped exactly as the frontend expects: { "error": "..." }
// Also forwards Sequelize/validation errors into readable messages.
// -------------------------------------------------------------------

const env = require("../config/env");
const { ApiError } = require("../utils/errors");

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof ApiError) {
    const body = { error: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.status).json(body);
  }

  // Sequelize unique constraint
  if (err.name === "SequelizeUniqueConstraintError") {
    const field = err.errors?.[0]?.path || "field";
    return res
      .status(409)
      .json({ error: `${field} already exists.` });
  }

  // Sequelize validation
  if (err.name === "SequelizeValidationError") {
    const message = err.errors?.[0]?.message || "Invalid data.";
    return res.status(400).json({ error: message });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Your session has expired or is invalid." });
  }

  // Fallback
  const status = err.status || 500;
  const message =
    status >= 500 && !env.isProduction
      ? err.message
      : status >= 500
        ? "Something went wrong. Please try again."
        : err.message || "Something went wrong.";

  if (status >= 500) {
    console.error("[error]", err);
  }

  return res.status(status).json({ error: message });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: "Endpoint not found." });
}

module.exports = { errorHandler, notFoundHandler };

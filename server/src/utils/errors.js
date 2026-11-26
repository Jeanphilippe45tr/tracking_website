// -------------------------------------------------------------------
// Small error helpers.
// -------------------------------------------------------------------
// Every route throws ApiError and the central error handler turns it
// into the { "error": "message" } shape the frontend expects.
// -------------------------------------------------------------------

class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    if (details) this.details = details;
  }
}

const badRequest = (message, details) =>
  new ApiError(400, message, details);
const unauthorized = (message = "Please sign in to continue.") =>
  new ApiError(401, message);
const forbidden = (message = "You do not have access to this resource.") =>
  new ApiError(403, message);
const notFound = (message = "Resource not found.") =>
  new ApiError(404, message);
const conflict = (message) => new ApiError(409, message);

// Wrap async route handlers so rejected promises reach Express 5's
// error handling instead of becoming unhandled rejections.
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

module.exports = {
  ApiError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  asyncHandler,
};

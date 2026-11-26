// -------------------------------------------------------------------
// Tiny validation helpers (no extra dependency needed).
// -------------------------------------------------------------------

const { badRequest } = require("./errors");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// validates body against a description such as:
//   { name: { required: true, max: 120 },
//     email: { required: true, email: true },
//     status: { required: true, oneOf: STATUSES } }
// Returns an object of field -> message.
function validate(body, rules) {
  const source = body || {};
  const errors = {};

  for (const [field, rule] of Object.entries(rules)) {
    const raw = source[field];
    const provided =
      raw !== undefined && raw !== null && String(raw).trim() !== "";

    if (!provided) {
      if (rule.required) {
        errors[field] =
          rule.requiredMessage || `${rule.label || field} is required.`;
      }
      continue;
    }

    if (rule.type === "email" && !EMAIL_RE.test(String(raw).trim())) {
      errors[field] = "Enter a valid email address.";
      continue;
    }

    if (rule.type === "number") {
      const number = Number(raw);
      if (!Number.isFinite(number)) {
        errors[field] = `${rule.label || field} must be a number.`;
        continue;
      }
      if (rule.min !== undefined && number < rule.min) {
        errors[field] = `${rule.label || field} must be at least ${rule.min}.`;
        continue;
      }
      if (rule.max !== undefined && number > rule.max) {
        errors[field] = `${rule.label || field} must be at most ${rule.max}.`;
        continue;
      }
    }

    if (typeof raw === "string" || rule.minLength || rule.maxLength) {
      const text = String(raw).trim();
      if (rule.minLength && text.length < rule.minLength) {
        errors[field] =
          rule.minLengthMessage ||
          `${rule.label || field} must be at least ${rule.minLength} characters.`;
        continue;
      }
      if (rule.maxLength && text.length > rule.maxLength) {
        errors[field] =
          `${rule.label || field} must be at most ${rule.maxLength} characters.`;
        continue;
      }
    }

    if (rule.oneOf && !rule.oneOf.includes(raw)) {
      errors[field] = `${rule.label || field} is not a valid value.`;
    }
  }

  return errors;
}

function assertValid(errors) {
  const fields = Object.keys(errors);
  if (fields.length === 0) return;
  const first = errors[fields[0]];
  throw badRequest(first, errors);
}

// Copy only the listed keys that are present in source.
function pick(source, keys) {
  const result = {};
  for (const key of keys) {
    if (source && source[key] !== undefined) result[key] = source[key];
  }
  return result;
}

module.exports = { validate, assertValid, pick, EMAIL_RE };

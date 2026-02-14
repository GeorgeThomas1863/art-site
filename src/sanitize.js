/**
 * Input sanitization and validation utilities
 */

// Escape HTML special characters for safe embedding in email templates
export const escapeHtml = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};

// Prevent NoSQL operator injection — if value is an object with $-prefixed keys, convert to string
export const sanitizeMongoValue = (val) => {
  if (val === null || val === undefined) return val;
  if (typeof val === "object" && !Array.isArray(val)) {
    const keys = Object.keys(val);
    for (const key of keys) {
      if (key.startsWith("$")) return String(val);
    }
  }
  return val;
};

// Strip path separators and traversal sequences, return basename only
export const sanitizeFilename = (filename) => {
  if (typeof filename !== "string") return "";
  // Remove any path traversal sequences
  let clean = filename.replace(/\.\./g, "");
  // Extract basename (remove directory components)
  clean = clean.replace(/^.*[\\\/]/, "");
  // Remove any remaining null bytes
  clean = clean.replace(/\0/g, "");
  return clean;
};

// Validate email format, reject strings with newlines (prevents header injection)
export const validateEmail = (email) => {
  if (typeof email !== "string") return false;
  if (/[\r\n]/.test(email)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate US ZIP code format
export const validateZip = (zip) => {
  if (typeof zip !== "string") return false;
  return /^\d{5}(-\d{4})?$/.test(zip);
};

// Validate and return a positive integer, or null if invalid
export const validatePositiveInt = (val) => {
  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || parsed <= 0) return null;
  return parsed;
};

// Validate and return a positive number (float), or null if invalid
export const validatePositiveNumber = (val) => {
  const parsed = parseFloat(val);
  if (isNaN(parsed) || parsed <= 0) return null;
  return parsed;
};

// Type check + length cap, strip control characters
export const validateString = (val, maxLength = 1000) => {
  if (typeof val !== "string") return null;
  // Strip control characters except newline and tab
  let clean = val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  if (clean.length > maxLength) clean = clean.slice(0, maxLength);
  return clean;
};

// Strip newlines and carriage returns from strings used in email headers/subjects
export const sanitizeEmailHeader = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(/[\r\n\t]/g, "");
};

// Return new object with only allowed keys (prevents mass assignment)
export const whitelistFields = (obj, allowedFields) => {
  if (!obj || typeof obj !== "object") return {};
  const result = {};
  for (const field of allowedFields) {
    if (obj.hasOwnProperty(field)) {
      result[field] = obj[field];
    }
  }
  return result;
};

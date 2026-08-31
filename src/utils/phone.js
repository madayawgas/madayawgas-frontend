/**
 * Utility for parsing, validating, and formatting Philippine phone numbers.
 * Supports:
 * - Mobile: +639xxxxxxxxx, 09xxxxxxxxx, (+63) 9xx xxx xxxx, 09xx-xxx-xxxx
 * - Landlines: +63(area)xxxxxxx, 0(area)xxxxxxx, e.g. +63822245678, (082) 224-5678
 */

/**
 * Validates whether a phone number matches standard Philippine phone conventions.
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhilippinePhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  const cleaned = phone.replace(/[\s\-()]/g, "");

  // Mobile: +639xxxxxxxxx (13 chars) or 09xxxxxxxxx (11 digits) or 9xxxxxxxxx (10 digits)
  const mobileRegex = /^(\+63|0)?9\d{9}$/;

  // Landline: +63(area 1-2 digits)(7 digits) or 0(area 1-2 digits)(7-8 digits)
  const landlineRegex = /^(\+63|0)?[2-8]\d{7,8}$/;

  return mobileRegex.test(cleaned) || landlineRegex.test(cleaned);
}

/**
 * Formats a phone string into clean display format e.g. (+63) 999 999 9999 or clean standard.
 * @param {string} phone
 * @returns {string}
 */
export function formatPhilippinePhone(phone) {
  if (!phone || typeof phone !== "string") return phone || "";
  const cleaned = phone.replace(/[\s\-()]/g, "");

  // Mobile starting with +639
  if (/^\+639\d{9}$/.test(cleaned)) {
    return `(+63) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }

  // Mobile starting with 09
  if (/^09\d{9}$/.test(cleaned)) {
    return `(+63) ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  // Mobile starting with 9 (10 digits)
  if (/^9\d{9}$/.test(cleaned)) {
    return `(+63) ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }

  return phone;
}

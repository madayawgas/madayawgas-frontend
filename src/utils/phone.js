/**
 * Utility for parsing, validating, and formatting Philippine phone numbers.
 * Supports:
 * - Mobile: +639xxxxxxxxx, 09xxxxxxxxx, (+63) 9xx xxx xxxx, 09xx-xxx-xxxx
 * - Landlines: +63(area)xxxxxxx, 0(area)xxxxxxx, e.g. +63822245678, (082) 224-5678, +63281234567
 */

/**
 * Validates whether a phone number matches standard Philippine phone conventions.
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhilippinePhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  const cleaned = phone.replace(/[\s\-().]/g, "");

  // Mobile: +639xxxxxxxxx (13 chars) or 09xxxxxxxxx (11 digits) or 9xxxxxxxxx (10 digits)
  const mobileRegex = /^(\+63|0)?9\d{9}$/;

  // Metro Manila Landline: +632 + 8 digits, 02 + 8 digits, 2 + 8 digits
  const manilaLandlineRegex = /^(\+63|0)?2\d{8}$/;

  // Provincial Landlines (2-digit area codes 3x-8x + 7 digits local):
  // e.g. +63822245678, 0822245678, 822245678
  const provincialLandlineRegex = /^(\+63|0)?[3-8]\d{8}$/;

  return (
    mobileRegex.test(cleaned) ||
    manilaLandlineRegex.test(cleaned) ||
    provincialLandlineRegex.test(cleaned)
  );
}

/**
 * Formats a phone string into clean display format e.g. (+63) 999 999 9999 or (+63) 82 224 5678.
 * @param {string} phone
 * @returns {string}
 */
export function formatPhilippinePhone(phone) {
  if (!phone || typeof phone !== "string") return phone || "";
  const cleaned = phone.replace(/[\s\-().]/g, "");

  // 1. Mobile (10-13 digits: 9xxxxxxxxx, 09xxxxxxxxx, +639xxxxxxxxx)
  if (/^\+639\d{9}$/.test(cleaned)) {
    return `(+63) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  if (/^09\d{9}$/.test(cleaned)) {
    return `(+63) ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  if (/^9\d{9}$/.test(cleaned)) {
    return `(+63) ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }

  // 2. Metro Manila Landline (Area code 2 + 8-digit subscriber number)
  // e.g. +63281234567, 0281234567, 281234567
  if (/^\+632\d{8}$/.test(cleaned)) {
    return `(+63) 2 ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  if (/^02\d{8}$/.test(cleaned)) {
    return `(+63) 2 ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
  }
  if (/^2\d{8}$/.test(cleaned)) {
    return `(+63) 2 ${cleaned.slice(1, 5)} ${cleaned.slice(5)}`;
  }

  // 3. Provincial Landline (2-digit Area code e.g. 82 for Davao, 32 for Cebu + 7-digit subscriber number)
  // e.g. +63822245678, 0822245678, 822245678
  if (/^\+63[3-8]\d{8}$/.test(cleaned)) {
    return `(+63) ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  if (/^0[3-8]\d{8}$/.test(cleaned)) {
    return `(+63) ${cleaned.slice(1, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  if (/^[3-8]\d{8}$/.test(cleaned)) {
    return `(+63) ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }

  return phone;
}

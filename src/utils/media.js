/**
 * src/utils/media.js
 *
 * Utilities for canonical relative media storage keys and URL resolution.
 */

/**
 * Whitelisted canonical media storage domains according to backend specification.
 */
export const ALLOWED_MEDIA_DOMAINS = [
  "maintenance/receipts",
  "maintenance/inspections",
  "fleet/vehicles",
  "sales/receipts",
  "sales/payments",
  "users/avatars",
];

/**
 * Validates whether a domain string matches the allowed storage domains.
 * @param {string} domain
 * @returns {boolean}
 */
export function isValidMediaDomain(domain) {
  return typeof domain === "string" && ALLOWED_MEDIA_DOMAINS.includes(domain);
}

/**
 * Resolves a canonical relative storage key (e.g. "maintenance/receipts/1775731200000-4b2a8f9c1d0e.jpg")
 * into a fully qualified access URL depending on the active environment.
 *
 * Passes absolute URLs (https://, http://, blob:, data:) through untouched.
 *
 * @param {string | null | undefined} storageKey - Relative key or absolute URL
 * @returns {string | null} Fully qualified URL or null if empty
 */
export function resolveMediaUrl(storageKey) {
  if (!storageKey || typeof storageKey !== "string") {
    return null;
  }

  const trimmed = storageKey.trim();
  if (!trimmed) {
    return null;
  }

  // Pass through absolute URLs, Object URLs, and Data URIs
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  // Derive base media URL
  let mediaBase = "";
  if (typeof import.meta !== "undefined" && import.meta.env) {
    if (import.meta.env.VITE_MEDIA_BASE_URL) {
      mediaBase = import.meta.env.VITE_MEDIA_BASE_URL;
    } else if (import.meta.env.VITE_API_URL) {
      // e.g. "http://localhost:5000/api" -> "http://localhost:5000/media"
      mediaBase = `${import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")}/media`;
    }
  }

  if (!mediaBase) {
    mediaBase = "http://localhost:5000/media";
  }

  const cleanBase = mediaBase.replace(/\/+$/, "");
  let cleanKey = trimmed.replace(/^\/+/, "");

  // Prevent accidental /media/media/ nesting if key already includes "media/"
  if (cleanKey.startsWith("media/") && cleanBase.endsWith("/media")) {
    cleanKey = cleanKey.replace(/^media\//, "");
  }

  return `${cleanBase}/${cleanKey}`;
}

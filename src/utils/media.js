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

/**
 * Safely resolves a receipt item or path into a fully accessible public or preview URL.
 * Prioritizes auto-resolved public `fileUrl`, followed by `previewUrl` (for staged files),
 * and falls back to resolving relative `storageKey`.
 *
 * @param {Object | string | null | undefined} receipt
 * @returns {string | null}
 */
export function getReceiptFileUrl(receipt) {
  if (!receipt) return null;
  if (typeof receipt === "string") return resolveMediaUrl(receipt);
  if (receipt.fileUrl) return resolveMediaUrl(receipt.fileUrl);
  if (receipt.previewUrl) return resolveMediaUrl(receipt.previewUrl);
  if (receipt.storageKey) return resolveMediaUrl(receipt.storageKey);
  return null;
}

/**
 * Evaluates whether an object, URL, or filename represents an image format.
 * Inspects MIME types, extensions (.jpg, .jpeg, .png, .webp, .gif, .svg, .bmp, .heic, .heif),
 * data URIs, blob URIs, and remote photo URLs.
 *
 * @param {Object | string | null | undefined} item - Receipt object or path string
 * @returns {boolean}
 */
export function isImageFile(item) {
  if (!item) return false;
  if (typeof item === "string") {
    const lower = item.toLowerCase();
    return (
      lower.startsWith("data:image/") ||
      /\.(jpe?g|png|webp|gif|svg|bmp|heic|heif)(\?.*)?$/i.test(lower) ||
      lower.includes("photo") ||
      lower.includes("image")
    );
  }
  if (item.file?.type && item.file.type.startsWith("image/")) return true;
  if (item.fileType && item.fileType.startsWith("image/")) return true;
  const target = (item.fileUrl || item.previewUrl || item.fileName || item.originalName || "").toLowerCase();
  if (target.startsWith("blob:") && item.fileType && !item.fileType.includes("pdf")) return true;
  return (
    target.startsWith("data:image/") ||
    /\.(jpe?g|png|webp|gif|svg|bmp|heic|heif)(\?.*)?$/i.test(target) ||
    target.includes("photo") ||
    target.includes("image")
  );
}

/**
 * Evaluates whether an object, URL, or filename represents a PDF document.
 *
 * @param {Object | string | null | undefined} item - Receipt object or path string
 * @returns {boolean}
 */
export function isPdfFile(item) {
  if (!item) return false;
  if (typeof item === "string") {
    const lower = item.toLowerCase();
    return lower.startsWith("data:application/pdf") || /\.pdf(\?.*)?$/i.test(lower);
  }
  if (item.file?.type === "application/pdf") return true;
  if (item.fileType === "application/pdf") return true;
  const target = (item.fileUrl || item.previewUrl || item.fileName || item.originalName || "").toLowerCase();
  return target.startsWith("data:application/pdf") || /\.pdf(\?.*)?$/i.test(target);
}

/**
 * Utility functions for text processing, normalization, and casing.
 */

/**
 * Converts a string into proper Title Case (capitalizing the first letter of each word or segment).
 * Handles hyphenated names, multi-word names, and apostrophes.
 * Examples:
 *   "juan" -> "Juan"
 *   "dela cruz" -> "Dela Cruz"
 *   "mary-jane" -> "Mary-Jane"
 *   "o'connor" -> "O'Connor"
 *   "CARLOS" -> "Carlos"
 *
 * @param {string} str
 * @returns {string}
 */
export function toProperCase(str) {
  if (!str || typeof str !== "string") return str || "";
  return str
    .trim()
    .toLowerCase()
    .replace(/(?:^|[\s\-'])\S/g, (match) => match.toUpperCase());
}

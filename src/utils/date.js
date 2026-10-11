/**
 * MadayawGas Date & Time Utility
 * Enforces Philippine Standard Time (PHT / GMT +8, Asia/Manila) across all date/time parsing,
 * formatting, calendar inputs, and range filtering.
 */

export const PHILIPPINE_TIMEZONE = "Asia/Manila";
export const PHILIPPINE_LOCALE = "en-US";

/**
 * Robust parser converting inputs (ISO UTC strings, Date objects, timestamps, date-only strings)
 * into a valid Date object.
 * Date-only strings ("YYYY-MM-DD") are safely pinned to Philippine midnight (00:00:00 PHT)
 * to avoid timezone boundary drift.
 *
 * @param {string | number | Date | null | undefined} input
 * @returns {Date | null}
 */
export function parsePhilippineDate(input) {
  if (input === null || input === undefined || input === "") return null;

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    // Safe check for pure YYYY-MM-DD calendar date strings
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, y, m, d] = match;
      // In Asia/Manila (UTC+8), 00:00:00 local is 16:00:00 UTC of previous day (i.e. -8h UTC)
      return new Date(Date.UTC(+y, +m - 1, +d, -8, 0, 0));
    }
  }

  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a date to Philippine medium date: "MMM DD, YYYY" (e.g. "Aug 24, 2026").
 *
 * @param {string | number | Date} dateInput
 * @param {object} [options]
 * @param {string} [options.fallback="N/A"]
 * @param {string} [options.month="short"] - "short", "long", or "numeric"
 * @returns {string}
 */
export function formatPhilippineDate(dateInput, options = {}) {
  const fallback = options.fallback !== undefined ? options.fallback : "N/A";
  const parsed = parsePhilippineDate(dateInput);
  if (!parsed) return fallback;

  try {
    return new Intl.DateTimeFormat(PHILIPPINE_LOCALE, {
      timeZone: PHILIPPINE_TIMEZONE,
      year: "numeric",
      month: options.month || "short",
      day: "numeric",
      ...options,
    }).format(parsed);
  } catch {
    return fallback;
  }
}

/**
 * Formats a date to Philippine short table date: "MM/DD/YY" (e.g. "08/24/26") or "MM/DD/YYYY".
 *
 * @param {string | number | Date} dateInput
 * @param {object} [options]
 * @param {string} [options.fallback="-"]
 * @param {number} [options.yearDigits=2] - 2 for "YY", 4 for "YYYY"
 * @returns {string}
 */
export function formatPhilippineDateShort(dateInput, options = {}) {
  const fallback = options.fallback !== undefined ? options.fallback : "-";
  const parsed = parsePhilippineDate(dateInput);
  if (!parsed) return fallback;

  try {
    const formatter = new Intl.DateTimeFormat(PHILIPPINE_LOCALE, {
      timeZone: PHILIPPINE_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = formatter.formatToParts(parsed).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

    const yearDigits = options.yearDigits || 2;
    const yearStr = yearDigits === 2 ? parts.year.slice(-2) : parts.year;
    return `${parts.month}/${parts.day}/${yearStr}`;
  } catch {
    return fallback;
  }
}

/**
 * Formats a timestamp into 12-hour Philippine time: "hh:mm A" (e.g. "08:30 AM").
 *
 * @param {string | number | Date} dateInput
 * @param {object} [options]
 * @param {string} [options.fallback="-"]
 * @returns {string}
 */
export function formatPhilippineTime(dateInput, options = {}) {
  const fallback = options.fallback !== undefined ? options.fallback : "-";
  const parsed = parsePhilippineDate(dateInput);
  if (!parsed) return fallback;

  try {
    return new Intl.DateTimeFormat(PHILIPPINE_LOCALE, {
      timeZone: PHILIPPINE_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      ...options,
    }).format(parsed);
  } catch {
    return fallback;
  }
}

/**
 * Formats a timestamp into full Philippine date and time: "MMM DD, YYYY, hh:mm A" (e.g. "Aug 24, 2026, 08:30 AM").
 *
 * @param {string | number | Date} dateInput
 * @param {object} [options]
 * @param {string} [options.fallback="-"]
 * @returns {string}
 */
export function formatPhilippineDateTime(dateInput, options = {}) {
  const fallback = options.fallback !== undefined ? options.fallback : "-";
  const parsed = parsePhilippineDate(dateInput);
  if (!parsed) return fallback;

  try {
    const dStr = formatPhilippineDate(parsed, options);
    const tStr = formatPhilippineTime(parsed, options);
    return `${dStr}, ${tStr}`;
  } catch {
    return fallback;
  }
}

/**
 * Converts any date or timestamp to "YYYY-MM-DD" in Philippine Time.
 * Ideal for HTML `<input type="date">` values, min/max bounds, and date comparisons.
 *
 * @param {string | number | Date} dateInput
 * @returns {string}
 */
export function toPhilippineDateInputString(dateInput) {
  if (!dateInput) return "";

  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})$/);
    if (match) return match[1];
  }

  const parsed = parsePhilippineDate(dateInput);
  if (!parsed) return "";

  try {
    const formatter = new Intl.DateTimeFormat(PHILIPPINE_LOCALE, {
      timeZone: PHILIPPINE_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = formatter.formatToParts(parsed).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

    return `${parts.year}-${parts.month}-${parts.day}`;
  } catch {
    return "";
  }
}

/**
 * Returns today's calendar date in Philippine Time in "YYYY-MM-DD" format.
 *
 * @returns {string}
 */
export function getPhilippineTodayString() {
  return toPhilippineDateInputString(new Date());
}

/**
 * Checks whether a given timestamp or date falls within a Philippine calendar date range [dateFrom, dateTo].
 * Both dateFrom and dateTo are assumed "YYYY-MM-DD" strings.
 *
 * @param {string | number | Date} dateInput
 * @param {string} [dateFrom] - "YYYY-MM-DD"
 * @param {string} [dateTo] - "YYYY-MM-DD"
 * @returns {boolean}
 */
export function isPhilippineDateInRange(dateInput, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return true;
  if (!dateInput) return false;

  const phtDate = toPhilippineDateInputString(dateInput);
  if (!phtDate) return false;

  if (dateFrom && phtDate < dateFrom) return false;
  if (dateTo && phtDate > dateTo) return false;

  return true;
}

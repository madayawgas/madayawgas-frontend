// src/api/client.js

export const isMock =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_USE_MOCK === undefined
      ? true
      : import.meta.env.VITE_USE_MOCK === "true"
    : true;

export const API_BASE_URL =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : "http://localhost:5000/api";

/**
 * Simulated network delay for mock operations.
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export const delay = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Lightweight native fetch wrapper.
 * Automatically adds credentials: 'include' (critical for HTTP-only mg_sid cookie)
 * and guarantees Content-Type: 'application/json' while merging headers and body serialization.
 *
 * @param {string} endpoint - API path (e.g. '/users/me')
 * @param {RequestInit & { body?: any }} options - Fetch options
 * @returns {Promise<any>}
 */
export async function apiClient(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const { headers, ...restOptions } = options;

  const config = {
    method: "GET",
    credentials: "include", // Sends and receives the mg_sid session cookie
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
  };

  // Automatically serialize object bodies to JSON if not FormData
  if (
    config.body &&
    typeof config.body === "object" &&
    !(config.body instanceof FormData)
  ) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message || `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

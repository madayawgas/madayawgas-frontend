// src/api/client.js

export const isMock =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_USE_MOCK === undefined
      ? true
      : import.meta.env.VITE_USE_MOCK === "true"
    : true;

export const API_BASE_URL = (
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : "http://localhost:5000/api"
).replace(/\/+$/, "");

/**
 * Simulated network delay for mock operations.
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export const delay = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Lightweight native fetch wrapper.
 * Automatically adds credentials: 'include' (critical for cross-origin HTTP-only mg_sid cookie)
 * and guarantees Content-Type: 'application/json' while merging headers and body serialization.
 *
 * @param {string} endpoint - API path (e.g. '/users/me')
 * @param {RequestInit & { body?: any }} options - Fetch options
 * @returns {Promise<any>}
 */
export async function apiClient(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  const { headers, ...restOptions } = options;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("mg_token") : null;

  const config = {
    method: "GET",
    ...restOptions,
    credentials: "include", // Guarantees cross-origin mg_sid cookie transmission for supported browsers
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}), // Guarantees auth on Safari (iOS) and Samsung Internet
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
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("mg_token");
    }
    const error = new Error(
      data.message || `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

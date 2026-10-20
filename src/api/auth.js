// src/api/auth.js
import { apiClient } from "./client.js";

export const authApi = {
  /**
   * Client-side placeholder. Server-side password verification is enforced
   * directly within sensitive operation endpoints (e.g., /deactivate, /status, /credentials).
   * @param {string} _password
   * @param {string} [_username]
   * @returns {Promise<boolean>}
   */
  // eslint-disable-next-line no-unused-vars
  async verifyPassword(_password, _username) {
    return true;
  },

  /**
   * Log in user and establish session cookie (mg_sid).
   * Stores fallback Bearer token for mobile/iOS WebKit cross-origin compatibility.
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise<object>} User object with role and permissions
   */
  async login(username, password) {
    const result = await apiClient("/users/login", {
      method: "POST",
      body: { username, password },
    });

    const token = result.data?.token || result.token;
    if (token && typeof window !== "undefined") {
      localStorage.setItem("mg_token", token);
    }

    return result.data.user;
  },

  /**
   * Get currently authenticated user profile and permissions.
   * Used on page refresh to verify active session cookie.
   * @returns {Promise<object|null>} Current user object
   */
  async getMe() {
    const result = await apiClient("/users/me");
    return result.data.user;
  },

  /**
   * Log out user and destroy server-side session cookie.
   * @returns {Promise<object>} Logout success message
   */
  async logout() {
    try {
      return await apiClient("/users/logout", { method: "POST" });
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("mg_token");
      }
    }
  },

  /**
   * Change authenticated user's password.
   * For first login / mustChangePassword: true, currentPassword is omitted.
   * @param {{ currentPassword?: string, newPassword: string }} payload
   * @returns {Promise<object>} Success message
   */
  async changePassword({ currentPassword, newPassword }) {
    const body = {
      ...(currentPassword && { currentPassword }),
      newPassword,
    };

    try {
      return await apiClient("/users/change-password", {
        method: "POST",
        body,
      });
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("mg_token");
      }
    }
  },
};

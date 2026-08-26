// src/api/auth.js
import { apiClient, isMock, delay } from "./client.js";
import mockMe from "../mocks/me.json" with { type: "json" };
import mockUsers from "../mocks/users.json" with { type: "json" };

const MOCK_CREDENTIALS = {
  superadmin: "Superadmin123!",
  admin_user: "AdminPass123!",
  fleet_user: "FleetPass123!",
  sales_user: "SalesPass123!",
};

const MOCK_SESSION_KEY = "mg_mock_session_user";

export const authApi = {
  /**
   * Log in user and establish session cookie (or mock session).
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise<object>} User object with role and permissions
   */
  async login(username, password) {
    if (isMock) {
      await delay(300);

      // Check seed credentials
      const expectedPassword = MOCK_CREDENTIALS[username];
      const matchedUser = mockUsers.data.users.find(
        (u) => u.username === username
      );

      if (
        (expectedPassword && expectedPassword === password) ||
        (matchedUser && password === "Password123!")
      ) {
        const user = matchedUser || mockMe.data.user;
        if (typeof window !== "undefined") {
          sessionStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
        }
        return user;
      }

      const error = new Error("Invalid credentials");
      error.status = 401;
      throw error;
    }

    const result = await apiClient("/users/login", {
      method: "POST",
      body: { username, password },
    });
    return result.data.user;
  },

  /**
   * Get currently authenticated user profile and permissions.
   * Used on page refresh to verify active session cookie.
   * @returns {Promise<object>} Current user object
   */
  async getMe() {
    if (isMock) {
      await delay(200);
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem(MOCK_SESSION_KEY);
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch {
            // Ignore JSON parse error and fallback
          }
        }
      }
      return mockMe.data.user;
    }

    const result = await apiClient("/users/me");
    return result.data.user;
  },

  /**
   * Log out user and destroy server-side session cookie.
   * @returns {Promise<object>} Logout success message
   */
  async logout() {
    if (isMock) {
      await delay(200);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(MOCK_SESSION_KEY);
      }
      return { status: "success", message: "Successfully logged out" };
    }

    return apiClient("/users/logout", { method: "POST" });
  },

  /**
   * Change authenticated user's password.
   * @param {{ currentPassword?: string, newPassword: string }} payload
   * @returns {Promise<object>} Success message
   */
  async changePassword({ currentPassword, newPassword }) {
    if (isMock) {
      await delay(300);
      return {
        status: "success",
        message: "Password changed successfully. Please log in again.",
      };
    }

    return apiClient("/users/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });
  },
};

// src/api/auth.js
import { apiClient, isMock, delay } from "./client.js";
import mockMe from "../mocks/me.json" with { type: "json" };
import mockUsers from "../mocks/users.json" with { type: "json" };

const MOCK_CREDENTIALS = {
  superadmin: "Superadmin123!",
  admin_user: "AdminPass123!",
  fleet_user: "FleetPass123!",
  sales_user: "SalesPass123!",
  temp_user: "TempPass123!",
};

/**
 * Update or set a user's password in the offline mock credentials registry.
 * @param {string} username
 * @param {string} password
 */
export function setMockUserPassword(username, password) {
  if (username && password) {
    MOCK_CREDENTIALS[username] = password;
  }
}

const MOCK_SESSION_KEY = "mg_mock_session_user";

export const authApi = {

  /**
   * Mock helper to verify password during offline/mock development.
   */
  async verifyPassword(password, username) {
    if (isMock) {
      await delay(250);
      const expectedPassword = MOCK_CREDENTIALS[username];

      if (!expectedPassword || password !== expectedPassword) {
        throw new Error("Incorrect password. Please try again.");
      }

      return true;
    }
    // On real server, password verification is handled directly by the target dangerous operation endpoints
    return true;
  },

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
   * @returns {Promise<object|null>} Current user object or null if unauthenticated
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
            // Ignore JSON parse error
          }
        }
      }
      return null;
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
   * For first login / mustChangePassword: true, currentPassword is omitted.
   * @param {{ currentPassword?: string, newPassword: string }} payload
   * @returns {Promise<object>} Success message
   */
  async changePassword({ currentPassword, newPassword }) {
    if (isMock) {
      await delay(300);
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem(MOCK_SESSION_KEY);
        if (saved) {
          try {
            const sessionUser = JSON.parse(saved);
            const userIndex = mockUsers.data.users.findIndex(
              (u) => u.id === sessionUser.id || u.username === sessionUser.username
            );
            if (userIndex !== -1) {
              mockUsers.data.users[userIndex].mustChangePassword = false;
            }
            if (sessionUser.username) {
              MOCK_CREDENTIALS[sessionUser.username] = newPassword;
            }
          } catch {
            // Ignore parse errors
          }
        }
        sessionStorage.removeItem(MOCK_SESSION_KEY);
      }
      return {
        status: "success",
        message: "Password changed successfully. Please log in again.",
      };
    }

    const body = {
      ...(currentPassword && { currentPassword }),
      newPassword,
    };

    return apiClient("/users/change-password", {
      method: "POST",
      body,
    });
  },
};

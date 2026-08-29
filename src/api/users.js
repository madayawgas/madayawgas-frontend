// src/api/users.js
import { apiClient, isMock, delay } from "./client.js";
import mockUsers from "../mocks/users.json" with { type: "json" };
import mockRoles from "../mocks/roles.json" with { type: "json" };

export const usersApi = {
    /**
   * Verify the admin's password before performing sensitive operations.
   * @param {string} password - Admin password to verify
   * @param {string} [username] - Optional username of the admin performing the check
   * @returns {Promise<boolean>} Resolves true if valid, throws an error if invalid
   */
  verifyAdminPassword: async (password, username) => {
    const validPassword = localStorage.getItem("current_user_password");

    if (!password || password !== validPassword) {
      throw new Error("Incorrect admin password. Please try again.");
    }

    return true;
  },
  
  /**
   * Get all user accounts (Admin/Manager with users.view permission).
   * @returns {Promise<Array>} List of user objects
   */
  async getAllUsers() {
    if (isMock) {
      await delay(300);
      return mockUsers.data.users;
    }
    const result = await apiClient("/users");
    return result.data.users;
  },

  /**
   * Get single user by ID.
   * @param {string} id - User ID
   * @returns {Promise<object>} User object
   */
  async getUserById(id) {
    if (isMock) {
      await delay(200);
      const user = mockUsers.data.users.find((u) => u.id === id);
      if (!user) {
        const error = new Error("User not found");
        error.status = 404;
        throw error;
      }
      return user;
    }
    const result = await apiClient(`/users/${id}`);
    return result.data.user;
  },

  /**
   * Get list of system roles.
   * @returns {Promise<Array>} List of roles
   */
  async getRoles() {
    if (isMock) {
      await delay(200);
      return mockRoles.data.roles;
    }
    const result = await apiClient("/users/roles");
    return result.data.roles;
  },

  /**
   * Create / Register a new user.
   * Backend auto-generates username (e.g. jcruz) and temporary password.
   *
   * @param {{ firstName: string, lastName: string, phone?: string, birthdate?: string, roleId: string }} userData
   * @returns {Promise<{ user: object, temporaryPassword: string }>} Created user and one-time temporary password
   */
  async createUser(userData) {
    if (isMock) {
      await delay(400);
      const role = mockRoles.data.roles.find((r) => r.id === userData.roleId);
      const roleName = role ? role.name : "Sales Person";

      // Auto-generated username format: first letter of first name + last name
      const baseUsername = `${userData.firstName.charAt(0)}${userData.lastName}`
        .toLowerCase()
        .replace(/\s+/g, "");

      const newUser = {
        id: `mock-${Date.now()}`,
        username: baseUsername,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || null,
        birthdate: userData.birthdate || null,
        role: roleName,
        roleId: userData.roleId,
        isActive: true,
        isBlocked: false,
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
      };

      const temporaryPassword = `Mg#${Math.random().toString(36).slice(-8)}!`;

      return {
        user: newUser,
        temporaryPassword,
      };
    }

    const result = await apiClient("/users", {
      method: "POST",
      body: userData,
    });
    return result.data;
  },

  /**
   * Update a user's profile details.
   * @param {string} id - Target user ID
   * @param {{ firstName?: string, lastName?: string, phone?: string, birthdate?: string, roleId?: string }} userData
   * @returns {Promise<object>} Updated user object
   */
  async updateUser(id, userData) {
    if (isMock) {
      await delay(300);
      const existing = mockUsers.data.users.find((u) => u.id === id) || {};
      const role = userData.roleId
        ? mockRoles.data.roles.find((r) => r.id === userData.roleId)
        : null;

      return {
        ...existing,
        ...userData,
        role: role ? role.name : existing.role,
      };
    }

    const result = await apiClient(`/users/${id}`, {
      method: "PATCH",
      body: userData,
    });
    return result.data.user;
  },

  /**
   * Update personal profile information of currently logged-in user.
   * @param {{ firstName?: string, lastName?: string, phone?: string, birthdate?: string }} profileData
   * @returns {Promise<object>} Updated user object
   */
  async updateMe(profileData) {
    if (isMock) {
      await delay(300);
      return {
        ...mockUsers.data.users[0],
        ...profileData,
      };
    }

    const result = await apiClient("/users/me", {
      method: "PATCH",
      body: profileData,
    });
    return result.data.user;
  },

  /**
   * Admin Reset / Update User Credentials.
   * Requires admin password confirmation.
   *
   * @param {string} id - Target user ID
   * @param {{ adminPassword: string, resetPassword?: boolean, username?: string }} payload
   * @returns {Promise<object>} Confirmation and new temporary password if reset
   */
  async resetUserCredentials(id, { adminPassword, resetPassword, username }) {
    if (isMock) {
      await delay(400);
      if (!adminPassword) {
        const error = new Error("Admin password confirmation is required");
        error.status = 401;
        throw error;
      }

      const tempPass = resetPassword
        ? `Mg#${Math.random().toString(36).slice(-8)}!`
        : undefined;

      return {
        id,
        username: username || "updated_username",
        mustChangePassword: !!resetPassword,
        temporaryPassword: tempPass,
        message:
          "Temporary password generated. Target user must log in and change their password.",
      };
    }

    const result = await apiClient(`/users/${id}/credentials`, {
      method: "PATCH",
      body: { adminPassword, resetPassword, username },
    });
    return result.data;
  },

  /**
   * Deactivate/Activate or Block/Unblock a user account.
   * Requires admin password confirmation.
   *
   * @param {string} id - Target user ID
   * @param {{ adminPassword: string, isActive?: boolean, isBlocked?: boolean }} payload
   * @returns {Promise<object>} Updated user object
   */
  async updateUserStatus(id, { adminPassword, isActive, isBlocked }) {
    if (isMock) {
      await delay(300);
      if (!adminPassword) {
        const error = new Error("Admin password confirmation is required");
        error.status = 401;
        throw error;
      }

      const user = mockUsers.data.users.find((u) => u.id === id) || {};
      return {
        ...user,
        ...(isActive !== undefined && { isActive }),
        ...(isBlocked !== undefined && { isBlocked }),
      };
    }

    const result = await apiClient(`/users/${id}/status`, {
      method: "PATCH",
      body: { adminPassword, isActive, isBlocked },
    });
    return result.data.user;
  },
};

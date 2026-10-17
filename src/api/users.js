// src/api/users.js
import { apiClient } from "./client.js";

export const usersApi = {
  /**
   * Get all user accounts (Admin/Manager with users.view permission).
   * @returns {Promise<Array>} List of user objects
   */
  async getUsers() {
    return this.getAllUsers();
  },

  async getAllUsers() {
    const result = await apiClient("/users");
    return result.data.users;
  },

  /**
   * Get single user by ID.
   * @param {string} id - User ID
   * @returns {Promise<object>} User object
   */
  async getUserById(id) {
    const result = await apiClient(`/users/${id}`);
    return result.data.user;
  },

  /**
   * Get list of system roles.
   * @returns {Promise<Array>} List of roles
   */
  async getRoles() {
    const result = await apiClient("/users/roles");
    return result.data.roles;
  },

  /**
   * Get system permissions catalog.
   * @returns {Promise<Array>} List of available permissions
   */
  async getPermissions() {
    const result = await apiClient("/users/permissions");
    return result.data.permissions;
  },

  /**
   * Create / Register a new user.
   * Backend auto-generates username (e.g. jcruz) and temporary password.
   *
   * @param {{ firstName: string, lastName: string, phone?: string, birthdate?: string, roleId: string }} userData
   * @returns {Promise<{ user: object, temporaryPassword: string }>} Created user and one-time temporary password
   */
  async createUser(userData) {
    const result = await apiClient("/users", {
      method: "POST",
      body: userData,
    });
    return result.data;
  },

  /**
   * Update a user's profile details.
   * @param {string} id - Target user ID
   * @param {{ firstName?: string, lastName?: string, phone?: string, birthdate?: string, roleId?: string, isBlocked?: boolean, status?: string }} userData
   * @returns {Promise<object>} Updated user object
   */
  async updateUser(id, userData) {
    const result = await apiClient(`/users/${id}`, {
      method: "PATCH",
      body: userData,
    });
    return result.data.user;
  },

  /**
   * Update a user's system role (Admin dangerous operation).
   * @param {string} id - Target user ID
   * @param {{ roleId: string, confirmPassword?: string, adminPassword?: string }} payload
   * @returns {Promise<object>} Updated user object
   */
  async updateUserRole(id, { roleId, confirmPassword, adminPassword }) {
    const password = confirmPassword || adminPassword;
    const result = await apiClient(`/users/${id}/role`, {
      method: "PATCH",
      body: {
        roleId,
        confirmPassword: password,
        adminPassword: password,
        confirm_password: password,
        admin_password: password,
      },
    });
    return result.data.user;
  },

  /**
   * Update personal profile information of currently logged-in user.
   * @param {{ firstName?: string, lastName?: string, phone?: string, birthdate?: string }} profileData
   * @returns {Promise<object>} Updated user object
   */
  async updateMe(profileData) {
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
   * @param {{ confirmPassword?: string, adminPassword?: string, resetPassword?: boolean, username?: string }} payload
   * @returns {Promise<object>} Confirmation and new temporary password if reset
   */
  async resetUserCredentials(id, { confirmPassword, adminPassword, resetPassword, username }) {
    const password = confirmPassword || adminPassword;
    const result = await apiClient(`/users/${id}/credentials`, {
      method: "PATCH",
      body: {
        confirmPassword: password,
        adminPassword: password,
        confirm_password: password,
        admin_password: password,
        resetPassword: resetPassword !== undefined ? resetPassword : true,
        ...(username && { username }),
      },
    });
    return result.data;
  },

  /**
   * Deactivate/Activate or Block/Unblock a user account.
   * Requires admin password confirmation.
   *
   * @param {string} id - Target user ID
   * @param {{ confirmPassword?: string, adminPassword?: string, isActive?: boolean, isBlocked?: boolean }} payload
   * @returns {Promise<object>} Updated user object
   */
  async updateUserStatus(id, { confirmPassword, adminPassword, isActive, isBlocked }) {
    const password = confirmPassword || adminPassword;
    const result = await apiClient(`/users/${id}/status`, {
      method: "PATCH",
      body: {
        confirmPassword: password,
        adminPassword: password,
        confirm_password: password,
        admin_password: password,
        ...(isActive !== undefined && { isActive }),
        ...(isBlocked !== undefined && { isBlocked }),
      },
    });
    return result.data.user;
  },

  /**
   * Create a new role.
   * @param {{ name: string, description?: string, permissions?: string[] }} roleData
   * @returns {Promise<object>} Created role object
   */
  async createRole(roleData) {
    const result = await apiClient("/users/roles", {
      method: "POST",
      body: roleData,
    });
    return result.data.role;
  },

  /**
   * Update an existing role.
   * @param {string} id - Role ID
   * @param {{ name?: string, description?: string, permissions?: string[] }} roleData
   * @returns {Promise<object>} Updated role object
   */
  async updateRole(id, roleData) {
    const result = await apiClient(`/users/roles/${id}`, {
      method: "PATCH",
      body: roleData,
    });
    return result.data.role;
  },
};

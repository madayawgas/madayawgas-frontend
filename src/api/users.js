// src/api/users.js
import { apiClient, isMock, delay } from "./client.js";
import mockUsers from "../mocks/users.json" with { type: "json" };
import mockRoles from "../mocks/roles.json" with { type: "json" };

export const usersApi = {
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
   * Get system permissions catalog.
   * @returns {Promise<Array>} List of available permissions
   */
  async getPermissions() {
    if (isMock) {
      await delay(200);
      return [
        { id: "1", name: "dashboard.view", description: "View the dashboard." },
        { id: "2", name: "fleet.view", description: "View fleet and maintenance." },
        { id: "3", name: "fleet.manage", description: "Manage fleet and maintenance." },
        { id: "4", name: "route.view", description: "View route schedules." },
        { id: "5", name: "route.manage", description: "Manage route dispatch." },
        { id: "6", name: "inventory.view", description: "View inventory items." },
        { id: "7", name: "inventory.manage", description: "Manage inventory stock." },
        { id: "8", name: "sales.view", description: "View sales and customer records." },
        { id: "9", name: "sales.create", description: "Register customers and sales orders." },
        { id: "10", name: "sales.update", description: "Update customers and sales orders." },
        { id: "11", name: "users.view", description: "View user directory." },
        { id: "12", name: "users.manage", description: "Manage users and RBAC roles." },
        { id: "13", name: "history.view", description: "View audit logs." },
      ];
    }
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
    if (isMock) {
      await delay(400);
      const role = mockRoles.data.roles.find((r) => r.id === userData.roleId);
      const roleName = role ? role.name : "Sales Person";

      // Auto-generated username format: first letter of first name + last name
      const baseUsername = `${(userData.firstName || "").charAt(0)}${userData.lastName || ""}`
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

      // Update mock dataset in memory
      mockUsers.data.users.unshift(newUser);

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
      if (existing.role === "Super Admin") {
        const error = new Error("Super Admin account details cannot be modified.");
        error.status = 403;
        throw error;
      }
      const role = userData.roleId
        ? mockRoles.data.roles.find((r) => r.id === userData.roleId)
        : null;

      const updated = {
        ...existing,
        ...userData,
        role: role ? role.name : existing.role,
      };

      const index = mockUsers.data.users.findIndex((u) => u.id === id);
      if (index !== -1) {
        mockUsers.data.users[index] = updated;
      }

      return updated;
    }

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
    if (isMock) {
      await delay(300);
      if (!password) {
        const error = new Error("Admin password confirmation is required");
        error.status = 401;
        throw error;
      }
      const role = mockRoles.data.roles.find((r) => r.id === roleId);
      const existing = mockUsers.data.users.find((u) => u.id === id) || {};
      return {
        ...existing,
        roleId,
        role: role ? role.name : existing.role,
      };
    }

    const result = await apiClient(`/users/${id}/role`, {
      method: "PATCH",
      body: { roleId, confirmPassword: password },
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
   * @param {{ confirmPassword?: string, adminPassword?: string, resetPassword?: boolean, username?: string }} payload
   * @returns {Promise<object>} Confirmation and new temporary password if reset
   */
  async resetUserCredentials(id, { confirmPassword, adminPassword, resetPassword, username }) {
    const password = confirmPassword || adminPassword;
    if (isMock) {
      await delay(400);
      if (!password) {
        const error = new Error("Admin password confirmation is required");
        error.status = 401;
        throw error;
      }

      const existingUser = mockUsers.data.users.find((u) => u.id === id);
      if (existingUser?.role === "Super Admin") {
        const error = new Error("Super Admin credentials cannot be modified.");
        error.status = 403;
        throw error;
      }

      if (existingUser) {
        existingUser.mustChangePassword = true;
        if (username) existingUser.username = username;
      }

      const tempPass = resetPassword
        ? `Mg#${Math.random().toString(36).slice(-8)}!`
        : undefined;

      return {
        id,
        username: username || existingUser?.username || "updated_username",
        mustChangePassword: !!resetPassword,
        temporaryPassword: tempPass,
        message:
          "Temporary password generated. Target user must log in and change their password.",
      };
    }

    const result = await apiClient(`/users/${id}/credentials`, {
      method: "PATCH",
      body: { confirmPassword: password, resetPassword, username },
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
    if (isMock) {
      await delay(300);
      if (!password) {
        const error = new Error("Admin password confirmation is required");
        error.status = 401;
        throw error;
      }

      const user = mockUsers.data.users.find((u) => u.id === id) || {};
      if (user.role === "Super Admin") {
        const error = new Error("Super Admin account cannot be deactivated or blocked.");
        error.status = 403;
        throw error;
      }

      const updated = {
        ...user,
        ...(isActive !== undefined && { isActive }),
        ...(isBlocked !== undefined && { isBlocked }),
      };

      const index = mockUsers.data.users.findIndex((u) => u.id === id);
      if (index !== -1) {
        mockUsers.data.users[index] = updated;
      }

      return updated;
    }

    const result = await apiClient(`/users/${id}/status`, {
      method: "PATCH",
      body: { confirmPassword: password, isActive, isBlocked },
    });
    return result.data.user;
  },

  /**
   * Create a new role.
   * @param {{ name: string, description?: string, permissions?: string[] }} roleData
   * @returns {Promise<object>} Created role object
   */
  async createRole(roleData) {
    if (isMock) {
      await delay(300);
      const newRole = {
        id: `role-${Date.now()}`,
        name: roleData.name,
        description: roleData.description || "",
        permissions: roleData.permissions || [],
        userCount: 0,
        createdAt: new Date().toISOString(),
      };
      mockRoles.data.roles.push(newRole);
      return newRole;
    }

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
    if (isMock) {
      await delay(300);
      const index = mockRoles.data.roles.findIndex((r) => r.id === id);
      const existing = index !== -1 ? mockRoles.data.roles[index] : {};
      const updated = {
        ...existing,
        ...roleData,
      };
      if (index !== -1) {
        mockRoles.data.roles[index] = updated;
      }
      return updated;
    }

    const result = await apiClient(`/users/roles/${id}`, {
      method: "PATCH",
      body: roleData,
    });
    return result.data.role;
  },
};

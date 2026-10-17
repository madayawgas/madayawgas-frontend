// src/api/customers.js
import { apiClient } from "./client.js";
import { authApi } from "./auth.js";

/**
 * Customer Profile API Service
 * Interacts with /api/sales/customers endpoints based on docs/API Contract/sales-customer.api.md
 */
export const customersApi = {
  /**
   * Verify admin password before performing sensitive operations.
   * Delegates directly to authApi.
   * @param {string} password
   * @param {string} [username]
   * @returns {Promise<boolean>}
   */
  async verifyAdminPassword(password, username) {
    return authApi.verifyPassword(password, username);
  },

  /**
   * View customer overview (List & Search).
   * @param {object} [params] - Query parameters (search, customerType, status, isActive, sortBy, sortOrder, page, limit)
   * @returns {Promise<Array|object>} Array of customer objects or paginated envelope
   */
  async getCustomers(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.customerType && params.customerType !== "All Types") {
      query.append("customerType", params.customerType);
    }
    if (params.status) query.append("status", params.status);
    if (params.isActive !== undefined) query.append("isActive", params.isActive);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/sales/customers${queryString}`);
    if (Array.isArray(result?.data)) {
      return result.data;
    }
    return result?.data?.customers || result?.data || (Array.isArray(result) ? result : []);
  },

  /**
   * View Single Customer Profile.
   * @param {string} id - Customer UUID
   * @returns {Promise<object>} Customer object
   */
  async getCustomerById(id) {
    const result = await apiClient(`/sales/customers/${id}`);
    return result?.data?.customer || result?.data || result;
  },

  /**
   * Register Customer.
   * @param {{ name: string, address: string, contactNumber: string, customerType: string, isActive?: boolean }} customerData
   * @returns {Promise<{ customer: object }>} Created customer response
   */
  async createCustomer(customerData) {
    const result = await apiClient("/sales/customers", {
      method: "POST",
      body: customerData,
    });
    return result.data;
  },

  /**
   * Update Customer Profile.
   * @param {string} id - Customer UUID
   * @param {object} customerData - Fields to update
   * @returns {Promise<{ customer: object }>} Updated customer response
   */
  async updateCustomer(id, customerData) {
    const result = await apiClient(`/sales/customers/${id}`, {
      method: "PATCH",
      body: customerData,
    });
    return result.data;
  },

  /**
   * Deactivate Customer (Soft delete with password verification).
   * @param {string} id - Customer UUID
   * @param {{ confirmPassword?: string }} payload
   * @returns {Promise<{ customer: object, message: string }>} Updated deactivated customer
   */
  async deactivateCustomer(id, { confirmPassword }) {
    const password =
      typeof confirmPassword === "object"
        ? confirmPassword?.confirmPassword || confirmPassword?.adminPassword
        : confirmPassword;
    const result = await apiClient(`/sales/customers/${id}/deactivate`, {
      method: "PATCH",
      body: {
        confirmPassword: password,
        adminPassword: password,
        confirm_password: password,
        admin_password: password,
      },
    });
    return result.data;
  },
};

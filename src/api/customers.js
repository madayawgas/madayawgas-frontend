// src/api/customers.js
import { apiClient, isMock, delay } from "./client.js";
import mockCustomers from "../mocks/customers.json" with { type: "json" };
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
   * @param {object} [params] - Query parameters (search, customerType, status, isActive)
   * @returns {Promise<Array>} Array of customer objects
   */
  async getCustomers(params = {}) {
    if (isMock) {
      await delay(250);
      let list = [...mockCustomers.data.customers];

      if (params.customerType && params.customerType !== "All Types") {
        list = list.filter(
          (c) =>
            (c.customerType || "").toUpperCase() ===
            params.customerType.toUpperCase()
        );
      }

      if (params.status) {
        if (params.status.toUpperCase() === "ACTIVE") {
          list = list.filter((c) => c.isActive === true);
        } else if (params.status.toUpperCase() === "INACTIVE") {
          list = list.filter((c) => c.isActive === false);
        }
      }

      if (params.isActive !== undefined) {
        const activeBool =
          params.isActive === true || params.isActive === "true";
        list = list.filter((c) => c.isActive === activeBool);
      }

      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (c) =>
            (c.name || "").toLowerCase().includes(q) ||
            (c.address || "").toLowerCase().includes(q) ||
            (c.contactNumber || "").toLowerCase().includes(q) ||
            (c.customerType || "").toLowerCase().includes(q)
        );
      }

      return list;
    }

    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.customerType && params.customerType !== "All Types") {
      query.append("customerType", params.customerType);
    }
    if (params.status) query.append("status", params.status);
    if (params.isActive !== undefined) query.append("isActive", params.isActive);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/sales/customers${queryString}`);
    return result.data.customers;
  },

  /**
   * View Single Customer Profile.
   * @param {string} id - Customer UUID
   * @returns {Promise<object>} Customer object
   */
  async getCustomerById(id) {
    if (isMock) {
      await delay(150);
      const customer = mockCustomers.data.customers.find((c) => c.id === id);
      if (!customer) {
        const error = new Error("Customer not found");
        error.status = 404;
        throw error;
      }
      return customer;
    }

    const result = await apiClient(`/sales/customers/${id}`);
    return result.data.customer;
  },

  /**
   * Register Customer.
   * @param {{ name: string, address: string, contactNumber: string, customerType: string, isActive?: boolean }} customerData
   * @returns {Promise<{ customer: object }>} Created customer response
   */
  async createCustomer(customerData) {
    if (isMock) {
      await delay(300);
      const newCustomer = {
        id: `cust-${Date.now()}`,
        name: customerData.name,
        address: customerData.address,
        contactNumber: customerData.contactNumber,
        customerType: customerData.customerType || "COMMERCIAL",
        isActive: customerData.isActive !== undefined ? customerData.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Keep mock in-memory array updated
      mockCustomers.data.customers.unshift(newCustomer);
      mockCustomers.data.count = mockCustomers.data.customers.length;
      return { customer: newCustomer };
    }

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
    if (isMock) {
      await delay(250);
      const index = mockCustomers.data.customers.findIndex((c) => c.id === id);
      const existing = index !== -1 ? mockCustomers.data.customers[index] : {};
      const updated = {
        ...existing,
        ...customerData,
        updatedAt: new Date().toISOString(),
      };
      if (index !== -1) {
        mockCustomers.data.customers[index] = updated;
      }
      return { customer: updated };
    }

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
    if (isMock) {
      await delay(300);
      if (!confirmPassword) {
        const error = new Error("Admin password confirmation is required");
        error.status = 401;
        throw error;
      }

      const index = mockCustomers.data.customers.findIndex((c) => c.id === id);
      const existing = index !== -1 ? mockCustomers.data.customers[index] : {};
      const updated = {
        ...existing,
        isActive: false,
        updatedAt: new Date().toISOString(),
      };
      if (index !== -1) {
        mockCustomers.data.customers[index] = updated;
      }
      return {
        customer: updated,
        message: "Customer successfully deactivated",
      };
    }

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

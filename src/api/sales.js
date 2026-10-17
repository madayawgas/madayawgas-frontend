// src/api/sales.js
import { apiClient } from "./client.js";
import { customersApi } from "./customers.js";

export const salesApi = {
  /**
   * Get sales overview data grouped by weekly, monthly, and annually timeframes.
   * @returns {Promise<{ weekly: Array, monthly: Array, annually: Array }>}
   */
  async getSalesOverview() {
    try {
      const result = await apiClient("/sales/overview");
      if (result?.data) {
        return {
          weekly: Array.isArray(result.data.weekly) ? result.data.weekly : [],
          monthly: Array.isArray(result.data.monthly) ? result.data.monthly : [],
          annually: Array.isArray(result.data.annually) ? result.data.annually : [],
        };
      }
    } catch {
      // Backend sales overview endpoint not implemented or empty
    }
    return { weekly: [], monthly: [], annually: [] };
  },

  /**
   * Customers CRUD endpoints under /api/sales/customers
   */
  async getCustomers(params) {
    return customersApi.getCustomers(params);
  },

  async getCustomerById(id) {
    return customersApi.getCustomerById(id);
  },
};

// src/api/sales.js
import { apiClient, isMock, delay } from "./client.js";
import mockSales from "../mocks/sales.json" with { type: "json" };
import { customersApi } from "./customers.js";

export const salesApi = {
  /**
   * Get sales overview data grouped by weekly, monthly, and annually timeframes.
   * @returns {Promise<{ weekly: Array, monthly: Array, annually: Array }>}
   */
  async getSalesOverview() {
    if (isMock) {
      await delay(200);
      return mockSales.data;
    }
    const result = await apiClient("/sales/overview");
    return result.data;
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

// src/api/sales.js
import { apiClient } from "./client.js";
import { customersApi } from "./customers.js";

export const salesApi = {
  /**
   * Get sales overview data grouped by weekly, monthly, and annually timeframes.
   * Also returns summary KPIs, product breakdown, and payment distribution.
   *
   * @param {Object} [params]
   * @returns {Promise<Object>}
   */
  async getSalesOverview(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.startDate) query.append("startDate", params.startDate);
      if (params.endDate) query.append("endDate", params.endDate);
      if (params.timeframe) query.append("timeframe", params.timeframe);
      if (params.tripId) query.append("tripId", params.tripId);
      if (params.truckId) query.append("truckId", params.truckId);

      const qs = query.toString() ? `?${query.toString()}` : "";
      const result = await apiClient(`/sales/overview${qs}`);
      if (result?.data) {
        return {
          summary: result.data.summary || {},
          productBreakdown: Array.isArray(result.data.productBreakdown) ? result.data.productBreakdown : [],
          paymentBreakdown: result.data.paymentBreakdown || { cash: {}, gcash: {} },
          salesTrends: Array.isArray(result.data.salesTrends) ? result.data.salesTrends : [],
          weekly: Array.isArray(result.data.weekly) ? result.data.weekly : [],
          monthly: Array.isArray(result.data.monthly) ? result.data.monthly : [],
          annually: Array.isArray(result.data.annually) ? result.data.annually : [],
        };
      }
    } catch (err) {
      console.warn("[salesApi] getSalesOverview failed:", err);
    }
    return {
      summary: {},
      productBreakdown: [],
      paymentBreakdown: { cash: {}, gcash: {} },
      salesTrends: [],
      weekly: [],
      monthly: [],
      annually: [],
    };
  },

  /**
   * Alias for getSalesOverview with explicit filters for the analytics tab.
   *
   * @param {Object} [params]
   * @returns {Promise<Object>}
   */
  async getSalesAnalytics(params = {}) {
    return this.getSalesOverview(params);
  },

  /**
   * Get delivery trips with sales revenue, units sold, and empties returned.
   *
   * @param {Object} [params] - { startDate, endDate, truckId, status, search, page, limit }
   * @returns {Promise<{ items: Array, meta: Object }|Array>}
   */
  async getTripSalesPerformance(params = {}) {
    const query = new URLSearchParams();
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.truckId) query.append("truckId", params.truckId);
    if (params.status) query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/sales/trip-performance${qs}`);
    if (result?.data?.items && result?.data?.meta) {
      return result.data;
    }
    return result?.data?.trips || result?.data || [];
  },

  /**
   * Get shift closeout remittance summary for a trip.
   *
   * @param {string} tripId - UUID of the trip
   * @returns {Promise<Object>}
   */
  async getTripShiftSummary(tripId) {
    const result = await apiClient(`/sales/trips/${tripId}/shift-summary`);
    return result?.data || null;
  },

  /**
   * Get paginated sales transactions.
   *
   * @param {Object} [params] - { page, limit, sort, order, tripId, customerId, status, paymentMethod, search, startDate, endDate }
   * @returns {Promise<{ items: Array, meta: Object }|Array>}
   */
  async getTransactions(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.sort) query.append("sort", params.sort);
    if (params.order) query.append("order", params.order);
    if (params.tripId) query.append("tripId", params.tripId);
    if (params.customerId) query.append("customerId", params.customerId);
    if (params.status) query.append("status", params.status);
    if (params.paymentMethod) query.append("paymentMethod", params.paymentMethod);
    if (params.search) query.append("search", params.search);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/sales/transactions${qs}`);
    if (result?.data?.items && result?.data?.meta) {
      return result.data;
    }
    return result?.data?.transactions || result?.data || [];
  },

  /**
   * Get details of a single transaction by ID.
   *
   * @param {string} id - Transaction UUID
   * @returns {Promise<Object>}
   */
  async getTransactionById(id) {
    const result = await apiClient(`/sales/transactions/${id}`);
    return result?.data?.transaction || result?.data || null;
  },

  /**
   * Get paginated sales invoices.
   *
   * @param {Object} [params] - { page, limit, sort, order, tripId, paymentMethod, paymentStatus, search, startDate, endDate }
   * @returns {Promise<{ items: Array, meta: Object }|Array>}
   */
  async getInvoices(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.sort) query.append("sort", params.sort);
    if (params.order) query.append("order", params.order);
    if (params.tripId) query.append("tripId", params.tripId);
    if (params.paymentMethod) query.append("paymentMethod", params.paymentMethod);
    if (params.paymentStatus) query.append("paymentStatus", params.paymentStatus);
    if (params.search) query.append("search", params.search);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/sales/invoices${qs}`);
    if (result?.data?.items && result?.data?.meta) {
      return result.data;
    }
    return result?.data?.invoices || result?.data || [];
  },

  /**
   * Get details of a single invoice by ID.
   *
   * @param {string} id - Invoice UUID
   * @returns {Promise<Object>}
   */
  async getInvoiceById(id) {
    const result = await apiClient(`/sales/invoices/${id}`);
    return result?.data?.invoice || result?.data || null;
  },

  /**
   * Verifies an invoice payment (supervisor action).
   *
   * @param {string} id - Invoice UUID
   * @returns {Promise<Object>}
   */
  async verifyInvoice(id) {
    const result = await apiClient(`/sales/invoices/${id}/verify`, {
      method: "PATCH",
    });
    return result?.data?.invoice || result?.data;
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

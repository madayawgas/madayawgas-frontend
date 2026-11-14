// src/api/dashboard.js
import { apiClient } from "./client.js";

/**
 * Legacy Dashboard API Service.
 * Note: The Dashboard page now aggregates live metrics directly from verified
 * backend endpoints (/sales/overview, /operations/fuel/analysis, /fleet/vehicles,
 * and /trips?status=IN_PROGRESS).
 */
export const dashboardApi = {
  /**
   * Get dashboard high-level financial & operational metrics.
   * @deprecated Prefer aggregating from salesApi, fuelApi, fleetApi, and tripsApi.
   * @returns {Promise<object>}
   */
  async getMetrics() {
    const result = await apiClient("/dashboard/metrics");
    return result?.data?.metrics || result?.data || {};
  },
};

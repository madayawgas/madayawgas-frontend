// src/api/dashboard.js
import { apiClient } from "./client.js";

export const dashboardApi = {
  /**
   * Get dashboard high-level financial & operational metrics.
   * @returns {Promise<object>}
   */
  async getMetrics() {
    const result = await apiClient("/dashboard/metrics");
    return result.data;
  },
};

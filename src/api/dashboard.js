// src/api/dashboard.js
import { apiClient, isMock, delay } from "./client.js";
import mockDash from "../mocks/dashboard.json" with { type: "json" };

export const dashboardApi = {
  /**
   * Get dashboard high-level financial & operational metrics.
   * @returns {Promise<object>}
   */
  async getMetrics() {
    if (isMock) {
      await delay(200);
      return mockDash.data;
    }
    const result = await apiClient("/dashboard/metrics");
    return result.data;
  },
};

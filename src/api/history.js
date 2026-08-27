import { apiClient, isMock, delay } from "./client.js";
import mockHistory from "../mocks/history.json" with { type: "json" };

export const historyApi = {
  /**
   * Get system history logs.
   * @returns {Promise<Array>} Array of history log objects
   */
  async getHistoryLogs() {
    if (isMock) {
      await delay(200); // Simulated network delay[cite: 7]
      return mockHistory.data.logs;
    }
    
    const result = await apiClient("/history"); 
    return result.data.logs;
  },
};
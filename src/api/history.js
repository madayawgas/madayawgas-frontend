// src/api/history.js
import { apiClient } from "./client.js";

export const historyApi = {
  /**
   * Get system history logs with server-side pagination & filtering.
   * @param {object} [params] - { page, limit, module, search, sortBy, sortOrder }
   * @returns {Promise<{ data: Array, meta: object } | Array>} Standardized response
   */
  async getHistoryLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.module && params.module !== "All") query.append("module", params.module);
    if (params.search) query.append("search", params.search);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/history${queryString}`);
    return result;
  },
};
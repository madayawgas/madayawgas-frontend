import { apiClient, isMock, delay } from "./client.js";
import mockHistory from "../mocks/history.json" with { type: "json" };

export const historyApi = {
  /**
   * Get system history logs with server-side pagination & filtering.
   * @param {object} [params] - { page, limit, module, search, sortBy, sortOrder }
   * @returns {Promise<{ data: Array, meta: object } | Array>} Standardized response
   */
  async getHistoryLogs(params = {}) {
    if (isMock) {
      await delay(200); // Simulated network delay
      let logs = [...(mockHistory.data?.logs || [])];

      if (params.module && params.module !== "All") {
        logs = logs.filter(
          (log) => (log.module || "").toLowerCase() === params.module.toLowerCase()
        );
      }

      if (params.search) {
        const q = params.search.toLowerCase().trim();
        logs = logs.filter(
          (log) =>
            (log.description || "").toLowerCase().includes(q) ||
            (log.action || "").toLowerCase().includes(q) ||
            (log.userName || log.user || "").toLowerCase().includes(q) ||
            (log.module || "").toLowerCase().includes(q)
        );
      }

      const page = Math.max(1, Number(params.page) || 1);
      const limit = Math.max(1, Number(params.limit) || 20);
      const totalItems = logs.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));
      const paginatedLogs = logs.slice((page - 1) * limit, page * limit);

      return {
        status: "success",
        data: paginatedLogs,
        meta: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

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
// src/api/attendance.js
import { apiClient } from "./client.js";

export const attendanceApi = {
  /**
   * Retrieves paginated or unpaginated attendance shift logs.
   * @param {Object} [params]
   * @returns {Promise<Array>}
   */
  async getAttendanceLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.userId) query.append("userId", params.userId);
    if (params.role) query.append("role", params.role);
    if (params.status) query.append("status", params.status);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient(`/attendance${qs}`);
    if (Array.isArray(res?.data?.records)) return res.data.records;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.records)) return res.records;
    return [];
  },

  /**
   * Retrieves active open duty cycle for a target user or current user.
   * @param {string} [userId]
   * @returns {Promise<Object|null>}
   */
  async getActiveDutyCycle(userId = null) {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    const res = await apiClient(`/attendance/active${qs}`);
    return res?.data || null;
  },

  /**
   * Retrieves all currently active (clocked-in) personnel.
   * @returns {Promise<Array>}
   */
  async getActivePersonnel() {
    return this.getAttendanceLogs({ status: "ACTIVE" });
  },

  /**
   * Records a clock-in event.
   * @param {Object} [payload]
   */
  async clockIn(payload = {}) {
    const res = await apiClient(`/attendance/clock-in`, {
      method: "POST",
      body: payload,
    });
    return res?.data;
  },

  /**
   * Records a clock-out event.
   * @param {Object} [payload]
   */
  async clockOut(payload = {}) {
    const res = await apiClient(`/attendance/clock-out`, {
      method: "POST",
      body: payload,
    });
    return res?.data;
  },
};

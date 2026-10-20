// src/api/apprehensions.js
import { apiClient } from "./client.js";

/**
 * Driver Road Apprehensions API Service
 * Handles citation tracking, roadside violations, and settlement statuses.
 * Base Path: /api/operations/apprehensions
 */
export const apprehensionsApi = {
  /**
   * Retrieves roadside apprehensions list with filtering.
   * Endpoint: GET /api/operations/apprehensions
   *
   * @param {Object} [params] - { vehicleId, driverId, tripId, agency, status, startDate, endDate, search, page, limit }
   * @returns {Promise<{ apprehensions: Array, count: number, meta?: Object }>}
   */
  async getApprehensions(params = {}) {
    const query = new URLSearchParams();
    if (params.vehicleId) query.append("vehicleId", params.vehicleId);
    if (params.driverId) query.append("driverId", params.driverId);
    if (params.tripId) query.append("tripId", params.tripId);
    if (params.agency && params.agency !== "ALL") query.append("agency", params.agency);
    if (params.status && params.status !== "ALL") query.append("status", params.status);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.search) query.append("search", params.search);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient(`/operations/apprehensions${qs}`);

    if (Array.isArray(res?.data?.apprehensions)) {
      return {
        apprehensions: res.data.apprehensions,
        count: res.data.count || res.data.apprehensions.length,
        meta: res.meta || null,
      };
    }
    if (Array.isArray(res?.data)) {
      return {
        apprehensions: res.data,
        count: res.data.length,
        meta: res.meta || null,
      };
    }
    return { apprehensions: [], count: 0, meta: null };
  },

  /**
   * Retrieves single apprehension by UUID.
   * Endpoint: GET /api/operations/apprehensions/:id
   *
   * @param {string} id - Apprehension UUID
   * @returns {Promise<Object>}
   */
  async getApprehensionById(id) {
    if (!id) throw new Error("Apprehension ID is required");
    const res = await apiClient(`/operations/apprehensions/${encodeURIComponent(id)}`);
    return res?.data || null;
  },

  /**
   * Updates status of an apprehension record (SETTLED, DISPUTED, CANCELLED).
   * Endpoint: PATCH /api/operations/apprehensions/:id/status
   *
   * @param {string} id - Apprehension UUID
   * @param {Object} payload - { status: 'SETTLED'|'DISPUTED'|'CANCELLED'|'RECORDED', notes?: string }
   * @returns {Promise<Object>}
   */
  async updateStatus(id, payload = {}) {
    if (!id) throw new Error("Apprehension ID is required");
    const res = await apiClient(`/operations/apprehensions/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: payload,
    });
    return res?.data || null;
  },

  /**
   * Records a road citation incident with ticket photo.
   * Endpoint: POST /api/operations/apprehensions
   *
   * @param {Object} payload - { vehicleId, driverId, tripId, citationTicketNo, violationType, apprehendingAgency, incidentTime, location, penaltyAmount, ticketMediaKey, notes }
   * @returns {Promise<Object>}
   */
  async recordApprehension(payload = {}) {
    const res = await apiClient(`/operations/apprehensions`, {
      method: "POST",
      body: payload,
    });
    return res?.data || null;
  },
};

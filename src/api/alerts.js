// src/api/alerts.js
import { apiClient } from "./client.js";

export const alertsApi = {
  /**
   * Retrieves all currently active and acknowledged driver emergency alerts.
   * Target endpoint: GET /api/operations/alerts/active
   *
   * @returns {Promise<Array<object>>} List of active alert objects
   */
  async getActiveAlerts() {
    const result = await apiClient("/operations/alerts/active");
    return result.data?.alerts || [];
  },

  /**
   * Retrieves details of a specific emergency alert.
   * Target endpoint: GET /api/operations/alerts/:id
   *
   * @param {string} id - Emergency alert UUID
   * @returns {Promise<object>} Alert detail record
   */
  async getAlertById(id) {
    const result = await apiClient(`/operations/alerts/${id}`);
    return result.data;
  },

  /**
   * Acknowledges an active emergency alert by a supervisor.
   * Target endpoint: PATCH /api/operations/alerts/:id/acknowledge
   *
   * @param {string} id - Emergency alert UUID
   * @returns {Promise<object>} Updated alert record
   */
  async acknowledgeAlert(id) {
    const result = await apiClient(`/operations/alerts/${id}/acknowledge`, {
      method: "PATCH",
    });
    return result.data;
  },

  /**
   * Resolves an emergency alert with supervisor resolution notes.
   * Target endpoint: PATCH /api/operations/alerts/:id/resolve
   *
   * @param {string} id - Emergency alert UUID
   * @param {string} [resolutionNotes] - Operational notes explaining resolution
   * @returns {Promise<object>} Resolved alert record
   */
  async resolveAlert(id, resolutionNotes = "") {
    const result = await apiClient(`/operations/alerts/${id}/resolve`, {
      method: "PATCH",
      body: { resolutionNotes },
    });
    return result.data;
  },
};

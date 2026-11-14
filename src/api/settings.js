// src/api/settings.js
import { apiClient } from "./client.js";

export const settingsApi = {
  /**
   * Fetch all organization business system settings, optionally filtered by category.
   * @param {string} [category]
   * @returns {Promise<Array>}
   */
  async getSettings(category) {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    const res = await apiClient(`/settings${query}`);
    return res?.data?.settings || res?.settings || [];
  },

  /**
   * Fetch a single system setting by key.
   * @param {string} key
   * @returns {Promise<object|null>}
   */
  async getSettingByKey(key) {
    const res = await apiClient(`/settings/${encodeURIComponent(key)}`);
    return res?.data?.setting || res?.setting || null;
  },

  /**
   * Update a system setting's value by key.
   * @param {string} key
   * @param {string|number|boolean} value
   * @returns {Promise<object>}
   */
  async updateSetting(key, value) {
    const res = await apiClient(`/settings/${encodeURIComponent(key)}`, {
      method: "PATCH",
      body: JSON.stringify({ value }),
    });
    return res?.data?.setting || res?.setting || res;
  },
};

// src/api/inventory.js
import { apiClient, isMock, delay } from "./client.js";

/**
 * Inventory API Service
 * Modular service prepared for upcoming backend inventory integration endpoints.
 */
export const inventoryApi = {
  async getInventoryItems() {
    if (isMock) {
      await delay(300);
      return [];
    }
    const result = await apiClient("/inventory");
    return result.data.items;
  },

  async getInventoryItemById(id) {
    if (isMock) {
      await delay(200);
      return null;
    }
    const result = await apiClient(`/inventory/${id}`);
    return result.data.item;
  },

  async updateStock(id, stockData) {
    if (isMock) {
      await delay(300);
      return { id, ...stockData };
    }
    const result = await apiClient(`/inventory/${id}/stock`, {
      method: "PATCH",
      body: stockData,
    });
    return result.data.item;
  },
};

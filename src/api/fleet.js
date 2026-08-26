// src/api/fleet.js
import { apiClient, isMock, delay } from "./client.js";

/**
 * Fleet & Truck API Service
 * Modular service prepared for upcoming backend fleet integration endpoints.
 */
export const fleetApi = {
  async getTrucks() {
    if (isMock) {
      await delay(300);
      return [];
    }
    const result = await apiClient("/fleet/trucks");
    return result.data.trucks;
  },

  async getTruckById(id) {
    if (isMock) {
      await delay(200);
      return null;
    }
    const result = await apiClient(`/fleet/trucks/${id}`);
    return result.data.truck;
  },

  async createTruck(truckData) {
    if (isMock) {
      await delay(300);
      return { id: `truck-${Date.now()}`, ...truckData };
    }
    const result = await apiClient("/fleet/trucks", {
      method: "POST",
      body: truckData,
    });
    return result.data.truck;
  },

  async updateTruck(id, truckData) {
    if (isMock) {
      await delay(300);
      return { id, ...truckData };
    }
    const result = await apiClient(`/fleet/trucks/${id}`, {
      method: "PATCH",
      body: truckData,
    });
    return result.data.truck;
  },

  async deleteTruck(id) {
    if (isMock) {
      await delay(200);
      return true;
    }
    await apiClient(`/fleet/trucks/${id}`, { method: "DELETE" });
    return true;
  },
};

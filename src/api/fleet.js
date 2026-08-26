// src/api/fleet.js
import { apiClient, isMock, delay } from "./client.js";
import mockFleet from "../mocks/fleet.json" with { type: "json" };

/**
 * Fleet & Truck API Service
 * Handles vehicle CRUD, driver assignments, and maintenance status updates.
 */
export const fleetApi = {
  /**
   * Get list of trucks in fleet.
   * @returns {Promise<Array>}
   */
  async getTrucks() {
    if (isMock) {
      await delay(200);
      return mockFleet.data.trucks;
    }
    const result = await apiClient("/fleet/trucks");
    return result.data.trucks;
  },

  /**
   * Get single truck details by ID.
   * @param {string|number} id
   * @returns {Promise<object>}
   */
  async getTruckById(id) {
    if (isMock) {
      await delay(150);
      const truck = mockFleet.data.trucks.find(
        (t) => t.id === id || t.truckId === Number(id)
      );
      return truck || null;
    }
    const result = await apiClient(`/fleet/trucks/${id}`);
    return result.data.truck;
  },

  /**
   * Add a new truck to the fleet.
   * @param {object} truckData
   * @returns {Promise<object>}
   */
  async createTruck(truckData) {
    if (isMock) {
      await delay(300);
      const newTruck = {
        id: `trk-${Date.now()}`,
        truckId: Date.now(),
        lastUpdated: new Date().toLocaleString(),
        ...truckData,
      };
      return newTruck;
    }
    const result = await apiClient("/fleet/trucks", {
      method: "POST",
      body: truckData,
    });
    return result.data.truck;
  },

  /**
   * Update truck information.
   * @param {string|number} id
   * @param {object} truckData
   * @returns {Promise<object>}
   */
  async updateTruck(id, truckData) {
    if (isMock) {
      await delay(250);
      return {
        id,
        truckId: id,
        lastUpdated: new Date().toLocaleString(),
        ...truckData,
      };
    }
    const result = await apiClient(`/fleet/trucks/${id}`, {
      method: "PATCH",
      body: truckData,
    });
    return result.data.truck;
  },

  /**
   * Remove a truck from the fleet.
   * @param {string|number} id
   * @returns {Promise<boolean>}
   */
  async deleteTruck(id) {
    if (isMock) {
      await delay(200);
      return true;
    }
    await apiClient(`/fleet/trucks/${id}`, { method: "DELETE" });
    return true;
  },
};

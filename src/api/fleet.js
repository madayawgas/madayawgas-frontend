// src/api/fleet.js
import { apiClient, isMock, delay } from "./client.js";
import mockFleet from "../mocks/fleet.json" with { type: "json" };
import mockUsers from "../mocks/users.json" with { type: "json" };
import { authApi } from "./auth.js";

/**
 * Helper to get fresh cached trucks or fallback mock
 */
function getInMemoryTrucks() {
  try {
    const cached = localStorage.getItem("app_fleet_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading cached fleet:", e);
  }
  return mockFleet?.data?.trucks ? [...mockFleet.data.trucks] : [];
}

/**
 * Helper to persist mock trucks state to localStorage
 */
function saveInMemoryTrucks(trucks) {
  try {
    localStorage.setItem("app_fleet_cache", JSON.stringify(trucks));
  } catch (e) {
    console.error("Error saving fleet cache:", e);
  }
}

/**
 * Helper to resolve driver object from driverId (checks cache and fallback mock)
 */
function resolveDriver(driverId) {
  if (!driverId) return null;
  let userList = [];
  try {
    const cached = localStorage.getItem("app_users_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        userList = parsed;
      }
    }
  } catch (e) {
    console.error("Error reading cached users:", e);
  }

  if (userList.length === 0) {
    userList = mockUsers?.data?.users || [];
  }

  const found = userList.find((u) => u.id === driverId || u.userId === driverId);
  if (!found) return null;
  return {
    id: found.id || found.userId,
    firstName: found.firstName || "",
    lastName: found.lastName || "",
    phone: found.phone || "",
    username: found.username || "",
    role: found.role || "Driver",
  };
}

/**
 * Fleet & Maintenance API Service
 * Interacts with /api/fleet endpoints based on docs/API Contract/fleet-and-maintenance.api.md
 */
export const fleetApi = {
  /**
   * Verify admin password before performing sensitive operations.
   * Delegates directly to authApi.
   * @param {string} password
   * @param {string} [username]
   * @returns {Promise<boolean>}
   */
  async verifyAdminPassword(password, username) {
    return authApi.verifyPassword(password, username);
  },

  /**
   * View Fleet Overview Metrics.
   * @returns {Promise<{ metrics: object, summary: object }>}
   */
  async getFleetOverview() {
    if (isMock) {
      await delay(200);
      const inMemoryTrucks = getInMemoryTrucks();
      const totalVehicles = inMemoryTrucks.length;
      const activeVehicles = inMemoryTrucks.filter((t) => t.status === "ACTIVE");
      const availableVehicles = activeVehicles.length;
      const assignedVehicles = activeVehicles.filter((t) => !!t.driverId).length;
      const unassignedVehicles = availableVehicles - assignedVehicles;
      const underMaintenanceVehicles = inMemoryTrucks.filter(
        (t) => t.status === "UNDER_MAINTENANCE"
      ).length;
      const inactiveVehicles = inMemoryTrucks.filter(
        (t) => t.status === "INACTIVE" || t.status === "RETIRED"
      ).length;

      const operationalRatePercent = totalVehicles > 0
        ? Number(((availableVehicles / totalVehicles) * 100).toFixed(1))
        : 0;

      return {
        metrics: {
          totalVehicles,
          availableVehicles,
          assignedVehicles,
          unassignedVehicles,
          underMaintenanceVehicles,
          inactiveVehicles,
        },
        summary: {
          operationalTotal: availableVehicles,
          operationalRatePercent,
        },
      };
    }

    const result = await apiClient("/fleet/overview");
    return result.data;
  },

  /**
   * View Fleet Availability.
   * @param {object} [params] - { driverAssigned }
   * @returns {Promise<{ availableCount: number, vehicles: Array }>}
   */
  async getFleetAvailability(params = {}) {
    if (isMock) {
      await delay(200);
      const inMemoryTrucks = getInMemoryTrucks();
      let list = inMemoryTrucks.filter((t) => t.status === "ACTIVE");
      if (params.driverAssigned !== undefined) {
        const assignedBool =
          params.driverAssigned === true || params.driverAssigned === "true";
        list = list.filter((t) => (!!t.driverId) === assignedBool);
      }
      return {
        availableCount: list.length,
        vehicles: list,
      };
    }

    const query = new URLSearchParams();
    if (params.driverAssigned !== undefined) {
      query.append("driverAssigned", params.driverAssigned);
    }
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/fleet/availability${queryString}`);
    return result.data;
  },

  /**
   * List All Vehicles (with search and status filters).
   * @param {object} [params] - { status, search, driverAssigned }
   * @returns {Promise<Array>} Array of truck objects
   */
  async getTrucks(params = {}) {
    if (isMock) {
      await delay(250);
      let list = getInMemoryTrucks();

      // Status filter
      if (params.status && params.status !== "All") {
        list = list.filter(
          (t) =>
            (t.status || "").toUpperCase() === params.status.toUpperCase() ||
            (t.operationalStatus || "").toUpperCase() === params.status.toUpperCase()
        );
      }

      // Search filter (plateNumber, model, driver)
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (t) =>
            (t.plateNumber || "").toLowerCase().includes(q) ||
            (t.model || "").toLowerCase().includes(q) ||
            (t.driver?.firstName || "").toLowerCase().includes(q) ||
            (t.driver?.lastName || "").toLowerCase().includes(q) ||
            (t.driver?.username || "").toLowerCase().includes(q)
        );
      }

      // Driver assigned filter
      if (params.driverAssigned !== undefined) {
        const assignedBool =
          params.driverAssigned === true || params.driverAssigned === "true";
        list = list.filter((t) => (!!t.driverId) === assignedBool);
      }

      return list;
    }

    const query = new URLSearchParams();
    if (params.status && params.status !== "All") query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.driverAssigned !== undefined) query.append("driverAssigned", params.driverAssigned);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/fleet/trucks${queryString}`);
    return result.data.trucks;
  },

  /**
   * Get Vehicle by ID.
   * @param {string} id - Truck UUID
   * @returns {Promise<object>} Truck object
   */
  async getTruckById(id) {
    if (isMock) {
      await delay(150);
      const inMemoryTrucks = getInMemoryTrucks();
      const truck = inMemoryTrucks.find((t) => t.id === id || t.truckId === id);
      if (!truck) {
        const error = new Error("Truck not found");
        error.status = 404;
        throw error;
      }
      return truck;
    }

    const result = await apiClient(`/fleet/trucks/${id}`);
    return result.data.truck;
  },

  /**
   * Register Vehicle.
   * @param {{ plateNumber: string, model: string, yearModel: number, currentOdometer?: number, lastPmOdometer?: number, status?: string, driverId?: string, driver?: object }} truckData
   * @returns {Promise<{ truck: object }>} Created truck response
   */
  async createTruck(truckData) {
    if (isMock) {
      await delay(300);
      const inMemoryTrucks = getInMemoryTrucks();
      const initialStatus = truckData.status || "ACTIVE";
      const isAvailable = initialStatus === "ACTIVE";
      const shouldReleaseDriver = initialStatus === "INACTIVE" || initialStatus === "RETIRED";
      const driverId = shouldReleaseDriver ? null : (truckData.driverId || null);
      const driverObj = (driverId && truckData.driver) ? truckData.driver : resolveDriver(driverId);

      const newTruck = {
        id: `trk-${Date.now()}`,
        plateNumber: truckData.plateNumber,
        model: truckData.model,
        yearModel: Number(truckData.yearModel) || new Date().getFullYear(),
        currentOdometer: Number(truckData.currentOdometer) || 0,
        lastPmOdometer: Number(truckData.lastPmOdometer) || 0,
        status: initialStatus,
        operationalStatus: initialStatus,
        isAvailable,
        driverId,
        driver: driverObj,
        driverName: driverObj
          ? `${driverObj.firstName || ""} ${driverObj.lastName || ""}`.trim() || driverObj.username
          : "No Assigned",
        designatedRoute: truckData.designatedRoute || "No Route Assigned",
        tankNumber: truckData.tankNumber || "1234",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      inMemoryTrucks.unshift(newTruck);
      saveInMemoryTrucks(inMemoryTrucks);
      return { truck: newTruck };
    }

    const result = await apiClient("/fleet/trucks", {
      method: "POST",
      body: truckData,
    });
    return result.data;
  },

  /**
   * Update Vehicle Information.
   * Seamlessly handles vehicle specs, operational status, and driver assignments across API endpoints.
   * @param {string} id - Truck UUID
   * @param {object} truckData - Fields to update
   * @returns {Promise<{ truck: object }>} Updated truck response
   */
  async updateTruck(id, truckData) {
    if (isMock) {
      await delay(250);
      const inMemoryTrucks = getInMemoryTrucks();
      const index = inMemoryTrucks.findIndex((t) => t.id === id || t.truckId === id);
      const existing = index !== -1 ? inMemoryTrucks[index] : {};

      const newStatus = truckData.status || existing.status || "ACTIVE";
      const isAvailable = newStatus === "ACTIVE";

      // If status is INACTIVE or RETIRED, release driver
      const shouldReleaseDriver = newStatus === "INACTIVE" || newStatus === "RETIRED";

      let driverId = existing.driverId;
      if (truckData.driverId !== undefined) {
        driverId = truckData.driverId || null;
      }
      if (shouldReleaseDriver) {
        driverId = null;
      }

      let driverObj = existing.driver;
      if (truckData.driver !== undefined) {
        driverObj = truckData.driver;
      } else if (truckData.driverId !== undefined) {
        driverObj = resolveDriver(truckData.driverId);
      }
      if (shouldReleaseDriver || !driverId) {
        driverObj = null;
      }

      const driverName = driverObj
        ? `${driverObj.firstName || ""} ${driverObj.lastName || ""}`.trim() || driverObj.username
        : "No Assigned";

      const updated = {
        ...existing,
        ...truckData,
        id: id || existing.id,
        driverId,
        driver: driverObj,
        driverName,
        status: newStatus,
        operationalStatus: newStatus,
        isAvailable,
        yearModel: truckData.yearModel !== undefined ? Number(truckData.yearModel) : existing.yearModel,
        currentOdometer: truckData.currentOdometer !== undefined ? Number(truckData.currentOdometer) : existing.currentOdometer,
        lastPmOdometer: truckData.lastPmOdometer !== undefined ? Number(truckData.lastPmOdometer) : existing.lastPmOdometer,
        updatedAt: new Date().toISOString(),
      };

      if (index !== -1) {
        inMemoryTrucks[index] = updated;
      } else {
        inMemoryTrucks.unshift(updated);
      }
      saveInMemoryTrucks(inMemoryTrucks);
      return { truck: updated };
    }

    // LIVE REST BACKEND: Orchestrate across API contract endpoints
    let latestTruck = null;

    // 1. Vehicle specs update (/api/fleet/trucks/:id)
    const infoPayload = {};
    if (truckData.plateNumber !== undefined) infoPayload.plateNumber = truckData.plateNumber;
    if (truckData.model !== undefined) infoPayload.model = truckData.model;
    if (truckData.yearModel !== undefined) infoPayload.yearModel = Number(truckData.yearModel);
    if (truckData.currentOdometer !== undefined) infoPayload.currentOdometer = Number(truckData.currentOdometer);
    if (truckData.lastPmOdometer !== undefined) infoPayload.lastPmOdometer = Number(truckData.lastPmOdometer);

    if (Object.keys(infoPayload).length > 0) {
      const res = await apiClient(`/fleet/trucks/${id}`, {
        method: "PATCH",
        body: infoPayload,
      });
      latestTruck = res.data?.truck || res.data;
    }

    // 2. Status update (/api/fleet/trucks/:id/status)
    if (truckData.status) {
      const res = await apiClient(`/fleet/trucks/${id}/status`, {
        method: "PATCH",
        body: { status: truckData.status },
      });
      latestTruck = res.data?.truck || res.data || latestTruck;
    }

    // 3. Driver assignment / unassignment endpoints (/assign and /unassign)
    if (truckData.driverId === null || truckData.driverId === "") {
      const res = await this.unassignDriver(id);
      latestTruck = res.data?.truck || res.truck || latestTruck;
    } else if (truckData.driverId) {
      const res = await this.assignDriver(id, { driverId: truckData.driverId });
      latestTruck = res.data?.truck || res.truck || latestTruck;
    }

    if (!latestTruck) {
      latestTruck = await this.getTruckById(id);
    }

    return { truck: latestTruck };
  },

  /**
   * Assign Driver to Vehicle.
   * @param {string} id - Truck UUID
   * @param {{ driverId: string }} payload
   * @returns {Promise<{ truck: object, message: string }>} Updated driver assignment response
   */
  async assignDriver(id, { driverId }) {
    if (isMock) {
      await delay(250);
      const inMemoryTrucks = getInMemoryTrucks();
      const index = inMemoryTrucks.findIndex((t) => t.id === id || t.truckId === id);
      const existing = index !== -1 ? inMemoryTrucks[index] : {};

      // Invariant: check if vehicle already has an assigned driver
      if (existing.driverId && existing.driverId !== driverId) {
        const error = new Error(
          "This vehicle already has an assigned driver. Please unassign the current driver first."
        );
        error.status = 409;
        throw error;
      }

      // Invariant: check if driver is already assigned to another active truck
      const otherTruck = inMemoryTrucks.find(
        (t) => t.id !== id && (t.driverId === driverId || t.driver?.id === driverId) && t.status === "ACTIVE"
      );
      if (otherTruck) {
        const driverObj = resolveDriver(driverId);
        const driverName = driverObj
          ? `${driverObj.firstName} ${driverObj.lastName}`.trim()
          : "Driver";
        const error = new Error(
          `Driver '${driverName}' is already assigned to vehicle '${otherTruck.plateNumber}'. The driver must be unassigned from vehicle '${otherTruck.plateNumber}' first.`
        );
        error.status = 409;
        throw error;
      }

      const driverObj = resolveDriver(driverId);
      const updated = {
        ...existing,
        id: id || existing.id,
        driverId,
        driver: driverObj,
        driverName: driverObj
          ? `${driverObj.firstName || ""} ${driverObj.lastName || ""}`.trim() || driverObj.username
          : "No Assigned",
        updatedAt: new Date().toISOString(),
      };

      if (index !== -1) {
        inMemoryTrucks[index] = updated;
      }
      saveInMemoryTrucks(inMemoryTrucks);

      return {
        truck: updated,
        message: "Driver successfully assigned",
      };
    }

    const result = await apiClient(`/fleet/trucks/${id}/assign`, {
      method: "PATCH",
      body: { driverId },
    });
    return result.data;
  },

  /**
   * Unassign Driver from Vehicle.
   * @param {string} id - Truck UUID
   * @returns {Promise<{ truck: object, message: string }>} Unassigned driver response
   */
  async unassignDriver(id) {
    if (isMock) {
      await delay(250);
      const inMemoryTrucks = getInMemoryTrucks();
      const index = inMemoryTrucks.findIndex((t) => t.id === id || t.truckId === id);
      const existing = index !== -1 ? inMemoryTrucks[index] : {};

      const updated = {
        ...existing,
        id: id || existing.id,
        driverId: null,
        driver: null,
        driverName: "No Assigned",
        updatedAt: new Date().toISOString(),
      };

      if (index !== -1) {
        inMemoryTrucks[index] = updated;
      }
      saveInMemoryTrucks(inMemoryTrucks);

      return {
        truck: updated,
        message: "Driver successfully unassigned",
      };
    }

    const result = await apiClient(`/fleet/trucks/${id}/unassign`, {
      method: "PATCH",
    });
    return result.data;
  },

  /**
   * Driver Directory (List All Drivers with live assignment status).
   * @param {object} [params] - { search, availableOnly }
   * @returns {Promise<{ count: number, drivers: Array }>}
   */
  async getDrivers(params = {}) {
    if (isMock) {
      await delay(200);
      const inMemoryTrucks = getInMemoryTrucks();
      let userList = [];
      try {
        const cached = localStorage.getItem("app_users_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            userList = parsed;
          }
        }
      } catch (e) {
        console.error("Error reading cached users:", e);
      }

      if (userList.length === 0) {
        userList = mockUsers?.data?.users || [];
      }

      let drivers = userList
        .filter(
          (u) =>
            (u.role || "").toLowerCase().trim() === "driver" &&
            u.isActive !== false &&
            !u.isBlocked
        )
        .map((u) => {
          const uId = u.id || u.userId;
          const assignedTruck = inMemoryTrucks.find(
            (t) =>
              (t.driverId === uId || t.driver?.id === uId) &&
              t.status === "ACTIVE"
          );
          const isAssigned = !!assignedTruck;
          return {
            id: uId,
            username: u.username,
            firstName: u.firstName || "",
            lastName: u.lastName || "",
            phone: u.phone || "",
            role: u.role || "Driver",
            isAssigned,
            status: isAssigned ? "ASSIGNED" : "AVAILABLE",
            assignedTruck: assignedTruck
              ? {
                  id: assignedTruck.id,
                  plateNumber: assignedTruck.plateNumber,
                  model: assignedTruck.model,
                }
              : null,
          };
        });

      if (params.search) {
        const q = params.search.toLowerCase().trim();
        drivers = drivers.filter(
          (d) =>
            (d.firstName || "").toLowerCase().includes(q) ||
            (d.lastName || "").toLowerCase().includes(q) ||
            (d.username || "").toLowerCase().includes(q)
        );
      }

      if (params.availableOnly === true || params.availableOnly === "true") {
        drivers = drivers.filter((d) => !d.isAssigned);
      }

      return {
        count: drivers.length,
        drivers,
      };
    }

    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.availableOnly !== undefined) query.append("availableOnly", params.availableOnly);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/fleet/drivers${queryString}`);
    return result.data;
  },

  /**
   * List Available Drivers (Active, unassigned drivers ready for vehicle assignment).
   * @returns {Promise<Array>} List of available driver objects
   */
  async getAvailableDrivers() {
    if (isMock) {
      const res = await this.getDrivers({ availableOnly: true });
      return res.drivers || [];
    }

    const result = await apiClient("/fleet/drivers/available");
    return result.data.drivers || [];
  },

  /**
   * View Vehicle Status.
   * @param {string} id - Truck UUID
   * @returns {Promise<object>} Status object
   */
  async getTruckStatus(id) {
    if (isMock) {
      await delay(150);
      const inMemoryTrucks = getInMemoryTrucks();
      const truck = inMemoryTrucks.find((t) => t.id === id || t.truckId === id);
      if (!truck) {
        const error = new Error("Truck not found");
        error.status = 404;
        throw error;
      }
      return {
        id: truck.id,
        plateNumber: truck.plateNumber,
        model: truck.model,
        status: truck.status,
        operationalStatus: truck.status,
        isAvailable: truck.isAvailable,
        driver: truck.driver,
      };
    }

    const result = await apiClient(`/fleet/trucks/${id}/status`);
    return result.data.truck;
  },

  /**
   * Set Vehicle Availability Status.
   * @param {string} id - Truck UUID
   * @param {{ status: string }} payload
   * @returns {Promise<{ truck: object, message: string }>} Updated status response
   */
  async updateTruckStatus(id, { status }) {
    if (isMock) {
      await delay(250);
      const inMemoryTrucks = getInMemoryTrucks();
      const index = inMemoryTrucks.findIndex((t) => t.id === id || t.truckId === id);
      const existing = index !== -1 ? inMemoryTrucks[index] : {};

      const isAvailable = status === "ACTIVE";
      // If inactive or retired, release driver
      const shouldReleaseDriver = status === "INACTIVE" || status === "RETIRED";
      const driverId = shouldReleaseDriver ? null : existing.driverId;
      const driver = shouldReleaseDriver ? null : existing.driver;

      const updated = {
        ...existing,
        id: id || existing.id,
        status,
        operationalStatus: status,
        isAvailable,
        driverId,
        driver,
        driverName: driver
          ? `${driver.firstName || ""} ${driver.lastName || ""}`.trim() || driver.username
          : "No Assigned",
        updatedAt: new Date().toISOString(),
      };

      if (index !== -1) {
        inMemoryTrucks[index] = updated;
      }
      saveInMemoryTrucks(inMemoryTrucks);

      return {
        truck: updated,
        message: "Vehicle availability status updated",
      };
    }

    const result = await apiClient(`/fleet/trucks/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    return result.data;
  },

  /**
   * Deactivate Vehicle (Soft decommission with password confirmation).
   * @param {string} id - Truck UUID
   * @param {{ confirmPassword?: string }} payload
   * @returns {Promise<{ truck: object, message: string }>} Deactivated vehicle response
   */
  async deactivateTruck(id, { confirmPassword }) {
    if (isMock) {
      await delay(300);
      if (!confirmPassword) {
        const error = new Error("Admin password confirmation is required");
        error.status = 401;
        throw error;
      }

      const inMemoryTrucks = getInMemoryTrucks();
      const index = inMemoryTrucks.findIndex((t) => t.id === id || t.truckId === id);
      const existing = index !== -1 ? inMemoryTrucks[index] : {};

      const updated = {
        ...existing,
        id: id || existing.id,
        status: "INACTIVE",
        operationalStatus: "INACTIVE",
        isAvailable: false,
        driverId: null,
        driver: null,
        driverName: "No Assigned",
        updatedAt: new Date().toISOString(),
      };

      if (index !== -1) {
        inMemoryTrucks[index] = updated;
      }
      saveInMemoryTrucks(inMemoryTrucks);

      return {
        truck: updated,
        message: "Vehicle successfully deactivated",
      };
    }

    const password =
      typeof confirmPassword === "object"
        ? confirmPassword?.confirmPassword || confirmPassword?.adminPassword
        : confirmPassword;
    const result = await apiClient(`/fleet/trucks/${id}/deactivate`, {
      method: "PATCH",
      body: {
        confirmPassword: password,
        adminPassword: password,
        confirm_password: password,
        admin_password: password,
      },
    });
    return result.data;
  },

  /**
   * Fleet Register Page Options.
   * @returns {Promise<{ availableDrivers: Array, statusOptions: Array }>}
   */
  async getRegisterOptions() {
    if (isMock) {
      const res = await this.getDrivers({ availableOnly: true });
      return {
        availableDrivers: res.drivers || [],
        statusOptions: ["ACTIVE", "INACTIVE", "UNDER_MAINTENANCE", "RETIRED"],
      };
    }

    const result = await apiClient("/fleet/register-options");
    return result.data;
  },

  /**
   * Record Vehicle Mileage.
   * @param {string} id - Truck UUID
   * @param {{ odometer: number }} payload
   * @returns {Promise<{ truck: object, mileageSummary: object, message: string }>}
   */
  async recordMileage(id, { odometer }) {
    if (isMock) {
      await delay(250);
      const inMemoryTrucks = getInMemoryTrucks();
      const index = inMemoryTrucks.findIndex((t) => t.id === id || t.truckId === id);
      const existing = index !== -1 ? inMemoryTrucks[index] : {};
      const current = existing.currentOdometer || 0;

      if (Number(odometer) < current) {
        const error = new Error(
          `New odometer reading (${odometer} km) cannot be less than current recorded odometer (${current} km)`
        );
        error.status = 400;
        throw error;
      }

      const previousOdometer = current;
      const newOdometer = Number(odometer);
      const distanceRecorded = newOdometer - previousOdometer;
      const lastPm = existing.lastPmOdometer || 0;
      const distanceSinceLastPm = newOdometer - lastPm;

      const updated = {
        ...existing,
        id: id || existing.id,
        currentOdometer: newOdometer,
        updatedAt: new Date().toISOString(),
      };

      if (index !== -1) {
        inMemoryTrucks[index] = updated;
      }
      saveInMemoryTrucks(inMemoryTrucks);

      return {
        truck: updated,
        mileageSummary: {
          previousOdometer,
          currentOdometer: newOdometer,
          distanceRecorded,
          lastPmOdometer: lastPm,
          distanceSinceLastPm,
        },
        message: "Vehicle mileage recorded successfully",
      };
    }

    const result = await apiClient(`/fleet/trucks/${id}/mileage`, {
      method: "PATCH",
      body: { odometer },
    });
    return result.data;
  },

  // Backward compatibility alias for delete
  async deleteTruck(id, payload = {}) {
    return this.deactivateTruck(id, payload);
  },
};

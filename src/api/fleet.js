// src/api/fleet.js
import { apiClient } from "./client.js";
import { authApi } from "./auth.js";

export const fleetApi = {
  /**
   * Verify admin password via auth API.
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
    const result = await apiClient("/fleet/overview");
    return result.data;
  },

  /**
   * View Fleet Availability.
   * @param {object} [params] - { driverAssigned }
   * @returns {Promise<{ availableCount: number, vehicles: Array }>}
   */
  async getFleetAvailability(params = {}) {
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
  async getVehicles(params = {}) {
    return this.getTrucks(params);
  },

  async getTrucks(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== "All") query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.vehicleType || params.type) query.append("vehicleType", params.vehicleType || params.type);
    if (params.driverAssigned !== undefined) query.append("driverAssigned", params.driverAssigned);
    if (params.page) query.append("page", params.page);
    if (params.limit || params.pageSize) query.append("limit", params.limit || params.pageSize);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/fleet/vehicles${queryString}`);

    let list = [];
    if (Array.isArray(result.data)) {
      list = result.data;
    } else if (result.data?.vehicles && Array.isArray(result.data.vehicles)) {
      list = result.data.vehicles;
    } else if (result.data?.trucks && Array.isArray(result.data.trucks)) {
      list = result.data.trucks;
    }

    return list.map((v) => ({
      ...v,
      vehicleType: v.vehicleType || "DELIVERY_TRUCK",
      pmDueFlag: v.pmDueFlag !== undefined ? v.pmDueFlag : Boolean(v.isPmDue),
      isPmDue: v.isPmDue !== undefined ? v.isPmDue : Boolean(v.pmDueFlag),
    }));
  },

  /**
   * Get Vehicle by ID.
   * @param {string} id - Vehicle UUID
   * @returns {Promise<object>} Vehicle object
   */
  async getTruckById(id) {
    const result = await apiClient(`/fleet/vehicles/${id}`);
    const vehicle = result.data?.vehicle || result.data?.truck || result.data;
    return {
      ...vehicle,
      vehicleType: vehicle.vehicleType || "DELIVERY_TRUCK",
      pmDueFlag: vehicle.pmDueFlag !== undefined ? vehicle.pmDueFlag : Boolean(vehicle.isPmDue),
      isPmDue: vehicle.isPmDue !== undefined ? vehicle.isPmDue : Boolean(vehicle.pmDueFlag),
    };
  },

  /**
   * Register Vehicle.
   * @param {{ plateNumber: string, model: string, yearModel: number, vehicleType?: string, currentOdometer?: number, lastPmOdometer?: number, status?: string, driverId?: string, driver?: object }} truckData
   * @returns {Promise<{ truck: object, vehicle: object }>} Created vehicle response
   */
  async createTruck(truckData) {
    const payload = {
      ...truckData,
      vehicleType: truckData.vehicleType || "DELIVERY_TRUCK",
    };

    const result = await apiClient("/fleet/vehicles", {
      method: "POST",
      body: payload,
    });
    const created = result.data?.vehicle || result.data?.truck || result.data;
    return {
      ...result,
      truck: created,
      vehicle: created,
    };
  },

  /**
   * Update Vehicle Information.
   * Seamlessly handles vehicle specs, operational status, and driver assignments across API endpoints.
   * @param {string} id - Truck UUID
   * @param {object} truckData - Fields to update
   * @returns {Promise<{ truck: object }>} Updated truck response
   */
  async updateTruck(id, truckData) {
    let latestTruck = null;

    // 1. Vehicle specs update (/api/fleet/vehicles/:id)
    const infoPayload = {};
    if (truckData.plateNumber !== undefined) infoPayload.plateNumber = truckData.plateNumber;
    if (truckData.model !== undefined) infoPayload.model = truckData.model;
    if (truckData.yearModel !== undefined) infoPayload.yearModel = Number(truckData.yearModel);
    if (truckData.vehicleType !== undefined) infoPayload.vehicleType = truckData.vehicleType;
    if (truckData.currentOdometer !== undefined) infoPayload.currentOdometer = Number(truckData.currentOdometer);
    if (truckData.lastPmOdometer !== undefined) infoPayload.lastPmOdometer = Number(truckData.lastPmOdometer);

    if (Object.keys(infoPayload).length > 0) {
      const res = await apiClient(`/fleet/vehicles/${id}`, {
        method: "PATCH",
        body: infoPayload,
      });
      latestTruck = res.data?.vehicle || res.data?.truck || res.data;
    }

    // 2. Status update (/api/fleet/vehicles/:id/status)
    if (truckData.status) {
      const res = await apiClient(`/fleet/vehicles/${id}/status`, {
        method: "PATCH",
        body: { status: truckData.status },
      });
      latestTruck = res.data?.vehicle || res.data?.truck || res.data || latestTruck;
    }

    // 3. Driver assignment / unassignment endpoints (/assign and /unassign)
    if (truckData.driverId === null || truckData.driverId === "") {
      const res = await this.unassignDriver(id);
      latestTruck = res.data?.vehicle || res.data?.truck || res.truck || latestTruck;
    } else if (truckData.driverId) {
      const res = await this.assignDriver(id, { driverId: truckData.driverId });
      latestTruck = res.data?.vehicle || res.data?.truck || res.truck || latestTruck;
    }

    if (!latestTruck) {
      latestTruck = await this.getTruckById(id);
    }

    return { truck: latestTruck, vehicle: latestTruck };
  },

  /**
   * Assign Driver to Vehicle.
   * @param {string} id - Vehicle UUID
   * @param {{ driverId: string }} payload
   * @returns {Promise<{ truck: object, message: string }>} Updated driver assignment response
   */
  async assignDriver(id, { driverId }) {
    const result = await apiClient(`/fleet/vehicles/${id}/assign`, {
      method: "PATCH",
      body: { driverId },
    });
    return result.data;
  },

  /**
   * Unassign Driver from Vehicle.
   * @param {string} id - Vehicle UUID
   * @returns {Promise<{ truck: object, message: string }>} Unassigned driver response
   */
  async unassignDriver(id) {
    const result = await apiClient(`/fleet/vehicles/${id}/unassign`, {
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
    const result = await apiClient("/fleet/drivers/available");
    return result.data.drivers || [];
  },

  /**
   * View Vehicle Status.
   * @param {string} id - Truck UUID
   * @returns {Promise<object>} Status object
   */
  async getTruckStatus(id) {
    const result = await apiClient(`/fleet/vehicles/${id}/status`);
    return result.data?.vehicle || result.data?.truck || result.data;
  },

  /**
   * Set Vehicle Availability Status.
   * @param {string} id - Vehicle UUID
   * @param {{ status: string }} payload
   * @returns {Promise<{ truck: object, message: string }>} Updated status response
   */
  async updateTruckStatus(id, { status }) {
    const result = await apiClient(`/fleet/vehicles/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    return result.data;
  },

  /**
   * Deactivate Vehicle (Soft decommission with password confirmation).
   * @param {string} id - Vehicle UUID
   * @param {{ confirmPassword?: string }} payload
   * @returns {Promise<{ truck: object, message: string }>} Deactivated vehicle response
   */
  async deactivateTruck(id, { confirmPassword }) {
    const password =
      typeof confirmPassword === "object"
        ? confirmPassword?.confirmPassword || confirmPassword?.adminPassword
        : confirmPassword;
    const result = await apiClient(`/fleet/vehicles/${id}/deactivate`, {
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
    const result = await apiClient("/fleet/register-options");
    return result.data;
  },

  /**
   * Record Vehicle Mileage.
   * @param {string} id - Vehicle UUID
   * @param {{ odometer: number }} payload
   * @returns {Promise<{ truck: object, mileageSummary: object, message: string }>}
   */
  async recordMileage(id, { odometer }) {
    const result = await apiClient(`/fleet/vehicles/${id}/mileage`, {
      method: "PATCH",
      body: { odometer },
    });
    return result.data;
  },

  /**
   * Record Post-Dispatch Return Odometer.
   * Enforces monotonic odometer reading and computes 5,000-km PM progress.
   * Endpoint: POST /api/fleet/maintenance/odometer
   * @param {{ truckId?: string, vehicleId?: string, odometerReading: number, source?: string, notes?: string }} payload
   * @returns {Promise<{ status: string, message: string, data: object }>}
   */
  async recordReturnOdometer({ truckId, vehicleId, odometerReading, source = "POST_DISPATCH_RETURN", notes = "" }) {
    const targetVehicleId = vehicleId || truckId;
    const result = await apiClient("/fleet/maintenance/odometer", {
      method: "POST",
      body: {
        vehicleId: targetVehicleId,
        truckId: targetVehicleId,
        odometerReading: Number(odometerReading),
        source: source || "POST_DISPATCH_RETURN",
        notes: notes || "",
      },
    });
    return result;
  },

  /**
   * View Vehicle Odometer Log History.
   * Modernized endpoint: GET /api/fleet/maintenance/odometer/vehicle/:vehicleId
   * @param {string} truckId - Vehicle UUID
   * @param {object} [params] - { page, limit }
   * @returns {Promise<{ status: string, data: object }>}
   */
  async getTruckOdometerLogs(truckId, params = {}) {
    const vehicleId = truckId;
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/fleet/maintenance/odometer/vehicle/${vehicleId}${queryString}`);
    return result;
  },

  /**
   * View Fleet PM Status Overview.
   * Endpoint: GET /api/fleet/maintenance/pm-overview
   * @param {object} [params] - { status, search, isPmDue }
   * @returns {Promise<{ status: string, data: object }>}
   */
  async getPmOverview(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== "All") query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.isPmDue !== undefined) query.append("isPmDue", params.isPmDue);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/fleet/maintenance/pm-overview${queryString}`);
    return result;
  },

  /**
   * Set Vehicle Availability Status (Mark truck unavailable / change operational condition).
   * Endpoints: PATCH /api/fleet/availability/:id/status or PATCH /api/fleet/trucks/:id/status
   * @param {string} id - Truck UUID
   * @param {{ status: string, reason?: string }} payload
   * @returns {Promise<{ truck: object, message: string }>}
   */
  async setVehicleAvailabilityStatus(id, { status, reason }) {
    try {
      const result = await apiClient(`/fleet/availability/${id}/status`, {
        method: "PATCH",
        body: { status, reason },
      });
      return result.data;
    } catch {
      // Fallback to /fleet/trucks/:id/status
      const result = await apiClient(`/fleet/trucks/${id}/status`, {
        method: "PATCH",
        body: { status, reason },
      });
      return result.data;
    }
  },

  /**
   * Assign Driver to Vehicle with 1:1 soft-binding invariant.
   * Endpoints: PUT /api/fleet/trucks/:id/driver or PATCH /api/fleet/trucks/:id/assign
   * @param {string} id - Truck UUID
   * @param {{ driverId: string }} payload
   * @returns {Promise<{ truck: object, message: string }>}
   */
  async assignDriverToTruck(id, { driverId }) {
    try {
      const result = await apiClient(`/fleet/trucks/${id}/driver`, {
        method: "PUT",
        body: { driverId },
      });
      return result.data;
    } catch {
      return this.assignDriver(id, { driverId });
    }
  },

  // =========================================================================
  // SAFETY INSPECTIONS (Findings-Only — docs/api-contracts/fleet/maintenance.api.md)
  // =========================================================================

  /**
   * Record Daily Safety Inspection (Findings-Only — No Checklists)
   * If result === 'FAILED' or (result === 'NEEDS_ATTENTION' && allowDispatch === false),
   * the truck is automatically grounded to 'UNDER_MAINTENANCE' while retaining the assigned driver.
   * Endpoint: POST /api/fleet/maintenance/inspections
   * @param {{ truckId: string, vehicleId?: string, result: 'PASSED' | 'NEEDS_ATTENTION' | 'FAILED', findings: string, allowDispatch?: boolean, issueDetected?: boolean, inspectionDate?: string }} payload
   * @returns {Promise<{ status: string, message: string, data: { inspection: object, truck: object } }>}
   */
  async createInspection(payload) {
    const targetVehicleId = payload.vehicleId || payload.truckId;
    if (!targetVehicleId) throw new Error("Vehicle ID is required");
    if (!payload.result) throw new Error("Inspection result is required");
    if (!payload.findings || !payload.findings.trim()) {
      throw new Error("Inspection findings cannot be empty");
    }

    const isFailed = payload.result === "FAILED";
    const allowDispatch = isFailed ? false : (payload.allowDispatch !== undefined ? payload.allowDispatch : true);
    const issueDetected =
      payload.issueDetected !== undefined
        ? payload.issueDetected
        : payload.result !== "PASSED";

    const result = await apiClient("/fleet/maintenance/inspections", {
      method: "POST",
      body: {
        vehicleId: targetVehicleId,
        truckId: targetVehicleId,
        findings: payload.findings.trim(),
        issueDetected,
        result: payload.result,
        allowDispatch,
      },
    });
    return result;
  },

  /**
   * View Vehicle Inspections History
   * Modernized endpoint: GET /api/fleet/maintenance/inspections/vehicle/:vehicleId
   * @param {string} truckId - Vehicle UUID
   * @param {{ page?: number, limit?: number, result?: string }} [params]
   * @returns {Promise<{ status: string, data: { truckId: string, vehicleId: string, plateNumber: string, count: number, total: number, page: number, limit: number, inspections: Array } }>}
   */
  async getTruckInspections(truckId, params = {}) {
    const vehicleId = truckId;
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.result && params.result !== "All") query.append("result", params.result);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    const result = await apiClient(
      `/fleet/maintenance/inspections/vehicle/${vehicleId}${queryString}`
    );
    return result;
  },

  /**
   * Get Safety Inspection Record by ID
   * Endpoint: GET /api/fleet/maintenance/inspections/:id
   * @param {string} id
   * @returns {Promise<{ status: string, data: { inspection: object } }>}
   */
  async getInspectionById(id) {
    const result = await apiClient(`/fleet/maintenance/inspections/${id}`);
    return result;
  },

  // =========================================================================
  // MID-ROUTE INCIDENT & BREAKDOWN REPORTING
  // =========================================================================

  /**
   * Get Incident Types Catalog
   * Endpoint: GET /api/fleet/maintenance/incidents/types
   * @returns {Promise<{ status: string, data: { count: number, types: Array<{ id: number, typeName: string, createdAt: string }> } }>}
   */
  async getIncidentTypes() {
    const result = await apiClient("/fleet/maintenance/incidents/types");
    return result;
  },

  /**
   * Report Vehicle Incident / Breakdown
   * If severity === 'CRITICAL', automatically grounds truck to 'UNDER_MAINTENANCE' while retaining driver.
   * Endpoint: POST /api/fleet/maintenance/incidents
   * @param {{ truckId: string, incidentTypeId: number, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', incidentLocation?: string, description: string, reportDate?: string }} payload
   * @returns {Promise<{ status: string, message: string, data: { incident: object, truck: object } }>}
   */
  async createIncident(payload) {
    if (!payload.truckId) throw new Error("Truck ID is required");
    if (!payload.incidentTypeId) throw new Error("Incident type is required");
    if (!payload.severity) throw new Error("Severity level is required");
    if (!payload.description || !payload.description.trim()) {
      throw new Error("Incident description cannot be empty");
    }

    const result = await apiClient("/fleet/maintenance/incidents", {
      method: "POST",
      body: payload,
    });
    return result;
  },

  /**
   * List Fleet Incidents with Filters & Pagination
   * Endpoint: GET /api/fleet/maintenance/incidents
   * @param {{ page?: number, limit?: number, truckId?: string, severity?: string, incidentTypeId?: number, startDate?: string, endDate?: string, search?: string }} [params]
   * @returns {Promise<{ status: string, data: { count: number, total: number, page: number, limit: number, incidents: Array } }>}
   */
  async getIncidents(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.truckId) query.append("truckId", params.truckId);
    if (params.severity && params.severity !== "All") query.append("severity", params.severity);
    if (params.incidentTypeId && params.incidentTypeId !== "All")
      query.append("incidentTypeId", params.incidentTypeId);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.search) query.append("search", params.search);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    const result = await apiClient(`/fleet/maintenance/incidents${queryString}`);
    return result;
  },

  /**
   * View Vehicle Incident History
   * Modernized endpoint: GET /api/fleet/maintenance/incidents/vehicle/:vehicleId
   * @param {string} truckId - Vehicle UUID
   * @param {{ page?: number, limit?: number }} [params]
   * @returns {Promise<{ status: string, data: { truckId: string, vehicleId: string, plateNumber: string, count: number, total: number, page: number, limit: number, incidents: Array } }>}
   */
  async getTruckIncidents(truckId, params = {}) {
    const vehicleId = truckId;
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    const result = await apiClient(
      `/fleet/maintenance/incidents/vehicle/${vehicleId}${queryString}`
    );
    return result;
  },

  /**
   * Get Incident Report by ID
   * Endpoint: GET /api/fleet/maintenance/incidents/:id
   * @param {string} id
   * @returns {Promise<{ status: string, data: { incident: object } }>}
   */
  async getIncidentById(id) {
    const result = await apiClient(`/fleet/maintenance/incidents/${id}`);
    return result;
  },

  // =========================================================================
  // WORK ORDERS, COST APPROVALS & FINALIZATION (docs/api-contracts/fleet/maintenance.api.md)
  // =========================================================================

  /**
   * List Maintenance Types Catalog
   * Endpoint: GET /api/fleet/maintenance/work-orders/types
   * @returns {Promise<{ status: string, data: { count: number, types: Array<{ id: number, typeName: string, description: string }> } }>}
   */
  async getMaintenanceTypes() {
    const result = await apiClient("/fleet/maintenance/work-orders/types");
    return result;
  },

  /**
   * Create Maintenance Work Order
   * If estimatedCost >= 5000.00, work order initiates in 'PENDING' status requiring executive approval.
   * Otherwise initiates in 'APPROVED'. Vehicle is automatically grounded to 'UNDER_MAINTENANCE' with driver retained.
   * Endpoint: POST /api/fleet/maintenance/work-orders
   * @param {{ truckId: string, maintenanceTypeId: number, inspectionId?: string, incidentReportId?: string, shopName?: string, estimatedCost?: number, description: string, scheduledDate?: string, requiresApproval?: boolean }} payload
   * @returns {Promise<{ status: string, message: string, data: { workOrder: object, requiresApproval: boolean, approvalRequest: object|null, truck: object } }>}
   */
  async createWorkOrder(payload) {
    if (!payload.truckId) throw new Error("Target vehicle is required");
    if (!payload.maintenanceTypeId) throw new Error("Maintenance type is required");
    if (!payload.description || !payload.description.trim()) {
      throw new Error("Work order scope/description cannot be empty");
    }

    const result = await apiClient("/fleet/maintenance/work-orders", {
      method: "POST",
      body: payload,
    });
    return result;
  },

  /**
   * List Fleet Work Orders with Filters & Pagination
   * Endpoint: GET /api/fleet/maintenance/work-orders
   * @param {{ page?: number, limit?: number, truckId?: string, status?: string, maintenanceTypeId?: number, startDate?: string, endDate?: string, search?: string }} [params]
   * @returns {Promise<{ status: string, data: { count: number, total: number, page: number, limit: number, workOrders: Array } }>}
   */
  async getWorkOrders(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.truckId) query.append("truckId", params.truckId);
    if (params.status && params.status !== "All") query.append("status", params.status);
    if (params.maintenanceTypeId && params.maintenanceTypeId !== "All")
      query.append("maintenanceTypeId", params.maintenanceTypeId);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.search) query.append("search", params.search);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    const result = await apiClient(`/fleet/maintenance/work-orders${queryString}`);
    return result;
  },

  /**
   * Get Work Order Details by ID
   * Endpoint: GET /api/fleet/maintenance/work-orders/:id
   * @param {string} id
   * @returns {Promise<{ status: string, data: { workOrder: object } }>}
   */
  async getWorkOrderById(id) {
    const result = await apiClient(`/fleet/maintenance/work-orders/${id}`);
    return result;
  },

  /**
   * Advance Work Order Status
   * Permitted transitions: SCHEDULED, IN_PROGRESS, CANCELLED.
   * Invariant: COMPLETED is strictly prohibited here (must use /finalize).
   * Endpoint: PATCH /api/fleet/maintenance/work-orders/:id/status
   * @param {string} id
   * @param {{ status: 'SCHEDULED' | 'IN_PROGRESS' | 'CANCELLED' }} payload
   * @returns {Promise<{ status: string, message: string, data: { workOrder: object } }>}
   */
  async updateWorkOrderStatus(id, { status }) {
    if (status === "COMPLETED") {
      throw new Error(
        "Work order can only be completed by finalizing the maintenance log via /api/fleet/maintenance/work-orders/:id/finalize"
      );
    }

    const result = await apiClient(`/fleet/maintenance/work-orders/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    return result;
  },

  /**
   * Executive Cost Approval Decision
   * Approves or rejects high-cost repair work orders exceeding ₱5,000.00.
   * Endpoint: POST /api/fleet/maintenance/work-orders/:id/approve
   * @param {string} id
   * @param {{ isApproved: boolean, remarks?: string }} payload
   * @returns {Promise<{ status: string, message: string, data: { workOrder: object, approvalRequest: object } }>}
   */
  async decideWorkOrderApproval(id, { isApproved, remarks }) {
    const result = await apiClient(`/fleet/maintenance/work-orders/${id}/approve`, {
      method: "POST",
      body: { isApproved, remarks },
    });
    return result;
  },

  /**
   * Submit Cost Approval Request (1:N Multi-Approval)
   * Submits a cost approval request for a work order (initial or revised quotation).
   * Transitions the work order status back to 'PENDING'.
   * Endpoint: POST /api/fleet/maintenance/work-orders/:id/approval-requests
   * @param {string} id - Work order UUID
   * @param {{ amountRequested?: number, remarks?: string }} payload
   * @returns {Promise<{ status: string, message: string, data: { workOrder: object, approvalRequest: object } }>}
   */
  async submitWorkOrderApprovalRequest(id, { amountRequested, remarks } = {}) {
    const result = await apiClient(`/fleet/maintenance/work-orders/${id}/approval-requests`, {
      method: "POST",
      body: { amountRequested, remarks },
    });
    return result;
  },

  /**
   * Get Work Order Approval Requests
   * Retrieves historical approval requests associated with a work order.
   * Endpoint: GET /api/fleet/maintenance/work-orders/:id/approval-requests
   * @param {string} id - Work order UUID
   * @returns {Promise<{ status: string, data: { count: number, approvalRequests: Array } }>}
   */
  async getWorkOrderApprovalRequests(id) {
    const result = await apiClient(`/fleet/maintenance/work-orders/${id}/approval-requests`);
    return result;
  },

  /**
   * Attach Receipt to Work Order
   * Endpoint: POST /api/fleet/maintenance/work-orders/:id/receipts
   * @param {string} id - Work order UUID
   * @param {{ fileUrl: string } | string} payload - Object with fileUrl or string URL
   * @returns {Promise<{ status: string, message: string, data: { receipt: object } }>}
   */
  async attachWorkOrderReceipt(id, payload) {
    const fileUrl = typeof payload === "string" ? payload : (payload?.fileUrl || payload?.storageKey || payload?.url);
    if (!fileUrl) throw new Error("Receipt fileUrl is required");

    const result = await apiClient(`/fleet/maintenance/work-orders/${id}/receipts`, {
      method: "POST",
      body: { fileUrl },
    });
    return result;
  },

  /**
   * List Work Order Receipts
   * Endpoint: GET /api/fleet/maintenance/work-orders/:id/receipts
   * @param {string} id - Work order UUID
   * @returns {Promise<{ status: string, data: Array }>}
   */
  async getWorkOrderReceipts(id) {
    const result = await apiClient(`/fleet/maintenance/work-orders/${id}/receipts`);
    return result;
  },

  /**
   * Delete Work Order Receipt Attachment
   * Endpoint: DELETE /api/fleet/maintenance/receipts/:receiptId
   * @param {string} receiptId
   * @returns {Promise<{ status: string, message: string }>}
   */
  async deleteWorkOrderReceipt(receiptId) {
    const result = await apiClient(`/fleet/maintenance/receipts/${receiptId}`, {
      method: "DELETE",
    });
    return result;
  },

  /**
   * Finalize Maintenance Log & Release Vehicle
   * Marks work order COMPLETED, resets 5,000-km PM baseline if PREVENTIVE,
   * restores vehicle availability to ACTIVE, and retains soft-bound driver.
   * Endpoint: POST /api/fleet/maintenance/work-orders/:id/finalize
   * @param {string} id - Work order UUID
   * @param {{ severity: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL', dateStarted: string, dateResolved: string, partsCost?: number, laborCost?: number, downtimeDays?: number, odometerAtService: number, receiptUrls?: string[] }} payload
   * @returns {Promise<{ status: string, message: string, data: { maintenanceLog: object, workOrder: object, truck: object } }>}
   */
  async finalizeWorkOrder(id, payload) {
    if (!payload.dateStarted) throw new Error("Repair start date is required");
    if (!payload.dateResolved) throw new Error("Repair completion date is required");
    if (payload.odometerAtService === undefined || payload.odometerAtService === null) {
      throw new Error("Odometer reading at service is required");
    }

    // Pass receiptUrls as a plain array of strings
    const receiptUrls = Array.isArray(payload.receiptUrls)
      ? payload.receiptUrls
          .map((r) => (typeof r === "string" ? r : r?.fileUrl || r?.storageKey || r?.url))
          .filter(Boolean)
      : [];

    const requestPayload = {
      severity: payload.severity || "MEDIUM",
      dateStarted: payload.dateStarted,
      dateResolved: payload.dateResolved,
      partsCost: Number(payload.partsCost) || 0,
      laborCost: Number(payload.laborCost) || 0,
      downtimeDays: Number(payload.downtimeDays) || 1,
      odometerAtService: Number(payload.odometerAtService),
      receiptUrls,
    };

    const result = await apiClient(`/fleet/maintenance/work-orders/${id}/finalize`, {
      method: "POST",
      body: requestPayload,
    });
    return result;
  },

  /**
   * Query Historical Maintenance Logs
   * Endpoint: GET /api/fleet/maintenance/logs
   * @param {{ page?: number, limit?: number, truckId?: string, maintenanceTypeId?: number, startDate?: string, endDate?: string, search?: string }} [params]
   * @returns {Promise<{ status: string, data: { count: number, total: number, page: number, limit: number, logs: Array } }>}
   */
  async getMaintenanceLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.truckId) query.append("truckId", params.truckId);
    if (params.maintenanceTypeId && params.maintenanceTypeId !== "All")
      query.append("maintenanceTypeId", params.maintenanceTypeId);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.search) query.append("search", params.search);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    const result = await apiClient(`/fleet/maintenance/logs${queryString}`);
    return result;
  },

  /**
   * Get Recurring Issues Fleet Analytics
   * Endpoint: GET /api/fleet/maintenance/analytics/recurring-issues
   * @param {{ truckId?: string, days?: number, minOccurrences?: number }} [params]
   * @returns {Promise<{ status: string, data: { filter: object, count: number, recurringIssues: Array } }>}
   */
  async getRecurringIssuesAnalytics(params = {}) {
    const query = new URLSearchParams();
    if (params.truckId) query.append("truckId", params.truckId);
    if (params.days) query.append("days", params.days);
    if (params.minOccurrences) query.append("minOccurrences", params.minOccurrences);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    const result = await apiClient(
      `/fleet/maintenance/analytics/recurring-issues${queryString}`
    );
    return result;
  },
};

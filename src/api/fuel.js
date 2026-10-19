// src/api/fuel.js
import { apiClient } from "./client.js";

/**
 * Fuel API Service
 * Handles vehicle fuel logging, fleet analysis, and summary telemetry.
 * Base Path: /api/operations/fuel
 */
export const fuelApi = {
  /**
   * Fleet-wide Fuel Analysis
   * Retrieves totals, average km/L, cost/km, and individual vehicle breakdowns.
   * Endpoint: GET /api/operations/fuel/analysis
   *
   * @param {Object} [params]
   * @param {string} [params.period] - 'today'|'yesterday'|'this_week'|'last_week'|'this_month'|'last_month'|'last_30_days'|'last_90_days'|'this_year'|'all_time'|'custom'
   * @param {string} [params.startDate] - ISO or YYYY-MM-DD
   * @param {string} [params.endDate] - ISO or YYYY-MM-DD
   * @param {string} [params.vehicleId] - Filter to specific vehicle asset UUID
   * @param {string} [params.fuelType] - 'DIESEL'|'GASOLINE'
   * @param {string} [params.sortBy] - 'fuelUsedLiters'|'fuelCost'|'distanceTraveledKm'|'kmPerLiter'
   * @param {string} [params.order] - 'DESC'|'ASC'
   * @returns {Promise<Object>} { period, fleetTotals, fuelTypesBreakdown, topEfficientVehicles, leastEfficientVehicles, vehicles }
   */
  async getFleetFuelAnalysis(params = {}) {
    const query = new URLSearchParams();
    if (params.period) query.append("period", params.period);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.vehicleId) query.append("vehicleId", params.vehicleId);
    if (params.fuelType && params.fuelType !== "ALL") query.append("fuelType", params.fuelType);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.order) query.append("order", params.order);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient(`/operations/fuel/analysis${qs}`);
    return res?.data || null;
  },

  /**
   * Single Vehicle Detailed Fuel Analysis
   * Endpoint: GET /api/operations/fuel/analysis/:vehicleId
   *
   * @param {string} vehicleId - Target vehicle UUID
   * @param {Object} [params] - { period, startDate, endDate, fuelType }
   * @returns {Promise<Object>} Single vehicle telemetry & breakdown
   */
  async getSingleVehicleFuelAnalysis(vehicleId, params = {}) {
    if (!vehicleId) throw new Error("Vehicle ID is required");
    const query = new URLSearchParams();
    if (params.period) query.append("period", params.period);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.fuelType && params.fuelType !== "ALL") query.append("fuelType", params.fuelType);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient(`/operations/fuel/analysis/${encodeURIComponent(vehicleId)}${qs}`);
    return res?.data || null;
  },

  /**
   * Paginated or Filtered Fuel Intake Logs
   * Endpoint: GET /api/operations/fuel
   *
   * @param {Object} [params] - { vehicleId, driverId, tripId, fuelType, startDate, endDate, search, page, limit }
   * @returns {Promise<{ logs: Array, summary: Object, count: number }>}
   */
  async getFuelLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.vehicleId) query.append("vehicleId", params.vehicleId);
    if (params.driverId) query.append("driverId", params.driverId);
    if (params.tripId) query.append("tripId", params.tripId);
    if (params.fuelType && params.fuelType !== "ALL") query.append("fuelType", params.fuelType);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.search) query.append("search", params.search);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient(`/operations/fuel${qs}`);

    if (Array.isArray(res?.data?.logs)) {
      return {
        logs: res.data.logs,
        summary: res.data.summary || null,
        count: res.data.count || res.data.logs.length,
        meta: res.meta || null,
      };
    }
    if (Array.isArray(res?.data)) {
      return { logs: res.data, summary: null, count: res.data.length, meta: res.meta || null };
    }
    return { logs: [], summary: null, count: 0, meta: null };
  },

  /**
   * Summary Fuel Statistics
   * Endpoint: GET /api/operations/fuel/summary
   *
   * @param {Object} [params]
   * @returns {Promise<Object>}
   */
  async getFuelSummary(params = {}) {
    const query = new URLSearchParams();
    if (params.vehicleId) query.append("vehicleId", params.vehicleId);
    if (params.fuelType) query.append("fuelType", params.fuelType);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient(`/operations/fuel/summary${qs}`);
    return res?.data?.summary || res?.data || null;
  },

  /**
   * Records a vehicle fuel entry.
   * Endpoint: POST /api/operations/fuel
   *
   * @param {Object} payload - { vehicleId, litersPumped, totalCost, pricePerLiter, fuelStation, fuelType, odometerReading, receiptMediaKey, notes }
   * @returns {Promise<Object>}
   */
  async recordFuelEntry(payload = {}) {
    const res = await apiClient(`/operations/fuel`, {
      method: "POST",
      body: payload,
    });
    return res?.data || null;
  },
};

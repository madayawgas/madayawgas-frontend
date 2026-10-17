// src/api/schedules.js
import { apiClient } from "./client.js";
import { toPhilippineDateInputString } from "../utils/date.js";

export function normalizeZone(z) {
  if (!z) return null;
  return {
    ...z,
    id: z.id,
    code: (z.code || "").toUpperCase(),
    name: z.name || "",
    description: z.description || "",
    isActive: z.isActive !== false && z.is_active !== false,
    createdAt: z.createdAt || z.created_at,
    updatedAt: z.updatedAt || z.updated_at,
  };
}

export function normalizeTemplate(t) {
  if (!t) return null;
  const rawDay = t.dayOfWeek !== undefined ? t.dayOfWeek : t.day_of_week;
  const dayNum = Number(rawDay);
  const salesName =
    t.salesName ||
    (t.sales_first_name
      ? `${t.sales_first_name} ${t.sales_last_name}`.trim()
      : t.sales_username || "Unassigned");

  return {
    ...t,
    id: t.id,
    truckId: t.truckId || t.truck_id,
    truckPlate: t.truckPlate || t.truck_plate_number || t.plate_number || "No Plate",
    truckModel: t.truckModel || t.truck_model || "Delivery Vehicle",
    zoneId: t.zoneId || t.zone_id,
    zoneCode: t.zoneCode || t.zone_code || "",
    zoneName: t.zoneName || t.zone_name || "",
    dayOfWeek: isNaN(dayNum) ? 1 : dayNum,
    defaultSalesUserId: t.defaultSalesUserId || t.default_sales_user_id || null,
    salesName,
    isActive: t.isActive !== false && t.is_active !== false,
    createdAt: t.createdAt || t.created_at,
    updatedAt: t.updatedAt || t.updated_at,
  };
}

export function normalizeSchedule(s) {
  if (!s) return null;
  const rawDate = s.scheduledDate || s.scheduled_date;
  const normalizedDate = rawDate ? toPhilippineDateInputString(rawDate) : null;
  const salesName =
    s.salesName ||
    (s.sales_first_name
      ? `${s.sales_first_name} ${s.sales_last_name}`.trim()
      : s.sales_username || "Unassigned");
  const driverName =
    s.driverName ||
    (s.driver_first_name
      ? `${s.driver_first_name} ${s.driver_last_name}`.trim()
      : "Unassigned");

  return {
    ...s,
    id: s.id,
    scheduledDate: normalizedDate,
    truckId: s.truckId || s.truck_id,
    truckPlate: s.truckPlate || s.truck_plate_number || "No Plate",
    truckModel: s.truckModel || s.truck_model || "Delivery Vehicle",
    truckStatus: s.truckStatus || s.truck_status || "ACTIVE",
    truckDriverId: s.truckDriverId || s.truck_driver_id,
    driverName,
    salesUserId: s.salesUserId || s.sales_user_id,
    salesName,
    zoneId: s.zoneId || s.zone_id,
    zoneCode: s.zoneCode || s.zone_code || "",
    zoneName: s.zoneName || s.zone_name || "",
    status: s.status,
    notes: s.notes,
    tripId: s.tripId || s.trip_id,
    tripNumber: s.tripNumber || s.trip_number,
    tripStatus: s.tripStatus || s.trip_status,
  };
}

export const schedulesApi = {
  // ==========================================
  // 1. Service Zones
  // ==========================================

  async getZones(params = {}) {
    const query = new URLSearchParams();
    if (params.isActive !== undefined) query.append("isActive", params.isActive);
    if (params.search) query.append("search", params.search);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient(`/schedules/zones${qs}`);
    const rawList = res?.data?.zones || res?.data || [];
    if (Array.isArray(rawList)) {
      return rawList.map(normalizeZone);
    }
    return [];
  },

  async createZone(payload) {
    const res = await apiClient(`/schedules/zones`, {
      method: "POST",
      body: payload,
    });
    return res.data;
  },

  async updateZone(id, payload) {
    const res = await apiClient(`/schedules/zones/${id}`, {
      method: "PATCH",
      body: payload,
    });
    return res.data;
  },

  // ==========================================
  // 2. Weekly Master Route Templates
  // ==========================================

  async getTemplates(params = {}) {
    const query = new URLSearchParams();
    if (params.truckId) query.append("truckId", params.truckId);
    if (params.zoneId) query.append("zoneId", params.zoneId);
    if (params.dayOfWeek) query.append("dayOfWeek", params.dayOfWeek);
    if (params.isActive !== undefined) query.append("isActive", params.isActive);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient(`/schedules/templates${qs}`);
    const rawList = res?.data?.templates || res?.data || [];
    if (Array.isArray(rawList)) {
      return rawList.map(normalizeTemplate);
    }
    return [];
  },

  async createTemplate(payload) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let salesUserId = payload.defaultSalesUserId;
    if (typeof salesUserId === "string") {
      salesUserId = salesUserId.trim();
      if (!uuidRegex.test(salesUserId)) {
        salesUserId = null;
      }
    } else {
      salesUserId = null;
    }

    const cleanPayload = {
      truckId: payload.truckId,
      zoneId: payload.zoneId,
      dayOfWeek: Number(payload.dayOfWeek),
      defaultSalesUserId: salesUserId,
      isActive: payload.isActive !== false,
    };

    const res = await apiClient(`/schedules/templates`, {
      method: "POST",
      body: cleanPayload,
    });
    return res.data;
  },

  async updateTemplate(id, payload) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cleanPayload = {};
    if (payload.truckId !== undefined) cleanPayload.truckId = payload.truckId;
    if (payload.zoneId !== undefined) cleanPayload.zoneId = payload.zoneId;
    if (payload.dayOfWeek !== undefined) cleanPayload.dayOfWeek = Number(payload.dayOfWeek);
    if (payload.isActive !== undefined) cleanPayload.isActive = Boolean(payload.isActive);
    if ("defaultSalesUserId" in payload) {
      let salesUserId = payload.defaultSalesUserId;
      if (typeof salesUserId === "string") {
        salesUserId = salesUserId.trim();
        cleanPayload.defaultSalesUserId = uuidRegex.test(salesUserId) ? salesUserId : null;
      } else {
        cleanPayload.defaultSalesUserId = null;
      }
    }

    const res = await apiClient(`/schedules/templates/${id}`, {
      method: "PATCH",
      body: cleanPayload,
    });
    return res.data;
  },

  async deleteTemplate(id) {
    const res = await apiClient(`/schedules/templates/${id}`, {
      method: "DELETE",
    });
    return res.data;
  },

  // ==========================================
  // 3. Operational Daily Truck Schedules
  // ==========================================

  /**
   * Fetches active sales representatives eligible for route planning & scheduling.
   * @param {object} [params] - { search }
   * @returns {Promise<Array>} List of sales user objects
   */
  async getSalesPersons(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    const qs = query.toString() ? `?${query.toString()}` : "";

    const res = await apiClient(`/schedules/sales-persons${qs}`);
    const rawList = res?.data?.salesPersons || res?.data || [];
    return Array.isArray(rawList) ? rawList : [];
  },

  async getSchedules(params = {}) {
    const query = new URLSearchParams();
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.date) query.append("date", params.date);
    if (params.truckId) query.append("truckId", params.truckId);
    if (params.zoneId) query.append("zoneId", params.zoneId);
    if (params.status) query.append("status", params.status);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient(`/schedules${qs}`);
    const rawList =
      res?.data?.schedules ||
      res?.data?.items ||
      (Array.isArray(res?.data) ? res.data : []);
    if (Array.isArray(rawList)) {
      return rawList.map(normalizeSchedule);
    }
    return [];
  },

  async createSchedule(payload) {
    const cleanPayload = {
      scheduledDate: payload.scheduledDate,
      truckId: payload.truckId,
      salesUserId: payload.salesUserId,
      zoneId: payload.zoneId,
      notes: payload.notes || null,
    };

    const res = await apiClient(`/schedules`, {
      method: "POST",
      body: cleanPayload,
    });
    return res.data;
  },

  async generateSchedules(payload) {
    const res = await apiClient(`/schedules/generate`, {
      method: "POST",
      body: payload,
    });
    return res.data;
  },

  async cancelSchedule(id, payload = {}) {
    const res = await apiClient(`/schedules/${id}/cancel`, {
      method: "PATCH",
      body: payload,
    });
    return res.data;
  },
};

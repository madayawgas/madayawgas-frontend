// src/api/schedules.js
import { apiClient, isMock, delay } from "./client.js";
import mockZones from "../mocks/zones.json" with { type: "json" };
import mockTemplates from "../mocks/templates.json" with { type: "json" };
import mockSchedules from "../mocks/schedules.json" with { type: "json" };
import mockUsers from "../mocks/users.json" with { type: "json" };
import {
  toPhilippineDateInputString,
  getPhilippineDayOfWeek,
  addPhilippineDays,
} from "../utils/date.js";

const ZONES_CACHE_KEY = "app_zones_cache";
const TEMPLATES_CACHE_KEY = "app_templates_cache";
const SCHEDULES_CACHE_KEY = "app_schedules_cache";

function getInMemoryZones() {
  try {
    const cached = localStorage.getItem(ZONES_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore cache error and fall back to mock
  }
  return isMock && Array.isArray(mockZones) ? [...mockZones] : [];
}

function saveInMemoryZones(zones) {
  try {
    localStorage.setItem(ZONES_CACHE_KEY, JSON.stringify(zones));
  } catch {
    // Ignore storage write error
  }
}

function getInMemoryTemplates() {
  try {
    const cached = localStorage.getItem(TEMPLATES_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore cache error and fall back to mock
  }
  return isMock && Array.isArray(mockTemplates) ? [...mockTemplates] : [];
}

function saveInMemoryTemplates(templates) {
  try {
    localStorage.setItem(TEMPLATES_CACHE_KEY, JSON.stringify(templates));
  } catch {
    // Ignore storage write error
  }
}

function getInMemorySchedules() {
  try {
    const cached = localStorage.getItem(SCHEDULES_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore cache error and fall back to mock
  }
  return isMock && Array.isArray(mockSchedules) ? [...mockSchedules] : [];
}

function saveInMemorySchedules(schedules) {
  try {
    localStorage.setItem(SCHEDULES_CACHE_KEY, JSON.stringify(schedules));
  } catch {
    // Ignore storage write error
  }
}

export function normalizeZone(z) {
  if (!z) return null;
  return {
    ...z,
    id: z.id,
    code: z.code,
    name: z.name,
    description: z.description,
    isActive: z.isActive !== undefined ? z.isActive : (z.is_active !== undefined ? z.is_active : true),
  };
}

export function normalizeTemplate(t) {
  if (!t) return null;
  const salesName =
    t.salesName ||
    (t.default_sales_first_name
      ? `${t.default_sales_first_name} ${t.default_sales_last_name}`.trim()
      : null);
  return {
    ...t,
    id: t.id,
    truckId: t.truckId || t.truck_id,
    zoneId: t.zoneId || t.zone_id,
    dayOfWeek: Number(t.dayOfWeek ?? t.day_of_week),
    defaultSalesUserId: t.defaultSalesUserId || t.default_sales_user_id || null,
    isActive: t.isActive !== undefined ? t.isActive : (t.is_active !== undefined ? t.is_active : true),
    truckPlate: t.truckPlate || t.truck_plate_number || "No Plate",
    truckModel: t.truckModel || t.truck_model || "Delivery Vehicle",
    zoneCode: t.zoneCode || t.zone_code || "",
    zoneName: t.zoneName || t.zone_name || "",
    salesName,
  };
}

export function normalizeSchedule(s) {
  if (!s) return null;
  const rawDate = s.scheduledDate || s.scheduled_date;
  const normalizedDate = toPhilippineDateInputString(rawDate) || rawDate;
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
    if (isMock) {
      await delay(100);
      let list = getInMemoryZones();
      if (params.isActive !== undefined) {
        const activeBool = params.isActive === true || params.isActive === "true";
        list = list.filter((z) => z.isActive === activeBool);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (z) =>
            (z.code || "").toLowerCase().includes(q) ||
            (z.name || "").toLowerCase().includes(q)
        );
      }
      return list;
    }

    const query = new URLSearchParams();
    if (params.isActive !== undefined) query.append("isActive", params.isActive);
    if (params.search) query.append("search", params.search);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient(`/schedules/zones${qs}`);
    const rawList = res?.data?.zones || res?.data || [];
    if (Array.isArray(rawList)) {
      const normalized = rawList.map(normalizeZone);
      saveInMemoryZones(normalized);
      return normalized;
    }
    return [];
  },

  async createZone(payload) {
    if (isMock) {
      await delay(150);
      const list = getInMemoryZones();
      const newZone = {
        id: `zone-${Date.now()}`,
        code: (payload.code || "").toUpperCase().trim(),
        name: payload.name?.trim(),
        description: payload.description?.trim() || null,
        isActive: payload.isActive !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      list.unshift(newZone);
      saveInMemoryZones(list);
      return { zone: newZone, message: "Service zone created successfully" };
    }

    try {
      const res = await apiClient(`/schedules/zones`, {
        method: "POST",
        body: payload,
      });
      const data = res?.data;
      const zone = normalizeZone(data?.zone || data);
      if (zone) {
        const list = getInMemoryZones();
        list.unshift(zone);
        saveInMemoryZones(list);
      }
      return res.data;
    } catch (e) {
      console.warn("apiClient /schedules/zones create failed:", e?.message);
      throw e;
    }
  },

  async updateZone(id, payload) {
    if (isMock) {
      await delay(150);
      const list = getInMemoryZones();
      const idx = list.findIndex((z) => z.id === id);
      if (idx === -1) throw new Error("Service zone not found");
      const updated = {
        ...list[idx],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      list[idx] = updated;
      saveInMemoryZones(list);
      return { zone: updated, message: "Service zone updated successfully" };
    }

    try {
      const res = await apiClient(`/schedules/zones/${id}`, {
        method: "PATCH",
        body: payload,
      });
      const data = res?.data;
      const zone = normalizeZone(data?.zone || data);
      if (zone) {
        const list = getInMemoryZones();
        const idx = list.findIndex((z) => z.id === id);
        if (idx !== -1) {
          list[idx] = zone;
          saveInMemoryZones(list);
        }
      }
      return res.data;
    } catch (e) {
      console.warn(`apiClient /schedules/zones/${id} update failed:`, e?.message);
      throw e;
    }
  },

  // ==========================================
  // 2. Weekly Master Route Templates
  // ==========================================

  async getTemplates(params = {}) {
    if (isMock) {
      await delay(100);
      let list = getInMemoryTemplates();
      if (params.truckId) list = list.filter((t) => t.truckId === params.truckId);
      if (params.zoneId) list = list.filter((t) => t.zoneId === params.zoneId);
      if (params.dayOfWeek) list = list.filter((t) => Number(t.dayOfWeek) === Number(params.dayOfWeek));
      if (params.isActive !== undefined) {
        const activeBool = params.isActive === true || params.isActive === "true";
        list = list.filter((t) => t.isActive === activeBool);
      }
      return list.map(normalizeTemplate);
    }

    const query = new URLSearchParams();
    if (params.truckId) query.append("truckId", params.truckId);
    if (params.zoneId) query.append("zoneId", params.zoneId);
    if (params.dayOfWeek) query.append("dayOfWeek", params.dayOfWeek);
    if (params.isActive !== undefined) query.append("isActive", params.isActive);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient(`/schedules/templates${qs}`);
    const rawList = res?.data?.templates || res?.data || [];
    if (Array.isArray(rawList)) {
      const normalized = rawList.map(normalizeTemplate);
      saveInMemoryTemplates(normalized);
      return normalized;
    }
    return [];
  },

  async createTemplate(payload) {
    if (isMock) {
      await delay(150);
      const list = getInMemoryTemplates();

      // Check if a template already exists for this vehicle & day of week (1:1 constraint)
      const existingIdx = list.findIndex(
        (t) => t.truckId === payload.truckId && Number(t.dayOfWeek) === Number(payload.dayOfWeek)
      );

      if (existingIdx !== -1) {
        const updated = {
          ...list[existingIdx],
          ...payload,
          dayOfWeek: Number(payload.dayOfWeek),
          updatedAt: new Date().toISOString(),
        };
        list[existingIdx] = updated;
        saveInMemoryTemplates(list);
        return { template: normalizeTemplate(updated), message: "Weekly template updated successfully" };
      }

      const newTemplate = {
        id: `tpl-${Date.now()}`,
        truckId: payload.truckId,
        zoneId: payload.zoneId,
        dayOfWeek: Number(payload.dayOfWeek),
        defaultSalesUserId: payload.defaultSalesUserId || null,
        isActive: payload.isActive !== false,
        truckPlate: payload.truckPlate,
        truckModel: payload.truckModel,
        zoneCode: payload.zoneCode,
        zoneName: payload.zoneName,
        salesName: payload.salesName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      list.push(newTemplate);
      saveInMemoryTemplates(list);
      return { template: normalizeTemplate(newTemplate), message: "Weekly template created successfully" };
    }

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

    try {
      const res = await apiClient(`/schedules/templates`, {
        method: "POST",
        body: cleanPayload,
      });
      const data = res?.data;
      const tpl = normalizeTemplate(data?.template || data);
      if (tpl) {
        const list = getInMemoryTemplates();
        const existingIdx = list.findIndex(
          (t) => t.truckId === tpl.truckId && Number(t.dayOfWeek) === Number(tpl.dayOfWeek)
        );
        if (existingIdx !== -1) {
          list[existingIdx] = tpl;
        } else {
          list.push(tpl);
        }
        saveInMemoryTemplates(list);
      }
      return res.data;
    } catch (e) {
      console.warn("apiClient /schedules/templates create failed:", e?.message);
      throw e;
    }
  },

  async updateTemplate(id, payload) {
    if (isMock) {
      await delay(150);
      const list = getInMemoryTemplates();
      const idx = list.findIndex((t) => t.id === id);
      if (idx === -1) throw new Error("Template not found");
      const updated = {
        ...list[idx],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      list[idx] = updated;
      saveInMemoryTemplates(list);
      return { template: normalizeTemplate(updated), message: "Weekly template updated successfully" };
    }

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

    try {
      const res = await apiClient(`/schedules/templates/${id}`, {
        method: "PATCH",
        body: cleanPayload,
      });
      const data = res?.data;
      const tpl = normalizeTemplate(data?.template || data);
      if (tpl) {
        const list = getInMemoryTemplates();
        const idx = list.findIndex((t) => t.id === id);
        if (idx !== -1) {
          list[idx] = tpl;
          saveInMemoryTemplates(list);
        }
      }
      return res.data;
    } catch (e) {
      console.warn(`apiClient /schedules/templates/${id} update failed:`, e?.message);
      throw e;
    }
  },

  async deleteTemplate(id) {
    if (isMock) {
      await delay(100);
      let list = getInMemoryTemplates();
      list = list.filter((t) => t.id !== id);
      saveInMemoryTemplates(list);
      return { message: "Weekly template deleted successfully" };
    }

    try {
      const res = await apiClient(`/schedules/templates/${id}`, {
        method: "DELETE",
      });
      const list = getInMemoryTemplates().filter((t) => t.id !== id);
      saveInMemoryTemplates(list);
      return res.data;
    } catch (e) {
      console.warn(`apiClient /schedules/templates/${id} delete failed:`, e?.message);
      throw e;
    }
  },

  // ==========================================
  // 3. Operational Daily Truck Schedules
  // ==========================================

  /**
   * Fetches active sales representatives eligible for route planning & scheduling.
   * Accessible to route managers without requiring administrative users.view.
   * @param {object} [params] - { search }
   * @returns {Promise<Array>} List of sales user objects
   */
  async getSalesPersons(params = {}) {
    if (isMock) {
      await delay(150);
      let list = [];
      try {
        const cached = localStorage.getItem("app_users_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
        }
      } catch {
        // ignore
      }
      if (list.length === 0) {
        list = mockUsers?.data?.users || [];
      }
      return list
        .filter((u) => {
          const role = (u.role || u.roleNames?.join(" ") || "").toLowerCase();
          return role.includes("sales") && u.isActive !== false && !u.isBlocked;
        })
        .map((u) => ({
          id: u.id,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          fullName: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username,
          phone: u.phone,
          roleName: u.role || "Sales Person",
        }));
    }

    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    const qs = query.toString() ? `?${query.toString()}` : "";

    const res = await apiClient(`/schedules/sales-persons${qs}`);
    const rawList = res?.data?.salesPersons || res?.data || [];
    return Array.isArray(rawList) ? rawList : [];
  },

  async getSchedules(params = {}) {
    if (isMock) {
      await delay(100);
      let list = getInMemorySchedules();
      if (params.status) {
        list = list.filter((s) => (s.status || "").toUpperCase() === params.status.toUpperCase());
      }
      if (params.date) {
        list = list.filter((s) => s.scheduledDate === params.date);
      }
      if (params.truckId) {
        list = list.filter((s) => s.truckId === params.truckId);
      }
      if (params.zoneId) {
        list = list.filter((s) => s.zoneId === params.zoneId);
      }
      return list.map(normalizeSchedule);
    }

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
      const normalized = rawList.map(normalizeSchedule);
      // Only overwrite the entire cache if no filtering params were applied;
      // otherwise merge to prevent erasing other dates
      if (Object.keys(params).length === 0) {
        saveInMemorySchedules(normalized);
      } else {
        const cached = getInMemorySchedules();
        const map = new Map(cached.map((s) => [s.id, s]));
        normalized.forEach((s) => map.set(s.id, s));
        saveInMemorySchedules(Array.from(map.values()));
      }
      return normalized;
    }
    return [];
  },

  async createSchedule(payload) {
    if (isMock) {
      await delay(150);
      const list = getInMemorySchedules();
      const newSchedule = {
        id: `sch-${Date.now()}`,
        scheduledDate: payload.scheduledDate,
        truckId: payload.truckId,
        salesUserId: payload.salesUserId,
        zoneId: payload.zoneId,
        notes: payload.notes || null,
        status: "SCHEDULED",
        createdAt: new Date().toISOString(),
        truckPlate: payload.truckPlate,
        truckModel: payload.truckModel,
        salesName: payload.salesName,
        zoneCode: payload.zoneCode,
        zoneName: payload.zoneName,
      };
      list.unshift(newSchedule);
      saveInMemorySchedules(list);
      return { schedule: normalizeSchedule(newSchedule), message: "Operational schedule created successfully" };
    }

    const cleanPayload = {
      scheduledDate: payload.scheduledDate,
      truckId: payload.truckId,
      salesUserId: payload.salesUserId,
      zoneId: payload.zoneId,
      notes: payload.notes || null,
    };

    try {
      const res = await apiClient(`/schedules`, {
        method: "POST",
        body: cleanPayload,
      });
      const data = res?.data;
      const sch = normalizeSchedule(data?.schedule || data);
      if (sch) {
        const list = getInMemorySchedules();
        list.unshift(sch);
        saveInMemorySchedules(list);
      }
      return res.data;
    } catch (e) {
      console.warn("apiClient /schedules create failed:", e?.message);
      throw e;
    }
  },

  async generateSchedules(payload) {
    if (isMock) {
      await delay(250);
      const { startDate, endDate } = payload || {};
      const tpls = getInMemoryTemplates().filter((t) => t.isActive !== false);
      const schedList = getInMemorySchedules();
      let generatedCount = 0;

      if (startDate && endDate) {
        let current = startDate;
        while (current <= endDate) {
          const dayOfWeek = getPhilippineDayOfWeek(current);
          const dayTpls = tpls.filter((t) => Number(t.dayOfWeek) === Number(dayOfWeek));

          for (const t of dayTpls) {
            const alreadyExists = schedList.some(
              (s) => s.truckId === t.truckId && s.scheduledDate === current
            );
            if (!alreadyExists) {
              schedList.push({
                id: `sch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                scheduledDate: current,
                truckId: t.truckId,
                truckPlate: t.truckPlate,
                truckModel: t.truckModel,
                truckStatus: "ACTIVE",
                salesUserId: t.defaultSalesUserId,
                salesName: t.salesName || "Sales Person",
                zoneId: t.zoneId,
                zoneCode: t.zoneCode,
                zoneName: t.zoneName,
                status: "SCHEDULED",
                createdAt: new Date().toISOString(),
              });
              generatedCount++;
            }
          }
          current = addPhilippineDays(current, 1);
        }
        saveInMemorySchedules(schedList);
      }

      return {
        message: `Successfully generated ${generatedCount} daily truck schedules`,
        data: { generatedCount },
      };
    }

    try {
      const res = await apiClient(`/schedules/generate`, {
        method: "POST",
        body: payload,
      });
      return res.data;
    } catch (e) {
      console.warn("apiClient /schedules/generate failed:", e?.message);
      throw e;
    }
  },

  async cancelSchedule(id, payload = {}) {
    if (isMock) {
      await delay(100);
      const list = getInMemorySchedules();
      const idx = list.findIndex((s) => s.id === id);
      if (idx !== -1) {
        list[idx].status = "CANCELLED";
        if (payload.reason) {
          list[idx].cancelReason = payload.reason;
          list[idx].notes = list[idx].notes
            ? `${list[idx].notes} | Cancelled: ${payload.reason}`
            : `Cancelled: ${payload.reason}`;
        }
        saveInMemorySchedules(list);
      }
      return { message: "Schedule cancelled successfully" };
    }

    try {
      const res = await apiClient(`/schedules/${id}/cancel`, {
        method: "PATCH",
        body: payload,
      });
      const list = getInMemorySchedules();
      const idx = list.findIndex((s) => s.id === id);
      if (idx !== -1) {
        list[idx].status = "CANCELLED";
        if (payload.reason) list[idx].cancelReason = payload.reason;
        saveInMemorySchedules(list);
      }
      return res.data;
    } catch (e) {
      console.warn(`apiClient /schedules/${id}/cancel failed:`, e?.message);
      throw e;
    }
  },
};

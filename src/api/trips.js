// src/api/trips.js
import { apiClient, isMock, delay } from "./client.js";
import mockTrips from "../mocks/trips.json" with { type: "json" };

const LOCAL_STORAGE_KEY = "app_trips_cache";

function getInMemoryTrips() {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error reading cached trips:", e);
  }
  return isMock && Array.isArray(mockTrips) ? [...mockTrips] : [];
}

function saveInMemoryTrips(trips) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trips));
  } catch (e) {
    console.error("Error saving trips cache:", e);
  }
}

export function normalizeTrip(raw) {
  if (!raw) return null;
  const driverName =
    raw.driverName ||
    (raw.driver_first_name
      ? `${raw.driver_first_name} ${raw.driver_last_name}`.trim()
      : raw.driver_name || "Unassigned");
  const salesName =
    raw.salesName ||
    (raw.sales_first_name
      ? `${raw.sales_first_name} ${raw.sales_last_name}`.trim()
      : raw.sales_name || "Unassigned");

  const reconStatus =
    raw.reconciliationStatus ||
    raw.reconciliation_status ||
    raw.reconciliation?.status ||
    null;

  const rawStatus = (raw.status || "").toUpperCase();
  const effectiveStatus =
    rawStatus === "COMPLETED" && reconStatus
      ? reconStatus
      : rawStatus === "COMPLETED"
      ? "AWAITING_SYNC"
      : raw.status || "IN_PROGRESS";

  const departureOdo =
    Number(raw.departureOdometer ?? raw.truck_current_odometer ?? raw.odometer) || null;
  const returnOdo =
    Number(raw.returnOdometer ?? raw.return_odometer_reading) || null;
  const distanceKm =
    raw.distanceDrivenKm ??
    raw.distance_driven_km ??
    (returnOdo && departureOdo ? Math.max(0, returnOdo - departureOdo) : null);

  const normalizedLoads = Array.isArray(raw.loads)
    ? raw.loads.map(normalizeLoad)
    : [];

  const normalizedRecon = raw.reconciliation
    ? normalizeReconciliation(raw.reconciliation)
    : null;

  const allItems = normalizedLoads.flatMap((l) => l.items || []);
  const totalUnits = allItems.reduce((acc, it) => acc + (it.quantityUnits || 0), 0);
  const canisterUnits = allItems
    .filter((it) => (it.containerType || it.container_type) === "CANISTER")
    .reduce((acc, it) => acc + (it.quantityUnits || 0), 0);
  const cylinderUnits = allItems
    .filter((it) => (it.containerType || it.container_type) === "CYLINDER")
    .reduce((acc, it) => acc + (it.quantityUnits || 0), 0);

  return {
    ...raw,
    id: raw.id,
    tripNumber: raw.tripNumber || raw.trip_number || `TRIP-${raw.id?.slice(0, 8)}`,
    scheduleId: raw.scheduleId || raw.schedule_id || null,
    scheduledDate: raw.scheduledDate || raw.scheduled_date || null,
    truckId: raw.truckId || raw.truck_id,
    truckPlate: raw.truckPlate || raw.truck_plate_number || raw.plate_number || "No Plate",
    truckModel: raw.truckModel || raw.truck_model || "Delivery Vehicle",
    truckStatus: raw.truckStatus || raw.truck_status || "ACTIVE",
    driverId: raw.driverId || raw.driver_id,
    driverName,
    driverPhone: raw.driverPhone || raw.driver_phone,
    salesUserId: raw.salesUserId || raw.sales_user_id,
    salesName,
    salesPhone: raw.salesPhone || raw.sales_phone,
    zoneId: raw.zoneId || raw.zone_id,
    zoneCode: raw.zoneCode || raw.zone_code || "",
    zoneName: raw.zoneName || raw.zone_name || "",
    status: effectiveStatus,
    departureTime: raw.departureTime || raw.departure_time,
    returnTime: raw.returnTime || raw.return_time || null,
    departureOdometer: departureOdo,
    returnOdometer: returnOdo,
    distanceDrivenKm: distanceKm,
    loads: normalizedLoads,
    reconciliation: normalizedRecon,
    onBoardSummary: raw.onBoardSummary || {
      totalUnits,
      canisterCrates: Math.floor(canisterUnits / 24),
      cylinders: cylinderUnits,
    },
    notes: raw.notes || null,
    cancelReason: raw.cancelReason || raw.cancel_reason || null,
  };
}

export function normalizeLoad(load) {
  if (!load) return null;
  return {
    ...load,
    id: load.id,
    tripId: load.tripId || load.trip_id,
    transferType: load.transferType || load.transfer_type,
    slipNumber: load.slipNumber || load.slip_number,
    recordedBy: load.recordedBy || load.recorded_by,
    recordedAt: load.recordedAt || load.recorded_at,
    remarks: load.remarks || null,
    items: Array.isArray(load.items)
      ? load.items.map((it) => ({
          ...it,
          id: it.id,
          loadId: it.loadId || it.load_id,
          productId: it.productId || it.product_id,
          productName: it.productName || it.product_name || it.name || "LPG Product",
          condition: it.condition || "FILLED",
          quantityUnits: parseInt(it.quantityUnits ?? it.quantity_units, 10) || 0,
          containerType: it.containerType || it.container_type,
          netWeightKg: Number(it.netWeightKg || it.net_weight_kg) || 0,
        }))
      : [],
  };
}

export function normalizeReconciliation(recon) {
  if (!recon) return null;
  return {
    ...recon,
    id: recon.id,
    tripId: recon.tripId || recon.trip_id,
    status: recon.status,
    isSettled: recon.status === "SETTLED" || recon.isSettled || recon.is_settled,
    totalLoadedFull: parseInt(recon.totalLoadedFull ?? recon.total_loaded_full, 10) || 0,
    totalSoldFull: parseInt(recon.totalSoldFull ?? recon.total_sold_full, 10) || 0,
    totalReturnedFull: parseInt(recon.totalReturnedFull ?? recon.total_returned_full, 10) || 0,
    totalReturnedEmptyGood:
      parseInt(recon.totalReturnedEmptyGood ?? recon.total_returned_empty_good, 10) || 0,
    totalReturnedDefective:
      parseInt(recon.totalReturnedDefective ?? recon.total_returned_defective, 10) || 0,
    netCustomerDebtCreated:
      parseInt(recon.netCustomerDebtCreated ?? recon.net_customer_debt_created, 10) || 0,
    fullDiscrepancy: recon.fullDiscrepancy ?? recon.full_discrepancy ?? null,
    emptyDiscrepancy: recon.emptyDiscrepancy ?? recon.empty_discrepancy ?? null,
    supervisorNotes: recon.supervisorNotes || recon.supervisor_notes || null,
    reconciledAt: recon.reconciledAt || recon.reconciled_at || null,
  };
}

export const tripsApi = {
  /**
   * List delivery trips with optional filters.
   */
  async getTrips(params = {}) {
    if (isMock) {
      await delay(100);
      let list = getInMemoryTrips().map(normalizeTrip);
      if (params.status) {
        list = list.filter((t) => (t.status || "").toUpperCase() === params.status.toUpperCase());
      }
      if (params.truckId) {
        list = list.filter((t) => t.truckId === params.truckId);
      }
      if (params.zoneId) {
        list = list.filter((t) => t.zoneId === params.zoneId);
      }
      return list;
    }

    const query = new URLSearchParams();
    if (params.status) query.append("status", params.status);
    if (params.truckId) query.append("truckId", params.truckId);
    if (params.zoneId) query.append("zoneId", params.zoneId);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient(`/trips${qs}`);
    const rawList = res?.data?.trips || res?.data || [];
    if (Array.isArray(rawList)) {
      const normalized = rawList.map(normalizeTrip);
      saveInMemoryTrips(normalized);
      return normalized;
    }
    return [];
  },

  /**
   * Get single trip detail by ID.
   */
  async getTripById(id) {
    if (isMock) {
      await delay(100);
      const trip = getInMemoryTrips().find((t) => t.id === id);
      if (!trip) throw new Error("Trip not found");
      return normalizeTrip(trip);
    }

    try {
      const res = await apiClient(`/trips/${id}`);
      const trip = res?.data?.trip || res?.data;
      if (trip) return normalizeTrip(trip);
      const cached = getInMemoryTrips().find((t) => t.id === id);
      return cached ? normalizeTrip(cached) : null;
    } catch (e) {
      console.warn(`apiClient /trips/${id} failed, falling back to cache:`, e?.message);
      const cached = getInMemoryTrips().find((t) => t.id === id);
      if (cached) return normalizeTrip(cached);
      throw e;
    }
  },

  /**
   * Dispatch a delivery truck for a scheduled or ad-hoc run.
   */
  async dispatchTrip(payload) {
    if (isMock) {
      await delay(200);
      const list = getInMemoryTrips();
      const tripId = `trp-${Date.now()}`;
      const tripNumber = `TRIP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(list.length + 1).padStart(3, "0")}`;

      const newTrip = {
        id: tripId,
        tripNumber,
        scheduleId: payload.scheduleId || null,
        truckId: payload.truckId || "trk-11111111-2222-3333-4444-555555555555",
        truckPlate: payload.truckPlate || "ABC-1001",
        truckModel: payload.truckModel || "Isuzu Elf N-Series",
        driverId: payload.driverId || "d1111111-aaaa-bbbb-cccc-111111111111",
        driverName: payload.driverName || "Juan Driver",
        salesUserId: payload.salesUserId || "98b3be70-2bd5-4a6d-be32-a9174cb1cb84",
        salesName: payload.salesName || "Sales Representative",
        zoneId: payload.zoneId || "7b8f9e6a-5432-41a9-83bc-9d0e12345678",
        zoneCode: payload.zoneCode || "TORIL",
        zoneName: payload.zoneName || "Toril District",
        status: "IN_PROGRESS",
        departureTime: new Date().toISOString(),
        departureOdometer: payload.departureOdometer || 45000,
        notes: payload.notes || "Trip dispatched from yard",
        loads: payload.initialLoads?.length
          ? [
              {
                id: `lod-${Date.now()}`,
                transferType: "DISPATCH_LOAD",
                slipNumber: `LOAD-${Date.now()}`,
                items: payload.initialLoads,
              },
            ]
          : [],
      };

      list.unshift(newTrip);
      saveInMemoryTrips(list);
      return { trip: newTrip, message: `Truck dispatched successfully with number ${tripNumber}` };
    }

    const res = await apiClient(`/trips/dispatch`, {
      method: "POST",
      body: payload,
    });
    const dispatched = res?.data?.trip || res?.data;
    if (dispatched) {
      const list = getInMemoryTrips();
      const norm = normalizeTrip(dispatched);
      list.unshift(norm);
      saveInMemoryTrips(list);
    }
    return res.data;
  },

  /**
   * Record a midday reload or transfer slip.
   */
  async addTripLoad(tripId, payload) {
    if (isMock) {
      await delay(150);
      const list = getInMemoryTrips();
      const trip = list.find((t) => t.id === tripId);
      if (!trip) throw new Error("Trip not found");

      const newLoad = {
        id: `lod-${Date.now()}`,
        transferType: payload.transferType || "DISPATCH_LOAD",
        slipNumber: `LOAD-${Date.now()}`,
        remarks: payload.remarks || null,
        items: payload.items || [],
        recordedAt: new Date().toISOString(),
      };

      if (!trip.loads) trip.loads = [];
      trip.loads.push(newLoad);
      saveInMemoryTrips(list);
      return { load: newLoad, message: "Load manifest recorded successfully" };
    }

    const res = await apiClient(`/trips/${tripId}/loads`, {
      method: "POST",
      body: payload,
    });
    return res.data;
  },

  /**
   * Complete yard return check-in with return odometer reading and return unloads.
   */
  async completeTripReturn(tripId, payload) {
    if (isMock) {
      await delay(200);
      const list = getInMemoryTrips();
      const trip = list.find((t) => t.id === tripId);
      if (!trip) throw new Error("Trip not found");

      trip.status = "AWAITING_SYNC";
      trip.returnTime = new Date().toISOString();
      trip.returnOdometer = Number(payload.returnOdometerKm);
      trip.distanceDrivenKm = Math.max(0, trip.returnOdometer - (trip.departureOdometer || 0));

      if (payload.returnLoads?.length) {
        if (!trip.loads) trip.loads = [];
        trip.loads.push({
          id: `lod-${Date.now()}`,
          transferType: "RETURN_UNLOAD",
          slipNumber: `UNLOAD-${Date.now()}`,
          items: payload.returnLoads,
          recordedAt: new Date().toISOString(),
        });
      }

      trip.reconciliation = {
        status: "AWAITING_SYNC",
        totalLoadedFull: 120,
        totalSoldFull: 95,
        totalReturnedFull: payload.returnLoads?.find((i) => i.condition === "FILLED")?.quantityUnits || 20,
        totalReturnedEmptyGood: payload.returnLoads?.find((i) => i.condition === "EMPTY_GOOD")?.quantityUnits || 95,
        totalReturnedDefective: payload.returnLoads?.find((i) => i.condition === "DEFECTIVE")?.quantityUnits || 5,
        netCustomerDebtCreated: 0,
        fullDiscrepancy: 0,
        emptyDiscrepancy: 0,
        isSettled: false,
      };

      saveInMemoryTrips(list);
      return {
        trip,
        message: "Plant return check-in recorded successfully. Trip is now awaiting sync.",
      };
    }

    const res = await apiClient(`/trips/${tripId}/complete`, {
      method: "POST",
      body: payload,
    });
    const completedTrip = res?.data?.trip;
    if (completedTrip) {
      const list = getInMemoryTrips();
      const idx = list.findIndex((t) => t.id === tripId);
      if (idx !== -1) {
        list[idx] = normalizeTrip(completedTrip);
        saveInMemoryTrips(list);
      }
    }
    return res.data;
  },

  /**
   * Retrieve post-trip reconciliation breakdown.
   */
  async getTripReconciliation(tripId) {
    if (isMock) {
      await delay(100);
      const trip = getInMemoryTrips().find((t) => t.id === tripId);
      return trip?.reconciliation || { status: "AWAITING_SYNC" };
    }

    const res = await apiClient(`/trips/${tripId}/reconciliation`);
    const recon = res?.data?.reconciliation || res?.data;
    return recon ? normalizeReconciliation(recon) : { status: "AWAITING_SYNC" };
  },

  /**
   * Settle post-trip stock reconciliation.
   */
  async settleReconciliation(tripId, payload) {
    if (isMock) {
      await delay(200);
      const list = getInMemoryTrips();
      const trip = list.find((t) => t.id === tripId);
      if (!trip) throw new Error("Trip not found");

      trip.status = "SETTLED";
      if (!trip.reconciliation) trip.reconciliation = {};
      trip.reconciliation.status = "SETTLED";
      trip.reconciliation.isSettled = true;
      trip.reconciliation.supervisorNotes = payload.supervisorNotes || "Verified and settled";
      trip.reconciliation.reconciledAt = new Date().toISOString();

      saveInMemoryTrips(list);
      return {
        trip,
        reconciliation: trip.reconciliation,
        message: "Trip stock reconciliation settled successfully",
      };
    }

    const res = await apiClient(`/trips/${tripId}/reconcile`, {
      method: "POST",
      body: payload,
    });
    const list = getInMemoryTrips();
    const idx = list.findIndex((t) => t.id === tripId);
    if (idx !== -1) {
      list[idx].status = "SETTLED";
      if (list[idx].reconciliation) {
        list[idx].reconciliation.status = "SETTLED";
        list[idx].reconciliation.isSettled = true;
      }
      saveInMemoryTrips(list);
    }
    return res.data;
  },

  /**
   * Cancel an operational trip.
   */
  async cancelTrip(tripId, payload = {}) {
    if (isMock) {
      await delay(150);
      const list = getInMemoryTrips();
      const trip = list.find((t) => t.id === tripId);
      if (trip) {
        trip.status = "CANCELLED";
        trip.returnTime = new Date().toISOString();
        if (payload.reason) {
          trip.cancelReason = payload.reason;
          trip.notes = trip.notes ? `${trip.notes} | Cancelled: ${payload.reason}` : `Cancelled: ${payload.reason}`;
        }
        if (payload.returnOdometerKm) {
          trip.returnOdometer = Number(payload.returnOdometerKm);
          trip.distanceDrivenKm = Math.max(0, trip.returnOdometer - (trip.departureOdometer || 0));
        }
        if (payload.returnLoads?.length) {
          if (!trip.loads) trip.loads = [];
          trip.loads.push({
            id: `lod-${Date.now()}`,
            transferType: "RETURN_UNLOAD",
            slipNumber: `CANCEL-UNLOAD-${Date.now()}`,
            remarks: `Aborted trip return: ${payload.reason || "Cancelled mid-way"}`,
            items: payload.returnLoads,
            recordedAt: new Date().toISOString(),
          });
        }
        saveInMemoryTrips(list);
      }
      return { message: "Trip cancelled successfully", trip };
    }

    const res = await apiClient(`/trips/${tripId}/cancel`, {
      method: "PATCH",
      body: payload,
    });
    const list = getInMemoryTrips();
    const idx = list.findIndex((t) => t.id === tripId);
    if (idx !== -1) {
      list[idx].status = "CANCELLED";
      if (payload.reason) list[idx].cancelReason = payload.reason;
      if (payload.returnOdometerKm) list[idx].returnOdometer = Number(payload.returnOdometerKm);
      if (payload.returnLoads?.length) {
        if (!list[idx].loads) list[idx].loads = [];
        list[idx].loads.push({
          id: `lod-${Date.now()}`,
          transferType: "RETURN_UNLOAD",
          slipNumber: `CANCEL-UNLOAD-${Date.now()}`,
          remarks: `Aborted trip return: ${payload.reason || "Cancelled mid-way"}`,
          items: payload.returnLoads,
          recordedAt: new Date().toISOString(),
        });
      }
      saveInMemoryTrips(list);
    }
    return res.data;
  },
};

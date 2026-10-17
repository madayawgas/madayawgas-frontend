// src/api/trips.js
import { apiClient } from "./client.js";

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
      return rawList.map(normalizeTrip);
    }
    return [];
  },

  /**
   * Get single trip detail by ID.
   */
  async getTripById(id) {
    const res = await apiClient(`/trips/${id}`);
    const trip = res?.data?.trip || res?.data;
    if (trip) return normalizeTrip(trip);
    return null;
  },

  /**
   * Dispatch a delivery truck for a scheduled or ad-hoc run.
   */
  async dispatchTrip(payload) {
    const res = await apiClient(`/trips/dispatch`, {
      method: "POST",
      body: payload,
    });
    return res.data;
  },

  /**
   * Record a midday reload or transfer slip.
   */
  async addTripLoad(tripId, payload) {
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
    const res = await apiClient(`/trips/${tripId}/complete`, {
      method: "POST",
      body: payload,
    });
    return res.data;
  },

  /**
   * Retrieve post-trip reconciliation breakdown.
   */
  async getTripReconciliation(tripId) {
    const res = await apiClient(`/trips/${tripId}/reconciliation`);
    const recon = res?.data?.reconciliation || res?.data;
    return recon ? normalizeReconciliation(recon) : { status: "AWAITING_SYNC" };
  },

  /**
   * Settle post-trip stock reconciliation.
   */
  async settleReconciliation(tripId, payload) {
    const res = await apiClient(`/trips/${tripId}/reconcile`, {
      method: "POST",
      body: payload,
    });
    return res.data;
  },

  /**
   * Cancel an operational trip.
   */
  async cancelTrip(tripId, payload = {}) {
    const res = await apiClient(`/trips/${tripId}/cancel`, {
      method: "PATCH",
      body: payload,
    });
    return res.data;
  },
};

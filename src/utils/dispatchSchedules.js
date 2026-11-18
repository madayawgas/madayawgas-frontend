// src/utils/dispatchSchedules.js
import {
  getPhilippineDayOfWeek,
  toPhilippineDateInputString,
} from "./date.js";

const COMPLETED_TRIP_STATUSES = new Set([
  "COMPLETED",
  "SETTLED",
  "AWAITING_SYNC",
  "BALANCED",
  "DISCREPANCY_REVIEW",
  "FLAGGED_VARIANCE",
]);

function resolvePersonName(person, fallback = "Unassigned") {
  if (!person) return fallback;
  return (
    person.fullName ||
    `${person.firstName || ""} ${person.lastName || ""}`.trim() ||
    person.username ||
    fallback
  );
}

export function isTripActiveOrReturned(trip) {
  if (!trip) return false;
  const raw = (trip.rawStatus || "").toUpperCase();
  const effective = (trip.status || "").toUpperCase();
  return (
    raw === "IN_PROGRESS" ||
    raw === "RETURNED" ||
    effective === "IN_PROGRESS" ||
    effective === "RETURNED"
  );
}

export function isTripCompleted(trip) {
  if (!trip) return false;
  const raw = (trip.rawStatus || "").toUpperCase();
  const effective = (trip.status || "").toUpperCase();
  if (raw === "CANCELLED" || effective === "CANCELLED") return false;
  return raw === "COMPLETED" || COMPLETED_TRIP_STATUSES.has(effective);
}

function buildSyntheticScheduleEntry({
  id,
  templateId = null,
  truckId,
  zoneId,
  zoneCode = "",
  zoneName = "",
  salesUserId = null,
  salesNameFallback = "Unassigned",
  truckPlateFallback = "No Plate",
  truckModelFallback = "Delivery Vehicle",
  driverNameFallback = "Unassigned",
  notes = "",
  todayPht,
  vehicles,
  zones,
  salesUsers,
  drivers,
  isRedispatch = false,
  completedTripsTodayCount = 0,
  lastCompletedTrip = null,
}) {
  const vehicle = vehicles.find((v) => v.id === truckId);
  const zone = zones.find((z) => z.id === zoneId);
  const salesUser = salesUsers.find((u) => u.id === salesUserId);
  const driverUser = drivers.find((d) => d.id === vehicle?.driverId);

  const driverName = driverUser
    ? resolvePersonName(driverUser, driverNameFallback)
    : vehicle?.driver
    ? resolvePersonName(vehicle.driver, driverNameFallback)
    : driverNameFallback;

  const salesName = salesUser
    ? resolvePersonName(salesUser, salesNameFallback)
    : salesNameFallback;

  return {
    id,
    templateId,
    scheduledDate: todayPht,
    truckId,
    truckPlate: vehicle?.plateNumber || truckPlateFallback,
    truckModel: vehicle?.model || truckModelFallback,
    truckStatus: vehicle?.status || "ACTIVE",
    truckDriverId: vehicle?.driverId || null,
    driverName,
    salesUserId: salesUserId || null,
    salesName,
    zoneId: zoneId || null,
    zoneCode: zoneCode || zone?.code || "",
    zoneName: zoneName || zone?.name || "",
    status: "SCHEDULED",
    notes,
    isTemplateDerived: true,
    isRedispatch,
    completedTripsTodayCount,
    lastCompletedTrip,
  };
}

/**
 * Builds Today's Scheduled & Re-Dispatchable entries by combining:
 * 1. Direct operational schedules for today with status === "SCHEDULED".
 * 2. Active weekly master templates for today's Philippine day-of-week not yet covered.
 * 3. Reconciled/completed vehicles from earlier today that have no active or returned
 *    trip right now, allowing them to be dispatched again on the same day.
 */
export function buildTodaySchedules({
  schedules = [],
  templates = [],
  trips = [],
  vehicles = [],
  zones = [],
  salesUsers = [],
  drivers = [],
  todayPht,
}) {
  // 1. Direct operational schedules for today that are still SCHEDULED
  const directScheduled = schedules.filter((s) => {
    const isSched = (s.status || "").toUpperCase() === "SCHEDULED";
    const schedDate = toPhilippineDateInputString(s.scheduledDate);
    return isSched && schedDate === todayPht;
  });

  const directScheduledTruckIds = new Set(
    directScheduled.map((s) => s.truckId).filter(Boolean)
  );

  // 2. Trucks currently out on route or awaiting dock check-in
  const activeOrReturnedTruckIds = new Set(
    trips
      .filter(isTripActiveOrReturned)
      .map((t) => t.truckId)
      .filter(Boolean)
  );

  // 3. Trips completed/reconciled today, grouped by truckId
  const completedTripsTodayByTruck = new Map();
  trips.forEach((t) => {
    if (!t?.truckId || !isTripCompleted(t)) return;
    const tripDate = toPhilippineDateInputString(
      t.departureTime || t.departure_time || t.createdAt
    );
    if (tripDate !== todayPht) return;
    const list = completedTripsTodayByTruck.get(t.truckId) || [];
    list.push(t);
    completedTripsTodayByTruck.set(t.truckId, list);
  });

  // 4. Explicitly cancelled schedules today (keep suppressed unless a trip was completed today)
  const cancelledTruckIds = new Set(
    schedules
      .filter((s) => {
        const isCancelled = (s.status || "").toUpperCase() === "CANCELLED";
        const schedDate = toPhilippineDateInputString(s.scheduledDate);
        return (
          isCancelled &&
          schedDate === todayPht &&
          !completedTripsTodayByTruck.has(s.truckId)
        );
      })
      .map((s) => s.truckId)
      .filter(Boolean)
  );

  // 5. Current Philippine day of week (1=Monday ... 7=Sunday)
  const currentIsoDay = getPhilippineDayOfWeek(todayPht);

  const todayActiveTemplates = templates.filter((t) => {
    const isToday = Number(t.dayOfWeek) === Number(currentIsoDay);
    const isActive = t.isActive !== false;
    return isToday && isActive;
  });

  const todayTemplateByTruck = new Map();
  todayActiveTemplates.forEach((t) => {
    if (t.truckId && !todayTemplateByTruck.has(t.truckId)) {
      todayTemplateByTruck.set(t.truckId, t);
    }
  });

  // 6. Template-derived runs for trucks not yet covered today
  const templateDerived = todayActiveTemplates
    .filter((t) => {
      return (
        t.truckId &&
        !directScheduledTruckIds.has(t.truckId) &&
        !activeOrReturnedTruckIds.has(t.truckId) &&
        !cancelledTruckIds.has(t.truckId) &&
        !completedTripsTodayByTruck.has(t.truckId)
      );
    })
    .map((t) =>
      buildSyntheticScheduleEntry({
        id: `tpl-${t.id}`,
        templateId: t.id,
        truckId: t.truckId,
        zoneId: t.zoneId,
        zoneCode: t.zoneCode || "",
        zoneName: t.zoneName || "",
        salesUserId: t.defaultSalesUserId || null,
        salesNameFallback: t.salesName || "Unassigned",
        truckPlateFallback: t.truckPlate || "No Plate",
        truckModelFallback: t.truckModel || "Delivery Vehicle",
        notes: `Weekly route schedule (Day ${currentIsoDay})`,
        todayPht,
        vehicles,
        zones,
        salesUsers,
        drivers,
      })
    );

  // 7. Re-dispatchable entries for trucks that completed & reconciled a trip today
  //    and are not currently out on route, returned, or already scheduled
  const redispatchEntries = [];
  completedTripsTodayByTruck.forEach((completedTrips, truckId) => {
    if (activeOrReturnedTruckIds.has(truckId)) return;
    if (directScheduledTruckIds.has(truckId)) return;

    const sortedTrips = [...completedTrips].sort((a, b) => {
      const timeA = new Date(a.returnTime || a.departureTime || a.createdAt || 0).getTime();
      const timeB = new Date(b.returnTime || b.departureTime || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    const lastCompletedTrip = sortedTrips[0];
    const tpl = todayTemplateByTruck.get(truckId) || null;
    const todaySched = schedules.find(
      (s) =>
        s.truckId === truckId &&
        toPhilippineDateInputString(s.scheduledDate) === todayPht
    );

    const zoneId =
      tpl?.zoneId || todaySched?.zoneId || lastCompletedTrip?.zoneId || null;
    const zoneCode =
      tpl?.zoneCode || todaySched?.zoneCode || lastCompletedTrip?.zoneCode || "";
    const zoneName =
      tpl?.zoneName || todaySched?.zoneName || lastCompletedTrip?.zoneName || "";
    const salesUserId =
      tpl?.defaultSalesUserId ||
      todaySched?.salesUserId ||
      lastCompletedTrip?.salesUserId ||
      null;
    const salesNameFallback =
      tpl?.salesName ||
      todaySched?.salesName ||
      lastCompletedTrip?.salesName ||
      "Unassigned";

    redispatchEntries.push(
      buildSyntheticScheduleEntry({
        id: `redispatch-${truckId}`,
        templateId: tpl?.id || null,
        truckId,
        zoneId,
        zoneCode,
        zoneName,
        salesUserId,
        salesNameFallback,
        truckPlateFallback:
          tpl?.truckPlate ||
          todaySched?.truckPlate ||
          lastCompletedTrip?.truckPlate ||
          "No Plate",
        truckModelFallback:
          tpl?.truckModel ||
          todaySched?.truckModel ||
          lastCompletedTrip?.truckModel ||
          "Delivery Vehicle",
        driverNameFallback: lastCompletedTrip?.driverName || "Unassigned",
        notes: `Re-dispatch after ${completedTrips.length} completed trip${
          completedTrips.length > 1 ? "s" : ""
        } today`,
        todayPht,
        vehicles,
        zones,
        salesUsers,
        drivers,
        isRedispatch: true,
        completedTripsTodayCount: completedTrips.length,
        lastCompletedTrip,
      })
    );
  });

  return [...directScheduled, ...templateDerived, ...redispatchEntries];
}

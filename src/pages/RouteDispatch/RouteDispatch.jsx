// src/pages/RouteDispatch/RouteDispatch.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";

import { tripsApi } from "../../api/trips.js";
import { schedulesApi } from "../../api/schedules.js";
import { fleetApi } from "../../api/fleet.js";
import { inventoryApi } from "../../api/inventory.js";
import { getScheduleDispatchGating } from "../../utils/fleetGuards.js";

import { isCanisterProduct, getCanisterCrates } from "../../utils/product.js";
import { buildTodaySchedules } from "../../utils/dispatchSchedules.js";
import {
  getPhilippineTodayString,
  toPhilippineDateInputString,
} from "../../utils/date.js";

import TodayDispatchesControls from "../../components/route-dispatch/TodayDispatchesControls.jsx";
import TodayDispatchesTable from "../../components/route-dispatch/TodayDispatchesTable.jsx";
import TodayDispatchesCards from "../../components/route-dispatch/TodayDispatchesCards.jsx";
import TripDetailPanel from "../../components/route-dispatch/TripDetailPanel.jsx";
import SideDrawer from "../../components/ui/SideDrawer.jsx";
import Badge from "../../components/ui/Badge.jsx";
import { Truck, ArrowRight, RotateCcw } from "lucide-react";

import DispatchModal from "../../components/route-dispatch/DispatchModal";
import MiddayReloadModal from "../../components/route-dispatch/MiddayReloadModal";
import CancelTripModal from "../../components/route-dispatch/CancelTripModal";
import CancelScheduleModal from "../../components/route-dispatch/CancelScheduleModal";
import SettleTripModal from "../../components/route-dispatch/SettleTripModal.jsx";
import EndTripModal from "../../components/route-dispatch/EndTripModal.jsx";
import ToastNotification from "../../components/ui/ToastNotifications";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh.js";

const VIEW_MODE_KEY = "app_route_dispatch_view_mode";

export default function RouteDispatch() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const canManage = can
    ? (can(PERMISSIONS.ROUTE_MANAGE || "route.manage") ||
       can(PERMISSIONS.INVENTORY_VEHICLE_MANAGE || "inventory.vehicle.manage"))
    : false;
  const canViewAllVehicles = can
    ? can(PERMISSIONS.FLEET_VIEW || "fleet.view") ||
      can(PERMISSIONS.ROUTE_VIEW || "route.view") ||
      can(PERMISSIONS.ROUTE_MANAGE || "route.manage")
    : false;

  const todayPht = useMemo(() => getPhilippineTodayString(), []);

  // 1. Core Data States (Initialized from cache when available)
  const { canistersPerCrate } = useSettings();
  const [trips, setTrips] = useState(() => {
    try {
      const cached = localStorage.getItem("app_trips_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [schedules, setSchedules] = useState(() => {
    try {
      const cached = localStorage.getItem("app_schedules_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [templates, setTemplates] = useState(() => {
    try {
      const cached = localStorage.getItem("app_templates_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [vehicles, setVehicles] = useState(() => {
    try {
      const cached = localStorage.getItem("app_fleet_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [zones, setZones] = useState(() => {
    try {
      const cached = localStorage.getItem("app_zones_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem("app_items_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [drivers, setDrivers] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [plantInventory, setPlantInventory] = useState([]);

  // 2. Filter, View Mode, Sorting, and Pagination States
  const [viewSection, setViewSection] = useState("VEHICLES"); // 'VEHICLES' | 'COMPLETED'
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("ALL");
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem(VIEW_MODE_KEY) || "table";
    } catch {
      return "table";
    }
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // ignore
    }
  };

  const [sortConfig, setSortConfig] = useState({
    key: "truckPlate",
    direction: "asc",
  });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const handleViewSectionChange = (nextSection) => {
    setViewSection(nextSection);
    setStatusFilter("ALL");
    setPage(1);
  };

  // Reset pagination page when filters change
  useEffect(() => {
    setPage(1);
  }, [viewSection, statusFilter, searchTerm, selectedZone]);

  const [toast, setToast] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const handleCloseDetail = () => setSelectedEntry(null);

  // 3. Operational Modals States
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [prefillScheduleId, setPrefillScheduleId] = useState("");
  const [prefillTruckId, setPrefillTruckId] = useState("");
  const [showMiddayModal, setShowMiddayModal] = useState(false);
  const [selectedTripForReload, setSelectedTripForReload] = useState(null);
  const [showCancelTripModal, setShowCancelTripModal] = useState(false);
  const [selectedTripToCancel, setSelectedTripToCancel] = useState(null);
  const [showCancelScheduleModal, setShowCancelScheduleModal] = useState(false);
  const [selectedScheduleToCancel, setSelectedScheduleToCancel] = useState(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedTripForSettle, setSelectedTripForSettle] = useState(null);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [selectedTripToEnd, setSelectedTripToEnd] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  // 4. Data Loading
  const loadData = useCallback(async () => {
    try {
      const [
        activeAndReturnedTrips,
        todayTrips,
        schedData,
        tplData,
        vData,
        zData,
        prodData,
        driverData,
        salesData,
        plantInvData,
      ] = await Promise.all([
        tripsApi.getTrips({ status: "IN_PROGRESS,RETURNED" }).catch((err) => {
          console.warn("Failed to fetch active/returned trips:", err);
          showToast("error", err?.message || "Failed to load active trips");
          return null;
        }),
        tripsApi.getTrips({ startDate: `${todayPht}T00:00:00+08:00` }).catch((err) => {
          console.warn("Failed to fetch today's trips:", err);
          return [];
        }),
        schedulesApi.getSchedules({ date: todayPht }).catch((err) => {
          console.warn("Failed to fetch schedules:", err);
          return [];
        }),
        schedulesApi.getTemplates().catch((err) => {
          console.warn("Failed to fetch templates:", err);
          return [];
        }),
        (canViewAllVehicles
          ? fleetApi.getVehicles()
          : fleetApi.getFleetAvailability().then((res) => res?.vehicles || [])
        ).catch((err) => {
          console.warn("Failed to fetch fleet:", err);
          return [];
        }),
        schedulesApi.getZones().catch((err) => {
          console.warn("Failed to fetch zones:", err);
          return [];
        }),
        inventoryApi.getInventoryItems().catch((err) => {
          console.warn("Failed to fetch items:", err);
          return [];
        }),
        fleetApi.getDrivers().catch((err) => {
          console.warn("Failed to fetch drivers:", err);
          return { drivers: [] };
        }),
        schedulesApi.getSalesPersons().catch((err) => {
          console.warn("Failed to fetch sales persons:", err);
          return [];
        }),
        inventoryApi.getPlantInventory().catch((err) => {
          console.warn("Failed to fetch plant inventory:", err);
          return [];
        }),
      ]);

      if (Array.isArray(activeAndReturnedTrips) || Array.isArray(todayTrips)) {
        const mergedMap = new Map();
        (Array.isArray(activeAndReturnedTrips) ? activeAndReturnedTrips : []).forEach((t) => {
          if (t?.id) mergedMap.set(t.id, t);
        });
        (Array.isArray(todayTrips) ? todayTrips : []).forEach((t) => {
          if (t?.id && !mergedMap.has(t.id)) mergedMap.set(t.id, t);
        });
        setTrips(Array.from(mergedMap.values()));
      }
      if (Array.isArray(schedData)) setSchedules(schedData);
      if (Array.isArray(tplData)) setTemplates(tplData);
      if (Array.isArray(vData)) setVehicles(vData);
      if (Array.isArray(zData)) setZones(zData);
      if (Array.isArray(prodData)) setProducts(prodData);
      if (Array.isArray(plantInvData)) setPlantInventory(plantInvData);
      const parsedDrivers = Array.isArray(driverData) ? driverData : (driverData?.drivers || []);
      setDrivers(parsedDrivers);
      if (Array.isArray(salesData)) setSalesUsers(salesData);
    } catch (err) {
      console.warn("Failed to refresh today's dispatches:", err);
    }
  }, [todayPht, canViewAllVehicles]);

  // Real-Time WebSocket Hook: Auto-refreshes trips, vehicle status, and schedules
  useRealtimeRefresh({
    events: [
      "TRIP_ENDED",
      "TRIP_DISPATCHED",
      "TRIP_COMPLETED",
      "TRIP_CANCELLED",
      "TRIP_RECONCILIATION_UPDATED",
      "FLEET_VEHICLE_GROUNDED",
      "FLEET_VEHICLE_RELEASED",
      "SALES_BATCH_SYNCED",
      "SCHEDULE_CREATED",
      "SCHEDULE_UPDATED",
      "SCHEDULE_CANCELLED",
    ],
    cacheKeysToInvalidate: ["app_fleet_cache", "app_trips_cache", "app_schedules_cache"],
    onRefresh: loadData,
  });

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      if (mounted) {
        await loadData();
      }
    };
    fetchAll();
    return () => {
      mounted = false;
    };
  }, [loadData]);

  // 5. Cargo Breakdown Helper
  const getFullCargoBreakdown = useCallback((trip) => {
    const loads = trip.loads || [];
    const items = loads
      .flatMap((l) => l.items || [])
      .filter((i) => i.condition === "FILLED");

    let canisterUnits = 0;
    let cylinderUnits = 0;

    items.forEach((it) => {
      const q = Number(it.quantityUnits) || 0;
      if (isCanisterProduct(it)) {
        canisterUnits += q;
      } else {
        cylinderUnits += q;
      }
    });

    const { crates: canisterCrates, remainder: canisterRemainder } = getCanisterCrates(canisterUnits, canistersPerCrate);
    return {
      totalUnits: canisterUnits + cylinderUnits,
      canisterUnits,
      canisterCrates,
      canisterRemainder,
      cylinderUnits,
    };
  }, [canistersPerCrate]);

  // 6. Partition Entities
  // 6a. Active Trips (IN_PROGRESS)
  const activeTrips = useMemo(() => {
    return trips.filter((t) => (t.status || "").toUpperCase() === "IN_PROGRESS");
  }, [trips]);

  // 6b. Returned Trips (RETURNED — awaiting dock stock check-in)
  const returnedTrips = useMemo(() => {
    return trips.filter((t) => (t.rawStatus || t.status || "").toUpperCase() === "RETURNED");
  }, [trips]);

  // 6b-2. Completed Trips (Today's settled trips + any unresolved FLAGGED_VARIANCE / AWAITING_SYNC trips)
  const completedTodayTrips = useMemo(() => {
    return trips.filter((t) => {
      const raw = (t.rawStatus || "").toUpperCase();
      if (raw !== "COMPLETED") return false;
      const reconSt = (t.reconciliation?.status || t.status || "").toUpperCase();
      const tripDate = toPhilippineDateInputString(t.departureTime || t.departure_time || t.createdAt);
      return tripDate === todayPht || reconSt === "FLAGGED_VARIANCE" || reconSt === "AWAITING_SYNC";
    });
  }, [trips, todayPht]);

  // 6c. Today's Scheduled & Re-Dispatchable Dispatches (Direct + Template-derived + Reconciled)
  const allTodaySchedules = useMemo(() => {
    return buildTodaySchedules({
      schedules,
      templates,
      trips,
      vehicles,
      zones,
      salesUsers,
      drivers,
      todayPht,
    });
  }, [schedules, templates, trips, vehicles, zones, salesUsers, drivers, todayPht]);

  // 6d. Partition schedules into Available vs Unavailable
  const { availableSchedules, unavailableSchedules } = useMemo(() => {
    const available = [];
    const unavailable = [];
    allTodaySchedules.forEach((sched) => {
      const gating = getScheduleDispatchGating(sched, vehicles, drivers);
      const enriched = { ...sched, gating };
      if (gating.canDispatch) {
        available.push(enriched);
      } else {
        unavailable.push(enriched);
      }
    });
    return { availableSchedules: available, unavailableSchedules: unavailable };
  }, [allTodaySchedules, vehicles, drivers]);

  // 7. Partitioned Operational Entries:
  //    - liveVehicleEntries: strictly 1 row per vehicle (OUT_ON_ROAD > RETURNED > READY > UNAVAILABLE)
  //    - completedRunEntries: reconciled trips today (SETTLED, FLAGGED_VARIANCE, AWAITING_SYNC)
  const { liveVehicleEntries, completedRunEntries } = useMemo(() => {
    const vehiclesList = [];
    const seenTruckIds = new Set();

    const pushUniqueVehicle = (entry) => {
      if (entry.truckId) {
        if (seenTruckIds.has(entry.truckId)) return;
        seenTruckIds.add(entry.truckId);
      }
      vehiclesList.push(entry);
    };

    // Priority 1: In-progress trips (Out on route)
    activeTrips.forEach((trip) => {
      const cargo = getFullCargoBreakdown(trip);
      pushUniqueVehicle({
        ...trip,
        entryType: "TRIP",
        operationalStatus: "OUT_ON_ROAD",
        cargo,
      });
    });

    // Priority 2: Returned trips (Arrived at yard, awaiting dock stock check-in)
    returnedTrips.forEach((trip) => {
      const cargo = getFullCargoBreakdown(trip);
      pushUniqueVehicle({
        ...trip,
        entryType: "TRIP",
        operationalStatus: "RETURNED",
        cargo,
      });
    });

    // Priority 3: Ready to dispatch
    availableSchedules.forEach((sched) => {
      pushUniqueVehicle({
        ...sched,
        entryType: "SCHEDULE",
        operationalStatus: "READY",
      });
    });

    // Priority 4: Unavailable vehicles
    unavailableSchedules.forEach((sched) => {
      pushUniqueVehicle({
        ...sched,
        entryType: "SCHEDULE",
        operationalStatus: "UNAVAILABLE",
      });
    });

    // Completed & reconciled trips today
    const completedList = completedTodayTrips.map((trip) => {
      const cargo = getFullCargoBreakdown(trip);
      const reconSt = (trip.reconciliation?.status || trip.status || "AWAITING_SYNC").toUpperCase();
      return {
        ...trip,
        entryType: "TRIP",
        operationalStatus: reconSt,
        cargo,
      };
    });

    return {
      liveVehicleEntries: vehiclesList,
      completedRunEntries: completedList,
    };
  }, [activeTrips, returnedTrips, completedTodayTrips, availableSchedules, unavailableSchedules, getFullCargoBreakdown]);

  const allOperationalEntries = useMemo(
    () => [...liveVehicleEntries, ...completedRunEntries],
    [liveVehicleEntries, completedRunEntries]
  );

  // Counts for Controls Bar & KPIs
  const counts = useMemo(() => {
    let unitsCount = 0;
    let cratesCount = 0;
    activeTrips.forEach((t) => {
      const cargo = getFullCargoBreakdown(t);
      unitsCount += (cargo.canisterUnits || 0) + (cargo.cylinderUnits || 0);
      cratesCount += cargo.canisterCrates || 0;
    });

    const outOnRoad = liveVehicleEntries.filter((e) => e.operationalStatus === "OUT_ON_ROAD").length;
    const returned = liveVehicleEntries.filter((e) => e.operationalStatus === "RETURNED").length;
    const ready = liveVehicleEntries.filter((e) => e.operationalStatus === "READY").length;
    const unavailable = liveVehicleEntries.filter((e) => e.operationalStatus === "UNAVAILABLE").length;
    const completedAttention = completedRunEntries.filter((e) =>
      ["FLAGGED_VARIANCE", "AWAITING_SYNC"].includes(e.operationalStatus)
    ).length;

    return {
      vehiclesTotal: liveVehicleEntries.length,
      outOnRoad,
      returned,
      ready,
      unavailable,
      completedTotal: completedRunEntries.length,
      completedAttention,
      totalUnitsStaged: unitsCount,
      totalCratesStaged: cratesCount,
    };
  }, [activeTrips, liveVehicleEntries, completedRunEntries, getFullCargoBreakdown]);

  // Keep active SideDrawer selectedEntry synchronized with live operational updates
  useEffect(() => {
    if (!selectedEntry) return;
    const currentId = selectedEntry.id || selectedEntry.scheduleId || selectedEntry.tripId;
    const fresh = allOperationalEntries.find(
      (e) => (e.id && e.id === currentId) || (e.tripId && e.tripId === currentId)
    );
    if (fresh && fresh !== selectedEntry) {
      setSelectedEntry(fresh);
    }
  }, [allOperationalEntries]);

  // 8. Filter & Sort Active Section Entries
  const filteredEntries = useMemo(() => {
    let result = viewSection === "COMPLETED" ? completedRunEntries : liveVehicleEntries;

    // Filter by Status Dropdown
    if (statusFilter !== "ALL") {
      result = result.filter((entry) => entry.operationalStatus === statusFilter);
    }

    // Filter by Service Zone
    if (selectedZone !== "ALL") {
      result = result.filter(
        (entry) =>
          entry.zoneId === selectedZone ||
          entry.zoneCode === selectedZone ||
          entry.zoneName === selectedZone
      );
    }

    // Filter by Search Query
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        (entry) =>
          (entry.truckPlate || "").toLowerCase().includes(q) ||
          (entry.truckModel || "").toLowerCase().includes(q) ||
          (entry.driverName || "").toLowerCase().includes(q) ||
          (entry.salesName || "").toLowerCase().includes(q) ||
          (entry.zoneCode || "").toLowerCase().includes(q) ||
          (entry.zoneName || "").toLowerCase().includes(q)
      );
    }

    // Sorting
    result = [...result].sort((a, b) => {
      let valA = a[sortConfig.key] || "";
      let valB = b[sortConfig.key] || "";

      if (sortConfig.key === "operationalStatus") {
        const order = {
          OUT_ON_ROAD: 1,
          RETURNED: 2,
          FLAGGED_VARIANCE: 3,
          AWAITING_SYNC: 4,
          READY: 5,
          SETTLED: 6,
          UNAVAILABLE: 7,
        };
        valA = order[a.operationalStatus] || 99;
        valB = order[b.operationalStatus] || 99;
        if (valA !== valB) {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        }
      }

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [viewSection, liveVehicleEntries, completedRunEntries, statusFilter, selectedZone, searchTerm, sortConfig]);

  // 9. Paginated Slice for Table View
  const totalItems = filteredEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredEntries.slice(start, start + limit);
  }, [filteredEntries, page, limit]);

  // 10. Filtered Lists for Cards View (Syncing with search & zone)
  const filteredCardsData = useMemo(() => {
    const filterFn = (item) => {
      if (selectedZone !== "ALL") {
        const matchesZone =
          item.zoneId === selectedZone ||
          item.zoneCode === selectedZone ||
          item.zoneName === selectedZone;
        if (!matchesZone) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch =
          (item.truckPlate || "").toLowerCase().includes(q) ||
          (item.truckModel || "").toLowerCase().includes(q) ||
          (item.driverName || "").toLowerCase().includes(q) ||
          (item.salesName || "").toLowerCase().includes(q) ||
          (item.zoneCode || "").toLowerCase().includes(q) ||
          (item.zoneName || "").toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      return true;
    };

    return {
      activeTrips: activeTrips.filter(filterFn),
      returnedTrips: returnedTrips.filter(filterFn),
      completedTrips: completedTodayTrips.filter(filterFn),
      availableSchedules: availableSchedules.filter(filterFn),
      unavailableSchedules: unavailableSchedules.filter(filterFn),
    };
  }, [activeTrips, returnedTrips, completedTodayTrips, availableSchedules, unavailableSchedules, selectedZone, searchTerm]);

  // 11. Modal Action Handlers
  const handleEndTrip = async (tripId, payload) => {
    try {
      await tripsApi.endTrip(tripId, payload);
      localStorage.removeItem("app_trips_cache");
      localStorage.removeItem("app_fleet_cache");
      showToast(
        "success",
        "Vehicle gate return logged successfully. Vehicle is ready for dock stock check-in."
      );
      setShowEndTripModal(false);
      setSelectedTripToEnd(null);
      loadData();
    } catch (err) {
      showToast("error", err.message || "Failed to log gate return and end trip");
      throw err;
    }
  };
  const handleDispatchTrip = async (payload) => {
    try {
      await tripsApi.dispatchTrip(payload);
      showToast("success", "Vehicle departure dispatched successfully");
      setShowDispatchModal(false);
      setPrefillScheduleId("");
      loadData();
    } catch (err) {
      showToast("error", err.message || "Failed to dispatch vehicle");
      throw err;
    }
  };

  const handleAddTripLoad = async (tripId, payload) => {
    try {
      await tripsApi.addTripLoad(tripId, payload);
      showToast("success", "Midday reload recorded successfully");
      setShowMiddayModal(false);
      setSelectedTripForReload(null);
      loadData();
    } catch (err) {
      showToast("error", err.message || "Failed to log midday reload");
      throw err;
    }
  };

  const handleCancelTrip = async (tripId, payload) => {
    try {
      await tripsApi.cancelTrip(tripId, payload);
      showToast("success", "Trip cancelled successfully and returned cargo checked back in to yard.");
      setShowCancelTripModal(false);
      setSelectedTripToCancel(null);
      loadData();
    } catch (err) {
      showToast("error", err.message || "Failed to cancel trip");
      throw err;
    }
  };

  const handleCancelSchedule = async (schedule, payload) => {
    try {
      if (schedule.isTemplateDerived) {
        // Create an explicit operational schedule for today and immediately cancel it
        const created = await schedulesApi.createSchedule({
          scheduledDate: todayPht,
          truckId: schedule.truckId,
          salesUserId: schedule.salesUserId || undefined,
          zoneId: schedule.zoneId,
          notes: payload.reason,
        });
        const createdId = created?.schedule?.id || created?.id;
        if (createdId) {
          await schedulesApi.cancelSchedule(createdId, { reason: payload.reason });
        }
      } else {
        await schedulesApi.cancelSchedule(schedule.id, { reason: payload.reason });
      }
      showToast("success", `Scheduled dispatch for ${schedule.truckPlate} cancelled for today.`);
      setShowCancelScheduleModal(false);
      setSelectedScheduleToCancel(null);
      loadData();
    } catch (err) {
      showToast("error", err.message || "Failed to cancel schedule");
      throw err;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-3.5">
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Header & Interactive Controls Bar */}
      <TodayDispatchesControls
        viewSection={viewSection}
        onViewSectionChange={handleViewSectionChange}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        counts={counts}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedZone={selectedZone}
        onZoneChange={setSelectedZone}
        zonesList={zones}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        canManage={canManage}
        onOpenDispatchModal={() => {
          setPrefillScheduleId("");
          setPrefillTruckId("");
          setShowDispatchModal(true);
        }}
        onNavigateCheckIn={() => navigate("/return-checkin")}
        plantInventory={plantInventory}
      />

      {/* Main Content Area: Switchable High-Density Table vs Modular Cards */}
      <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden">
        {viewMode === "table" ? (
          <TodayDispatchesTable
            viewSection={viewSection}
            entries={paginatedEntries}
            sortConfig={sortConfig}
            onSort={handleSort}
            selectedId={selectedEntry?.id || selectedEntry?.scheduleId || selectedEntry?.tripId || selectedEntry?.truckPlate}
            onSelectEntry={(entry) => setSelectedEntry(entry)}
            onDispatch={(sched) => {
              setPrefillTruckId("");
              setPrefillScheduleId(sched.id);
              setShowDispatchModal(true);
            }}
            onDispatchAgain={(trip) => {
              setPrefillScheduleId("");
              setPrefillTruckId(trip.truckId || "");
              setShowDispatchModal(true);
            }}
            onEndTrip={(trip) => {
              setSelectedTripToEnd(trip);
              setShowEndTripModal(true);
            }}
            onCheckInReturn={(trip) => {
              navigate(`/return-checkin?tripId=${trip.id}`);
            }}
            onReconcileTrip={(trip) => {
              navigate(`/return-checkin?tripId=${trip.id}`);
            }}
            canManage={canManage}
            pagination={{
              page,
              limit,
              totalItems,
              totalPages,
              onPageChange: setPage,
              onLimitChange: (newLimit) => {
                setLimit(newLimit);
                setPage(1);
              },
              isLoading: false,
            }}
          />
        ) : (
          <TodayDispatchesCards
            viewSection={viewSection}
            statusFilter={statusFilter}
            activeTrips={filteredCardsData.activeTrips}
            returnedTrips={filteredCardsData.returnedTrips}
            completedTrips={filteredCardsData.completedTrips}
            availableSchedules={filteredCardsData.availableSchedules}
            unavailableSchedules={filteredCardsData.unavailableSchedules}
            selectedId={selectedEntry?.id || selectedEntry?.scheduleId || selectedEntry?.tripId || selectedEntry?.truckPlate}
            onSelectEntry={(entry) => setSelectedEntry(entry)}
            onDispatch={(sched) => {
              setPrefillTruckId("");
              setPrefillScheduleId(sched.id);
              setShowDispatchModal(true);
            }}
            onDispatchAgain={(trip) => {
              setPrefillScheduleId("");
              setPrefillTruckId(trip.truckId || "");
              setShowDispatchModal(true);
            }}
            onCancelSchedule={(sched) => {
              setSelectedScheduleToCancel(sched);
              setShowCancelScheduleModal(true);
            }}
            onMiddayReload={(trip) => {
              setSelectedTripForReload(trip);
              setShowMiddayModal(true);
            }}
            onEndTrip={(trip) => {
              setSelectedTripToEnd(trip);
              setShowEndTripModal(true);
            }}
            onCheckInReturn={(trip) => {
              navigate(`/return-checkin?tripId=${trip.id}`);
            }}
            onReconcileTrip={(trip) => {
              navigate(`/return-checkin?tripId=${trip.id}`);
            }}
            onCancelTrip={(trip) => {
              setSelectedTripToCancel(trip);
              setShowCancelTripModal(true);
            }}
            canManage={canManage}
            getFullCargoBreakdown={getFullCargoBreakdown}
            todayPht={todayPht}
          />
        )}
      </div>

      {/* Universal SideDrawer for Detailed Inspection */}
      <SideDrawer
        isOpen={Boolean(selectedEntry)}
        onClose={handleCloseDetail}
        title={selectedEntry?.truckPlate || "Dispatch Inspection"}
        subtitle={
          selectedEntry?.zoneName
            ? `Route: ${selectedEntry.zoneCode ? `${selectedEntry.zoneCode} — ` : ""}${selectedEntry.zoneName}`
            : selectedEntry?.truckModel || "Vehicle Asset"
        }
        icon={Truck}
        badge={
          selectedEntry && (
            <Badge
              variant={
                selectedEntry.operationalStatus === "OUT_ON_ROAD" || selectedEntry.operationalStatus === "SETTLED"
                  ? "success"
                  : selectedEntry.operationalStatus === "RETURNED" || selectedEntry.operationalStatus === "AWAITING_SYNC"
                  ? "warning"
                  : selectedEntry.operationalStatus === "UNAVAILABLE" || selectedEntry.operationalStatus === "FLAGGED_VARIANCE"
                  ? "danger"
                  : "roles"
              }
              className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
            >
              {selectedEntry.operationalStatus === "OUT_ON_ROAD"
                ? "OUT ON ROUTE"
                : selectedEntry.operationalStatus === "RETURNED"
                ? "RETURNED TO YARD"
                : selectedEntry.operationalStatus === "FLAGGED_VARIANCE"
                ? "VARIANCE"
                : selectedEntry.operationalStatus === "AWAITING_SYNC"
                ? "PENDING SALES"
                : selectedEntry.operationalStatus === "SETTLED"
                ? "SETTLED"
                : selectedEntry.operationalStatus === "UNAVAILABLE"
                ? "UNAVAILABLE"
                : "READY TO DISPATCH"}
            </Badge>
          )
        }
        width="max-w-md sm:max-w-lg"
        footer={
          selectedEntry && (
            <div className="flex items-center justify-between gap-3 w-full">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="px-5 py-2 rounded-full text-xs font-bold bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] transition-all cursor-pointer shadow-2xs uppercase tracking-wider active:scale-95"
              >
                CLOSE
              </button>

              <div className="flex items-center gap-2">
                {selectedEntry.operationalStatus === "READY" && canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      setPrefillTruckId("");
                      setPrefillScheduleId(selectedEntry.id);
                      setShowDispatchModal(true);
                    }}
                    className="px-4 py-2 rounded-full text-xs font-bold bg-[#0A4B6E] text-[#FFDF2C] hover:bg-[#0E384E] transition-all cursor-pointer shadow-2xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95"
                  >
                    {selectedEntry.isRedispatch ? (
                      <>
                        <RotateCcw size={13} strokeWidth={2.5} />
                        <span>DISPATCH AGAIN</span>
                      </>
                    ) : (
                      <>
                        <span>DISPATCH VEHICLE</span>
                        <ArrowRight size={13} strokeWidth={2.5} />
                      </>
                    )}
                  </button>
                )}
                {selectedEntry.operationalStatus === "OUT_ON_ROAD" && canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTripToEnd(selectedEntry);
                      setShowEndTripModal(true);
                    }}
                    className="px-4 py-2 rounded-full text-xs font-bold bg-[#0A4B6E] text-[#FFDF2C] hover:bg-[#0E384E] transition-all cursor-pointer shadow-2xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95"
                  >
                    <span>END TRIP</span>
                    <ArrowRight size={13} strokeWidth={2.5} />
                  </button>
                )}
                {selectedEntry.operationalStatus === "RETURNED" && canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/return-checkin?tripId=${selectedEntry.id}`);
                    }}
                    className="px-4 py-2 rounded-full text-xs font-bold bg-[#FFDF2C] text-[#0A4B6E] hover:bg-[#ebd024] transition-all cursor-pointer shadow-2xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95"
                  >
                    <span>CHECK-IN STOCK</span>
                    <ArrowRight size={13} strokeWidth={2.5} />
                  </button>
                )}
                {(selectedEntry.operationalStatus === "SETTLED" ||
                  selectedEntry.operationalStatus === "FLAGGED_VARIANCE" ||
                  selectedEntry.operationalStatus === "AWAITING_SYNC") &&
                  canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/return-checkin?tripId=${selectedEntry.id}`);
                        }}
                        className="px-3.5 py-2 rounded-full text-xs font-bold bg-white border border-slate-300 text-[#0A4B6E] hover:bg-slate-50 transition-all cursor-pointer shadow-2xs uppercase tracking-wider active:scale-95"
                      >
                        RE-RECONCILE
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPrefillScheduleId("");
                          setPrefillTruckId(selectedEntry.truckId || "");
                          setShowDispatchModal(true);
                        }}
                        className="px-4 py-2 rounded-full text-xs font-bold bg-[#FFDF2C] text-[#0A4B6E] hover:bg-[#ebd024] transition-all cursor-pointer shadow-2xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95"
                      >
                        <span>DISPATCH AGAIN</span>
                        <ArrowRight size={13} strokeWidth={2.5} />
                      </button>
                    </>
                  )}
              </div>
            </div>
          )
        }
      >
        {selectedEntry && (
          <TripDetailPanel
            entry={selectedEntry}
            trip={
              selectedEntry.operationalStatus === "OUT_ON_ROAD" ||
              selectedEntry.operationalStatus === "RETURNED" ||
              selectedEntry.isTrip
                ? selectedEntry
                : null
            }
            schedule={
              selectedEntry.operationalStatus !== "OUT_ON_ROAD" &&
              selectedEntry.operationalStatus !== "RETURNED" &&
              !selectedEntry.isTrip
                ? selectedEntry
                : null
            }
            onMiddayReload={(trip) => {
              setSelectedTripForReload(trip);
              setShowMiddayModal(true);
            }}
            onCancelTrip={(trip) => {
              setSelectedTripToCancel(trip);
              setShowCancelTripModal(true);
            }}
            onCancelSchedule={(sched) => {
              setSelectedScheduleToCancel(sched);
              setShowCancelScheduleModal(true);
            }}
            canManage={canManage}
          />
        )}
      </SideDrawer>

      {/* Operational Action Modals */}
      <DispatchModal
        isOpen={showDispatchModal}
        onClose={() => {
          setShowDispatchModal(false);
          setPrefillScheduleId("");
          setPrefillTruckId("");
        }}
        onDispatch={handleDispatchTrip}
        schedules={availableSchedules}
        allSchedules={allTodaySchedules}
        trips={trips}
        vehicles={vehicles}
        drivers={drivers}
        zones={zones}
        products={products}
        salesUsers={salesUsers}
        plantInventory={plantInventory}
        initialScheduleId={prefillScheduleId}
        initialTruckId={prefillTruckId}
      />

      <MiddayReloadModal
        isOpen={showMiddayModal}
        trip={selectedTripForReload}
        products={products}
        onClose={() => {
          setShowMiddayModal(false);
          setSelectedTripForReload(null);
        }}
        onAddLoad={handleAddTripLoad}
      />

      <CancelTripModal
        isOpen={showCancelTripModal}
        trip={selectedTripToCancel}
        products={products}
        onClose={() => {
          setShowCancelTripModal(false);
          setSelectedTripToCancel(null);
        }}
        onCancelTrip={handleCancelTrip}
      />

      <CancelScheduleModal
        isOpen={showCancelScheduleModal}
        schedule={selectedScheduleToCancel}
        onClose={() => {
          setShowCancelScheduleModal(false);
          setSelectedScheduleToCancel(null);
        }}
        onCancelSchedule={handleCancelSchedule}
      />

      {/* Yard Gate Return & End Trip Modal */}
      <EndTripModal
        isOpen={showEndTripModal}
        onClose={() => {
          setShowEndTripModal(false);
          setSelectedTripToEnd(null);
        }}
        trip={selectedTripToEnd}
        onEndTrip={handleEndTrip}
      />

      {/* Post-Trip Reconciliation Settle Modal */}
      <SettleTripModal
        isOpen={showSettleModal}
        onClose={() => {
          setShowSettleModal(false);
          setSelectedTripForSettle(null);
        }}
        trip={selectedTripForSettle}
        onSettleSuccess={(settledRecon) => {
          showToast(
            "success",
            `Trip ${selectedTripForSettle?.tripNumber} reconciliation audit settled and locked.`
          );
          setSelectedEntry(null);
          loadData();
        }}
      />
    </div>
  );
}

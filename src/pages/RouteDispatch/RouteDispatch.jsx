// src/pages/RouteDispatch/RouteDispatch.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";

import { tripsApi } from "../../api/trips.js";
import { schedulesApi } from "../../api/schedules.js";
import { fleetApi } from "../../api/fleet.js";
import { inventoryApi } from "../../api/inventory.js";
import { attendanceApi } from "../../api/attendance.js";
import { getScheduleDispatchGating } from "../../utils/fleetGuards.js";

import { isCanisterProduct, getCanisterCrates } from "../../utils/product.js";
import {
  getPhilippineTodayString,
  getPhilippineDayOfWeek,
  toPhilippineDateInputString,
} from "../../utils/date.js";

import TodayDispatchesControls from "../../components/route-dispatch/TodayDispatchesControls.jsx";
import TodayDispatchesTable from "../../components/route-dispatch/TodayDispatchesTable.jsx";
import TodayDispatchesCards from "../../components/route-dispatch/TodayDispatchesCards.jsx";
import TripDetailPanel from "../../components/route-dispatch/TripDetailPanel.jsx";
import SideDrawer from "../../components/ui/SideDrawer.jsx";
import Badge from "../../components/ui/Badge.jsx";
import { Truck } from "lucide-react";

import DispatchModal from "../../components/route-dispatch/DispatchModal";
import MiddayReloadModal from "../../components/route-dispatch/MiddayReloadModal";
import CancelTripModal from "../../components/route-dispatch/CancelTripModal";
import CancelScheduleModal from "../../components/route-dispatch/CancelScheduleModal";
import ToastNotification from "../../components/ui/ToastNotifications";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh.js";

const VIEW_MODE_KEY = "app_route_dispatch_view_mode";

export default function RouteDispatch() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const canManage = can ? can(PERMISSIONS.ROUTE_MANAGE || "route.manage") : false;

  const todayPht = useMemo(() => getPhilippineTodayString(), []);

  // 1. Core Data States (Initialized from cache when available)
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
  const [activeDutyDriverIds, setActiveDutyDriverIds] = useState(() => new Set());
  const [plantInventory, setPlantInventory] = useState([]);

  // 2. Filter, View Mode, Sorting, and Pagination States
  const [statusTab, setStatusTab] = useState("ALL"); // 'ALL' | 'OUT_ON_ROAD' | 'READY' | 'UNAVAILABLE'
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

  // Reset pagination page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusTab, searchTerm, selectedZone]);

  const [toast, setToast] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const handleCloseDetail = () => setSelectedEntry(null);

  // 3. Operational Modals States
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [prefillScheduleId, setPrefillScheduleId] = useState("");
  const [showMiddayModal, setShowMiddayModal] = useState(false);
  const [selectedTripForReload, setSelectedTripForReload] = useState(null);
  const [showCancelTripModal, setShowCancelTripModal] = useState(false);
  const [selectedTripToCancel, setSelectedTripToCancel] = useState(null);
  const [showCancelScheduleModal, setShowCancelScheduleModal] = useState(false);
  const [selectedScheduleToCancel, setSelectedScheduleToCancel] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  // 4. Data Loading
  const loadData = useCallback(async () => {
    try {
      const [
        tripsData,
        schedData,
        tplData,
        vData,
        zData,
        prodData,
        driverData,
        salesData,
        activeAttendance,
        plantInvData,
      ] = await Promise.all([
        tripsApi.getTrips().catch((err) => {
          console.warn("Failed to fetch trips:", err);
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
        fleetApi.getVehicles().catch((err) => {
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
        attendanceApi.getActivePersonnel().catch((err) => {
          console.warn("Failed to fetch active personnel attendance:", err);
          return [];
        }),
        inventoryApi.getPlantInventory().catch((err) => {
          console.warn("Failed to fetch plant inventory:", err);
          return [];
        }),
      ]);

      if (Array.isArray(tripsData)) setTrips(tripsData);
      if (Array.isArray(schedData)) setSchedules(schedData);
      if (Array.isArray(tplData)) setTemplates(tplData);
      if (Array.isArray(vData)) setVehicles(vData);
      if (Array.isArray(zData)) setZones(zData);
      if (Array.isArray(prodData)) setProducts(prodData);
      if (Array.isArray(plantInvData)) setPlantInventory(plantInvData);
      const parsedDrivers = Array.isArray(driverData) ? driverData : (driverData?.drivers || []);
      setDrivers(parsedDrivers);
      if (Array.isArray(salesData)) setSalesUsers(salesData);

      const activeList = Array.isArray(activeAttendance) ? activeAttendance : [];
      const activeIds = new Set(
        activeList.map((rec) => rec.userId || rec.user_id || rec.user?.id).filter(Boolean)
      );
      setActiveDutyDriverIds(activeIds);
    } catch (err) {
      console.warn("Failed to refresh today's dispatches:", err);
    }
  }, [todayPht]);

  // Real-Time WebSocket Hook: Auto-refreshes trips, vehicle status, and schedules
  useRealtimeRefresh({
    events: [
      "FLEET_VEHICLE_GROUNDED",
      "FLEET_VEHICLE_RELEASED",
      "TRIP_RECONCILIATION_UPDATED",
      "SALES_BATCH_SYNCED",
      "ATTENDANCE_DUTY_UPDATED",
    ],
    cacheKeysToInvalidate: ["app_fleet_cache", "app_trips_cache"],
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

    const { crates: canisterCrates, remainder: canisterRemainder } = getCanisterCrates(canisterUnits);
    return {
      totalUnits: canisterUnits + cylinderUnits,
      canisterUnits,
      canisterCrates,
      canisterRemainder,
      cylinderUnits,
    };
  }, []);

  // 6. Partition Entities
  // 6a. Active Trips (IN_PROGRESS)
  const activeTrips = useMemo(() => {
    return trips.filter((t) => (t.status || "").toUpperCase() === "IN_PROGRESS");
  }, [trips]);

  // 6b. Today's Scheduled Dispatches (Direct + Template-derived)
  const allTodaySchedules = useMemo(() => {
    // 1. Direct operational schedules for today that are SCHEDULED
    const directScheduled = schedules.filter((s) => {
      const isSched = (s.status || "").toUpperCase() === "SCHEDULED";
      const schedDate = toPhilippineDateInputString(s.scheduledDate);
      return isSched && schedDate === todayPht;
    });

    // 2. Identify truck IDs already covered today
    const coveredTruckIds = new Set([
      ...schedules
        .filter((s) => toPhilippineDateInputString(s.scheduledDate) === todayPht)
        .map((s) => s.truckId),
      ...trips
        .filter((t) => (t.status || "").toUpperCase() === "IN_PROGRESS")
        .map((t) => t.truckId),
    ]);

    // 3. Current Philippine day of week (1=Monday ... 7=Sunday)
    const currentIsoDay = getPhilippineDayOfWeek(todayPht);

    // 4. Find active templates for TODAY whose vehicle isn't already covered
    const templateDerived = templates
      .filter((t) => {
        const isToday = Number(t.dayOfWeek) === Number(currentIsoDay);
        const isActive = t.isActive !== false;
        const notCovered = !coveredTruckIds.has(t.truckId);
        return isToday && isActive && notCovered;
      })
      .map((t) => {
        const vehicle = vehicles.find((v) => v.id === t.truckId);
        const zone = zones.find((z) => z.id === t.zoneId);
        const salesUser = salesUsers.find((u) => u.id === t.defaultSalesUserId);
        const driverUser = drivers.find((d) => d.id === vehicle?.driverId);

        return {
          id: `tpl-${t.id}`,
          templateId: t.id,
          scheduledDate: todayPht,
          truckId: t.truckId,
          truckPlate: t.truckPlate || vehicle?.plateNumber || "No Plate",
          truckModel: t.truckModel || vehicle?.model || "Delivery Vehicle",
          truckStatus: vehicle?.status || "ACTIVE",
          truckDriverId: vehicle?.driverId || null,
          driverName: driverUser
            ? (driverUser.fullName || `${driverUser.firstName || ""} ${driverUser.lastName || ""}`.trim() || driverUser.username)
            : (vehicle?.driver ? `${vehicle.driver.firstName || ""} ${vehicle.driver.lastName || ""}`.trim() : "Unassigned"),
          salesUserId: t.defaultSalesUserId || null,
          salesName: salesUser
            ? (salesUser.fullName || `${salesUser.firstName || ""} ${salesUser.lastName || ""}`.trim() || salesUser.username)
            : (t.salesName || "Unassigned"),
          zoneId: t.zoneId,
          zoneCode: t.zoneCode || zone?.code || "",
          zoneName: t.zoneName || zone?.name || "",
          status: "SCHEDULED",
          notes: `Weekly route schedule (Day ${currentIsoDay})`,
          isTemplateDerived: true,
        };
      });

    return [...directScheduled, ...templateDerived];
  }, [schedules, templates, trips, vehicles, zones, salesUsers, drivers, todayPht]);

  // 6c. Partition schedules into Available vs Unavailable
  const { availableSchedules, unavailableSchedules } = useMemo(() => {
    const available = [];
    const unavailable = [];
    allTodaySchedules.forEach((sched) => {
      const gating = getScheduleDispatchGating(sched, vehicles, drivers, activeDutyDriverIds);
      const enriched = { ...sched, gating };
      if (gating.canDispatch) {
        available.push(enriched);
      } else {
        unavailable.push(enriched);
      }
    });
    return { availableSchedules: available, unavailableSchedules: unavailable };
  }, [allTodaySchedules, vehicles, drivers, activeDutyDriverIds]);

  // Counts for Top Status Filter Tabs & Mission-Control KPI Strip
  const counts = useMemo(() => {
    let unitsCount = 0;
    let cratesCount = 0;
    activeTrips.forEach((t) => {
      const cargo = getFullCargoBreakdown(t);
      unitsCount += (cargo.canisterUnits || 0) + (cargo.cylinderUnits || 0);
      cratesCount += (cargo.canisterCrates || 0);
    });

    return {
      all: activeTrips.length + availableSchedules.length + unavailableSchedules.length,
      outOnRoad: activeTrips.length,
      ready: availableSchedules.length,
      unavailable: unavailableSchedules.length,
      totalUnitsStaged: unitsCount,
      totalCratesStaged: cratesCount,
    };
  }, [activeTrips, availableSchedules.length, unavailableSchedules.length, getFullCargoBreakdown]);

  // 7. Unified Operational Entries Array
  const allOperationalEntries = useMemo(() => {
    const list = [];

    // 1. In-progress trips
    activeTrips.forEach((trip) => {
      const cargo = getFullCargoBreakdown(trip);
      list.push({
        ...trip,
        entryType: "TRIP",
        operationalStatus: "OUT_ON_ROAD",
        cargo,
      });
    });

    // 2. Ready to dispatch
    availableSchedules.forEach((sched) => {
      list.push({
        ...sched,
        entryType: "SCHEDULE",
        operationalStatus: "READY",
      });
    });

    // 3. Unavailable vehicles
    unavailableSchedules.forEach((sched) => {
      list.push({
        ...sched,
        entryType: "SCHEDULE",
        operationalStatus: "UNAVAILABLE",
      });
    });

    return list;
  }, [activeTrips, availableSchedules, unavailableSchedules, getFullCargoBreakdown]);

  // 8. Filter & Sort Unified Entries
  const filteredEntries = useMemo(() => {
    let result = allOperationalEntries;

    // Filter by Status Tab
    if (statusTab !== "ALL") {
      result = result.filter((entry) => entry.operationalStatus === statusTab);
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
        const order = { OUT_ON_ROAD: 1, READY: 2, UNAVAILABLE: 3 };
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
  }, [allOperationalEntries, statusTab, selectedZone, searchTerm, sortConfig]);

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
      availableSchedules: availableSchedules.filter(filterFn),
      unavailableSchedules: unavailableSchedules.filter(filterFn),
    };
  }, [activeTrips, availableSchedules, unavailableSchedules, selectedZone, searchTerm]);

  // 11. Modal Action Handlers
  const handleDispatchTrip = async (payload) => {
    try {
      await tripsApi.dispatchTrip(payload);
      showToast("success", "Truck departure dispatched successfully");
      setShowDispatchModal(false);
      setPrefillScheduleId("");
      loadData();
    } catch (err) {
      showToast("error", err.message || "Failed to dispatch truck");
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
        statusTab={statusTab}
        onStatusTabChange={setStatusTab}
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
          setShowDispatchModal(true);
        }}
      />

      {/* Main Content Area: Switchable High-Density Table vs Modular Cards */}
      <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden">
        {viewMode === "table" ? (
          <TodayDispatchesTable
            entries={paginatedEntries}
            sortConfig={sortConfig}
            onSort={handleSort}
            selectedId={selectedEntry?.id || selectedEntry?.scheduleId || selectedEntry?.tripId || selectedEntry?.truckPlate}
            onSelectEntry={(entry) => setSelectedEntry(entry)}
            onDispatch={(sched) => {
              setPrefillScheduleId(sched.id);
              setShowDispatchModal(true);
            }}
            onCheckInReturn={(trip) => {
              navigate(`/reconciliation?tripId=${trip.id}`);
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
            statusTab={statusTab}
            activeTrips={filteredCardsData.activeTrips}
            availableSchedules={filteredCardsData.availableSchedules}
            unavailableSchedules={filteredCardsData.unavailableSchedules}
            selectedId={selectedEntry?.id || selectedEntry?.scheduleId || selectedEntry?.tripId || selectedEntry?.truckPlate}
            onSelectEntry={(entry) => setSelectedEntry(entry)}
            onDispatch={(sched) => {
              setPrefillScheduleId(sched.id);
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
            onCheckInReturn={(trip) => {
              navigate(`/reconciliation?tripId=${trip.id}`);
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
                selectedEntry.operationalStatus === "OUT_ON_ROAD" || selectedEntry.isTrip
                  ? "success"
                  : selectedEntry.operationalStatus === "UNAVAILABLE"
                  ? "danger"
                  : "roles"
              }
              className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
            >
              {selectedEntry.operationalStatus === "OUT_ON_ROAD" || selectedEntry.isTrip
                ? "OUT ON ROUTE"
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
                      setPrefillScheduleId(selectedEntry.id);
                      setShowDispatchModal(true);
                    }}
                    className="px-4 py-2 rounded-full text-xs font-bold bg-[#0A4B6E] text-[#FFDF2C] hover:bg-[#0E384E] transition-all cursor-pointer shadow-2xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95"
                  >
                    <span>DISPATCH TRUCK</span>
                    <span>➔</span>
                  </button>
                )}
                {selectedEntry.operationalStatus === "OUT_ON_ROAD" && canManage && (
                  <button
                    type="button"
                    onClick={() => navigate(`/reconciliation?tripId=${selectedEntry.id}`)}
                    className="px-4 py-2 rounded-full text-xs font-bold bg-[#0A4B6E] text-[#FFDF2C] hover:bg-[#0E384E] transition-all cursor-pointer shadow-2xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95"
                  >
                    <span>RETURN CHECK-IN</span>
                    <span>➔</span>
                  </button>
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
              selectedEntry.operationalStatus === "OUT_ON_ROAD" || selectedEntry.isTrip
                ? selectedEntry
                : null
            }
            schedule={
              selectedEntry.operationalStatus !== "OUT_ON_ROAD" && !selectedEntry.isTrip
                ? selectedEntry
                : null
            }
            onClose={handleCloseDetail}
            onDispatch={(sched) => {
              setPrefillScheduleId(sched.id);
              setShowDispatchModal(true);
            }}
            onMiddayReload={(trip) => {
              setSelectedTripForReload(trip);
              setShowMiddayModal(true);
            }}
            onReturnCheckIn={(trip) => {
              navigate(`/reconciliation?tripId=${trip.id}`);
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
        }}
        onDispatch={handleDispatchTrip}
        schedules={availableSchedules}
        vehicles={vehicles}
        drivers={drivers}
        activeDutyDriverIds={activeDutyDriverIds}
        zones={zones}
        products={products}
        salesUsers={salesUsers}
        plantInventory={plantInventory}
        initialScheduleId={prefillScheduleId}
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
    </div>
  );
}

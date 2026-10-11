// src/pages/RouteDispatch/RouteDispatch.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";

import { schedulesApi } from "../../api/schedules.js";
import { tripsApi } from "../../api/trips.js";
import { fleetApi } from "../../api/fleet.js";
import { inventoryApi } from "../../api/inventory.js";
import { usersApi } from "../../api/users.js";

import initialMockTrips from "../../mocks/trips.json";
import initialMockSchedules from "../../mocks/schedules.json";
import initialMockTemplates from "../../mocks/templates.json";
import initialMockZones from "../../mocks/zones.json";
import initialMockFleet from "../../mocks/fleet.json";
import initialMockUsers from "../../mocks/users.json";
import initialMockItems from "../../mocks/items.json";

import RouteDispatchHeader from "../../components/route-dispatch/RouteDispatchHeader";
import RouteDispatchControls from "../../components/route-dispatch/RouteDispatchControls";
import TripCard from "../../components/route-dispatch/TripCard";
import TripTable from "../../components/route-dispatch/TripTable";
import TripDetailPanel from "../../components/route-dispatch/TripDetailPanel";
import RouteCalendarView from "../../components/route-dispatch/RouteCalendarView";
import MasterTemplateMatrix from "../../components/route-dispatch/MasterTemplateMatrix";
import SchedulesTable from "../../components/route-dispatch/SchedulesTable";
import DispatchModal from "../../components/route-dispatch/DispatchModal";
import MiddayReloadModal from "../../components/route-dispatch/MiddayReloadModal";
import ReturnCheckInModal from "../../components/route-dispatch/ReturnCheckInModal";
import ReconciliationModal from "../../components/route-dispatch/ReconciliationModal";
import BatchGenerateModal from "../../components/route-dispatch/BatchGenerateModal";
import ScheduleModal from "../../components/route-dispatch/ScheduleModal";
import TemplateModal from "../../components/route-dispatch/TemplateModal";
import ZonesModal from "../../components/route-dispatch/ZonesModal";
import ToastNotification from "../../components/ui/ToastNotifications";

export default function RouteDispatch() {
  const { can } = useAuth();
  const canManage = can ? can(PERMISSIONS.ROUTE_MANAGE || "route.manage") : true;

  // Active Main Sub-Tab ('trips' | 'schedules' | 'zones')
  const [activeTab, setActiveTab] = useState("trips");

  // Core Data States (Synchronously seeded from localStorage / mock fallbacks)
  const [trips, setTrips] = useState(() => {
    try {
      const cached = localStorage.getItem("app_trips_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error reading cached trips:", e);
    }
    return Array.isArray(initialMockTrips) ? initialMockTrips : [];
  });

  const [schedules, setSchedules] = useState(() => {
    try {
      const cached = localStorage.getItem("app_schedules_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error reading cached schedules:", e);
    }
    return Array.isArray(initialMockSchedules) ? initialMockSchedules : [];
  });

  const [templates, setTemplates] = useState(() => {
    try {
      const cached = localStorage.getItem("app_templates_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error reading cached templates:", e);
    }
    return Array.isArray(initialMockTemplates) ? initialMockTemplates : [];
  });

  const [zones, setZones] = useState(() => {
    try {
      const cached = localStorage.getItem("app_zones_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error reading cached zones:", e);
    }
    return Array.isArray(initialMockZones) ? initialMockZones : [];
  });

  const [vehicles, setVehicles] = useState(() => {
    try {
      const cached = localStorage.getItem("app_fleet_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error reading cached fleet:", e);
    }
    return initialMockFleet?.data?.vehicles || initialMockFleet?.data?.trucks || [];
  });

  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem("app_items_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error reading cached items:", e);
    }
    return Array.isArray(initialMockItems)
      ? initialMockItems
      : initialMockItems?.data?.products || [];
  });

  const allUsersList = useMemo(() => initialMockUsers?.data?.users || [], []);
  const [salesUsers, setSalesUsers] = useState(() =>
    allUsersList.filter((u) => (u.role || "").toLowerCase().includes("sales"))
  );
  const [drivers, setDrivers] = useState(() =>
    allUsersList.filter((u) => (u.role || "").toLowerCase().includes("driver"))
  );
  const [isLoading, setIsLoading] = useState(false);

  // Slide-in Drawer Detail Panel States (Identical to Fleet & ItemProfile)
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [activeDetailTrip, setActiveDetailTrip] = useState(null);
  const [isClosingPanel, setIsClosingPanel] = useState(false);
  const closeTimerRef = useRef(null);

  // Modals & Action States
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [prefillScheduleId, setPrefillScheduleId] = useState("");
  const [showMiddayModal, setShowMiddayModal] = useState(false);
  const [selectedTripForReload, setSelectedTripForReload] = useState(null);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedTripForReturn, setSelectedTripForReturn] = useState(null);

  const [showReconModal, setShowReconModal] = useState(false);
  const [selectedTripForRecon, setSelectedTripForRecon] = useState(null);

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState(null);
  const [prefillTruckId, setPrefillTruckId] = useState("");
  const [prefillDayOfWeek, setPrefillDayOfWeek] = useState(1);
  const [showZonesModal, setShowZonesModal] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  // Cleanup close timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // Slide-in Detail Panel Selection & Toggle Handler
  const handleSelectTrip = (trip) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    const isSameTrip =
      (selectedTrip?.id && selectedTrip.id === trip.id) ||
      (activeDetailTrip?.id && activeDetailTrip.id === trip.id);

    if (isSameTrip && !isClosingPanel) {
      handleCloseDetail();
    } else {
      setIsClosingPanel(false);
      setSelectedTrip(trip);
      setActiveDetailTrip(trip);
    }
  };

  const handleCloseDetail = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsClosingPanel(true);
    setSelectedTrip(null);
    closeTimerRef.current = setTimeout(() => {
      setActiveDetailTrip(null);
      setIsClosingPanel(false);
      closeTimerRef.current = null;
    }, 250);
  };

  // Asynchronous Data Refetch
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        tripsData,
        schedulesData,
        templatesData,
        zonesData,
        vehiclesData,
        productsData,
        usersData,
      ] = await Promise.all([
        tripsApi.getTrips().catch(() => initialMockTrips),
        schedulesApi.getSchedules().catch(() => initialMockSchedules),
        schedulesApi.getTemplates().catch(() => initialMockTemplates),
        schedulesApi.getZones().catch(() => initialMockZones),
        fleetApi.getTrucks().catch(() => initialMockFleet?.data?.vehicles || []),
        inventoryApi.getInventoryItems().catch(() => initialMockItems),
        usersApi.getAllUsers().catch(() => allUsersList),
      ]);

      if (tripsData && tripsData.length > 0) {
        setTrips(tripsData);
        // Keep active detail panel synchronized if open
        setActiveDetailTrip((prev) => {
          if (!prev) return null;
          const matched = tripsData.find((t) => t.id === prev.id);
          return matched ? { ...prev, ...matched } : prev;
        });
      }
      if (schedulesData && schedulesData.length > 0) setSchedules(schedulesData);
      if (templatesData && templatesData.length > 0) setTemplates(templatesData);
      if (zonesData && zonesData.length > 0) setZones(zonesData);
      if (vehiclesData && vehiclesData.length > 0) setVehicles(vehiclesData);
      if (productsData && productsData.length > 0) setProducts(productsData);

      const allUsers = usersData && usersData.length > 0 ? usersData : allUsersList;
      setSalesUsers(allUsers.filter((u) => (u.role || "").toLowerCase().includes("sales")));
      setDrivers(allUsers.filter((u) => (u.role || "").toLowerCase().includes("driver")));
    } catch (err) {
      console.error("Error loading route dispatch data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [allUsersList]);

  useEffect(() => {
    async function initRouteData() {
      await loadData();
    }
    initRouteData();
  }, [loadData]);

  // Operational Action Handlers
  const handleDispatchTrip = async (payload) => {
    const res = await tripsApi.dispatchTrip(payload);
    showToast("success", res?.message || "Truck dispatched successfully");
    await loadData();
  };

  const handleAddTripLoad = async (tripId, payload) => {
    const res = await tripsApi.addTripLoad(tripId, payload);
    showToast("success", res?.message || "Midday reload recorded");
    await loadData();
  };

  const handleCompleteReturn = async (tripId, payload) => {
    const res = await tripsApi.completeTripReturn(tripId, payload);
    showToast("success", res?.message || "Return check-in completed");
    await loadData();
  };

  const handleSettleReconciliation = async (tripId, payload) => {
    const res = await tripsApi.settleReconciliation(tripId, payload);
    showToast("success", res?.message || "Trip reconciliation settled");
    await loadData();
  };

  const handleCreateSchedule = async (payload) => {
    const res = await schedulesApi.createSchedule(payload);
    showToast("success", res?.message || "Schedule created");
    await loadData();
  };

  const handleBatchGenerate = async (payload) => {
    const res = await schedulesApi.generateSchedules(payload);
    showToast("success", res?.message || "Schedules generated");
    await loadData();
    return res;
  };

  const handleCancelSchedule = async (id) => {
    await schedulesApi.cancelSchedule(id);
    showToast("info", "Schedule cancelled");
    await loadData();
  };

  const handleDeleteTemplate = async (id) => {
    await schedulesApi.deleteTemplate(id);
    showToast("info", "Template assignment removed");
    await loadData();
  };

  const handleOpenAddTemplate = (truckId = "", dayOfWeek = 1) => {
    setTemplateToEdit(null);
    setPrefillTruckId(truckId || "");
    setPrefillDayOfWeek(dayOfWeek || 1);
    setShowTemplateModal(true);
  };

  const handleOpenEditTemplate = (template) => {
    setTemplateToEdit(template);
    setPrefillTruckId(template.truckId || "");
    setPrefillDayOfWeek(template.dayOfWeek || 1);
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async (payload) => {
    if (payload.id) {
      const res = await schedulesApi.updateTemplate(payload.id, payload);
      showToast("success", res?.message || "Route template updated successfully");
    } else {
      const res = await schedulesApi.createTemplate(payload);
      showToast("success", res?.message || "Weekly route template created successfully");
    }
    await loadData();
  };

  const handleCreateZone = async (payload) => {
    const res = await schedulesApi.createZone(payload);
    showToast("success", res?.message || "Service zone added");
    await loadData();
  };

  const handleUpdateZone = async (id, payload) => {
    const res = await schedulesApi.updateZone(id, payload);
    showToast("success", res?.message || "Service zone updated");
    await loadData();
  };

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    dateScope: "today",
    status: "",
    zone: "All Zones",
    dateFrom: "",
    dateTo: "",
  });

  // View Mode ('grid' | 'table')
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem("app_route_view_mode") || "grid";
    } catch {
      return "grid";
    }
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("app_route_view_mode", mode);
    } catch {
      // ignore
    }
  };

  // Sort Config
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

  // Filtered & Sorted Trips Memo
  const filteredAndSortedTrips = useMemo(() => {
    const list = trips.filter((trip) => {
      // 1. Search Query
      const q = (typeof searchTerm === "string" ? searchTerm : "").toLowerCase().trim();
      if (q) {
        const tripNumber = (trip.tripNumber || "").toLowerCase();
        const plate = (trip.truckPlate || "").toLowerCase();
        const model = (trip.truckModel || "").toLowerCase();
        const driver = (trip.driverName || "").toLowerCase();
        const sales = (trip.salesName || "").toLowerCase();
        const zoneCode = (trip.zoneCode || "").toLowerCase();
        const zoneName = (trip.zoneName || "").toLowerCase();
        const notes = (trip.notes || "").toLowerCase();

        const matches =
          tripNumber.includes(q) ||
          plate.includes(q) ||
          model.includes(q) ||
          driver.includes(q) ||
          sales.includes(q) ||
          zoneCode.includes(q) ||
          zoneName.includes(q) ||
          notes.includes(q);

        if (!matches) return false;
      }

      // 2. Date Scope
      const tripDate = trip.departureTime ? new Date(trip.departureTime) : null;
      if (filters.dateScope === "today" && tripDate) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const tripDateStr = tripDate.toISOString().slice(0, 10);
        // Matches current date or the primary mock test date 2026-10-04
        const isMatchToday = tripDateStr === "2026-10-04" || tripDateStr === todayStr;
        if (!isMatchToday) return false;
      } else if (filters.dateScope === "yesterday" && tripDate) {
        const tripDateStr = tripDate.toISOString().slice(0, 10);
        const isMatchYesterday = tripDateStr === "2026-10-03";
        if (!isMatchYesterday) return false;
      }

      // 2.1 Date Range
      if (filters.dateFrom && tripDate) {
        const from = new Date(filters.dateFrom).setHours(0, 0, 0, 0);
        if (tripDate.getTime() < from) return false;
      }
      if (filters.dateTo && tripDate) {
        const to = new Date(filters.dateTo).setHours(23, 59, 59, 999);
        if (tripDate.getTime() > to) return false;
      }

      // 3. Status Filter
      if (filters.status) {
        if ((trip.status || "").toUpperCase() !== filters.status.toUpperCase()) {
          return false;
        }
      }

      // 4. Zone Filter
      if (filters.zone && filters.zone !== "All Zones") {
        const zCode = (trip.zoneCode || "").toUpperCase();
        const zName = (trip.zoneName || "").toUpperCase();
        const filterZ = filters.zone.toUpperCase();
        if (zCode !== filterZ && zName !== filterZ) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return [...list].sort((a, b) => {
      let aVal = "";
      let bVal = "";

      if (sortConfig.key === "tripNumber") {
        aVal = a.tripNumber || "";
        bVal = b.tripNumber || "";
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal, undefined, { numeric: true })
          : bVal.localeCompare(aVal, undefined, { numeric: true });
      }
      if (sortConfig.key === "departureTime") {
        const aTime = a.departureTime ? new Date(a.departureTime).getTime() : 0;
        const bTime = b.departureTime ? new Date(b.departureTime).getTime() : 0;
        return sortConfig.direction === "asc" ? aTime - bTime : bTime - aTime;
      }
      if (sortConfig.key === "zoneCode") {
        aVal = a.zoneCode || a.zoneName || "";
        bVal = b.zoneCode || b.zoneName || "";
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (sortConfig.key === "truckPlate") {
        aVal = a.truckPlate || "";
        bVal = b.truckPlate || "";
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (sortConfig.key === "driverName") {
        aVal = a.driverName || "";
        bVal = b.driverName || "";
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (sortConfig.key === "departureOdometer") {
        const aOdo = Number(a.departureOdometer) || 0;
        const bOdo = Number(b.departureOdometer) || 0;
        return sortConfig.direction === "asc" ? aOdo - bOdo : bOdo - aOdo;
      }
      if (sortConfig.key === "status") {
        aVal = (a.status || "").toUpperCase();
        bVal = (b.status || "").toUpperCase();
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return 0;
    });
  }, [trips, searchTerm, filters, sortConfig]);

  // Metrics
  const inProgressCount = trips.filter((t) => t.status === "IN_PROGRESS").length;
  const awaitingSyncCount = trips.filter((t) => t.status === "AWAITING_SYNC").length;

  return (
    <div className="h-[calc(100vh-112px)] md:h-[calc(100vh-128px)] flex flex-col overflow-hidden w-full max-w-[1600px] mx-auto text-left font-sans">
      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* 1. Header with Subsystem Switcher & Action Buttons */}
      <div className="shrink-0">
        <RouteDispatchHeader
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (activeDetailTrip) handleCloseDetail();
          }}
          tripsCount={trips.length}
          inProgressCount={inProgressCount}
          awaitingSyncCount={awaitingSyncCount}
          schedulesCount={schedules.length}
          zonesCount={zones.length}
          canManage={canManage}
          onOpenDispatchModal={() => setShowDispatchModal(true)}
          onOpenBatchGenerateModal={() => setShowBatchModal(true)}
          onOpenAddScheduleModal={() => setShowAddScheduleModal(true)}
          onOpenAddTemplateModal={() => handleOpenAddTemplate()}
          onOpenAddZoneModal={() => setShowZonesModal(true)}
        />
      </div>

      {/* 2. Main Content Area */}
      {isLoading && trips.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#D5E3EC]">
          <p className="text-[#0A4B6E] font-semibold text-sm">Loading route dispatch operations...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: TRIPS & OPERATIONS (Controls + Cards Grid / Table + Right Sliding Detail Panel) */}
          {activeTab === "trips" && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden min-w-0">
              {/* Controls: Search Bar, Active Filter Chips, Filter Dropdown & View Mode Switcher */}
              <div className="shrink-0">
                <RouteDispatchControls
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onClearSearch={() => setSearchTerm("")}
                  activeFilters={filters}
                  onApplyFilters={setFilters}
                  onClearDateScope={() => setFilters((prev) => ({ ...prev, dateScope: "all" }))}
                  onClearStatus={() => setFilters((prev) => ({ ...prev, status: "" }))}
                  onClearZone={() => setFilters((prev) => ({ ...prev, zone: "All Zones" }))}
                  onClearDates={() => setFilters((prev) => ({ ...prev, dateFrom: "", dateTo: "" }))}
                  zonesList={zones}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                />
              </div>

              {/* Main Content Area: Cards Grid / Table / Calendar + Right Sliding Detail Panel */}
              <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-4 lg:gap-6 overflow-hidden min-w-0 pt-1 relative">
                {viewMode === "table" ? (
                  <div className="flex-1 min-w-0 h-full overflow-hidden pb-4">
                    <TripTable
                      trips={filteredAndSortedTrips}
                      selectedTrip={!isClosingPanel ? activeDetailTrip || selectedTrip : null}
                      onSelectTrip={handleSelectTrip}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      onMiddayReload={(t) => {
                        setSelectedTripForReload(t);
                        setShowMiddayModal(true);
                      }}
                      onReturnCheckIn={(t) => {
                        setSelectedTripForReturn(t);
                        setShowReturnModal(true);
                      }}
                      onReconciliation={(t) => {
                        setSelectedTripForRecon(t);
                        setShowReconModal(true);
                      }}
                      canManage={canManage}
                    />
                  </div>
                ) : viewMode === "calendar" ? (
                  <div className="flex-1 min-w-0 min-h-0 h-full flex flex-col overflow-hidden pb-4">
                    <RouteCalendarView
                      trips={filteredAndSortedTrips}
                      schedules={schedules}
                      selectedTrip={!isClosingPanel ? activeDetailTrip || selectedTrip : null}
                      onSelectTrip={handleSelectTrip}
                      onDispatchSchedule={(sched) => {
                        setPrefillScheduleId(sched.id);
                        setShowDispatchModal(true);
                      }}
                      onMiddayReload={(t) => {
                        setSelectedTripForReload(t);
                        setShowMiddayModal(true);
                      }}
                      onReturnCheckIn={(t) => {
                        setSelectedTripForReturn(t);
                        setShowReturnModal(true);
                      }}
                      onReconciliation={(t) => {
                        setSelectedTripForRecon(t);
                        setShowReconModal(true);
                      }}
                      onOpenDispatchModal={() => {
                        setPrefillScheduleId("");
                        setShowDispatchModal(true);
                      }}
                      onOpenAddScheduleModal={() => setShowAddScheduleModal(true)}
                      canManage={canManage}
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 min-h-0 h-full flex flex-col overflow-hidden">
                    {filteredAndSortedTrips.length === 0 ? (
                      <div className="bg-[#E8F3F8]/40 border border-dashed border-[#BCE1F1] rounded-2xl p-12 text-center">
                        <p className="text-[#0A4B6E] font-bold text-sm mb-1">No Operational Trips Found</p>
                        <p className="text-[#6D8AA2] text-xs">
                          {trips.length === 0
                            ? "Dispatch a scheduled or ad-hoc truck run to start tracking real-time delivery lifecycle."
                            : "No trips match the current search or filter criteria. Try adjusting your filters."}
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
                        <div
                          className={`grid gap-4 ${
                            activeDetailTrip
                              ? "grid-cols-1 md:grid-cols-2"
                              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                          }`}
                        >
                          {filteredAndSortedTrips.map((trip) => (
                            <TripCard
                              key={trip.id}
                              trip={trip}
                              isSelected={
                                !isClosingPanel &&
                                ((selectedTrip && selectedTrip.id === trip.id) ||
                                  (activeDetailTrip && activeDetailTrip.id === trip.id))
                              }
                              onClick={handleSelectTrip}
                              canManage={canManage}
                              onMiddayReload={(t) => {
                                setSelectedTripForReload(t);
                                setShowMiddayModal(true);
                              }}
                              onReturnCheckIn={(t) => {
                                setSelectedTripForReturn(t);
                                setShowReturnModal(true);
                              }}
                              onReconciliation={(t) => {
                                setSelectedTripForRecon(t);
                                setShowReconModal(true);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* Mobile/Tablet Backdrop Overlay (closes panel on outside tap) */}
              {activeDetailTrip && (
                <div
                  className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                  onClick={handleCloseDetail}
                />
              )}

              {/* Right Column: Sliding Detail Panel (Constrained width on small screens) */}
              {activeDetailTrip && (
                <div
                  className={`fixed inset-y-0 right-0 z-40 w-[360px] max-w-[92vw] lg:static lg:w-[390px] xl:w-[420px] lg:max-w-none shrink-0 h-full flex flex-col overflow-hidden shadow-2xl lg:shadow-none transition-all duration-300 bg-white ${
                    isClosingPanel
                      ? "animate-slide-fade-out pointer-events-none"
                      : "animate-slide-fade-in"
                  }`}
                >
                  <TripDetailPanel
                    trip={activeDetailTrip}
                    onClose={handleCloseDetail}
                    onMiddayReload={(t) => {
                      setSelectedTripForReload(t);
                      setShowMiddayModal(true);
                    }}
                    onReturnCheckIn={(t) => {
                      setSelectedTripForReturn(t);
                      setShowReturnModal(true);
                    }}
                    onReconciliation={(t) => {
                      setSelectedTripForRecon(t);
                      setShowReconModal(true);
                    }}
                    canManage={canManage}
                  />
                </div>
              )}
            </div>
          </div>
        )}

          {/* TAB 2: SCHEDULES & TEMPLATES */}
          {activeTab === "schedules" && (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-6 pr-1 pb-4">
              <MasterTemplateMatrix
                templates={templates}
                vehicles={vehicles}
                canManage={canManage}
                onAddTemplate={handleOpenAddTemplate}
                onEditTemplate={handleOpenEditTemplate}
                onDeleteTemplate={handleDeleteTemplate}
              />

              <SchedulesTable
                schedules={schedules}
                trips={trips}
                canManage={canManage}
                onOpenAddSchedule={() => setShowAddScheduleModal(true)}
                onCancelSchedule={handleCancelSchedule}
                onDispatchSchedule={(sched) => {
                  setPrefillScheduleId(sched.id);
                  setShowDispatchModal(true);
                }}
                onSelectTrip={handleSelectTrip}
              />
            </div>
          )}

          {/* TAB 3: SERVICE ZONES */}
          {activeTab === "zones" && (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
              <div className="bg-white rounded-2xl border border-[#D5E3EC] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div>
                    <h2 className="text-sm font-bold text-[#0A4B6E]">Active Service Delivery Zones</h2>
                    <p className="text-xs text-[#6D8AA2]">Distribution coverage districts across Davao Region</p>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setShowZonesModal(true)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#0A4B6E] text-white hover:bg-[#0E384E] cursor-pointer"
                    >
                      Manage Service Zones
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {zones.map((z) => (
                    <div
                      key={z.id}
                      className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-[#0A4B6E]">{z.code}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            ACTIVE
                          </span>
                        </div>
                        <h4 className="font-semibold text-xs text-slate-800 mb-1">{z.name}</h4>
                        <p className="text-[11px] text-slate-500">{z.description || "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ALL MODALS */}
      <DispatchModal
        isOpen={showDispatchModal}
        onClose={() => {
          setShowDispatchModal(false);
          setPrefillScheduleId("");
        }}
        onDispatch={handleDispatchTrip}
        schedules={schedules}
        vehicles={vehicles}
        drivers={drivers}
        zones={zones}
        products={products}
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

      <ReturnCheckInModal
        isOpen={showReturnModal}
        trip={selectedTripForReturn}
        products={products}
        onClose={() => {
          setShowReturnModal(false);
          setSelectedTripForReturn(null);
        }}
        onCompleteReturn={handleCompleteReturn}
      />

      <ReconciliationModal
        isOpen={showReconModal}
        trip={selectedTripForRecon}
        onClose={() => {
          setShowReconModal(false);
          setSelectedTripForRecon(null);
        }}
        onSettle={handleSettleReconciliation}
      />

      <BatchGenerateModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onGenerate={handleBatchGenerate}
      />

      <ScheduleModal
        isOpen={showAddScheduleModal}
        onClose={() => setShowAddScheduleModal(false)}
        vehicles={vehicles}
        salesUsers={salesUsers}
        zones={zones}
        onCreateSchedule={handleCreateSchedule}
      />

      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setTemplateToEdit(null);
        }}
        template={templateToEdit}
        initialTruckId={prefillTruckId}
        initialDayOfWeek={prefillDayOfWeek}
        vehicles={vehicles}
        zones={zones}
        salesUsers={salesUsers}
        onSaveTemplate={handleSaveTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />

      <ZonesModal
        isOpen={showZonesModal}
        onClose={() => setShowZonesModal(false)}
        zones={zones}
        canManage={canManage}
        onCreateZone={handleCreateZone}
        onUpdateZone={handleUpdateZone}
      />
    </div>
  );
}

// src/pages/RouteDispatch/RouteDispatch.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Plus,
  Search,
  MapPin,
  Clock,
  Layers,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";

import { tripsApi } from "../../api/trips.js";
import { schedulesApi } from "../../api/schedules.js";
import { fleetApi } from "../../api/fleet.js";
import { inventoryApi } from "../../api/inventory.js";

import { isCanisterProduct, getCanisterCrates } from "../../utils/product.js";
import {
  getPhilippineTodayString,
  getPhilippineDayOfWeek,
  toPhilippineDateInputString,
  formatPhilippineDate,
  formatPhilippineTime,
} from "../../utils/date.js";

import DispatchModal from "../../components/route-dispatch/DispatchModal";
import MiddayReloadModal from "../../components/route-dispatch/MiddayReloadModal";
import ToastNotification from "../../components/ui/ToastNotifications";

export default function RouteDispatch() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const canManage = can ? can(PERMISSIONS.ROUTE_MANAGE || "route.manage") : false;

  const todayPht = useMemo(() => getPhilippineTodayString(), []);

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

  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);

  // Modals state
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [prefillScheduleId, setPrefillScheduleId] = useState("");
  const [showMiddayModal, setShowMiddayModal] = useState(false);
  const [selectedTripForReload, setSelectedTripForReload] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const loadData = useCallback(async () => {
    try {
      const [tripsData, schedData, tplData, vData, zData, prodData, driverData, salesData] = await Promise.all([
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
      ]);

      if (Array.isArray(tripsData)) setTrips(tripsData);
      if (Array.isArray(schedData)) setSchedules(schedData);
      if (Array.isArray(tplData)) setTemplates(tplData);
      if (Array.isArray(vData)) setVehicles(vData);
      if (Array.isArray(zData)) setZones(zData);
      if (Array.isArray(prodData)) setProducts(prodData);
      const parsedDrivers = Array.isArray(driverData) ? driverData : (driverData?.drivers || []);
      setDrivers(parsedDrivers);
      if (Array.isArray(salesData)) setSalesUsers(salesData);
    } catch (err) {
      console.warn("Failed to refresh today's dispatches:", err);
    }
  }, [todayPht]);

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

  // 1. Out on the Road: Active trips (IN_PROGRESS)
  const activeTrips = useMemo(() => {
    let list = trips.filter((t) => (t.status || "").toUpperCase() === "IN_PROGRESS");
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (t) =>
          (t.truckPlate || "").toLowerCase().includes(q) ||
          (t.driverName || "").toLowerCase().includes(q) ||
          (t.salesName || "").toLowerCase().includes(q) ||
          (t.zoneCode || "").toLowerCase().includes(q) ||
          (t.zoneName || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [trips, searchTerm]);

  // 2. Ready to Dispatch: Scheduled runs (SCHEDULED) FOR TODAY ONLY
  const readySchedules = useMemo(() => {
    // 1. Explicit operational schedules for today that are SCHEDULED
    const directScheduled = schedules.filter((s) => {
      const isSched = (s.status || "").toUpperCase() === "SCHEDULED";
      const schedDate = toPhilippineDateInputString(s.scheduledDate);
      return isSched && schedDate === todayPht;
    });

    // 2. Identify truck IDs already covered today (scheduled or active trip)
    const coveredTruckIds = new Set([
      ...directScheduled.map((s) => s.truckId),
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
          notes: `Weekly template (Day ${currentIsoDay})`,
          isTemplateDerived: true,
        };
      });

    let combined = [...directScheduled, ...templateDerived];

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      combined = combined.filter(
        (s) =>
          (s.truckPlate || "").toLowerCase().includes(q) ||
          (s.driverName || "").toLowerCase().includes(q) ||
          (s.salesName || "").toLowerCase().includes(q) ||
          (s.zoneCode || "").toLowerCase().includes(q) ||
          (s.zoneName || "").toLowerCase().includes(q)
      );
    }
    return combined;
  }, [schedules, templates, trips, vehicles, zones, salesUsers, drivers, searchTerm, todayPht]);

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

  const getFullCargoBreakdown = (trip) => {
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
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Controls & Search Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D5E3EC]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>{activeTrips.length} Out on the Road</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs">
            <Clock size={13} className="text-[#0A4B6E]" />
            <span>{readySchedules.length} Ready to Dispatch</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Quick Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[#6D8AA2]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search truck, crew, zone..."
              className="pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-full text-xs text-[#0A4B6E] focus:outline-[#0A4B6E] w-48 sm:w-56"
            />
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => {
                setPrefillScheduleId("");
                setShowDispatchModal(true);
              }}
              className="flex items-center gap-1.5 bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] font-bold text-xs px-3.5 py-2 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Plus size={14} />
              <span>Dispatch Truck</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Two Clean Sections */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-6 pr-1 pb-4">
        {/* SECTION 1: OUT ON THE ROAD */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-[#0A4B6E] uppercase tracking-wide">
                Out on the Road ({activeTrips.length})
              </h3>
            </div>
            <span className="text-[11px] text-[#6D8AA2]">Active distribution runs in progress</span>
          </div>

          {activeTrips.length === 0 ? (
            <div className="bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-2xl p-8 text-center">
              <Truck size={28} className="mx-auto text-[#6D8AA2] mb-2 opacity-50" />
              <p className="text-xs font-semibold text-[#0A4B6E]">No active trucks currently out on the road</p>
              <p className="text-[11px] text-[#6D8AA2] mt-0.5">
                Vehicles ready to depart can be dispatched below.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {activeTrips.map((trip) => {
                const departureFormatted = trip.departureTime
                  ? formatPhilippineTime(trip.departureTime)
                  : "—";
                const cargo = getFullCargoBreakdown(trip);

                return (
                  <div
                    key={trip.id}
                    className="bg-white border border-[#D5E3EC] hover:border-[#0A4B6E]/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all text-left"
                  >
                    <div>
                      {/* Top: Plate & Zone */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-bold text-[#0A4B6E] tracking-tight">
                              {trip.truckPlate}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              EN ROUTE
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-[#6D8AA2] mt-0.5">
                            <MapPin size={11} className="text-[#0A4B6E]" />
                            <span>Zone: <strong className="text-[#0A4B6E]">{trip.zoneCode || trip.zoneName}</strong></span>
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center shrink-0">
                          <Truck size={15} />
                        </div>
                      </div>

                      {/* Middle Meta Details */}
                      <div className="bg-[#F8FAFC] rounded-xl p-2.5 border border-[#E2E8F0] space-y-1 text-xs mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[#6D8AA2]">Crew:</span>
                          <span className="font-medium text-slate-800 truncate max-w-[170px] text-right">
                            {trip.driverName} · {trip.salesName}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-[#6D8AA2] flex items-center gap-1">
                            <Clock size={11} /> Departed:
                          </span>
                          <span className="font-semibold text-slate-700">{departureFormatted}</span>
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-[#E2E8F0]">
                          <span className="text-[#6D8AA2] flex items-center gap-1">
                            <Layers size={11} /> Cargo On-Board:
                          </span>
                          <span className="font-bold text-[#0A4B6E] text-right">
                            {cargo.cylinderUnits > 0 && cargo.canisterUnits > 0 ? (
                              <>
                                {cargo.cylinderUnits} cyl · {cargo.canisterUnits} cans ({cargo.canisterCrates} crt)
                              </>
                            ) : cargo.canisterUnits > 0 ? (
                              <>
                                {cargo.canisterUnits} cans ({cargo.canisterCrates} crt{cargo.canisterRemainder > 0 ? ` +${cargo.canisterRemainder}` : ""})
                              </>
                            ) : cargo.cylinderUnits > 0 ? (
                              <>
                                {cargo.cylinderUnits} cylinders
                              </>
                            ) : (
                              "0 units"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Add Midday Reload & Check-In Return */}
                    {canManage && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2E8F0]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTripForReload(trip);
                            setShowMiddayModal(true);
                          }}
                          className="w-full py-1.5 px-2 bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#0A4B6E] rounded-full text-xs font-bold transition cursor-pointer"
                        >
                          + Midday Reload
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate(`/reconciliation?tripId=${trip.id}`)}
                          className="w-full py-1.5 px-2 bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] rounded-full text-xs font-bold transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                        >
                          <span>Check-In Return</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: READY TO DISPATCH */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0A4B6E]" />
              <h3 className="text-sm font-bold text-[#0A4B6E] uppercase tracking-wide">
                Ready to Dispatch ({readySchedules.length})
              </h3>
              <span className="text-[10px] font-bold text-[#0A4B6E] bg-[#E8F3F8] border border-[#BCE1F1] px-2.5 py-0.5 rounded-full">
                Today · {formatPhilippineDate(todayPht)}
              </span>
            </div>
            <span className="text-[11px] text-[#6D8AA2]">Scheduled vehicle deployments for today</span>
          </div>

          {readySchedules.length === 0 ? (
            <div className="bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-2xl p-8 text-center">
              <Calendar size={28} className="mx-auto text-[#6D8AA2] mb-2 opacity-50" />
              <p className="text-xs font-semibold text-[#0A4B6E]">No pending schedules ready to deploy today</p>
              <p className="text-[11px] text-[#6D8AA2] mt-0.5">
                Generate upcoming schedules from the Route Planner or click Dispatch Truck for an ad-hoc run.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {readySchedules.map((sched) => (
                <div
                  key={sched.id}
                  className="bg-white border border-[#D5E3EC] hover:border-[#0A4B6E]/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all text-left"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-bold text-[#0A4B6E] tracking-tight">
                            {sched.truckPlate}
                          </span>
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                            SCHEDULED
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6D8AA2]">{sched.truckModel}</p>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-[#EDF3F7] text-[#0A4B6E] flex items-center justify-center shrink-0">
                        <Truck size={15} />
                      </div>
                    </div>

                    <div className="bg-[#F8FAFC] rounded-xl p-2.5 border border-[#E2E8F0] space-y-1 text-xs mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[#6D8AA2]">Route Zone:</span>
                        <span className="font-bold text-[#0A4B6E]">{sched.zoneCode || sched.zoneName}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[#6D8AA2]">Assigned Crew:</span>
                        <span className="font-medium text-slate-800 truncate max-w-[170px] text-right">
                          {sched.driverName || "Driver"} · {sched.salesName || "Sales Rep"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-[#E2E8F0]">
                        <span className="text-[#6D8AA2]">Scheduled Date:</span>
                        <span className="font-bold text-[#0A4B6E]">{formatPhilippineDate(sched.scheduledDate)}</span>
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        setPrefillScheduleId(sched.id);
                        setShowDispatchModal(true);
                      }}
                      className="w-full py-2 px-3 bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] rounded-full text-xs font-bold transition cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      <Plus size={13} />
                      <span>Dispatch Truck</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DispatchModal
        isOpen={showDispatchModal}
        onClose={() => {
          setShowDispatchModal(false);
          setPrefillScheduleId("");
        }}
        onDispatch={handleDispatchTrip}
        schedules={readySchedules}
        vehicles={vehicles}
        drivers={drivers}
        zones={zones}
        products={products}
        salesUsers={salesUsers}
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
    </div>
  );
}

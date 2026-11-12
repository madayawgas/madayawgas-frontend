// src/pages/RouteDispatch/StockCheckInPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  PackageCheck,
  Truck,
  Sparkles,
  RotateCcw,
  Check,
  CheckCircle2,
  AlertTriangle,
  UserRound,
  MapPin,
  Warehouse,
  Flame,
  ArrowRight,
  Clock,
  Gauge,
} from "lucide-react";
import { tripsApi } from "../../api/trips.js";
import { inventoryApi } from "../../api/inventory.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";
import VehicleSearchDropdown from "../../components/route-dispatch/VehicleSearchDropdown.jsx";
import EndTripModal from "../../components/route-dispatch/EndTripModal.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import ToastNotification from "../../components/ui/ToastNotifications.jsx";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh.js";

const TRIPS_CACHE_KEY = "app_trips_cache";
const ITEMS_CACHE_KEY = "app_items_cache";

/**
 * StockCheckInPage — Minimal, High-Contrast Return Stock Check-In Workspace.
 * Conforms strictly to MadayawGas UI/UX table standards (#0D4B6E thead, border-[#0A4B6E]/30 container).
 */
export default function StockCheckInPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const canManage = can ? can(PERMISSIONS.ROUTE_MANAGE || "route.manage") : false;

  const currentTripIdFromUrl = searchParams.get("tripId") || "";

  // 1. Core Data States (Initialized from cache)
  const [trips, setTrips] = useState(() => {
    try {
      const cached = localStorage.getItem(TRIPS_CACHE_KEY);
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
      const cached = localStorage.getItem(ITEMS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // 2. Fetch Trips and Items
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [tripsRes, itemsRes] = await Promise.all([
        tripsApi.getTrips().catch((err) => {
          console.warn("Failed to fetch trips:", err);
          return [];
        }),
        inventoryApi.getInventoryItems().catch((err) => {
          console.warn("Failed to fetch items:", err);
          return [];
        }),
      ]);

      const tripsList = Array.isArray(tripsRes) ? tripsRes : tripsRes?.data?.trips || [];
      const itemsList = Array.isArray(itemsRes) ? itemsRes : itemsRes?.data?.products || [];

      if (Array.isArray(tripsList)) {
        setTrips(tripsList);
        localStorage.setItem(TRIPS_CACHE_KEY, JSON.stringify(tripsList));
      }
      if (Array.isArray(itemsList)) {
        setProducts(itemsList);
        localStorage.setItem(ITEMS_CACHE_KEY, JSON.stringify(itemsList));
      }
    } catch (err) {
      console.warn("Error loading check-in data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-Time WebSocket Hook: Auto-refreshes trips and inventory when trips are ended or reconciled
  useRealtimeRefresh({
    events: ["TRIP_ENDED", "TRIP_RECONCILIATION_UPDATED", "TRIP_COMPLETED"],
    cacheKeysToInvalidate: [TRIPS_CACHE_KEY, "app_trips_cache"],
    onRefresh: loadData,
  });

  // 3. Trips Partitioning:
  // 3a. Ended Trips strictly eligible for Post-Trip Stock Reconciliation: status === "RETURNED"
  const endedTrips = useMemo(() => {
    return trips.filter((t) => {
      const s = (t.rawStatus || t.status || "").toUpperCase();
      return s === "RETURNED";
    });
  }, [trips]);

  // 3b. Active In-Progress Trips (out on the road)
  const inProgressTrips = useMemo(() => {
    return trips.filter((t) => {
      const s = (t.rawStatus || t.status || "").toUpperCase();
      return s === "IN_PROGRESS";
    });
  }, [trips]);

  // Combined list for dropdown search (Returned first, then In-Progress)
  const dropdownTrips = useMemo(() => {
    return [...endedTrips, ...inProgressTrips];
  }, [endedTrips, inProgressTrips]);

  // Target trip selected by URL ID or defaulted to first eligible
  const targetTrip = useMemo(() => {
    if (currentTripIdFromUrl) {
      const found = trips.find((t) => t.id === currentTripIdFromUrl);
      if (found) return found;
    }
    return endedTrips[0] || inProgressTrips[0] || null;
  }, [trips, endedTrips, inProgressTrips, currentTripIdFromUrl]);

  // Evaluate whether target trip is still out on route (IN_PROGRESS)
  const isTargetTripInProgress = useMemo(() => {
    if (!targetTrip) return false;
    const s = (targetTrip.rawStatus || targetTrip.status || "").toUpperCase();
    return s === "IN_PROGRESS";
  }, [targetTrip]);

  // Active Selected Trip (strictly from ended trips awaiting reconciliation)
  const selectedTrip = useMemo(() => {
    if (!targetTrip) return null;
    const s = (targetTrip.rawStatus || targetTrip.status || "").toUpperCase();
    return s === "RETURNED" ? targetTrip : null;
  }, [targetTrip]);

  // Sync selected trip with URL: update when valid targetTrip exists, or clear invalid tripId if no trips
  useEffect(() => {
    if (targetTrip?.id) {
      if (currentTripIdFromUrl !== targetTrip.id) {
        setSearchParams({ tripId: targetTrip.id }, { replace: true });
      }
    } else if (currentTripIdFromUrl && trips.length > 0 && !targetTrip) {
      setSearchParams({}, { replace: true });
    }
  }, [currentTripIdFromUrl, targetTrip, trips.length, setSearchParams]);

  // 4. Authoritative Full Trip Detail for Check-In
  const [selectedTripDetail, setSelectedTripDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    if (selectedTrip?.id) {
      setIsLoadingDetail(true);
      tripsApi
        .getTripById(selectedTrip.id)
        .then((detail) => {
          if (isCurrent && detail) {
            setSelectedTripDetail(detail);
          }
        })
        .catch((err) => {
          console.warn("Failed to fetch authoritative trip detail for check-in:", err);
        })
        .finally(() => {
          if (isCurrent) setIsLoadingDetail(false);
        });
    } else {
      setSelectedTripDetail(null);
    }
    return () => {
      isCurrent = false;
    };
  }, [selectedTrip?.id]);

  // 5. Products Loaded on the Selected Trip (Resolved from authoritative detail or trip loads)
  const loadedProducts = useMemo(() => {
    const activeTrip = selectedTripDetail || selectedTrip;
    if (!activeTrip) return [];
    const loads = activeTrip.loads || [];
    const allItems = loads.flatMap((l) => l.items || []);
    const filledItems = allItems.filter((i) => (i.condition || "FILLED") === "FILLED");

    const map = new Map();
    filledItems.forEach((it) => {
      const pId = it.productId;
      if (!pId) return;
      const current = map.get(pId) || {
        productId: pId,
        productName: it.productName || "LPG Product",
        containerType: it.containerType || "CANISTER",
        netWeightKg: it.netWeightKg || 0,
        loadedUnits: 0,
      };
      current.loadedUnits += parseInt(it.quantityUnits, 10) || 0;
      map.set(pId, current);
    });

    return Array.from(map.values());
  }, [selectedTripDetail, selectedTrip]);

  // 6. Counts State Map: { [productId]: { returnedFull, returnedEmptyGood, returnedDefective, defectNotes } }
  const [counts, setCounts] = useState({});
  const [supervisorNotes, setSupervisorNotes] = useState("");

  useEffect(() => {
    if (selectedTrip) {
      setError(null);
      setSupervisorNotes(
        selectedTrip.notes
          ? `Gate return verified. ${selectedTrip.notes}`
          : "Physical return counts verified at Bunawan yard gate."
      );

      const initial = {};
      loadedProducts.forEach((p) => {
        initial[p.productId] = {
          returnedFull: 0,
          returnedEmptyGood: p.loadedUnits || 0,
          returnedDefective: 0,
          defectNotes: "",
        };
      });
      setCounts(initial);
    }
  }, [selectedTrip?.id, loadedProducts]);

  const handleSelectTrip = (tripId) => {
    setSearchParams({ tripId }, { replace: true });
    setError(null);
  };

  const handleCountChange = (productId, field, rawValue) => {
    const val = rawValue === "" ? 0 : Math.max(0, parseInt(rawValue, 10) || 0);
    setCounts((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { returnedFull: 0, returnedEmptyGood: 0, returnedDefective: 0, defectNotes: "" }),
        [field]: val,
      },
    }));
  };

  const handleNotesChange = (productId, notesValue) => {
    setCounts((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { returnedFull: 0, returnedEmptyGood: 0, returnedDefective: 0, defectNotes: "" }),
        defectNotes: notesValue,
      },
    }));
  };

  // Row-level fast shortcut: All units sold with empty returns
  const applyRowAllSold = (productId, loadedUnits) => {
    setCounts((prev) => ({
      ...prev,
      [productId]: {
        returnedFull: 0,
        returnedEmptyGood: loadedUnits,
        returnedDefective: 0,
        defectNotes: "",
      },
    }));
  };

  // Bulk action: Mark all products sold out
  const handleMarkAllSoldOut = () => {
    setCounts((prev) => {
      const next = { ...prev };
      loadedProducts.forEach((p) => {
        next[p.productId] = {
          returnedFull: 0,
          returnedEmptyGood: p.loadedUnits,
          returnedDefective: 0,
          defectNotes: "",
        };
      });
      return next;
    });
  };

  // Bulk action: Reset all inputs to 0
  const handleResetAllToZero = () => {
    setCounts((prev) => {
      const next = { ...prev };
      loadedProducts.forEach((p) => {
        next[p.productId] = {
          returnedFull: 0,
          returnedEmptyGood: 0,
          returnedDefective: 0,
          defectNotes: "",
        };
      });
      return next;
    });
  };

  // Aggregate totals
  const totals = loadedProducts.reduce(
    (acc, p) => {
      const pCounts = counts[p.productId] || { returnedFull: 0, returnedEmptyGood: 0, returnedDefective: 0 };
      const full = Number(pCounts.returnedFull) || 0;
      const empty = Number(pCounts.returnedEmptyGood) || 0;
      const defect = Number(pCounts.returnedDefective) || 0;
      acc.totalLoaded += p.loadedUnits;
      acc.totalFull += full;
      acc.totalEmpty += empty;
      acc.totalDefect += defect;
      acc.totalReturned += full + empty + defect;
      return acc;
    },
    { totalLoaded: 0, totalFull: 0, totalEmpty: 0, totalDefect: 0, totalReturned: 0 }
  );

  const varianceFromLoaded = totals.totalReturned - totals.totalLoaded;

  // Final check-in submission
  const handleFinalSubmit = async () => {
    if (!selectedTrip) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const returnLoads = [];
      loadedProducts.forEach((p) => {
        const pCounts = counts[p.productId] || { returnedFull: 0, returnedEmptyGood: 0, returnedDefective: 0 };
        const full = Number(pCounts.returnedFull) || 0;
        const empty = Number(pCounts.returnedEmptyGood) || 0;
        const defect = Number(pCounts.returnedDefective) || 0;

        if (full > 0) {
          returnLoads.push({
            productId: p.productId,
            condition: "FILLED",
            quantityUnits: full,
          });
        }
        if (empty > 0) {
          returnLoads.push({
            productId: p.productId,
            condition: "EMPTY_GOOD",
            quantityUnits: empty,
          });
        }
        if (defect > 0) {
          returnLoads.push({
            productId: p.productId,
            condition: "DEFECTIVE",
            quantityUnits: defect,
          });
        }
      });

      const payload = {
        supervisorNotes: supervisorNotes.trim() || "Physical yard return intake verified.",
        returnLoads,
      };

      await tripsApi.reconcileTrip(selectedTrip.id, payload);

      // Invalidate caches
      localStorage.removeItem(TRIPS_CACHE_KEY);
      localStorage.removeItem(ITEMS_CACHE_KEY);

      setShowConfirmModal(false);
      setToast({
        type: "success",
        message: `Trip #${selectedTrip.tripNumber} (${selectedTrip.truckPlate}) stock reconciliation completed. Bunawan yard stock updated!`,
      });

      // Reload trips to reflect completed status
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to complete return check-in. Please try again.");
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler to end trip directly from check-in page
  const handleEndTripFromCheckIn = async (tripId, payload) => {
    try {
      await tripsApi.endTrip(tripId, payload);
      localStorage.removeItem(TRIPS_CACHE_KEY);
      localStorage.removeItem("app_fleet_cache");
      setShowEndTripModal(false);
      setToast({
        type: "success",
        message: `Vehicle ${targetTrip?.truckPlate || ""} gate return logged successfully. Ready for stock check-in below!`,
      });
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to log gate return.");
      throw err;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden min-w-0 space-y-3 font-sans">
      {/* 1. TOP CONTROLS BAR (No duplicate <h1> or redundant description) */}
      <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#0A4B6E]/20">
        {/* Left: Searchable Truck Plate Dropdown + Selected Trip Meta Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <VehicleSearchDropdown
            trips={dropdownTrips}
            selectedTripId={targetTrip?.id || ""}
            onSelectTrip={handleSelectTrip}
            disabled={isSubmitting}
            placeholder="Select returning vehicle trip..."
          />

          {selectedTrip && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs h-[32px]">
                <UserRound size={13} className="text-[#0A4B6E]" />
                <span>{selectedTrip.driverName || "Driver"}</span>
              </span>

              {selectedTrip.zoneCode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs shadow-2xs h-[32px]">
                  <MapPin size={12} className="text-[#6D8AA2]" />
                  <span>{selectedTrip.zoneCode}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs shadow-2xs h-[32px]">
                <span>Dispatched: {totals.totalLoaded} units</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs shadow-2xs h-[32px]">
                <Clock size={12} className="text-amber-600" />
                <span>Ended · Ready for Reconciliation</span>
              </span>

              {selectedTrip.returnOdometer && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-semibold text-xs shadow-2xs h-[32px]">
                  <span>Return Odo: {Number(selectedTrip.returnOdometer).toLocaleString()} km</span>
                </span>
              )}
            </div>
          )}

          {targetTrip && !selectedTrip && isTargetTripInProgress && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs h-[32px]">
                <UserRound size={13} className="text-[#0A4B6E]" />
                <span>{targetTrip.driverName || "Driver"}</span>
              </span>

              {targetTrip.zoneCode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs shadow-2xs h-[32px]">
                  <MapPin size={12} className="text-[#6D8AA2]" />
                  <span>{targetTrip.zoneCode}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold text-xs shadow-2xs h-[32px]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>Out on Route (In Progress)</span>
              </span>
            </div>
          )}
        </div>

        {/* Right: Fast Shortcuts */}
        {selectedTrip && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleMarkAllSoldOut}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer h-[32px]"
              title="Automatically count all dispatched units as good empty returns"
            >
              <Sparkles size={13} className="text-[#0A4B6E]" />
              <span>Mark All Sold Out</span>
            </button>

            <button
              type="button"
              onClick={handleResetAllToZero}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition cursor-pointer h-[32px]"
              title="Reset all inputs to 0"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-[#C93B32] rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 animate-scale-in">
          <AlertTriangle size={15} className="shrink-0 text-[#C93B32]" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. MASTER TABLE (Strict Project Design Standard: #0D4B6E header, #0A4B6E/30 container) */}
      {selectedTrip ? (
        <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-2xs">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              {/* Project Standard Dark-Navy Header */}
              <thead className="bg-[#0D4B6E] text-white text-xs sticky top-0 z-10 shadow-xs select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                    Product Name
                  </th>
                  <th className="py-3 px-3 text-center font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[110px]">
                    Dispatched
                  </th>
                  <th className="py-3 px-3 text-center font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[130px]">
                    Unsold (Full)
                  </th>
                  <th className="py-3 px-3 text-center font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[130px]">
                    Good Empties
                  </th>
                  <th className="py-3 px-3 text-center font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[130px]">
                    Damaged
                  </th>
                  <th className="py-3 px-3 text-center font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[120px]">
                    Total Counted
                  </th>
                  <th className="py-3 px-3 text-center font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[100px]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-xs">
                {isLoadingDetail ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-[#0A4B6E] border-t-transparent rounded-full animate-spin" />
                        <p className="font-semibold text-slate-700 text-xs">
                          Loading authoritative dispatched cargo manifest...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : loadedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <PackageCheck size={32} className="text-[#6D8AA2]/50" />
                        <p className="font-semibold text-slate-700 text-sm">
                          No Dispatched Cargo Found
                        </p>
                        <p className="text-xs text-[#6D8AA2] max-w-md">
                          Trip #{selectedTrip.tripNumber} ({selectedTrip.truckPlate}) has no recorded dispatch loads. If cargo was loaded, please verify the departure transfer slip.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  loadedProducts.map((p) => {
                    const pCounts = counts[p.productId] || {
                      returnedFull: 0,
                      returnedEmptyGood: 0,
                      returnedDefective: 0,
                      defectNotes: "",
                    };
                    const rowFull = Number(pCounts.returnedFull) || 0;
                    const rowEmpty = Number(pCounts.returnedEmptyGood) || 0;
                    const rowDefect = Number(pCounts.returnedDefective) || 0;
                    const rowTotal = rowFull + rowEmpty + rowDefect;
                    const isBalanced = rowTotal === p.loadedUnits;
                    const hasDefects = rowDefect > 0;

                    return (
                      <React.Fragment key={p.productId}>
                        <tr className="hover:bg-[#F4F9FC] transition-colors">
                          {/* 1. Product Name */}
                          <td className="py-3 px-4">
                            <p className="font-bold text-[#0A4B6E] text-xs leading-tight">
                              {p.productName}
                            </p>
                            <span className="text-[11px] text-[#6D8AA2] font-medium mt-0.5 inline-block">
                              {p.containerType === "CANISTER" ? "Butane Canister" : "LPG Cylinder"} · {p.netWeightKg}kg
                            </span>
                          </td>

                          {/* 2. Dispatched */}
                          <td className="py-3 px-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1]">
                              {p.loadedUnits}
                            </span>
                          </td>

                          {/* 3. Unsold Full */}
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={pCounts.returnedFull}
                              onChange={(e) => handleCountChange(p.productId, "returnedFull", e.target.value)}
                              className="w-22 text-center py-1.5 px-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0A4B6E] focus:outline-none focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/20"
                            />
                          </td>

                          {/* 4. Good Empties */}
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={pCounts.returnedEmptyGood}
                              onChange={(e) => handleCountChange(p.productId, "returnedEmptyGood", e.target.value)}
                              className="w-22 text-center py-1.5 px-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0A4B6E] focus:outline-none focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/20"
                            />
                          </td>

                          {/* 5. Damaged */}
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={pCounts.returnedDefective}
                              onChange={(e) => handleCountChange(p.productId, "returnedDefective", e.target.value)}
                              className={`w-22 text-center py-1.5 px-2 rounded-xl text-xs font-bold transition-all focus:outline-none ${
                                hasDefects
                                  ? "bg-rose-50 border-rose-400 text-rose-800 focus:ring-2 focus:ring-rose-400/20"
                                  : "bg-white border-[#CBD5E1] text-[#0A4B6E] focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/20"
                              }`}
                            />
                          </td>

                          {/* 6. Total Counted */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1 font-bold">
                              <span
                                className={`text-xs ${
                                  isBalanced
                                    ? "text-emerald-700 font-bold"
                                    : rowTotal > p.loadedUnits
                                    ? "text-blue-700"
                                    : "text-amber-700"
                                }`}
                              >
                                {rowTotal}
                              </span>
                              {isBalanced ? (
                                <Check size={14} className="text-emerald-600 stroke-[2.5]" />
                              ) : rowTotal < p.loadedUnits ? (
                                <span className="text-[10px] text-amber-600 font-semibold">
                                  ({rowTotal - p.loadedUnits})
                                </span>
                              ) : (
                                <span className="text-[10px] text-blue-600 font-semibold">
                                  (+{rowTotal - p.loadedUnits})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 7. Action */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => applyRowAllSold(p.productId, p.loadedUnits)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#0A4B6E] hover:bg-[#E8F3F8] border border-slate-200 hover:border-[#0A4B6E]/40 transition cursor-pointer"
                              title="Set unsold to 0 and empties to loaded count"
                            >
                              All Sold
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Defect Note row if damaged > 0 */}
                        {hasDefects && (
                          <tr className="bg-rose-50/60 border-b border-rose-100">
                            <td colSpan={7} className="py-2.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-rose-800 shrink-0">
                                  Defect details ({p.productName}):
                                </span>
                                <input
                                  type="text"
                                  placeholder="e.g. 2 leaking valves, 1 dented collar..."
                                  value={pCounts.defectNotes}
                                  onChange={(e) => handleNotesChange(p.productId, e.target.value)}
                                  className="w-full px-3 py-1 text-xs bg-white border border-rose-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : isTargetTripInProgress && targetTrip ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white border border-[#0A4B6E]/30 rounded-2xl shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3 shadow-inner">
            <Gauge size={28} />
          </div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap justify-center">
            <span className="text-base font-bold text-[#0A4B6E]">
              {targetTrip.truckPlate} · Trip #{targetTrip.tripNumber}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 uppercase tracking-wider">
              OUT ON ROUTE
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            Vehicle Has Not Ended Trip Yet
          </h3>
          <p className="text-xs text-slate-600 max-w-md mt-1 mb-5 leading-relaxed">
            This delivery truck is currently active on its route. Before stock reconciliation can be conducted and cylinders returned to Bunawan plant inventory, the vehicle must be checked in at the gate with its mandatory return odometer reading.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {canManage && (
              <button
                type="button"
                onClick={() => setShowEndTripModal(true)}
                className="flex items-center gap-1.5 bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Gauge size={14} strokeWidth={2.5} />
                <span>Log Return Odometer & End Trip</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/route-dispatch")}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-full transition-all cursor-pointer"
            >
              <span>View Today's Dispatches</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white border border-[#0A4B6E]/30 rounded-2xl shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3 shadow-inner">
            <CheckCircle2 size={30} />
          </div>
          <h3 className="text-base font-bold text-[#0A4B6E]">No Ended Trips Awaiting Reconciliation</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            All returned delivery trucks have completed stock reconciliation, or active runs are still out on the road and have not yet been ended by drivers.
          </p>
          <button
            type="button"
            onClick={() => navigate("/route-dispatch")}
            className="flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-full shadow-2xs transition-all cursor-pointer"
          >
            <span>View Today's Dispatches</span>
          </button>
        </div>
      )}

      {/* 3. PINNED BOTTOM ACTION & SUMMARY BAR */}
      {selectedTrip && (
        <div className="shrink-0 pt-3 pb-1 border-t border-[#0A4B6E]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* High-Contrast Tally Indicators */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-700">
              Dispatched: <strong className="text-[#0A4B6E]">{totals.totalLoaded}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-700">
              Counted: <strong className="text-slate-900">{totals.totalReturned}</strong>
              <span className="text-slate-500 font-normal ml-1">
                ({totals.totalFull} Full, {totals.totalEmpty} Empties, {totals.totalDefect} Damaged)
              </span>
            </span>
            <span className="text-slate-300">|</span>
            {totals.totalReturned === totals.totalLoaded ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Check size={12} className="text-emerald-700 stroke-[3]" />
                <span>Balanced</span>
              </span>
            ) : totals.totalReturned > totals.totalLoaded ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                <span>+{totals.totalReturned - totals.totalLoaded} Extra</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <AlertTriangle size={12} className="text-amber-700" />
                <span>{totals.totalReturned - totals.totalLoaded} Short</span>
              </span>
            )}
          </div>

          {/* Primary Action Button */}
          {canManage && (
            <button
              type="button"
              disabled={isSubmitting || isLoadingDetail || loadedProducts.length === 0}
              onClick={() => setShowConfirmModal(true)}
              className="flex items-center justify-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] disabled:opacity-50 disabled:cursor-not-allowed text-[#0A4B6E] font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
              title={loadedProducts.length === 0 ? "No dispatched products to reconcile" : "Confirm and complete stock reconciliation"}
            >
              <span>Confirm & Complete Reconciliation</span>
              <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      {/* 4. STANDARDIZED CONFIRMATION MODAL */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Post-Trip Stock Reconciliation"
        subtitle={selectedTrip ? `${selectedTrip.truckPlate} · Trip #${selectedTrip.tripNumber}` : "Reconciliation"}
        icon={PackageCheck}
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5"
            >
              <span>{isSubmitting ? "Settling..." : "Complete Reconciliation"}</span>
              <CheckCircle2 size={14} strokeWidth={2.5} />
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 text-xs">
          <p className="text-slate-600">
            Confirming this intake will immediately update the Bunawan yard inventory balances:
          </p>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-[#E8F3F8] border border-[#BCE1F1] rounded-xl">
              <span className="text-[10px] font-bold text-[#0A4B6E] uppercase block">Sale-Ready</span>
              <p className="text-base font-bold text-[#0A4B6E] mt-0.5">{totals.totalFull}</p>
              <span className="text-[10px] text-slate-500">Unsold full units</span>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Refill Dock</span>
              <p className="text-base font-bold text-emerald-800 mt-0.5">{totals.totalEmpty}</p>
              <span className="text-[10px] text-slate-500">Good empty returns</span>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">Quarantine</span>
              <p className="text-base font-bold text-rose-800 mt-0.5">{totals.totalDefect}</p>
              <span className="text-[10px] text-slate-500">Damaged / defects</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#0A4B6E] mb-1">
              Supervisor Notes (Optional)
            </label>
            <input
              type="text"
              value={supervisorNotes}
              onChange={(e) => setSupervisorNotes(e.target.value)}
              placeholder="e.g. Verified at Bunawan gate..."
              className="w-full px-3 py-2 text-xs bg-[#F4F8FA] border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0A4B6E] focus:bg-white"
            />
          </div>
        </div>
      </Modal>

      {/* GATE RETURN / END TRIP MODAL */}
      <EndTripModal
        isOpen={showEndTripModal}
        trip={targetTrip}
        onClose={() => setShowEndTripModal(false)}
        onEndTrip={handleEndTripFromCheckIn}
      />

      {/* TOAST NOTIFICATION */}
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

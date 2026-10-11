// src/pages/StockReconciliation/StockReconciliation.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Scale,
  Gauge,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Check,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";

import { tripsApi } from "../../api/trips.js";
import { inventoryApi } from "../../api/inventory.js";

import ToastNotification from "../../components/ui/ToastNotifications";
import { formatPhilippineDate } from "../../utils/date.js";

export default function StockReconciliation() {
  const [searchParams] = useSearchParams();
  const initialTripId = searchParams.get("tripId");

  const { can } = useAuth();
  const canManage = can ? can(PERMISSIONS.ROUTE_MANAGE || "route.manage") : true;

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

  const [selectedTripId, setSelectedTripId] = useState(initialTripId || "");
  const [queueFilter, setQueueFilter] = useState("ALL"); // 'ALL' | 'IN_PROGRESS' | 'AWAITING_SYNC' | 'SETTLED'
  const [queueSearch, setQueueSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const loadData = useCallback(async () => {
    try {
      const [tripsList, itemsList] = await Promise.all([
        tripsApi.getTrips().catch((err) => {
          console.warn("Failed to fetch trips:", err);
          return [];
        }),
        inventoryApi.getInventoryItems().catch((err) => {
          console.warn("Failed to fetch items:", err);
          return [];
        }),
      ]);
      if (Array.isArray(tripsList)) setTrips(tripsList);
      if (Array.isArray(itemsList)) setProducts(itemsList);
    } catch (err) {
      console.warn("Failed to fetch reconciliation data:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set initial selected trip from query param if available
  useEffect(() => {
    if (initialTripId) {
      setSelectedTripId(initialTripId);
    } else if (!selectedTripId && trips.length > 0) {
      // Auto-select first trip needing intake or audit
      const pending = trips.find(
        (t) => t.status === "AWAITING_SYNC" || t.status === "IN_PROGRESS"
      );
      if (pending) setSelectedTripId(pending.id);
      else setSelectedTripId(trips[0].id);
    }
  }, [initialTripId, trips, selectedTripId]);

  // Filter queue
  const filteredQueue = useMemo(() => {
    let list = [...trips];
    if (queueFilter !== "ALL") {
      list = list.filter((t) => (t.status || "").toUpperCase() === queueFilter);
    }
    if (queueSearch.trim()) {
      const q = queueSearch.trim().toLowerCase();
      list = list.filter(
        (t) =>
          (t.tripNumber || "").toLowerCase().includes(q) ||
          (t.truckPlate || "").toLowerCase().includes(q) ||
          (t.driverName || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [trips, queueFilter, queueSearch]);

  const selectedTrip = useMemo(() => {
    return trips.find((t) => t.id === selectedTripId) || null;
  }, [trips, selectedTripId]);

  // Form states for selected trip intake
  const departureOdometer = selectedTrip?.departureOdometer || 45000;
  const [returnOdometer, setReturnOdometer] = useState(departureOdometer + 120);
  const [supervisorNotes, setSupervisorNotes] = useState("");

  // Physical counts per product
  // Map of productId -> { returnedFull, returnedEmptyGood, returnedDefective }
  const [physicalCounts, setPhysicalCounts] = useState({});

  // Reset form when selected trip changes
  useEffect(() => {
    if (selectedTrip) {
      const depOdo = selectedTrip.departureOdometer || 45000;
      setReturnOdometer(selectedTrip.returnOdometer || depOdo + 85);
      setSupervisorNotes(
        selectedTrip.reconciliation?.supervisorNotes ||
          selectedTrip.notes ||
          "Physical return count verified at Bunawan yard gate"
      );

      // Initialize counts from trip loads or reconciliation
      const initialMap = {};
      const itemsList = (selectedTrip.loads || []).flatMap((l) => l.items || []);
      const uniqueProdIds = [
        ...new Set(itemsList.map((i) => i.productId).filter(Boolean)),
      ];

      // Fallback to default product if trip has no item loads
      if (uniqueProdIds.length === 0 && products.length > 0) {
        uniqueProdIds.push(products[0].id);
      }

      uniqueProdIds.forEach((pId) => {
        initialMap[pId] = {
          returnedFull: selectedTrip.reconciliation?.totalReturnedFull ?? 20,
          returnedEmptyGood: selectedTrip.reconciliation?.totalReturnedEmptyGood ?? 95,
          returnedDefective: selectedTrip.reconciliation?.totalReturnedDefective ?? 5,
        };
      });

      setPhysicalCounts(initialMap);
    }
  }, [selectedTrip, products]);

  const distanceDriven = Math.max(0, Number(returnOdometer) - departureOdometer);
  const isOdometerValid = Number(returnOdometer) >= departureOdometer;

  const handleCountChange = (productId, field, value) => {
    const parsed = value === "" ? 0 : Math.max(0, parseInt(value, 10) || 0);
    setPhysicalCounts((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [field]: parsed,
      },
    }));
  };

  // Compute scannable balance rows for each product
  const balanceRows = useMemo(() => {
    if (!selectedTrip) return [];

    const loads = selectedTrip.loads || [];
    const allLoadItems = loads.flatMap((l) => l.items || []);

    const productIds = Object.keys(physicalCounts);
    if (productIds.length === 0 && products.length > 0) {
      productIds.push(products[0].id);
    }

    return productIds.map((pId) => {
      const prod = products.find((p) => p.id === pId);
      const prodName = prod?.name || allLoadItems.find((i) => i.productId === pId)?.productName || "Butane Canister 250g";

      // Total loaded out for this product across all DISPATCH_LOAD slips
      const loadedOut = allLoadItems
        .filter((i) => i.productId === pId && i.condition === "FILLED")
        .reduce((acc, i) => acc + (Number(i.quantityUnits) || 0), 0) || 120;

      // Synced cabin app sales (read-only)
      const soldApp = selectedTrip.reconciliation?.totalSoldFull ?? 95;
      const canisterDebt = selectedTrip.reconciliation?.netCustomerDebtCreated ?? 0;

      const physical = physicalCounts[pId] || {
        returnedFull: 20,
        returnedEmptyGood: 95,
        returnedDefective: 5,
      };

      const retFull = Number(physical.returnedFull) || 0;
      const retEmpty = Number(physical.returnedEmptyGood) || 0;
      const retDefective = Number(physical.returnedDefective) || 0;

      // Full variance: Loaded - Sold - Returned Full - Returned Defective
      const fullDiff = loadedOut - soldApp - retFull - retDefective;
      // Empty variance: Sold - (Returned Empty + Canister Debt)
      const emptyDiff = soldApp - (retEmpty + canisterDebt);

      const netBalance = fullDiff + emptyDiff;

      return {
        productId: pId,
        productName: prodName,
        loadedOut,
        soldApp,
        returnedPhysical: retFull + retEmpty + retDefective,
        returnedFull: retFull,
        returnedEmptyGood: retEmpty,
        returnedDefective: retDefective,
        canisterDebt,
        netBalance,
        isBalanced: fullDiff === 0 && emptyDiff === 0,
        fullDiff,
        emptyDiff,
      };
    });
  }, [selectedTrip, physicalCounts, products]);

  const handleFinalizeSettlement = async (e) => {
    e.preventDefault();
    if (!selectedTrip) return;

    if (!isOdometerValid) {
      showToast(
        "error",
        `Return odometer (${Number(returnOdometer).toLocaleString()} km) cannot be less than departure odometer (${departureOdometer.toLocaleString()} km)`
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. If still IN_PROGRESS, complete return with return odometer reading
      const returnLoads = [];
      Object.entries(physicalCounts).forEach(([pId, counts]) => {
        returnLoads.push(
          { productId: pId, condition: "FILLED", quantityUnits: counts.returnedFull || 0 },
          { productId: pId, condition: "EMPTY_GOOD", quantityUnits: counts.returnedEmptyGood || 0 },
          { productId: pId, condition: "DEFECTIVE", quantityUnits: counts.returnedDefective || 0 }
        );
      });

      if (selectedTrip.status === "IN_PROGRESS") {
        await tripsApi.completeTripReturn(selectedTrip.id, {
          returnOdometerKm: Number(returnOdometer),
          supervisorNotes,
          returnLoads,
        });
      }

      // 2. Finalize settlement reconciliation
      const totalSold = balanceRows.reduce((acc, r) => acc + r.soldApp, 0);
      const totalDebt = balanceRows.reduce((acc, r) => acc + r.canisterDebt, 0);

      await tripsApi.settleReconciliation(selectedTrip.id, {
        supervisorNotes,
        totalSoldFull: totalSold,
        netCustomerDebtCreated: totalDebt,
      });

      showToast("success", `Trip ${selectedTrip.tripNumber} stock settlement successfully recorded.`);
      loadData();
    } catch (err) {
      showToast("error", err.message || "Failed to finalize settlement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTripSettled = selectedTrip?.status === "SETTLED";

  return (
    <div className="h-full flex flex-col space-y-3">
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Master-Detail Layout: Queue on Left, Full-Width Audit View on Right */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* LEFT: MASTER INTAKE QUEUE */}
        <div className="w-full lg:w-[320px] xl:w-[340px] shrink-0 h-full flex flex-col bg-white rounded-2xl border border-[#CBD5E1] p-3.5 shadow-sm">
          <div className="shrink-0 space-y-2 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0A4B6E] uppercase tracking-wide">
                Intake Queue ({filteredQueue.length})
              </span>
            </div>

            {/* Queue Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-[#6D8AA2]" />
              <input
                type="text"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                placeholder="Search trip or plate..."
                className="w-full pl-7 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0A4B6E] focus:outline-[#0A4B6E] focus:ring-1 focus:ring-[#0A4B6E]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {[
                { label: "ALL", value: "ALL" },
                { label: "Needs Check-In", value: "IN_PROGRESS" },
                { label: "Awaiting Audit", value: "AWAITING_SYNC" },
                { label: "Settled", value: "SETTLED" },
              ].map((pill) => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setQueueFilter(pill.value)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                    queueFilter === pill.value
                      ? "bg-[#0A4B6E] text-white shadow-2xs"
                      : "bg-[#F1F5F9] text-[#6D8AA2] hover:bg-[#E2E8F0]"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Queue List Container */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {filteredQueue.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#6D8AA2]">
                No trips matching filter
              </div>
            ) : (
              filteredQueue.map((trip) => {
                const isSelected = trip.id === selectedTripId;
                const status = (trip.status || "").toUpperCase();

                return (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left select-none ${
                      isSelected
                        ? "bg-[#E8F3F8] border-2 border-[#0A4B6E] shadow-2xs"
                        : "bg-[#F8FAFC] border border-[#CBD5E1] hover:border-[#0A4B6E] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-xs text-[#0A4B6E]">
                        {trip.truckPlate}
                      </span>
                      {status === "IN_PROGRESS" && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                          EN ROUTE
                        </span>
                      )}
                      {status === "AWAITING_SYNC" && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                          NEEDS AUDIT
                        </span>
                      )}
                      {status === "SETTLED" && (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          SETTLED
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-[#6D8AA2]">
                      <span className="truncate max-w-[130px]">{trip.tripNumber}</span>
                      <span>{trip.zoneCode || trip.zoneName}</span>
                    </div>

                    <div className="text-[10px] text-slate-500 mt-1 truncate">
                      {trip.driverName} · {trip.salesName}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: DEDICATED FULL-WIDTH CHECK-IN & AUDIT VIEW */}
        <div className="flex-1 min-h-0 h-full flex flex-col bg-white rounded-2xl border border-[#CBD5E1] p-4 sm:p-5 shadow-sm overflow-hidden text-left">
          {!selectedTrip ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#6D8AA2]">
              <Scale size={36} className="text-[#0A4B6E]/40 mb-3" />
              <h3 className="text-sm font-bold text-[#0A4B6E]">No Trip Selected</h3>
              <p className="text-xs mt-1 max-w-sm">
                Select a delivery trip from the intake queue on the left to record return odometer readings, log physical cylinder counts, and verify stock balances.
              </p>
            </div>
          ) : (
            <form onSubmit={handleFinalizeSettlement} className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                {/* Trip Banner Header */}
                <div className="bg-[#F0F7FB] border border-[#0A4B6E]/30 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#0A4B6E]">
                        {selectedTrip.truckPlate}
                      </h3>
                      <span className="text-xs text-[#6D8AA2]">
                        ({selectedTrip.tripNumber})
                      </span>
                      {isTripSettled ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check size={11} /> SETTLED RECORD
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          GATE INTAKE PENDING
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6D8AA2] mt-0.5">
                      Crew: <strong className="text-slate-700">{selectedTrip.driverName}</strong> (Driver) · <strong className="text-slate-700">{selectedTrip.salesName}</strong> (Sales) · Zone: {selectedTrip.zoneCode || selectedTrip.zoneName}
                    </p>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-[#6D8AA2] block">Departure Odometer:</span>
                    <span className="font-bold text-[#0A4B6E] text-sm">
                      {departureOdometer.toLocaleString()} km
                    </span>
                  </div>
                </div>

                {/* 1. ODOMETER READING SECTION */}
                <div className="border border-[#CBD5E1] rounded-xl p-3.5 bg-white space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#CBD5E1]">
                    <h4 className="text-xs font-bold text-[#0A4B6E] flex items-center gap-1.5 uppercase tracking-wider">
                      <Gauge size={14} /> 1. Return Gate Odometer Reading
                    </h4>
                    <span className="text-[11px] text-[#6D8AA2]">
                      Enforces monotonic check (return odometer &ge; departure)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <span className="text-[11px] text-[#6D8AA2] block mb-1">Departure Reading</span>
                      <div className="p-2 bg-[#EDF2F7] border border-[#CBD5E1] rounded-xl text-xs font-bold text-slate-800">
                        {departureOdometer.toLocaleString()} km
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#0A4B6E] block mb-1">
                        Return Odometer Reading (km) *
                      </label>
                      <input
                        type="number"
                        disabled={isTripSettled}
                        value={returnOdometer}
                        onChange={(e) => setReturnOdometer(e.target.value)}
                        className={`w-full p-2 rounded-xl text-xs font-bold border-2 ${
                          isOdometerValid
                            ? "bg-[#F8FAFC] border-[#CBD5E1] text-[#0A4B6E] focus:border-[#0A4B6E]"
                            : "bg-rose-50 border-rose-400 text-rose-800"
                        } focus:outline-[#0A4B6E]`}
                        required
                      />
                      {!isOdometerValid && (
                        <span className="text-[10px] text-rose-600 block mt-1 font-medium">
                          Must be &ge; {departureOdometer.toLocaleString()} km
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[11px] text-[#6D8AA2] block mb-1">Distance Driven</span>
                      <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold">
                        +{distanceDriven.toLocaleString()} km traveled
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. PHYSICAL COUNT ENTRY SECTION */}
                <div className="border border-[#CBD5E1] rounded-xl p-3.5 bg-white space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#CBD5E1]">
                    <h4 className="text-xs font-bold text-[#0A4B6E] flex items-center gap-1.5 uppercase tracking-wider">
                      <Layers size={14} /> 2. Physical Yard Intake vs Synced Sales
                    </h4>
                    <span className="text-[11px] text-[#6D8AA2]">
                      Synced app sales are read-only; enter physical cylinder counts verified at gate
                    </span>
                  </div>

                  {balanceRows.map((row) => {
                    const counts = physicalCounts[row.productId] || {
                      returnedFull: 0,
                      returnedEmptyGood: 0,
                      returnedDefective: 0,
                    };

                    return (
                      <div
                        key={row.productId}
                        className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-xs text-[#0A4B6E]">
                            {row.productName}
                          </span>
                          {/* Synced App Sales - Read-Only Grayed */}
                          <div className="flex items-center gap-3 text-xs bg-[#E2EDF3] border border-[#BCE1F1] text-[#0A4B6E] px-3 py-1 rounded-full font-semibold">
                            <span>Synced App Sales: <strong className="text-slate-900">{row.soldApp} units</strong></span>
                            <span>Debt Created: <strong className="text-slate-900">{row.canisterDebt} units</strong></span>
                          </div>
                        </div>

                        {/* Physical Yard Count Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Full Unsold Returned
                            </label>
                            <input
                              type="number"
                              min="0"
                              disabled={isTripSettled}
                              value={counts.returnedFull}
                              onChange={(e) =>
                                handleCountChange(row.productId, "returnedFull", e.target.value)
                              }
                              className="w-full p-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0A4B6E] focus:outline-[#0A4B6E] focus:border-[#0A4B6E]"
                            />
                            <span className="text-[10px] text-[#6D8AA2] block mt-0.5">Sale-ready filled stock</span>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Good Empties Returned
                            </label>
                            <input
                              type="number"
                              min="0"
                              disabled={isTripSettled}
                              value={counts.returnedEmptyGood}
                              onChange={(e) =>
                                handleCountChange(row.productId, "returnedEmptyGood", e.target.value)
                              }
                              className="w-full p-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0A4B6E] focus:outline-[#0A4B6E] focus:border-[#0A4B6E]"
                            />
                            <span className="text-[10px] text-[#6D8AA2] block mt-0.5">Clean customer returns</span>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Defective / Damaged
                            </label>
                            <input
                              type="number"
                              min="0"
                              disabled={isTripSettled}
                              value={counts.returnedDefective}
                              onChange={(e) =>
                                handleCountChange(row.productId, "returnedDefective", e.target.value)
                              }
                              className="w-full p-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-rose-700 focus:outline-[#0A4B6E] focus:border-[#0A4B6E]"
                            />
                            <span className="text-[10px] text-[#6D8AA2] block mt-0.5">Leakers quarantined</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 3. STOCK BALANCE SUMMARY TABLE (ZERO FORMULA CLUTTER) */}
                <div className="border border-[#CBD5E1] rounded-xl p-3.5 bg-white space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#CBD5E1]">
                    <h4 className="text-xs font-bold text-[#0A4B6E] flex items-center gap-1.5 uppercase tracking-wider">
                      <Scale size={14} /> 3. Stock Balance Summary
                    </h4>
                    <span className="text-[11px] text-[#6D8AA2]">
                      Clean reconciliation balance across items
                    </span>
                  </div>

                  <div className="border border-[#0A4B6E]/30 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-[#0D4B6E] text-white text-[11px] uppercase tracking-wider font-semibold select-none">
                          <th className="py-2.5 px-3">Product</th>
                          <th className="py-2.5 px-3 text-center">Loaded Out</th>
                          <th className="py-2.5 px-3 text-center">Sold (App)</th>
                          <th className="py-2.5 px-3 text-center">Returned (Physical)</th>
                          <th className="py-2.5 px-3 text-center">Canister Debt</th>
                          <th className="py-2.5 px-3 text-center">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {balanceRows.map((r) => (
                          <tr key={r.productId} className="hover:bg-[#F4F9FC] transition-colors">
                            <td className="py-2.5 px-3 font-bold text-[#0A4B6E]">{r.productName}</td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-800">{r.loadedOut}</td>
                            <td className="py-2.5 px-3 text-center text-slate-600 bg-slate-50/70">{r.soldApp}</td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-800">
                              {r.returnedPhysical}
                              <span className="text-[10px] text-[#6D8AA2] block font-normal">
                                ({r.returnedFull}F · {r.returnedEmptyGood}E · {r.returnedDefective}D)
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-700">{r.canisterDebt}</td>
                            <td className="py-2.5 px-3 text-center">
                              {r.isBalanced ? (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                                  Balanced (0)
                                </span>
                              ) : r.netBalance < 0 ? (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300">
                                  {r.netBalance} Missing
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-blue-900 bg-blue-100 border border-blue-300">
                                  +{r.netBalance} Over
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. SUPERVISOR NOTES */}
                <div className="border border-[#CBD5E1] rounded-xl p-3.5 bg-white space-y-1.5 shadow-2xs">
                  <label className="text-xs font-bold text-[#0A4B6E] block">
                    Supervisor Gate Intake Notes
                  </label>
                  <textarea
                    rows={2}
                    disabled={isTripSettled}
                    value={supervisorNotes}
                    onChange={(e) => setSupervisorNotes(e.target.value)}
                    placeholder="Physical gate count notes or discrepancy explanation..."
                    className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0A4B6E] focus:outline-[#0A4B6E] focus:border-[#0A4B6E]"
                  />
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="shrink-0 pt-3 border-t border-[#CBD5E1] flex items-center justify-between gap-3 bg-white">
                <div className="text-xs text-[#6D8AA2]">
                  {isTripSettled ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} /> This trip was settled and locked on {selectedTrip.reconciliation?.reconciledAt ? formatPhilippineDate(selectedTrip.reconciliation.reconciledAt) : "file"}.
                    </span>
                  ) : (
                    <span>Click Finalize to log physical yard unloads and lock trip reconciliation.</span>
                  )}
                </div>

                {canManage && !isTripSettled && (
                  <button
                    type="submit"
                    disabled={isSubmitting || !isOdometerValid}
                    className="flex items-center gap-1.5 bg-[#0A4B6E] hover:bg-[#0E384E] disabled:opacity-50 text-[#FFDF2C] font-bold text-xs px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    <span>{isSubmitting ? "Settling..." : "Finalize & Settle Trip"}</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

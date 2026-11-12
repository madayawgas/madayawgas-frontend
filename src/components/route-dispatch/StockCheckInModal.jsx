// src/components/route-dispatch/StockCheckInModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Warehouse,
  RotateCcw,
  ShieldAlert,
  Check,
  Info,
  Sparkles,
  Layers,
} from "lucide-react";
import Modal from "../ui/Modal.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import { tripsApi } from "../../api/trips.js";

/**
 * StockCheckInModal — Fast, physical yard gate return check-in.
 * 
 * Optimized for multi-product dispatches:
 * - High-density tabular layout (Product | Loaded | Unsold | Good Empties | Damaged | Total | Action)
 * - 1-click "Mark All as Sold" bulk action for the standard 100% sellout scenario
 * - Inline defect note row that only expands when Damaged > 0
 * - Real-time variance & balance computation
 * - Conforms to project standards via reusable <Modal>, <Badge>, and <Button>
 */
export default function StockCheckInModal({
  isOpen,
  onClose,
  trip,
  products = [],
  onCompleteSuccess,
}) {
  const [step, setStep] = useState(1); // 1 = Table Form, 2 = Review & Confirm
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Group loaded products from dispatch loads
  const loadedProducts = useMemo(() => {
    if (!trip) return [];
    const loads = trip.loads || [];
    const allItems = loads.flatMap((l) => l.items || []);
    const filledItems = allItems.filter((i) => (i.condition || "FILLED") === "FILLED");

    // Aggregate by productId
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

    const result = Array.from(map.values());
    // Fallback to default product if no itemized loads were found
    if (result.length === 0 && products.length > 0) {
      result.push({
        productId: products[0].id,
        productName: products[0].name || "Butane Canister 250g",
        containerType: products[0].containerType || "CANISTER",
        netWeightKg: products[0].netWeightKg || 0.25,
        loadedUnits: 120,
      });
    }
    return result;
  }, [trip, products]);

  // Physical counts state map: { [productId]: { returnedFull, returnedEmptyGood, returnedDefective, defectNotes } }
  const [counts, setCounts] = useState({});
  const [supervisorNotes, setSupervisorNotes] = useState("");

  // Initialize or reset counts whenever trip opens
  useEffect(() => {
    if (isOpen && trip) {
      setStep(1);
      setError(null);
      setSupervisorNotes(
        trip.notes ? `Gate return verified. ${trip.notes}` : "Physical return counts verified at Bunawan yard gate."
      );

      const initial = {};
      loadedProducts.forEach((p) => {
        // Defaults: 0 unsold full, 0 defective, empties default to loaded units (standard sellout case)
        initial[p.productId] = {
          returnedFull: 0,
          returnedEmptyGood: p.loadedUnits || 0,
          returnedDefective: 0,
          defectNotes: "",
        };
      });
      setCounts(initial);
    }
  }, [isOpen, trip, loadedProducts]);

  if (!isOpen || !trip) return null;

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

  // Quick preset shortcuts for physical counts
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

  // Global bulk action: Mark all loaded products as completely sold out with empty returns
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

  // Global bulk action: Reset all return counts to 0
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

  // Helper: Format crate + loose text
  const formatCrates = (units) => {
    const u = Number(units) || 0;
    const crates = Math.floor(u / 24);
    const loose = u % 24;
    if (crates === 0) return `${loose} cans`;
    if (loose === 0) return `${crates} crt`;
    return `${crates} crt + ${loose}`;
  };

  // Aggregate totals across all products
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

  const handleProceedToConfirm = (e) => {
    if (e) e.preventDefault();
    setError(null);
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Build returnLoads array conforming to API contract
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

      // Construct payload
      const payload = {
        returnOdometerKm: Number(trip.departureOdometer || trip.truck_current_odometer || 0),
        supervisorNotes: supervisorNotes.trim() || "Physical yard return intake verified.",
        returnLoads,
      };

      const result = await tripsApi.completeTripReturn(trip.id, payload);

      // Invalidate caches
      localStorage.removeItem("app_trips_cache");
      localStorage.removeItem("app_items_cache");

      if (onCompleteSuccess) {
        onCompleteSuccess(result?.trip || trip);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to complete return check-in. Please try again.");
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Footer for Step 1 vs Step 2
  const renderFooter = () => {
    if (step === 1) {
      return (
        <div className="flex items-center justify-between gap-3 w-full">
          <Button
            type="button"
            variant="cancel"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleProceedToConfirm}
          >
            <span>Review Unloads</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between gap-3 w-full">
        <Button
          type="button"
          variant="cancel"
          onClick={() => setStep(1)}
          disabled={isSubmitting}
          className="flex items-center gap-1.5"
        >
          <ArrowLeft size={13} />
          <span>Back to Edit</span>
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={handleFinalSubmit}
          disabled={isSubmitting}
        >
          <span>{isSubmitting ? "Unloading..." : "Confirm Unload & Complete Trip"}</span>
          <CheckCircle2 size={14} strokeWidth={2.5} />
        </Button>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Return Stock Check-In"
      subtitle={`Trip ${trip.tripNumber} · ${trip.truckPlate} · ${trip.driverName || "Driver"} (${trip.zoneCode || trip.zoneName || "Main Zone"})`}
      icon={PackageCheck}
      badge={<Badge variant="info">{trip.truckPlate}</Badge>}
      onBack={step === 2 ? () => setStep(1) : null}
      maxWidth="max-w-4xl"
      footer={renderFooter()}
    >
      <div className="space-y-4 text-xs text-left">
        {error && (
          <div
            role="alert"
            className="p-3 bg-rose-50 border border-rose-200 text-[#C93B32] rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 animate-scale-in"
          >
            <AlertTriangle size={15} className="shrink-0 text-[#C93B32]" />
            <span>{error}</span>
          </div>
        )}

        {/* ================= STEP 1: TABULAR DATA ENTRY ================= */}
        {step === 1 && (
          <div className="space-y-3.5">
            {/* Top Toolbar: Context & 1-Click Fast Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[#0A4B6E]" />
                <span className="text-xs font-bold text-[#0A4B6E]">
                  Dispatched: {totals.totalLoaded} units ({formatCrates(totals.totalLoaded)})
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-[11px] text-slate-500">
                  {loadedProducts.length} {loadedProducts.length === 1 ? "product type" : "product types"}
                </span>
              </div>

              {/* Fast Action Shortcuts */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllSoldOut}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F3F8] hover:bg-[#d8ecf6] text-[#0A4B6E] border border-[#BCE1F1] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Sets all unsold to 0 and empties to loaded count"
                >
                  <Sparkles size={12} className="text-[#0A4B6E]" />
                  <span>Mark All Sold Out</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetAllToZero}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 transition cursor-pointer flex items-center gap-1"
                  title="Reset counts to 0"
                >
                  <RotateCcw size={11} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* High-Density Multi-Product Entry Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[#6D8AA2] uppercase text-[10px] font-bold tracking-wider select-none">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[170px]">Product</th>
                    <th className="py-2.5 px-3 text-center w-[80px]">Loaded</th>
                    <th className="py-2.5 px-3 text-center w-[105px]">
                      <span className="text-slate-700">Unsold (Full)</span>
                    </th>
                    <th className="py-2.5 px-3 text-center w-[105px]">
                      <span className="text-[#0A4B6E]">Good Empties</span>
                    </th>
                    <th className="py-2.5 px-3 text-center w-[105px]">
                      <span className="text-rose-700">Damaged</span>
                    </th>
                    <th className="py-2.5 px-3 text-center w-[100px]">Total Count</th>
                    <th className="py-2.5 px-3 text-center w-[75px]">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loadedProducts.map((p) => {
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
                        <tr className="hover:bg-slate-50/70 transition-colors">
                          {/* Product Info */}
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-[#0A4B6E] text-xs leading-tight">
                              {p.productName}
                            </p>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {p.containerType === "CANISTER" ? "Butane Canister" : "LPG Cylinder"} · {p.netWeightKg}kg
                            </span>
                          </td>

                          {/* Loaded Quantity */}
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {p.loadedUnits}
                            </span>
                          </td>

                          {/* Unsold (Full) */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={pCounts.returnedFull}
                              onChange={(e) => handleCountChange(p.productId, "returnedFull", e.target.value)}
                              className="w-18 text-center py-1.5 px-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-[#0A4B6E] focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
                            />
                          </td>

                          {/* Good Empties */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={pCounts.returnedEmptyGood}
                              onChange={(e) => handleCountChange(p.productId, "returnedEmptyGood", e.target.value)}
                              className="w-18 text-center py-1.5 px-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-[#0A4B6E] focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
                            />
                          </td>

                          {/* Damaged / Defective */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={pCounts.returnedDefective}
                              onChange={(e) => handleCountChange(p.productId, "returnedDefective", e.target.value)}
                              className={`w-18 text-center py-1.5 px-1 rounded-lg text-xs font-bold transition-all focus:outline-none focus:ring-2 ${
                                hasDefects
                                  ? "bg-rose-50 border-rose-400 text-rose-700 focus:ring-rose-500"
                                  : "bg-white border-slate-300 text-slate-700 focus:ring-[#0A4B6E]"
                              }`}
                            />
                          </td>

                          {/* Total Counted & Row Status */}
                          <td className="py-2.5 px-3 text-center">
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
                                <Check size={13} className="text-emerald-600 stroke-[2.5]" />
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

                          {/* Row Action: Quick Autofill */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => applyRowAllSold(p.productId, p.loadedUnits)}
                              className="px-2 py-1 rounded text-[10px] font-bold text-[#0A4B6E] hover:bg-[#E8F3F8] border border-slate-200 hover:border-[#0A4B6E]/40 transition cursor-pointer"
                              title="Set unsold to 0 and empties to loaded count"
                            >
                              All Sold
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Defect Note row if damaged > 0 */}
                        {hasDefects && (
                          <tr className="bg-rose-50/50">
                            <td colSpan={7} className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider shrink-0">
                                  Defect Note:
                                </span>
                                <input
                                  type="text"
                                  placeholder="e.g. 2 leaking valves, 1 dented body..."
                                  value={pCounts.defectNotes}
                                  onChange={(e) => handleNotesChange(p.productId, e.target.value)}
                                  className="w-full px-2.5 py-1 text-xs bg-white border border-rose-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>

                {/* Table Footer with Totals */}
                <tfoot className="bg-[#F8FAFC] border-t border-slate-200 font-bold text-xs text-slate-700">
                  <tr>
                    <td className="py-2.5 px-3 text-[#0A4B6E]">Total Units</td>
                    <td className="py-2.5 px-3 text-center text-slate-800">{totals.totalLoaded}</td>
                    <td className="py-2.5 px-3 text-center text-slate-800">{totals.totalFull}</td>
                    <td className="py-2.5 px-3 text-center text-[#0A4B6E]">{totals.totalEmpty}</td>
                    <td className="py-2.5 px-3 text-center text-rose-700">{totals.totalDefect}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-xs ${
                          varianceFromLoaded === 0
                            ? "text-emerald-700 font-bold"
                            : varianceFromLoaded < 0
                            ? "text-amber-700 font-bold"
                            : "text-blue-700 font-bold"
                        }`}
                      >
                        {totals.totalReturned}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {varianceFromLoaded === 0 && (
                        <span className="text-[10px] text-emerald-700 font-bold uppercase">Balanced</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Live Count Balance Feedback Banner */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <span className="text-slate-600 font-medium">Reconciliation Status:</span>
              {varianceFromLoaded === 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300">
                  <CheckCircle2 size={13} />
                  <span>All {totals.totalLoaded} dispatched units accounted for</span>
                </span>
              ) : varianceFromLoaded < 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-amber-900 bg-amber-100 border border-amber-300">
                  <Info size={13} />
                  <span>{Math.abs(varianceFromLoaded)} units pending customer swap / credit</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-blue-900 bg-blue-100 border border-blue-300">
                  +{varianceFromLoaded} extra units returned
                </span>
              )}
            </div>

            {/* Optional Supervisor Gate Notes */}
            <div>
              <label htmlFor="supervisor-gate-notes" className="text-[11px] font-bold text-[#6D8AA2] uppercase tracking-wider block mb-1">
                Gate Notes (Optional)
              </label>
              <input
                id="supervisor-gate-notes"
                type="text"
                value={supervisorNotes}
                onChange={(e) => setSupervisorNotes(e.target.value)}
                placeholder="Vehicle physical condition, seal integrity, or gate notes..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/30"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 2: REVIEW & CONFIRM ================= */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center py-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center font-bold mb-2 shadow-2xs">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-base font-bold text-[#0A4B6E]">Review Yard Inventory Credit</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical counts below will be credited directly to Bunawan Yard balances upon confirmation.
              </p>
            </div>

            {/* Yard Credit Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Sale-Ready Warehouse */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                  <Warehouse size={15} />
                  <span>Warehouse (Full)</span>
                </div>
                <p className="text-lg font-bold text-[#0A4B6E] mt-1">
                  +{totals.totalFull.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
                </p>
                <span className="text-[10px] text-slate-500 block">
                  Sealed unsold stock
                </span>
              </div>

              {/* Plant Refill Queue */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-2xs">
                <div className="flex items-center gap-2 text-[#0A4B6E] font-bold text-xs">
                  <RotateCcw size={15} />
                  <span>Refill Dock (Empties)</span>
                </div>
                <p className="text-lg font-bold text-[#0A4B6E] mt-1">
                  +{totals.totalEmpty.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
                </p>
                <span className="text-[10px] text-slate-500 block">
                  Customer return swaps
                </span>
              </div>

              {/* Quarantine Defective */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-2xs">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                  <ShieldAlert size={15} />
                  <span>Quarantine Buffer</span>
                </div>
                <p className="text-lg font-bold text-rose-700 mt-1">
                  +{totals.totalDefect.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
                </p>
                <span className="text-[10px] text-slate-500 block">
                  Damaged or leaking units
                </span>
              </div>
            </div>

            {/* Breakdown Table Recap */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[#6D8AA2] text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3 text-center">Unsold</th>
                    <th className="py-2 px-3 text-center">Empties</th>
                    <th className="py-2 px-3 text-center">Damaged</th>
                    <th className="py-2 px-3 text-center">Total Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadedProducts.map((p) => {
                    const c = counts[p.productId] || { returnedFull: 0, returnedEmptyGood: 0, returnedDefective: 0 };
                    const tot = (Number(c.returnedFull) || 0) + (Number(c.returnedEmptyGood) || 0) + (Number(c.returnedDefective) || 0);
                    return (
                      <tr key={p.productId}>
                        <td className="py-2 px-3 font-semibold text-[#0A4B6E]">{p.productName}</td>
                        <td className="py-2 px-3 text-center font-medium">{c.returnedFull}</td>
                        <td className="py-2 px-3 text-center font-medium text-[#0A4B6E]">{c.returnedEmptyGood}</td>
                        <td className="py-2 px-3 text-center font-medium text-rose-700">{c.returnedDefective}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800">{tot}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Reassurance Notice */}
            <div className="p-3 bg-[#E8F3F8] border border-[#BCE1F1] rounded-xl text-xs text-[#0A4B6E] flex items-center gap-2">
              <Sparkles size={16} className="text-[#0A4B6E] shrink-0" />
              <span>
                Completing return check-in updates Bunawan yard inventory immediately.
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

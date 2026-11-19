// src/components/route-dispatch/TripReconciliationManifest.jsx
import { useState, useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  Package,
  Plus,
  RotateCcw,
  FileText,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  computeTripReconciliation,
  formatVarianceSummary,
} from "../../utils/reconciliation.js";
import { formatPhilippineTime } from "../../utils/date.js";

/**
 * TripReconciliationManifest
 * Shared Loaded vs. Returned & Dual Reconciliation component used across:
 * - StockCheckInPage (mode="checkin", editable physical return counts)
 * - TripDetailPanel & TransferRecords SideDrawer (mode="audit", read-only)
 */
export default function TripReconciliationManifest({
  trip,
  mode = "audit",
  counts = null,
  onCountChange = null,
  onApplyRowAllSold = null,
  disabled = false,
  onReviewReconcile = null,
  compact = false,
}) {
  const [showSalesColumns, setShowSalesColumns] = useState(false);

  const loads = useMemo(() => trip?.loads || [], [trip?.loads]);
  const salesSummary = trip?.salesSummary || null;
  const reconciliation = trip?.reconciliation || null;

  const computed = useMemo(
    () =>
      computeTripReconciliation({
        loads,
        salesSummary,
        reconciliation,
        returnCountsOverride: mode === "checkin" ? counts : null,
      }),
    [loads, salesSummary, reconciliation, mode, counts]
  );

  const { products, totals, hasVariance, isAwaitingSync, isBalanced } = computed;
  const varianceLabel = formatVarianceSummary(
    totals.fullDiscrepancy,
    totals.emptyDiscrepancy
  );

  const dispatchLoads = loads.filter((l) => l.transferType === "DISPATCH_LOAD");
  const middayLoads = loads.filter((l) => l.transferType === "MIDDAY_RELOAD");
  const returnUnload = loads.find((l) => l.transferType === "RETURN_UNLOAD");

  const statusMeta = useMemo(() => {
    if (isAwaitingSync) {
      return {
        label: "Awaiting Sync",
        pillClass: "bg-amber-50 text-amber-800 border-amber-200",
        dotClass: "bg-amber-500",
        Icon: Clock,
      };
    }
    if (hasVariance) {
      return {
        label: `Flagged Variance · ${varianceLabel}`,
        pillClass: "bg-rose-50 text-[#C93B32] border-rose-200",
        dotClass: "bg-[#C93B32]",
        Icon: AlertTriangle,
      };
    }
    return {
      label: "Settled",
      pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotClass: "bg-emerald-600",
      Icon: CheckCircle2,
    };
  }, [isAwaitingSync, hasVariance, varianceLabel]);

  const StatusIcon = statusMeta.Icon;

  if (mode === "checkin") {
    return (
      <div className="flex flex-col flex-1 min-h-0 space-y-2.5">
        {/* Compact Dual-Balance Summary Strip */}
        <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-white border border-[#0A4B6E]/20 rounded-xl px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D8AA2] block">
              Dispatched
            </span>
            <span className="text-base font-bold text-[#0A4B6E] tabular-nums">
              {totals.loadedFull}
            </span>
          </div>
          <div className="bg-white border border-[#0A4B6E]/20 rounded-xl px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D8AA2] block">
              Synced Sold
            </span>
            <span className="text-base font-bold text-[#0A4B6E] tabular-nums">
              {totals.soldFull}
              {totals.netCustomerDebtCreated !== 0 && (
                <span className="text-[11px] font-semibold text-[#6D8AA2] ml-1.5">
                  ({totals.netCustomerDebtCreated > 0 ? `+${totals.netCustomerDebtCreated}` : totals.netCustomerDebtCreated} debt)
                </span>
              )}
            </span>
          </div>
          <div className="bg-white border border-[#0A4B6E]/20 rounded-xl px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D8AA2] block">
              Counted Return
            </span>
            <span className="text-base font-bold text-[#0A4B6E] tabular-nums">
              {totals.totalReturned}
            </span>
          </div>
          <div
            className={`border rounded-xl px-3 py-2 ${
              hasVariance
                ? "bg-rose-50/80 border-rose-200"
                : "bg-emerald-50/70 border-emerald-200"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D8AA2] block">
              Live Balance
            </span>
            <span
              className={`text-sm font-bold tabular-nums flex items-center gap-1 ${
                hasVariance ? "text-[#C93B32]" : "text-emerald-700"
              }`}
            >
              {hasVariance ? (
                <AlertTriangle size={13} className="shrink-0" />
              ) : (
                <CheckCircle2 size={13} className="shrink-0" />
              )}
              <span className="truncate">{varianceLabel}</span>
            </span>
          </div>
        </div>

        {/* Physical Return Intake Table */}
        <div className="flex-1 min-h-0 bg-white rounded-xl border border-[#0A4B6E]/30 overflow-hidden flex flex-col">
          <div className="shrink-0 px-3.5 py-2 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A4B6E]">
              Physical Return Counts
            </span>
            <button
              type="button"
              onClick={() => setShowSalesColumns((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0A4B6E] hover:underline cursor-pointer"
            >
              {showSalesColumns ? <EyeOff size={12} /> : <Eye size={12} />}
              <span>{showSalesColumns ? "Hide Sold & Debt" : "Show Sold & Debt"}</span>
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#0D4B6E] text-white sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3.5 text-[11px] font-bold uppercase tracking-wider">
                    Product
                  </th>
                  <th className="py-2.5 px-2.5 text-[11px] font-bold uppercase tracking-wider text-center w-20">
                    Loaded
                  </th>
                  {showSalesColumns && (
                    <>
                      <th className="py-2.5 px-2.5 text-[11px] font-bold uppercase tracking-wider text-center w-16 bg-[#0A3D5A]">
                        Sold
                      </th>
                      <th className="py-2.5 px-2.5 text-[11px] font-bold uppercase tracking-wider text-center w-16 bg-[#0A3D5A]">
                        Debt
                      </th>
                    </>
                  )}
                  <th className="py-2.5 px-2.5 text-[11px] font-bold uppercase tracking-wider text-center w-28">
                    Full
                  </th>
                  <th className="py-2.5 px-2.5 text-[11px] font-bold uppercase tracking-wider text-center w-28">
                    Empty Good
                  </th>
                  <th className="py-2.5 px-2.5 text-[11px] font-bold uppercase tracking-wider text-center w-28">
                    Defective
                  </th>
                  <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-center w-36">
                    Variance
                  </th>
                  <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-right w-24">
                    Quick
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={showSalesColumns ? 9 : 7}
                      className="py-10 text-center text-slate-500 text-xs"
                    >
                      No dispatched products found for this trip.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const rowCounts = counts?.[p.productId] || {
                      returnedFull: 0,
                      returnedEmptyGood: 0,
                      returnedDefective: 0,
                    };
                    const rowVarianceText = formatVarianceSummary(
                      p.fullDiscrepancy,
                      p.emptyDiscrepancy
                    );

                    return (
                      <tr
                        key={p.productId}
                        className={`transition-colors ${
                          p.hasVariance ? "bg-rose-50/30 hover:bg-rose-50/50" : "hover:bg-[#F3F8FB]"
                        }`}
                      >
                        <td className="py-2.5 px-3.5">
                          <span className="font-bold text-[#0A4B6E] block text-xs">
                            {p.productName}
                          </span>
                          <span className="text-[11px] text-[#6D8AA2]">
                            {p.containerType === "CANISTER" ? "Canister" : "Cylinder"}
                            {p.netWeightKg ? ` · ${p.netWeightKg}kg` : ""}
                          </span>
                        </td>

                        <td className="py-2.5 px-2.5 text-center font-bold text-[#0A4B6E] tabular-nums">
                          {p.loadedFull}
                        </td>

                        {showSalesColumns && (
                          <>
                            <td className="py-2.5 px-2.5 text-center font-semibold text-slate-700 bg-slate-50/70 tabular-nums">
                              {p.soldFull}
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-semibold text-slate-700 bg-slate-50/70 tabular-nums">
                              {p.netCustomerDebtCreated}
                            </td>
                          </>
                        )}

                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            aria-label={`${p.productName} returned full`}
                            value={rowCounts.returnedFull}
                            onChange={(e) =>
                              onCountChange &&
                              onCountChange(p.productId, "returnedFull", e.target.value)
                            }
                            disabled={disabled}
                            className="w-20 mx-auto block px-2 py-1.5 text-center font-bold text-[#0A4B6E] bg-[#F3F5F5] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0A4B6E] focus:bg-white transition-all text-xs tabular-nums"
                          />
                        </td>

                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            aria-label={`${p.productName} returned empty good`}
                            value={rowCounts.returnedEmptyGood}
                            onChange={(e) =>
                              onCountChange &&
                              onCountChange(p.productId, "returnedEmptyGood", e.target.value)
                            }
                            disabled={disabled}
                            className="w-20 mx-auto block px-2 py-1.5 text-center font-bold text-emerald-700 bg-[#F3F5F5] border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-xs tabular-nums"
                          />
                        </td>

                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            aria-label={`${p.productName} returned defective`}
                            value={rowCounts.returnedDefective}
                            onChange={(e) =>
                              onCountChange &&
                              onCountChange(p.productId, "returnedDefective", e.target.value)
                            }
                            disabled={disabled}
                            className="w-20 mx-auto block px-2 py-1.5 text-center font-bold text-[#C93B32] bg-[#F3F5F5] border border-slate-300 rounded-lg focus:outline-none focus:border-[#C93B32] focus:bg-white transition-all text-xs tabular-nums"
                          />
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                              p.hasVariance
                                ? "bg-rose-100 text-[#C93B32]"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {p.hasVariance ? (
                              <AlertTriangle size={11} className="shrink-0" />
                            ) : (
                              <Check size={11} className="shrink-0" />
                            )}
                            <span>{rowVarianceText}</span>
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              onApplyRowAllSold &&
                              onApplyRowAllSold(p.productId, p.loadedFull)
                            }
                            disabled={disabled}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E8F3F8] hover:bg-[#0A4B6E] text-[#0A4B6E] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                            title="Set Empty Good equal to Dispatched"
                          >
                            All Sold
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // AUDIT MODE (Read-Only for TripDetailPanel & TransferRecords SideDrawer)
  return (
    <div className="space-y-3">
      {/* Status & Summary Card */}
      <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <span className="font-bold text-xs text-[#0A4B6E] uppercase tracking-wider">
            Loaded vs. Returned
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusMeta.pillClass}`}
          >
            <StatusIcon size={11} className="shrink-0" />
            <span>{statusMeta.label}</span>
          </span>
        </div>

        {/* System vs Physical Strip */}
        <div className={`grid ${compact ? "grid-cols-3" : "grid-cols-4"} gap-2 text-xs`}>
          <div className="bg-white px-2.5 py-2 rounded-lg border border-slate-200">
            <span className="text-[10px] font-semibold text-[#6D8AA2] uppercase block">
              Loaded
            </span>
            <span className="font-bold text-[#0A4B6E] text-sm tabular-nums">
              {totals.loadedFull}
            </span>
          </div>
          <div className="bg-white px-2.5 py-2 rounded-lg border border-slate-200">
            <span className="text-[10px] font-semibold text-[#6D8AA2] uppercase block">
              Sold
            </span>
            <span className="font-bold text-slate-800 text-sm tabular-nums">
              {totals.soldFull}
            </span>
          </div>
          {!compact && (
            <div className="bg-white px-2.5 py-2 rounded-lg border border-slate-200">
              <span className="text-[10px] font-semibold text-[#6D8AA2] uppercase block">
                Debt
              </span>
              <span className="font-bold text-slate-800 text-sm tabular-nums">
                {totals.netCustomerDebtCreated}
              </span>
            </div>
          )}
          <div className="bg-white px-2.5 py-2 rounded-lg border border-slate-200">
            <span className="text-[10px] font-semibold text-[#6D8AA2] uppercase block">
              Returned
            </span>
            <span className="font-bold text-[#0A4B6E] text-sm tabular-nums">
              {totals.totalReturned}
            </span>
          </div>
        </div>

        {/* Per-SKU Reconciliation Breakdown */}
        {products.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-[#0D4B6E] text-white">
                <tr>
                  <th className="py-1.5 px-2.5 font-bold uppercase tracking-wider">SKU</th>
                  <th className="py-1.5 px-2 font-bold uppercase tracking-wider text-center">
                    Load
                  </th>
                  <th className="py-1.5 px-2 font-bold uppercase tracking-wider text-center">
                    Sold
                  </th>
                  <th className="py-1.5 px-2 font-bold uppercase tracking-wider text-center">
                    Ret (F/E/D)
                  </th>
                  <th className="py-1.5 px-2.5 font-bold uppercase tracking-wider text-right">
                    Var
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const rowVar = isAwaitingSync
                    ? "Pending"
                    : formatVarianceSummary(p.fullDiscrepancy, p.emptyDiscrepancy);
                  return (
                    <tr key={p.productId}>
                      <td className="py-2 px-2.5 font-semibold text-[#0A4B6E] truncate max-w-[110px]">
                        {p.productName}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-slate-700 tabular-nums">
                        {p.loadedFull}
                      </td>
                      <td className="py-2 px-2 text-center font-semibold text-slate-700 tabular-nums">
                        {p.soldFull}
                      </td>
                      <td className="py-2 px-2 text-center font-medium text-slate-700 tabular-nums">
                        {p.returnedFull}/{p.returnedEmptyGood}/{p.returnedDefective}
                      </td>
                      <td
                        className={`py-2 px-2.5 text-right font-bold tabular-nums ${
                          isAwaitingSync
                            ? "text-amber-700"
                            : p.hasVariance
                            ? "text-[#C93B32]"
                            : "text-emerald-700"
                        }`}
                      >
                        {rowVar}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Dual Variance Totals */}
        {!isAwaitingSync && (
          <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-[#6D8AA2] font-medium">
              Full Diff:{" "}
              <strong
                className={`tabular-nums ${
                  totals.fullDiscrepancy === 0 ? "text-emerald-700" : "text-[#C93B32]"
                }`}
              >
                {totals.fullDiscrepancy}
              </strong>
            </span>
            <span className="text-[#6D8AA2] font-medium">
              Empty Diff:{" "}
              <strong
                className={`tabular-nums ${
                  totals.emptyDiscrepancy === 0 ? "text-emerald-700" : "text-[#C93B32]"
                }`}
              >
                {totals.emptyDiscrepancy}
              </strong>
            </span>
          </div>
        )}

        {/* Supervisor Audit Notes */}
        {reconciliation?.supervisorNotes && (
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D8AA2] flex items-center gap-1 mb-0.5">
              <FileText size={11} /> Audit Notes
            </span>
            <p className="text-slate-700 leading-snug">{reconciliation.supervisorNotes}</p>
          </div>
        )}

        {/* Direct Review / Re-reconcile CTA */}
        {onReviewReconcile && (hasVariance || isAwaitingSync || !isBalanced) && (
          <button
            type="button"
            onClick={onReviewReconcile}
            className="w-full py-2 px-3 rounded-full text-[11px] font-bold bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <span>Review / Re-reconcile</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Dispatch, Reload & Return Slips Timeline */}
      {loads.length > 0 && (
        <div className="space-y-2">
          <span className="font-bold text-xs text-[#0A4B6E] uppercase tracking-wider block">
            Load & Return Slips ({loads.length})
          </span>

          <div className="space-y-1.5">
            {dispatchLoads.map((load, idx) => (
              <div
                key={load.id || `disp-${idx}`}
                className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0A4B6E] flex items-center gap-1">
                    <Package size={12} /> Dispatch Load
                  </span>
                  <span className="text-[11px] font-mono text-slate-600">
                    {load.slipNumber}
                    {load.recordedAt ? ` · ${formatPhilippineTime(load.recordedAt)}` : ""}
                  </span>
                </div>
                <div className="space-y-0.5 text-xs">
                  {load.items?.map((item, iIdx) => (
                    <div key={iIdx} className="flex justify-between text-slate-700">
                      <span className="truncate pr-2">{item.productName}</span>
                      <span className="font-bold text-[#0A4B6E] shrink-0 tabular-nums">
                        {item.quantityUnits}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {middayLoads.map((load, idx) => (
              <div
                key={load.id || `mid-${idx}`}
                className="bg-emerald-50/70 rounded-lg p-2.5 border border-emerald-200 space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <Plus size={12} /> Midday Reload
                  </span>
                  <span className="text-[11px] font-mono text-emerald-800">
                    {load.slipNumber}
                    {load.recordedAt ? ` · ${formatPhilippineTime(load.recordedAt)}` : ""}
                  </span>
                </div>
                <div className="space-y-0.5 text-xs">
                  {load.items?.map((item, iIdx) => (
                    <div key={iIdx} className="flex justify-between text-slate-700">
                      <span className="truncate pr-2">{item.productName}</span>
                      <span className="font-bold text-emerald-800 shrink-0 tabular-nums">
                        +{item.quantityUnits}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {returnUnload && (
              <div className="bg-blue-50/70 rounded-lg p-2.5 border border-[#BCE1F1] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0A4B6E] flex items-center gap-1">
                    <RotateCcw size={12} /> Return Unload
                  </span>
                  <span className="text-[11px] font-mono text-[#0A4B6E]">
                    {returnUnload.slipNumber}
                    {returnUnload.recordedAt
                      ? ` · ${formatPhilippineTime(returnUnload.recordedAt)}`
                      : ""}
                  </span>
                </div>
                <div className="space-y-0.5 text-xs">
                  {returnUnload.items?.map((item, iIdx) => (
                    <div key={iIdx} className="flex justify-between text-slate-700">
                      <span className="truncate pr-2">
                        {item.productName} ({item.condition?.replace("_", " ")})
                      </span>
                      <span className="font-bold text-[#0A4B6E] shrink-0 tabular-nums">
                        {item.quantityUnits}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// src/components/route-dispatch/TripReconciliationLedger.jsx
import React from "react";
import {
  Truck,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  MessageSquareText,
} from "lucide-react";
import { isCanisterProduct, getCanisterCrates } from "../../utils/product.js";
import { formatPhilippineTime } from "../../utils/date.js";
import { computeTripAccountability } from "../../utils/reconciliation.js";

function VariancePill({ diff, awaitingLabel = "Pending Sales" }) {
  if (diff === null || diff === undefined) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <Clock size={11} />
        <span>{awaitingLabel}</span>
      </span>
    );
  }
  const val = Number(diff) || 0;
  if (val === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 size={11} />
        <span>Balanced</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
      <AlertTriangle size={11} />
      <span>{val > 0 ? `${val} Missing` : `+${Math.abs(val)} Extra`}</span>
    </span>
  );
}

/**
 * TripReconciliationLedger — Unified Loaded vs. Returned & Stock Summary.
 * Reused across StockCheckInPage (livePreview), TripDetailPanel, and TransferRecords.
 */
export default function TripReconciliationLedger({
  trip,
  liveMetrics = null,
  showLoadSlips = true,
  onReviewReconcile = null,
}) {
  if (!trip) return null;

  const loadsList = Array.isArray(trip.loads) ? trip.loads : [];
  const dispatchLoads = loadsList.filter((l) => l.transferType === "DISPATCH_LOAD");
  const middayLoads = loadsList.filter((l) => l.transferType === "MIDDAY_RELOAD");
  const returnUnloads = loadsList.filter((l) => l.transferType === "RETURN_UNLOAD");

  const recon = trip.reconciliation || null;
  const salesSummary = trip.salesSummary || null;

  const isLive = Boolean(liveMetrics);
  const showSalesRow = isLive
    ? liveMetrics.showSalesRow ?? Boolean(liveMetrics.hasSyncedSales)
    : recon
    ? recon.status !== "AWAITING_SYNC"
    : Boolean(salesSummary && salesSummary.completedTransactions > 0);
  const hasSyncedSales = isLive
    ? Boolean(liveMetrics.hasSyncedSales)
    : recon
    ? recon.status !== "AWAITING_SYNC"
    : Boolean(salesSummary && salesSummary.completedTransactions > 0);

  const metrics = isLive
    ? computeTripAccountability({
        loadedFull: liveMetrics.loadedFull,
        soldFull: liveMetrics.soldFull,
        returnedFull: liveMetrics.returnedFull,
        returnedEmptyGood: liveMetrics.returnedEmptyGood,
        returnedDefective: liveMetrics.returnedDefective,
        netCustomerDebtCreated: liveMetrics.netCustomerDebtCreated,
        hasSyncedSales,
      })
    : recon
    ? computeTripAccountability({
        loadedFull: recon.totalLoadedFull,
        soldFull: recon.totalSoldFull,
        returnedFull: recon.totalReturnedFull,
        returnedEmptyGood: recon.totalReturnedEmptyGood,
        returnedDefective: recon.totalReturnedDefective,
        netCustomerDebtCreated: recon.netCustomerDebtCreated,
        hasSyncedSales: recon.status !== "AWAITING_SYNC",
      })
    : null;

  const reconStatus = isLive
    ? !hasSyncedSales
      ? "AWAITING_SYNC"
      : metrics?.hasVariance
      ? "FLAGGED_VARIANCE"
      : "SETTLED"
    : recon?.status || (trip.rawStatus === "RETURNED" ? "RETURNED" : null);

  const statusBadge = (() => {
    switch (reconStatus) {
      case "SETTLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={11} />
            <span>Settled</span>
          </span>
        );
      case "FLAGGED_VARIANCE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle size={11} />
            <span>Variance</span>
          </span>
        );
      case "AWAITING_SYNC":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Clock size={11} />
            <span>Pending Sales</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>Pending Check-In</span>
          </span>
        );
    }
  })();

  const renderLoadItems = (items = [], prefix = "") => (
    <div className="space-y-1 text-xs">
      {items.map((item, idx) => {
        const isCan = isCanisterProduct(item);
        const units = Number(item.quantityUnits) || 0;
        const { crates, remainder } = getCanisterCrates(units);
        const condLabel =
          item.condition && item.condition !== "FILLED"
            ? ` (${item.condition.replace("_", " ")})`
            : "";

        return (
          <div key={item.id || idx} className="flex justify-between items-center text-slate-700">
            <span className="truncate pr-2">
              {item.productName}
              {condLabel && <span className="text-[11px] text-[#6D8AA2]">{condLabel}</span>}
            </span>
            <span className="font-bold text-[#0A4B6E] shrink-0">
              {prefix}
              {units} {isCan ? "cans" : "cyl"}
              {isCan && crates > 0 ? ` (${crates} crt${remainder > 0 ? ` +${remainder}` : ""})` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3 text-left font-sans">
      {/* 1. LOAD & UNLOAD TRANSFER SLIPS */}
      {showLoadSlips && loadsList.length > 0 && (
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5">
              <Truck size={13} className="text-[#0A4B6E]" />
              <span>Loaded vs. Returned Slips</span>
            </h4>
            <span className="text-[11px] font-semibold text-[#6D8AA2]">
              {loadsList.length} slip{loadsList.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="space-y-2">
            {dispatchLoads.map((load) => (
              <div
                key={load.id || load.slipNumber}
                className="bg-white rounded-lg p-2.5 border border-slate-200 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-[#0A4B6E] flex items-center gap-1">
                    <Truck size={12} /> Initial Departure Load
                  </span>
                  <div className="flex items-center gap-1.5">
                    {load.recordedAt && (
                      <span className="text-[10px] text-[#6D8AA2]">
                        {formatPhilippineTime(load.recordedAt)}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-[#3E5C76] bg-slate-100 px-1.5 py-0.5 rounded">
                      {load.slipNumber}
                    </span>
                  </div>
                </div>
                {renderLoadItems(load.items)}
              </div>
            ))}

            {middayLoads.map((load) => (
              <div
                key={load.id || load.slipNumber}
                className="bg-amber-50/70 rounded-lg p-2.5 border border-amber-200 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-amber-900 flex items-center gap-1">
                    <Plus size={12} strokeWidth={2.5} /> Midday Reload Transfer
                  </span>
                  <div className="flex items-center gap-1.5">
                    {load.recordedAt && (
                      <span className="text-[10px] text-amber-800/80">
                        {formatPhilippineTime(load.recordedAt)}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      {load.slipNumber}
                    </span>
                  </div>
                </div>
                {renderLoadItems(load.items, "+")}
              </div>
            ))}

            {returnUnloads.map((load) => (
              <div
                key={load.id || load.slipNumber}
                className="bg-blue-50/70 rounded-lg p-2.5 border border-[#BCE1F1] space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-[#0A4B6E] flex items-center gap-1">
                    <RotateCcw size={12} /> Physical Return Unload
                  </span>
                  <div className="flex items-center gap-1.5">
                    {load.recordedAt && (
                      <span className="text-[10px] text-[#3E5C76]">
                        {formatPhilippineTime(load.recordedAt)}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-[#0A4B6E] bg-white px-1.5 py-0.5 rounded border border-[#BCE1F1]">
                      {load.slipNumber}
                    </span>
                  </div>
                </div>
                {renderLoadItems(load.items)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. CLEAN STOCK SUMMARY */}
      {metrics && (
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 gap-2">
            <span className="font-bold text-xs text-[#0A4B6E] flex items-center gap-1.5 uppercase tracking-wider">
              <FileSpreadsheet size={13} className="text-[#0A4B6E]" />
              <span>Stock Summary</span>
            </span>
            {statusBadge}
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#3E5C76]">Dispatched</span>
              <span className="font-bold text-[#0A4B6E]">{metrics.loaded}</span>
            </div>
            {showSalesRow && (
              <div className="flex justify-between">
                <span className="text-[#3E5C76]">Sold</span>
                <span className="font-semibold text-slate-800">{metrics.sold}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#3E5C76]">Returned Full</span>
              <span className="font-semibold text-slate-800">{metrics.retFull}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#3E5C76]">Good Empties</span>
              <span className="font-semibold text-slate-800">{metrics.retEmpty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#3E5C76]">Damaged</span>
              <span className={`font-semibold ${metrics.retDefect > 0 ? "text-rose-700" : "text-slate-800"}`}>
                {metrics.retDefect}
              </span>
            </div>
            {showSalesRow && metrics.debt > 0 && (
              <div className="flex justify-between">
                <span className="text-[#3E5C76]">Loaned to Customers</span>
                <span className="font-semibold text-slate-800">{metrics.debt}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-700">
                {!hasSyncedSales
                  ? "Status"
                  : (metrics.fullDiscrepancy ?? 0) !== 0 && (metrics.emptyDiscrepancy ?? 0) !== 0
                  ? "Full / Empty Variance"
                  : (metrics.emptyDiscrepancy ?? 0) !== 0
                  ? "Empty Return Variance"
                  : "Variance"}
              </span>
              {!hasSyncedSales ? (
                <VariancePill diff={null} />
              ) : (metrics.fullDiscrepancy ?? 0) !== 0 && (metrics.emptyDiscrepancy ?? 0) !== 0 ? (
                <div className="flex items-center gap-1">
                  <VariancePill diff={metrics.fullDiscrepancy} />
                  <VariancePill diff={metrics.emptyDiscrepancy} />
                </div>
              ) : (
                <VariancePill
                  diff={
                    (metrics.fullDiscrepancy ?? 0) !== 0
                      ? metrics.fullDiscrepancy
                      : metrics.emptyDiscrepancy
                  }
                />
              )}
            </div>
          </div>

          {!isLive && recon?.supervisorNotes && (
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs space-y-1">
              <span className="text-[11px] font-bold text-[#0A4B6E] flex items-center gap-1">
                <MessageSquareText size={12} />
                <span>Supervisor Notes</span>
              </span>
              <p className="text-slate-700 leading-relaxed">{recon.supervisorNotes}</p>
            </div>
          )}

          {!isLive &&
            onReviewReconcile &&
            (reconStatus === "FLAGGED_VARIANCE" || reconStatus === "AWAITING_SYNC") && (
              <button
                type="button"
                onClick={() => onReviewReconcile(trip)}
                className="w-full py-2 px-3 rounded-full text-[11px] font-bold bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] transition-all cursor-pointer shadow-2xs uppercase tracking-wider"
              >
                Re-Reconcile / Update Check-In
              </button>
            )}
        </div>
      )}
    </div>
  );
}

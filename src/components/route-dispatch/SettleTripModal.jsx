// src/components/route-dispatch/SettleTripModal.jsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Scale,
  X,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  ArrowRight,
} from "lucide-react";
import { tripsApi } from "../../api/trips.js";

/**
 * SettleTripModal — Post-trip financial reconciliation settlement.
 * 
 * Purpose:
 * Once physical returns have been checked in (via StockCheckInModal) and mobile cabin
 * sales have synced, the supervisor audits the variance and locks the trip reconciliation.
 */
export default function SettleTripModal({
  isOpen,
  onClose,
  trip,
  onSettleSuccess,
}) {
  const recon = trip?.reconciliation || {};
  const [soldFull, setSoldFull] = useState(recon.totalSoldFull ?? 0);
  const [customerDebt, setCustomerDebt] = useState(recon.netCustomerDebtCreated ?? 0);
  const [notes, setSupervisorNotes] = useState(
    recon.supervisorNotes || "Reconciliation audited and confirmed against sales receipts."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen || !trip) return null;

  const loadedFull = Number(recon.totalLoadedFull ?? trip?.onBoardSummary?.totalUnits ?? 0);
  const retFull = Number(recon.totalReturnedFull ?? 0);
  const retEmpty = Number(recon.totalReturnedEmptyGood ?? 0);
  const retDefect = Number(recon.totalReturnedDefective ?? 0);

  // Math: Full Discrepancy = Loaded - Sold - Returned Full - Returned Defective
  const fullDiscrepancy = loadedFull - Number(soldFull) - retFull - retDefect;
  // Empty Discrepancy = Sold - (Returned Empty + Customer Debt)
  const emptyDiscrepancy = Number(soldFull) - (retEmpty + Number(customerDebt));
  const isBalanced = fullDiscrepancy === 0 && emptyDiscrepancy === 0;

  const handleSettle = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        totalSoldFull: Number(soldFull),
        netCustomerDebtCreated: Number(customerDebt),
        supervisorNotes: notes.trim(),
      };

      const result = await tripsApi.settleReconciliation(trip.id, payload);

      localStorage.removeItem("app_trips_cache");
      localStorage.removeItem("app_items_cache");

      if (onSettleSuccess) {
        onSettleSuccess(result?.reconciliation || result);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to settle trip reconciliation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalNode = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settle-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden text-left">
        
        {/* HEADER */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center font-bold shadow-sm shrink-0">
              <Scale size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="settle-modal-title" className="text-base font-bold text-[#0A4B6E] tracking-tight">
                  Audit & Settle Trip
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1]">
                  {trip.truckPlate}
                </span>
              </div>
              <p className="text-xs text-[#475569] mt-0.5">
                Trip: <strong className="text-slate-800">{trip.tripNumber}</strong> · Driver: {trip.driverName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 bg-rose-50 border border-rose-200 text-[#C93B32] rounded-2xl text-xs font-semibold flex items-center gap-2 shrink-0"
          >
            <AlertTriangle size={15} className="shrink-0 text-[#C93B32]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSettle} className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 pr-1">
            
            {/* PHYSICAL UNLOAD SUMMARY (READ-ONLY) */}
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <span className="text-[11px] font-bold text-[#0A4B6E] uppercase tracking-wider block">
                1. Recorded Physical Unloads (Yard Intake)
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-[#475569] block">Full Unsold</span>
                  <strong className="text-slate-800 font-bold text-sm">{retFull}</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-[#475569] block">Good Empties</span>
                  <strong className="text-slate-800 font-bold text-sm">{retEmpty}</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-[#475569] block">Defective</span>
                  <strong className="text-rose-700 font-bold text-sm">{retDefect}</strong>
                </div>
              </div>
            </div>

            {/* SYNCED SALES & CUSTOMER DEBT INPUTS */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-[#0A4B6E] uppercase tracking-wider block">
                2. Synced Sales & Credit Audit
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="settle-sold-full" className="text-xs font-bold text-slate-800 block mb-1">
                    Confirmed Sold (Full Units) *
                  </label>
                  <input
                    id="settle-sold-full"
                    type="number"
                    min="0"
                    value={soldFull}
                    onChange={(e) => setSoldFull(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-[#0A4B6E] focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
                    required
                  />
                  <span className="text-[10px] text-[#475569] block mt-0.5">Full canisters sold & delivered</span>
                </div>

                <div>
                  <label htmlFor="settle-customer-debt" className="text-xs font-bold text-slate-800 block mb-1">
                    Customer Canister Debt
                  </label>
                  <input
                    id="settle-customer-debt"
                    type="number"
                    min="0"
                    value={customerDebt}
                    onChange={(e) => setCustomerDebt(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-[#0A4B6E] focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
                  />
                  <span className="text-[10px] text-[#475569] block mt-0.5">Empties owed by clients</span>
                </div>
              </div>
            </div>

            {/* VARIANCE RESULT BANNER */}
            <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
              isBalanced
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}>
              <div className="flex items-center gap-2">
                {isBalanced ? (
                  <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="text-amber-700 shrink-0" />
                )}
                <div>
                  <strong className="block font-bold">
                    {isBalanced ? "Stock Fully Balanced" : "Discrepancy Detected"}
                  </strong>
                  <span className="text-[11px]">
                    Full diff: {fullDiscrepancy} · Empty diff: {emptyDiscrepancy}
                  </span>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isBalanced
                  ? "bg-emerald-200/70 text-emerald-900"
                  : "bg-amber-200/70 text-amber-900"
              }`}>
                {isBalanced ? "READY TO SETTLE" : "FLAGGED VARIANCE"}
              </span>
            </div>

            {/* SUPERVISOR AUDIT NOTES */}
            <div className="space-y-1">
              <label htmlFor="settle-notes" className="text-xs font-bold text-slate-700 block">
                Audit Settlement Remarks
              </label>
              <textarea
                id="settle-notes"
                rows={2}
                value={notes}
                onChange={(e) => setSupervisorNotes(e.target.value)}
                placeholder="Discrepancy explanation or receipt verification note..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
              />
            </div>

          </div>

          {/* MODAL FOOTER */}
          <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer uppercase tracking-wider"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#0A4B6E] text-[#FFDF2C] hover:bg-[#0E384E] disabled:opacity-50 transition-all cursor-pointer shadow-sm flex items-center gap-1.5 uppercase tracking-wider active:scale-95"
            >
              <span>{isSubmitting ? "Locking..." : "Finalize & Settle"}</span>
              <FileCheck2 size={13} strokeWidth={2.5} />
            </button>
          </div>
        </form>

      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalNode, document.body)
    : modalNode;
}
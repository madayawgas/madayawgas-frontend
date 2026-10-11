// src/components/route-dispatch/ReconciliationModal.jsx
import { useState } from "react";
import { Scale, X, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

export default function ReconciliationModal({
  isOpen,
  onClose,
  trip,
  onSettle,
}) {
  const recon = trip?.reconciliation || {};
  const isAlreadySettled = recon.status === "SETTLED" || recon.isSettled;

  const [loadedFull, setLoadedFull] = useState(recon.totalLoadedFull ?? 120);
  const [soldFull, setSoldFull] = useState(recon.totalSoldFull ?? 95);
  const [returnedFull, setReturnedFull] = useState(recon.totalReturnedFull ?? 20);
  const [returnedEmptyGood, setReturnedEmptyGood] = useState(recon.totalReturnedEmptyGood ?? 95);
  const [returnedDefective, setReturnedDefective] = useState(recon.totalReturnedDefective ?? 5);
  const [customerDebt, setCustomerDebt] = useState(recon.netCustomerDebtCreated ?? 0);
  const [notes, setNotes] = useState(recon.supervisorNotes || "Physical counts verified against driver manifest slip.");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !trip) return null;

  // Real-time calculation based on formulas in API contract
  const fullDiscrepancy = Number(loadedFull) - Number(soldFull) - Number(returnedFull) - Number(returnedDefective);
  const emptyDiscrepancy = Number(soldFull) - (Number(returnedEmptyGood) + Number(customerDebt));
  const isBalanced = fullDiscrepancy === 0 && emptyDiscrepancy === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);
      await onSettle(trip.id, {
        supervisorNotes: notes,
        syncCompleted: true,
        salesData: [
          {
            soldFull: Number(soldFull),
            netCustomerDebtCreated: Number(customerDebt),
          },
        ],
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to settle reconciliation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#D5E3EC] max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              isBalanced ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
            }`}>
              <Scale size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A4B6E]">
                Post-Trip Stock Reconciliation Engine
              </h3>
              <p className="text-[11px] text-[#6D8AA2]">
                Vehicle: <strong className="text-[#0A4B6E]">{trip.truckPlate}</strong> · Zone: {trip.zoneCode || trip.zoneName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-[#D93025] rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Formulas Explainer Banner */}
          <div className="bg-[#EDF3F7] p-3 rounded-xl border border-[#D5E3EC] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0A4B6E]">
                Full Discrepancy = Loaded ({loadedFull}) − Sold ({soldFull}) − Ret Full ({returnedFull}) − Defective ({returnedDefective})
              </span>
              <span className={`font-black px-2 py-0.5 rounded-full text-[11px] ${
                fullDiscrepancy === 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-[#D93025]"
              }`}>
                {fullDiscrepancy === 0 ? "0 (Balanced)" : `${fullDiscrepancy > 0 ? `+${fullDiscrepancy}` : fullDiscrepancy} Units`}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#D5E3EC]">
              <span className="font-bold text-[#0A4B6E]">
                Empty Discrepancy = Sold ({soldFull}) − [Ret Empty ({returnedEmptyGood}) + Canister Debt ({customerDebt})]
              </span>
              <span className={`font-black px-2 py-0.5 rounded-full text-[11px] ${
                emptyDiscrepancy === 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-[#D93025]"
              }`}>
                {emptyDiscrepancy === 0 ? "0 (Balanced)" : `${emptyDiscrepancy > 0 ? `+${emptyDiscrepancy}` : emptyDiscrepancy} Units`}
              </span>
            </div>
          </div>

          {/* Breakdown Form Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
            <div>
              <span className="text-[11px] text-[#6D8AA2] font-semibold block mb-1">Loaded Full</span>
              <input
                type="number"
                disabled={isAlreadySettled}
                value={loadedFull}
                onChange={(e) => setLoadedFull(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-bold text-center text-[#0A4B6E]"
              />
            </div>

            <div>
              <span className="text-[11px] text-[#6D8AA2] font-semibold block mb-1">Sold Full (App Sync)</span>
              <input
                type="number"
                disabled={isAlreadySettled}
                value={soldFull}
                onChange={(e) => setSoldFull(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-bold text-center text-emerald-800"
              />
            </div>

            <div>
              <span className="text-[11px] text-[#6D8AA2] font-semibold block mb-1">Returned Full Unsold</span>
              <input
                type="number"
                disabled={isAlreadySettled}
                value={returnedFull}
                onChange={(e) => setReturnedFull(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-bold text-center text-[#0A4B6E]"
              />
            </div>

            <div>
              <span className="text-[11px] text-[#6D8AA2] font-semibold block mb-1">Returned Empty Good</span>
              <input
                type="number"
                disabled={isAlreadySettled}
                value={returnedEmptyGood}
                onChange={(e) => setReturnedEmptyGood(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-bold text-center text-emerald-800"
              />
            </div>

            <div>
              <span className="text-[11px] text-rose-700 font-semibold block mb-1">Returned Defective</span>
              <input
                type="number"
                disabled={isAlreadySettled}
                value={returnedDefective}
                onChange={(e) => setReturnedDefective(e.target.value)}
                className="w-full bg-white border border-rose-300 rounded-lg p-1.5 text-xs font-bold text-center text-rose-700"
              />
            </div>

            <div>
              <span className="text-[11px] text-[#6D8AA2] font-semibold block mb-1">Customer Canister Debt</span>
              <input
                type="number"
                disabled={isAlreadySettled}
                value={customerDebt}
                onChange={(e) => setCustomerDebt(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-bold text-center"
              />
            </div>
          </div>

          {/* Supervisor Notes */}
          <div>
            <label className="block font-bold text-[#0A4B6E] mb-1">Supervisor Audit Settlement Notes</label>
            <textarea
              rows={2}
              disabled={isAlreadySettled}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs focus:outline-[#0A4B6E]"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
            <div>
              {isBalanced ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle2 size={13} /> Balanced · Ready to SETTLE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D93025] bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                  <AlertTriangle size={13} /> Unbalanced · Will Flag Variance
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {isAlreadySettled ? "Close" : "Cancel"}
              </button>
              {!isAlreadySettled && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer disabled:opacity-50 ${
                    isBalanced
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-[#0A4B6E] hover:bg-[#0E384E]"
                  }`}
                >
                  {isSubmitting ? "Settling..." : isBalanced ? "Settle Trip (SETTLED) ➔" : "Flag Variance & Save"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

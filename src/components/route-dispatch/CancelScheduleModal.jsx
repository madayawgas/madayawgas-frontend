// src/components/route-dispatch/CancelScheduleModal.jsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CalendarX, X, Truck, Info, AlertTriangle } from "lucide-react";
import { formatPhilippineDate } from "../../utils/date.js";

const COMMON_SCHEDULE_REASONS = [
  "Driver Unavailable / On Leave",
  "Preventive Maintenance Scheduled",
  "Severe Weather Alert / Flood",
  "Route Reallocation",
  "Inventory Restock Delay",
];

export default function CancelScheduleModal({
  isOpen,
  onClose,
  schedule,
  onCancelSchedule,
}) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (schedule && isOpen) {
      setReason("");
      setError(null);
    }
  }, [schedule, isOpen]);

  if (!isOpen || !schedule) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError("Please provide a reason for cancelling today's scheduled run.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onCancelSchedule(schedule, { reason: reason.trim() });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to cancel scheduled dispatch");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = schedule.scheduledDate
    ? formatPhilippineDate(schedule.scheduledDate)
    : "Today";

  return createPortal(
    <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl border border-rose-200 max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-scale-in text-left">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold shrink-0">
              <CalendarX size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0A4B6E]">Cancel Today&apos;s Dispatch</h3>
              <p className="text-xs text-[#6D8AA2]">
                Cancels scheduled delivery run for <strong>{formattedDate}</strong> only.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer transition"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium p-3 rounded-xl flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Informational Callout */}
        <div className="bg-[#E8F3F8] border border-[#BCE1F1] rounded-xl p-3 text-xs text-[#0A4B6E] flex items-start gap-2.5">
          <Info size={16} className="text-[#0A4B6E] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            This will cancel this truck&apos;s dispatch for <strong>today only</strong> ({formattedDate}). The weekly recurring master route plan will remain active for future weeks.
          </p>
        </div>

        {/* Schedule Summary Card */}
        <div className="bg-[#F8FAFC] border border-[#CBD5E1]/60 rounded-xl p-3.5 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-[#0A4B6E]">
              <Truck size={14} />
              <span>{schedule.truckPlate}</span>
              <span className="text-slate-500 font-normal">({schedule.truckModel})</span>
            </div>
            <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200">
              Zone: {schedule.zoneCode || schedule.zoneName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-200/60">
            <div>
              <span className="text-[#6D8AA2]">Assigned Crew: </span>
              <strong>{schedule.driverName || "Driver"}</strong> · {schedule.salesName || "Sales Rep"}
            </div>
            <div className="text-right">
              <span className="text-[#6D8AA2]">Status: </span>
              <span className="font-bold text-slate-700">SCHEDULED</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason for Cancellation */}
          <div>
            <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
              Cancellation Reason <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Driver on sick leave, route deferred"
              className="w-full bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10 outline-none transition"
            />

            {/* Quick Reason Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {COMMON_SCHEDULE_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                    reason === r
                      ? "bg-rose-50 border-rose-300 text-rose-700 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-full text-xs font-bold transition cursor-pointer"
            >
              Keep Scheduled
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <CalendarX size={13} />
              <span>{isSubmitting ? "Cancelling..." : "Confirm Cancellation"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

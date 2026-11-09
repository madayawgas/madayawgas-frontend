import { useState } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, X, Calendar, CheckCircle2 } from "lucide-react";
import { getPhilippineTodayString, addPhilippineDays } from "../../utils/date.js";

export default function BatchGenerateModal({
  isOpen,
  onClose,
  onGenerate,
}) {
  const today = getPhilippineTodayString();
  const nextWeek = addPhilippineDays(today, 6);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextWeek);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [skippedList, setSkippedList] = useState([]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessResult(null);
    setSkippedList([]);

    try {
      setIsSubmitting(true);
      const res = await onGenerate({ startDate, endDate });
      const genCount = res?.data?.generatedCount ?? res?.generatedCount ?? 0;
      const skipCount = res?.data?.skippedCount ?? res?.skippedCount ?? 0;
      const skipped = res?.data?.skippedDetails || res?.skippedDetails || [];

      if (skipCount > 0) {
        setSkippedList(skipped);
        setSuccessResult(`Generated ${genCount} schedules (${skipCount} skipped due to schedule rules).`);
      } else {
        setSuccessResult(res?.message || `Successfully generated ${genCount} daily schedules from master templates.`);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || "Failed to generate schedules");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalNode = (
    <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl border border-[#D5E3EC] max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFDF2C]/20 text-[#0A4B6E] flex items-center justify-center font-bold">
              <RefreshCw size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A4B6E]">Batch Generate Daily Schedules</h3>
              <p className="text-[11px] text-[#6D8AA2]">Populates truck schedules from weekly master templates</p>
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

        {successResult && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{successResult}</span>
          </div>
        )}

        {skippedList.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5 text-left">
            <p className="font-bold text-amber-900">Skipped Templates Notice:</p>
            <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar pr-1">
              {skippedList.map((sk, idx) => (
                <div key={idx} className="text-[11px] text-amber-800 bg-white/70 p-1.5 rounded border border-amber-100">
                  <span className="font-semibold">{sk.plateNumber || sk.truckId} ({sk.date}):</span> {sk.reason}
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-[#E8F3F8] rounded-xl border border-[#BCE1F1] text-xs text-[#0A4B6E]">
            <p className="font-semibold mb-1">Create Daily Truck Schedules</p>
            <p className="text-[#486581]">
              Daily truck runs will be scheduled matching each active vehicle's weekly route plan. Existing schedules on selected dates are skipped safely.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#0A4B6E] mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] font-bold focus:outline-[#0A4B6E]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#0A4B6E] mb-1">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] font-bold focus:outline-[#0A4B6E]"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              {skippedList.length > 0 ? "Close" : "Cancel"}
            </button>
            {skippedList.length === 0 && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-full text-xs font-bold bg-[#0A4B6E] text-[#FFDF2C] hover:bg-[#0E384E] cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? "Generating..." : "Generate Schedules ➔"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

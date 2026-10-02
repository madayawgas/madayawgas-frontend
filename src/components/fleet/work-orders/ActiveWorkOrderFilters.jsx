import { Funnel, X } from "lucide-react";

const STATUS_VARIANTS = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  SCHEDULED: "bg-purple-50 text-purple-700 border-purple-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function ActiveWorkOrderFilters({ selectedStatus, onClearStatus }) {
  if (!selectedStatus || selectedStatus === "ALL") return null;

  const badgeClass = STATUS_VARIANTS[selectedStatus] || "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
      <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs shrink-0 whitespace-nowrap">
        <Funnel size={11} className="text-[#0A4B6E]/70 shrink-0" />
        <span>Status:</span>
        <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold border ${badgeClass}`}>
          {selectedStatus.replace("_", " ")}
        </span>
        <button
          type="button"
          onClick={onClearStatus}
          className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-[#0A4B6E]"
          title="Remove filter"
        >
          <X size={11} />
        </button>
      </span>
    </div>
  );
}

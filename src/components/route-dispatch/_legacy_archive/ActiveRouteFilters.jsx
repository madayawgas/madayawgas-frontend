// src/components/route-dispatch/ActiveRouteFilters.jsx
import { Funnel, X, Calendar } from "lucide-react";

export default function ActiveRouteFilters({
  dateScope,
  selectedStatus,
  selectedZone,
  dateFrom,
  dateTo,
  onClearDateScope,
  onClearStatus,
  onClearZone,
  onClearDates,
}) {
  const getStatusBadgeClass = (status) => {
    const norm = (status || "").toUpperCase();
    switch (norm) {
      case "IN_PROGRESS":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "AWAITING_SYNC":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "SETTLED":
        return "bg-blue-50 text-[#0A4B6E] border-[#BCE1F1]";
      case "FLAGGED_VARIANCE":
        return "bg-rose-50 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatStatusDisplay = (status) => {
    switch ((status || "").toUpperCase()) {
      case "IN_PROGRESS":
        return "Out on Route";
      case "AWAITING_SYNC":
        return "Pending Reconciliation";
      case "SETTLED":
        return "Settled";
      case "FLAGGED_VARIANCE":
        return "Flagged Variance";
      default:
        return status;
    }
  };

  const hasAnyFilter =
    (dateScope && dateScope !== "all") ||
    Boolean(selectedStatus) ||
    (selectedZone && selectedZone !== "All Zones") ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  if (!hasAnyFilter) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Date Scope Filter Chip (e.g. Today) */}
      {dateScope && dateScope !== "all" && (
        <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs">
          <Calendar size={11} className="text-[#0A4B6E]/70 shrink-0" />
          <span>Date: <strong className="font-semibold">{dateScope === "today" ? "Today's Trips" : dateScope}</strong></span>
          <button
            type="button"
            onClick={onClearDateScope}
            className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-[#0A4B6E]"
            title="Clear date scope filter"
          >
            <X size={11} />
          </button>
        </span>
      )}

      {/* Custom Date Range Chip */}
      {(dateFrom || dateTo) && (
        <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs">
          <Calendar size={11} className="text-[#0A4B6E]/70 shrink-0" />
          <span>
            Range: <strong className="font-semibold">{dateFrom || "Start"}</strong> to{" "}
            <strong className="font-semibold">{dateTo || "End"}</strong>
          </span>
          <button
            type="button"
            onClick={onClearDates}
            className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-[#0A4B6E]"
            title="Clear date range filter"
          >
            <X size={11} />
          </button>
        </span>
      )}

      {/* Zone Filter Chip */}
      {selectedZone && selectedZone !== "All Zones" && (
        <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs">
          <Funnel size={11} className="text-[#0A4B6E]/70 shrink-0" />
          <span>Zone: <strong className="font-semibold">{selectedZone}</strong></span>
          <button
            type="button"
            onClick={onClearZone}
            className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-[#0A4B6E]"
            title="Clear zone filter"
          >
            <X size={11} />
          </button>
        </span>
      )}

      {/* Status Filter Chip */}
      {selectedStatus && selectedStatus !== "All" && (
        <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs">
          <Funnel size={11} className="text-[#0A4B6E]/70 shrink-0" />
          <span>Status:</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold border ${getStatusBadgeClass(selectedStatus)}`}>
            {formatStatusDisplay(selectedStatus)}
          </span>
          <button
            type="button"
            onClick={onClearStatus}
            className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-[#0A4B6E]"
            title="Clear status filter"
          >
            <X size={11} />
          </button>
        </span>
      )}
    </div>
  );
}

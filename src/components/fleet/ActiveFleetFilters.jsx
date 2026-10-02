import { Funnel, X } from "lucide-react";

export default function ActiveFleetFilters({
  selectedDriver,
  selectedStatus,
  selectedPmStatus,
  dateFrom,
  dateTo,
  onClearDriver,
  onClearStatus,
  onClearPmStatus,
  onClearDates,
}) {
  const getStatusBadgeClass = (status) => {
    const norm = (status || "").toUpperCase().replace("_", " ");
    switch (norm) {
      case "ACTIVE":
      case "IN USE":
      case "AVAILABLE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "STANDBY":
      case "IN SHOP":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "UNDER REPAIR":
      case "UNDER MAINTENANCE":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
      {/* Active Driver Filter Chip */}
      {selectedDriver && selectedDriver !== "All Drivers" && (
        <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs shrink-0 whitespace-nowrap">
          <Funnel size={11} className="text-[#0A4B6E]/70 shrink-0" />
          <span>Driver: <strong className="font-semibold">{selectedDriver}</strong></span>
          <button
            type="button"
            onClick={onClearDriver}
            className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-[#0A4B6E]"
            title="Remove filter"
          >
            <X size={11} />
          </button>
        </span>
      )}

      {/* Active Status Filter Chip */}
      {selectedStatus && selectedStatus !== "All" && (
        <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs shrink-0 whitespace-nowrap">
          <Funnel size={11} className="text-[#0A4B6E]/70 shrink-0" />
          <span>Status:</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold border ${getStatusBadgeClass(selectedStatus)}`}>
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
      )}

      {/* Active PM Due Filter Chip */}
      {selectedPmStatus && (
        <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs shrink-0 whitespace-nowrap">
          <Funnel size={11} className="text-[#0A4B6E]/70 shrink-0" />
          <span>PM:</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold border ${
            selectedPmStatus === "PM_DUE"
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}>
            {selectedPmStatus === "PM_DUE" ? "PM Due (≥ 5k KM)" : "Normal"}
          </span>
          <button
            type="button"
            onClick={onClearPmStatus}
            className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-[#0A4B6E]"
            title="Remove filter"
          >
            <X size={11} />
          </button>
        </span>
      )}

      {/* Active Date Filter Chip */}
      {(dateFrom || dateTo) && (
        <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs shrink-0 whitespace-nowrap">
          <Funnel size={11} className="text-[#0A4B6E]/70 shrink-0" />
          <span>Date: <strong className="font-semibold">{dateFrom || "Start"}</strong> to <strong className="font-semibold">{dateTo || "Present"}</strong></span>
          <button
            type="button"
            onClick={onClearDates}
            className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-[#0A4B6E]"
            title="Remove filter"
          >
            <X size={11} />
          </button>
        </span>
      )}
    </div>
  );
}

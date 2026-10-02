// src/components/items/ActiveItemFilters.jsx
import { Funnel, X } from "lucide-react";

export default function ActiveItemFilters({
  selectedCategory,
  selectedContainerType,
  selectedStatus,
  onClearCategory,
  onClearContainerType,
  onClearStatus,
}) {
  const getStatusBadgeClass = (status) => {
    const norm = (status || "").toUpperCase().replace("_", " ");
    switch (norm) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "INACTIVE":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Active Category Filter Chip */}
      {selectedCategory && selectedCategory !== "All Categories" && (
        <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs">
          <Funnel size={11} className="text-[#0A4B6E]/70 shrink-0" />
          <span>Category: <strong className="font-semibold">{selectedCategory}</strong></span>
          <button
            type="button"
            onClick={onClearCategory}
            className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-[#0A4B6E]"
            title="Remove category filter"
          >
            <X size={11} />
          </button>
        </span>
      )}

      {/* Active Container Type Filter Chip */}
      {selectedContainerType && selectedContainerType !== "All" && (
        <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs">
          <Funnel size={11} className="text-[#0A4B6E]/70 shrink-0" />
          <span>Container: <strong className="font-semibold">{selectedContainerType}</strong></span>
          <button
            type="button"
            onClick={onClearContainerType}
            className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-[#0A4B6E]"
            title="Remove container type filter"
          >
            <X size={11} />
          </button>
        </span>
      )}

      {/* Active Status Filter Chip */}
      {selectedStatus && selectedStatus !== "All" && (
        <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs">
          <Funnel size={11} className="text-[#0A4B6E]/70 shrink-0" />
          <span>Status:</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold border ${getStatusBadgeClass(selectedStatus)}`}>
            {selectedStatus.replace("_", " ")}
          </span>
          <button
            type="button"
            onClick={onClearStatus}
            className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-[#0A4B6E]"
            title="Remove status filter"
          >
            <X size={11} />
          </button>
        </span>
      )}
    </div>
  );
}

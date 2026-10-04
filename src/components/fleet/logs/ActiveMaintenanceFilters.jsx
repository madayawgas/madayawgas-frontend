import { Funnel, X } from "lucide-react";

export default function ActiveMaintenanceFilters({ selectedType, onClearType }) {
  if (!selectedType || selectedType === "ALL") return null;

  return (
    <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
      <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs shrink-0 whitespace-nowrap">
        <Funnel size={11} className="text-[#0A4B6E]/70 shrink-0" />
        <span>Type:</span>
        <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200">
          {selectedType}
        </span>
        <button
          type="button"
          onClick={onClearType}
          className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-[#0A4B6E]"
          title="Remove filter"
        >
          <X size={11} />
        </button>
      </span>
    </div>
  );
}

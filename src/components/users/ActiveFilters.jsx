import { Funnel, X } from "lucide-react";

export default function ActiveFilters({
  selectedRole,
  selectedStatus,
  onClearRole,
  onClearStatus,
}) {
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "SUSPENDED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "DEACTIVATED":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Active Role Filter Chip */}
      {selectedRole && selectedRole !== "All Roles" && (
        <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs">
          <Funnel size={11} className="text-[#0A4B6E]/70 shrink-0" />
          <span>Role: <strong className="font-semibold">{selectedRole}</strong></span>
          <button
            type="button"
            onClick={onClearRole}
            className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-[#0A4B6E]"
            title="Remove filter"
          >
            <X size={11} />
          </button>
        </span>
      )}

      {/* Active Status Filter Chip */}
      {selectedStatus && (
        <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs">
          <Funnel size={11} className="text-[#0A4B6E]/70 shrink-0" />
          <span>Status:</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold border ${getStatusBadgeClass(selectedStatus)}`}>
            {selectedStatus}
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
    </div>
  );
}
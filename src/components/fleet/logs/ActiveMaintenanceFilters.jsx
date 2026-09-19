// src/components/fleet/logs/ActiveMaintenanceFilters.jsx
import { Funnel, X } from "lucide-react";
import Badge from "../../ui/Badge";

export default function ActiveMaintenanceFilters({ selectedType, onClearType }) {
  if (!selectedType || selectedType === "ALL") return null;

  return (
    <div className="flex items-center gap-2 shrink-0 flex-nowrap">
      <Badge
        variant="roles"
        className="flex items-center gap-2 h-[38px] px-3 py-0 normal-case tracking-normal text-xs font-semibold shrink-0 whitespace-nowrap"
      >
        <Funnel size={14} className="text-[#0A4B6E]" />
        <span>Type:</span>
        <Badge variant="info">
          {selectedType}
        </Badge>
        <button
          type="button"
          onClick={onClearType}
          className="p-0.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer ml-1"
        >
          <X size={14} />
        </button>
      </Badge>
    </div>
  );
}


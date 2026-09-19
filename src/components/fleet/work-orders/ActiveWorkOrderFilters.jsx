// src/components/fleet/work-orders/ActiveWorkOrderFilters.jsx
import { Funnel, X } from "lucide-react";
import Badge from "../../ui/Badge";

const STATUS_VARIANTS = {
  PENDING: "warning",
  APPROVED: "info",
  SCHEDULED: "roles",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export default function ActiveWorkOrderFilters({ selectedStatus, onClearStatus }) {
  if (!selectedStatus || selectedStatus === "ALL") return null;

  const variant = STATUS_VARIANTS[selectedStatus] || "neutral";

  return (
    <div className="flex items-center gap-2 shrink-0 flex-nowrap">
      <Badge
        variant="roles"
        className="flex items-center gap-2 h-[38px] px-3 py-0 normal-case tracking-normal text-xs font-semibold shrink-0 whitespace-nowrap"
      >
        <Funnel size={14} className="text-[#0A4B6E]" />
        <span>Status:</span>
        <Badge variant={variant}>
          {selectedStatus.replace("_", " ")}
        </Badge>
        <button
          type="button"
          onClick={onClearStatus}
          className="p-0.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer ml-1"
        >
          <X size={14} />
        </button>
      </Badge>
    </div>
  );
}


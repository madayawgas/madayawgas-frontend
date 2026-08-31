import { Funnel, X } from "lucide-react";
import Badge from "../ui/Badge";

export default function CustomerActiveFilters({
  selectedType,
  selectedStatus,
  dateFrom,
  dateTo,
  onClearType,
  onClearStatus,
  onClearDate,
}) {
  const getStatusVariant = (status) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "deactivated";
      default:
        return "neutral";
    }
  };

  const hasDateFilter = !!(dateFrom || dateTo);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Active Customer Type Filter Chip */}
      {selectedType && selectedType !== "All Types" && (
        <Badge
          variant="roles"
          className="flex items-center gap-2 h-[38px] px-3 py-0 normal-case tracking-normal text-xs font-semibold"
        >
          <Funnel size={14} className="text-[#0A4B6E]" />
          <span>Type: {selectedType}</span>
          <button
            type="button"
            onClick={onClearType}
            className="p-0.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer ml-1"
          >
            <X size={14} />
          </button>
        </Badge>
      )}

      {/* Active Status Filter Chip */}
      {selectedStatus && (
        <Badge
          variant="roles"
          className="flex items-center gap-2 h-[38px] px-3 py-0 normal-case tracking-normal text-xs font-semibold"
        >
          <Funnel size={14} className="text-[#0A4B6E]" />
          <span>Status:</span>
          <Badge variant={getStatusVariant(selectedStatus)}>
            {selectedStatus}
          </Badge>
          <button
            type="button"
            onClick={onClearStatus}
            className="p-0.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer ml-1"
          >
            <X size={14} />
          </button>
        </Badge>
      )}

      {/* Active Date Filter Chip */}
      {hasDateFilter && (
        <Badge
          variant="roles"
          className="flex items-center gap-2 h-[38px] px-3 py-0 normal-case tracking-normal text-xs font-semibold"
        >
          <Funnel size={14} className="text-[#0A4B6E]" />
          <span>
            Date: {dateFrom || "Start"} to {dateTo || "End"}
          </span>
          <button
            type="button"
            onClick={onClearDate}
            className="p-0.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer ml-1"
          >
            <X size={14} />
          </button>
        </Badge>
      )}
    </div>
  );
}

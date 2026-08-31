import { Funnel, X } from "lucide-react";
import Badge from "../ui/Badge";

export default function ActiveFleetFilters({
  selectedRole,
  selectedStatus,
  onClearRole,
  onClearStatus,
}) {
  const getStatusVariant = (status) => {
    const norm = (status || "").toUpperCase().replace("_", " ");
    switch (norm) {
      case "ACTIVE":
      case "IN USE":
        return "success";
      case "AVAILABLE":
        return "info";
      case "STANDBY":
      case "IN SHOP":
        return "warning";
      case "UNDER REPAIR":
      case "UNDER MAINTENANCE":
        return "danger";
      default:
        return "neutral";
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0 flex-nowrap">
      {/* Active Role / Route Filter Chip */}
      {selectedRole && selectedRole !== "All Roles" && (
        <Badge
          variant="roles"
          className="flex items-center gap-2 h-[38px] px-3 py-0 normal-case tracking-normal text-xs font-semibold shrink-0 whitespace-nowrap"
        >
          <Funnel size={14} className="text-[#0A4B6E]" />
          <span>Roles: {selectedRole}</span>
          <button
            type="button"
            onClick={onClearRole}
            className="p-0.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer ml-1"
          >
            <X size={14} />
          </button>
        </Badge>
      )}

      {/* Active Status Filter Chip */}
      {selectedStatus && selectedStatus !== "All" && (
        <Badge
          variant="roles"
          className="flex items-center gap-2 h-[38px] px-3 py-0 normal-case tracking-normal text-xs font-semibold shrink-0 whitespace-nowrap"
        >
          <Funnel size={14} className="text-[#0A4B6E]" />
          <span>Status:</span>
          <Badge variant={getStatusVariant(selectedStatus)}>
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
      )}
    </div>
  );
}



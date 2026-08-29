import { Funnel, X } from "lucide-react";
import Badge from "../ui/Badge";

export default function ActiveFilters({
  selectedRole,
  selectedStatus,
  onClearRole,
  onClearStatus,
}) {
  const getStatusVariant = (status) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "SUSPENDED":
        return "danger";
      case "DEACTIVATED":
        return "deactivated";
      default:
        return "neutral";
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Active Role Filter Chip */}
      {selectedRole && selectedRole !== "All Roles" && (
        <Badge
          variant="roles"
          className="flex items-center gap-2 h-[38px] px-3 py-0 normal-case tracking-normal text-xs font-semibold"
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
    </div>
  );
}
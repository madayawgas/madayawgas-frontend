// src/components/fleet/work-orders/WorkOrderControls.jsx
import { Plus } from "lucide-react";
import SearchBar from "../../ui/SearchBar";
import FilterWorkOrder from "./FilterWorkOrder";
import ActiveWorkOrderFilters from "./ActiveWorkOrderFilters";

export default function WorkOrderControls({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  pendingCount = 0,
  onCreateWorkOrder,
  canCreate = true,
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
      {/* Search Bar */}
      <SearchBar
        placeholder="Search for work orders by WO#, plate, or shop"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full max-w-md"
      />

      {/* Filter Controls & Create Button */}
      <div className="flex items-center gap-2.5 justify-end flex-wrap shrink-0">
        <ActiveWorkOrderFilters
          selectedStatus={selectedStatus}
          onClearStatus={() => onStatusChange("ALL")}
        />

        <FilterWorkOrder
          label="Filter Status"
          selectedStatus={selectedStatus}
          onApply={onStatusChange}
          pendingCount={pendingCount}
        />

        {canCreate && onCreateWorkOrder && (
          <button
            type="button"
            onClick={onCreateWorkOrder}
            className="flex items-center gap-2 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs md:text-sm px-4 py-2 rounded-full shadow-xs transition-all active:scale-95 cursor-pointer h-[38px]"
          >
            <Plus size={16} />
            <span>Create Work Order</span>
          </button>
        )}
      </div>
    </div>
  );
}

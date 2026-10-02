import SearchBar from "../../ui/SearchBar";
import FilterWorkOrder from "./FilterWorkOrder";
import ActiveWorkOrderFilters from "./ActiveWorkOrderFilters";

export default function WorkOrderControls({
  searchQuery,
  onSearchChange,
  onSearch,
  onClear,
  selectedStatus,
  onStatusChange,
  pendingCount = 0,
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-3.5">
      {/* Search Bar */}
      <SearchBar
        placeholder="Search work orders (WO#, truck, vendor)..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onSearch={onSearch}
        onClear={onClear}
        className="w-full sm:w-64 md:w-72"
      />

      {/* Right: Active Status Filter & Filter Controls */}
      <div className="flex items-center gap-2 justify-end flex-wrap">
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
      </div>
    </div>
  );
}


import SearchBar from "../../ui/SearchBar";
import FilterMaintenanceLogs from "./FilterMaintenanceLogs";
import ActiveMaintenanceFilters from "./ActiveMaintenanceFilters";

export default function MaintenanceLogsControls({
  searchQuery,
  onSearchChange,
  onSearch,
  onClear,
  selectedType,
  onTypeChange,
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-3.5">
      {/* Search Bar */}
      <SearchBar
        placeholder="Search logs by plate, OR#, or mechanic..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onSearch={onSearch}
        onClear={onClear}
        className="w-full sm:w-64 md:w-72"
      />

      {/* Right: Active Type Filters & Filter Dropdown */}
      <div className="flex items-center gap-2 justify-end flex-wrap">
        <ActiveMaintenanceFilters
          selectedType={selectedType}
          onClearType={() => onTypeChange("ALL")}
        />
        <FilterMaintenanceLogs
          label="Filter Types"
          selectedType={selectedType}
          onApply={onTypeChange}
        />
      </div>
    </div>
  );
}


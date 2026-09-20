// src/components/fleet/logs/MaintenanceLogsControls.jsx
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
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
      {/* Search Bar with Search-on-Enter (Strategy B) */}
      <SearchBar
        placeholder="Search maintenance logs (Press Enter)..."
        value={searchQuery}
        onChange={onSearchChange}
        onSearch={onSearch}
        onClear={onClear}
        className="w-full max-w-md"
      />

      {/* Filter Controls */}
      <div className="flex items-center gap-2.5 justify-end flex-wrap shrink-0">
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

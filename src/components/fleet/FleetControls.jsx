// src/components/fleet/FleetControls.jsx
import SearchBar from "../ui/SearchBar";
import FilterFleet from "./FilterFleet";
import ActiveFleetFilters from "./ActiveFleetFilters";

export default function FleetControls({
  searchTerm,
  onSearchChange,
  activeFilters,
  onApplyFilters,
  onClearDriver,
  onClearStatus,
  onClearPmStatus,
  onClearDates,
  driversList = [],
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
      {/* Search Bar */}
      <SearchBar
        placeholder="Search for trucks by plate, driver, or model"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full max-w-md"
      />

      {/* Filter Controls */}
      <div className="flex items-center gap-2 justify-end flex-wrap shrink-0">
        <ActiveFleetFilters
          selectedDriver={activeFilters.driver}
          selectedStatus={activeFilters.status}
          selectedPmStatus={activeFilters.pmStatus}
          dateFrom={activeFilters.dateFrom}
          dateTo={activeFilters.dateTo}
          onClearDriver={onClearDriver}
          onClearStatus={onClearStatus}
          onClearPmStatus={onClearPmStatus}
          onClearDates={onClearDates}
        />

        <FilterFleet
          label="Filter Trucks"
          activeFilters={activeFilters}
          onApply={onApplyFilters}
          driversList={driversList}
        />
      </div>
    </div>
  );
}

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
  onClearDates,
  driversList = [],
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
      {/* Search Bar */}
      <SearchBar
        placeholder="Search for fleets"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full max-w-md"
      />

      {/* Filter Controls - Single Row */}
      <div className="flex items-center gap-2 justify-end flex-nowrap shrink-0">
        <ActiveFleetFilters
          selectedDriver={activeFilters.driver}
          selectedStatus={activeFilters.status}
          dateFrom={activeFilters.dateFrom}
          dateTo={activeFilters.dateTo}
          onClearDriver={onClearDriver}
          onClearStatus={onClearStatus}
          onClearDates={onClearDates}
        />

        <FilterFleet onApply={onApplyFilters} driversList={driversList} />
      </div>
    </div>
  );
}



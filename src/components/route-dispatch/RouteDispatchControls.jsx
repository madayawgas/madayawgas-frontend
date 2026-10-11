// src/components/route-dispatch/RouteDispatchControls.jsx
import { LayoutGrid, List, CalendarDays } from "lucide-react";
import SearchBar from "../ui/SearchBar";
import FilterRoute from "./FilterRoute";
import ActiveRouteFilters from "./ActiveRouteFilters";

export default function RouteDispatchControls({
  searchTerm = "",
  onSearchChange,
  onClearSearch,
  activeFilters = {},
  onApplyFilters,
  onClearDateScope,
  onClearStatus,
  onClearZone,
  onClearDates,
  zonesList = [],
  viewMode = "grid",
  onViewModeChange,
}) {
  const handleSearchChange = (e) => {
    const val = e && e.target ? e.target.value : typeof e === "string" ? e : "";
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleClear = () => {
    if (onClearSearch) {
      onClearSearch();
    } else if (onSearchChange) {
      onSearchChange("");
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-3.5">
      {/* Left: Search Bar */}
      <SearchBar
        placeholder="Search vehicle plate, driver, sales rep, or zone..."
        value={typeof searchTerm === "string" ? searchTerm : ""}
        onChange={handleSearchChange}
        onClear={handleClear}
        className="w-full sm:w-64 md:w-80"
      />

      {/* Right: Active Filters, Filter Dropdown, and Tri-View Switcher */}
      <div className="flex items-center gap-2.5 justify-end flex-wrap">
        {/* Active Filter Chips */}
        <ActiveRouteFilters
          dateScope={activeFilters.dateScope}
          selectedStatus={activeFilters.status}
          selectedZone={activeFilters.zone}
          dateFrom={activeFilters.dateFrom}
          dateTo={activeFilters.dateTo}
          onClearDateScope={onClearDateScope}
          onClearStatus={onClearStatus}
          onClearZone={onClearZone}
          onClearDates={onClearDates}
        />

        {/* Filter Route Dropdown */}
        <FilterRoute
          label="Filter Trips"
          activeFilters={activeFilters}
          onApply={onApplyFilters}
          zonesList={zonesList}
        />

        {/* View Mode Switcher (Cards vs Table vs Calendar) */}
        {onViewModeChange && (
          <div className="inline-flex items-center p-0.5 bg-[#EDF3F7] rounded-full border border-[#D5E3EC] shadow-2xs">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                  : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/60"
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid size={13} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                viewMode === "table"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                  : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/60"
              }`}
              title="Table View"
            >
              <List size={13} />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("calendar")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                viewMode === "calendar"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                  : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/60"
              }`}
              title="Calendar View"
            >
              <CalendarDays size={13} />
              <span>Calendar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

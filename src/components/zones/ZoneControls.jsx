// src/components/zones/ZoneControls.jsx
import React from "react";
import SearchBar from "../ui/SearchBar.jsx";
import FilterZone from "./FilterZone.jsx";
import ZoneActiveFilters from "./ZoneActiveFilters.jsx";

export default function ZoneControls({
  searchTerm,
  onSearchChange,
  onSearch,
  onClearSearch,
  activeFilters,
  onApplyFilters,
  onClearStatus,
  onClearDate,
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-3.5">
      {/* Standard Search Bar with Search-on-Enter / Reactive Support */}
      <SearchBar
        placeholder="Search zones by code, name, or description (Press Enter)"
        value={searchTerm}
        onChange={onSearchChange}
        onSearch={onSearch}
        onClear={onClearSearch}
        className="w-full sm:w-72 md:w-80"
      />

      {/* Right side: Active Filters Chips & Filter Dropdown Button */}
      <div className="flex items-center gap-2 justify-end flex-wrap">
        <ZoneActiveFilters
          selectedStatus={activeFilters.status}
          dateFrom={activeFilters.dateFrom}
          dateTo={activeFilters.dateTo}
          onClearStatus={onClearStatus}
          onClearDate={onClearDate}
        />
        <FilterZone
          initialFilters={activeFilters}
          onApply={onApplyFilters}
          label="Filter Zones"
        />
      </div>
    </div>
  );
}

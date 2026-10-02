// src/components/items/ItemControls.jsx
import { LayoutGrid, List } from "lucide-react";
import SearchBar from "../ui/SearchBar";
import FilterItem from "./FilterItem";
import ActiveItemFilters from "./ActiveItemFilters";

export default function ItemControls({
  searchTerm = "",
  onSearchChange,
  onClearSearch,
  activeFilters = {},
  onApplyFilters,
  onClearCategory,
  onClearContainerType,
  onClearStatus,
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
        placeholder="Search products by name, container, or category..."
        value={typeof searchTerm === "string" ? searchTerm : ""}
        onChange={handleSearchChange}
        onClear={handleClear}
        className="w-full sm:w-64 md:w-72"
      />

      {/* Right: Active Filters, Filter Dropdown, and View Mode Switcher */}
      <div className="flex items-center gap-2.5 justify-end flex-wrap">
        {/* Active Filter Chips */}
        <ActiveItemFilters
          selectedCategory={activeFilters?.category}
          selectedContainerType={activeFilters?.containerType}
          selectedStatus={activeFilters?.status}
          onClearCategory={onClearCategory}
          onClearContainerType={onClearContainerType}
          onClearStatus={onClearStatus}
        />

        {/* Filter Products Dropdown */}
        <FilterItem
          label="Filter Items"
          activeFilters={activeFilters}
          onApply={onApplyFilters}
        />

        {/* Dual View Mode Switcher (Cards vs Table) */}
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
          </div>
        )}
      </div>
    </div>
  );
}

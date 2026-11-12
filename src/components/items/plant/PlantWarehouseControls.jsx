// src/components/items/plant/PlantWarehouseControls.jsx
import { LayoutGrid, List } from "lucide-react";
import SearchBar from "../../ui/SearchBar";
import FilterPlantStock from "./FilterPlantStock";
import PlantActiveFilters from "./PlantActiveFilters";

/**
 * PlantWarehouseControls — Pinned controls bar for Bunawan Plant Warehouse.
 * Adheres to CustomerControls and ItemControls design specifications:
 * - Search bar on left
 * - Active filter chips, popover filter dropdown, and view switcher on right
 */
export default function PlantWarehouseControls({
  searchTerm = "",
  onSearchChange,
  onClearSearch,
  filters = {
    containerType: "ALL",
    stockLevel: "ALL",
  },
  onApplyFilters,
  onClearContainerType,
  onClearStockLevel,
  viewMode = "cards", // 'cards' | 'table'
  onViewModeChange,
}) {
  const handleSearch = (e) => {
    const val = e && e.target ? e.target.value : typeof e === "string" ? e : "";
    if (onSearchChange) onSearchChange(val);
  };

  const handleClear = () => {
    if (onClearSearch) onClearSearch();
    else if (onSearchChange) onSearchChange("");
  };

  return (
    <div className="shrink-0 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 px-4 sm:px-6 mb-3">
      {/* Left: Standard Search Bar */}
      <SearchBar
        placeholder="Search products by name or category..."
        value={typeof searchTerm === "string" ? searchTerm : ""}
        onChange={handleSearch}
        onClear={handleClear}
        className="w-full sm:w-64 md:w-72"
      />

      {/* Right: Active Filter Chips, Filter Dropdown, and View Switcher */}
      <div className="flex items-center gap-2 justify-end flex-wrap">
        {/* Active Filter Chips */}
        <PlantActiveFilters
          selectedContainerType={filters.containerType}
          selectedStockLevel={filters.stockLevel}
          onClearContainerType={onClearContainerType}
          onClearStockLevel={onClearStockLevel}
        />

        {/* Popover Filter Dropdown */}
        <FilterPlantStock
          label="Filter Stock"
          activeFilters={filters}
          onApply={onApplyFilters}
        />

        {/* Dual View Mode Switcher (Cards vs Table) */}
        {onViewModeChange && (
          <div className="inline-flex items-center p-0.5 bg-[#EDF3F7] rounded-full border border-[#CBD5E1] h-[30px]">
            <button
              type="button"
              onClick={() => onViewModeChange("cards")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer h-[26px] ${
                viewMode === "cards"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                  : "text-[#475569] hover:text-[#0A4B6E] hover:bg-white/60"
              }`}
              title="Cards View"
              aria-label="Cards View"
            >
              <LayoutGrid size={12} />
              <span>Cards</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer h-[26px] ${
                viewMode === "table"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                  : "text-[#475569] hover:text-[#0A4B6E] hover:bg-white/60"
              }`}
              title="Table View"
              aria-label="Table View"
            >
              <List size={12} />
              <span>Table</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

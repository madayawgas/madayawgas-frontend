import SearchBar from "../ui/SearchBar";
import FilterItem from "./FilterItem";
import ActiveItemFilters from "./ActiveItemFilters";

export default function ItemControls({
  searchTerm,
  onSearchChange,
  activeFilters,
  onApplyFilters,
  onClearCategory,
  onClearStatus,
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
      {/* Search Bar */}
      <SearchBar
        placeholder="Search for items"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full max-w-md"
      />

      {/* Filter Controls - Single Row */}
      <div className="flex items-center gap-2 justify-end flex-nowrap shrink-0">
        <ActiveItemFilters
          selectedCategory={activeFilters.category}
          selectedStatus={activeFilters.status}
          onClearCategory={onClearCategory}
          onClearStatus={onClearStatus}
        />

        <FilterItem onApply={onApplyFilters} />
      </div>
    </div>
  );
}


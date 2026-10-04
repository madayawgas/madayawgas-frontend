import SearchBar from "../ui/SearchBar";
import FilterCustomer from "./FilterCustomer";
import CustomerActiveFilters from "./CustomerActiveFilters";

export default function CustomerControls({
  searchTerm,
  onSearchChange,
  onSearch,
  onClearSearch,
  activeFilters,
  onApplyFilters,
  onClearType,
  onClearStatus,
  onClearDate,
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-3.5">
      {/* Search Bar with Search-on-Enter */}
      <SearchBar
        placeholder="Search for customers (Press Enter)"
        value={searchTerm}
        onChange={onSearchChange}
        onSearch={onSearch}
        onClear={onClearSearch}
        className="w-full sm:w-64 md:w-72"
      />

      {/* Right: Active Filters Chips & Filter Button */}
      <div className="flex items-center gap-2 justify-end flex-wrap">
        <CustomerActiveFilters
          selectedType={activeFilters.customerType}
          selectedStatus={activeFilters.status}
          dateFrom={activeFilters.dateFrom}
          dateTo={activeFilters.dateTo}
          onClearType={onClearType}
          onClearStatus={onClearStatus}
          onClearDate={onClearDate}
        />
        <FilterCustomer onApply={onApplyFilters} label="Filter Customers" />
      </div>
    </div>
  );
}


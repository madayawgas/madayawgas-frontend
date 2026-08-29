import SearchBar from "../ui/SearchBar";
import FilterRole from "./FilterRole";
import ActiveFilters from "./ActiveFilters";

export default function UsersControls({
  searchTerm,
  onSearchChange,
  activeFilters,
  onApplyFilters,
  onClearRole,
  onClearStatus,
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
      {/* Search Bar */}
      <SearchBar
        placeholder="Search for users"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full max-w-md"
      />

      {/* Filter Controls */}
      <div className="flex items-center gap-2 justify-end flex-wrap">
        <ActiveFilters
          selectedRole={activeFilters.role}
          selectedStatus={activeFilters.status}
          onClearRole={onClearRole}
          onClearStatus={onClearStatus}
        />

        <FilterRole onApply={onApplyFilters} />
      </div>
    </div>
  );
}
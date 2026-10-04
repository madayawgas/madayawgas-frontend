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
  roles = [],
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-3.5">
      {/* Search Bar */}
      <SearchBar
        placeholder="Search for users..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full sm:w-64 md:w-72"
      />

      {/* Right: Active Role & Status Filter Badges and Filter Button */}
      <div className="flex items-center gap-2 justify-end flex-wrap">
        <ActiveFilters
          selectedRole={activeFilters.role}
          selectedStatus={activeFilters.status}
          onClearRole={onClearRole}
          onClearStatus={onClearStatus}
        />
        <FilterRole onApply={onApplyFilters} roles={roles} />
      </div>
    </div>
  );
}
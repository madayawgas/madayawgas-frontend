// src/components/fleet/FleetHeader.jsx
import { Plus } from "lucide-react";
import FilterDropdown from "../ui/FilterDropdown";
import Button from "../ui/Button";
import SearchBar from "../ui/SearchBar";

export default function FleetHeader({ onAddTruck, onFilterChange, searchTerm, onSearchChange, selectedStatus }) {

  return (
    <div className="w-full mb-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        
        {/* Left Side: Header Branding */}
        <div>
          <h2 className="text-2xl font-bold text-[#1B4B75] mb-1">Fleet Board</h2>
          <p className="text-[#6D8AA2] text-sm">Manage Fleet details and information</p>
        </div>
        
        {/* Right Side: Interactive Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          
          {/* Search Bar: Controlled component using props passed from parent */}
          <SearchBar 
            placeholder="Search for driver or plate number" 
            value={searchTerm}
            onChange={onSearchChange}
            className="w-full sm:w-[320px]" 
          />

          {/* Grouping Filters and Actions */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <FilterDropdown
                label="Truck Status"
                options={[
                  "All",
                  "AVAILABLE",
                  "IN_USE",
                  "IN_SHOP",
                  "UNDER_MAINTENANCE",
                ]}
                value={selectedStatus}
                onChange={onFilterChange}
              />

              <Button
                variant="primary"
                onClick={onAddTruck}
                className="whitespace-nowrap h-[38px] text-sm"
              >
                <Plus size={18} />
                Add Truck
              </Button>
          </div>


            {/* Main CTA: Triggers the onAddTruck function to open a creation form */}
            <Button variant="primary" onClick={onAddTruck} className="whitespace-nowrap h-[38px] text-sm">
              <Plus size={18} />
              Add Truck
            </Button>
          </div>
        </div>
      </div> 
  );
}
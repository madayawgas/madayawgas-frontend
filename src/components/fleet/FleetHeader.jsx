// src/components/fleet/FleetHeader.jsx
import { useState } from "react";
import { Plus, Filter, ChevronDown } from "lucide-react";
import Button from "../ui/Button";
import SearchBar from "../ui/SearchBar";

export default function FleetHeader({ onAddTruck, onFilterChange, searchTerm, onSearchChange, selectedStatus }) {
  const [isOpen, setIsOpen] = useState(false);

  const truckStatuses = ["All", "AVAILABLE", "IN_USE", "IN_SHOP", "UNDER_MAINTENANCE"];

  const handleSelect = (status) => {
    setIsOpen(false);
    if (onFilterChange) onFilterChange(status);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        
        {/* Left Side: Titles */}
        <div>
          <h2 className="text-2xl font-bold text-[#1B4B75] mb-1">Fleet Board</h2>
          <p className="text-gray-500 text-sm">Manage Fleet details and information</p>
        </div>
        
        {/* Right Side: Search, Filter Dropdown, and Add Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          
          {/* Search Bar */}
          <SearchBar 
            placeholder="Search for driver or plate number" 
            value={searchTerm}
            onChange={onSearchChange}
            className="w-full sm:w-[320px]" 
          />

          {/* Buttons grouping */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="relative">
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="bg-[#EEF2F6] text-gray-600 px-4 py-2 rounded-lg text-sm border border-[#D1D9E2] flex items-center gap-2 hover:bg-gray-200 transition h-[38px]"
              >
                <Filter size={16} className="text-gray-500" />
                {selectedStatus === "All" ? "Truck Status" : selectedStatus.replace("_", " ")}
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-2 overflow-hidden">
                  {truckStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleSelect(status)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${selectedStatus === status ? "text-[#0F7AB2] font-semibold bg-[#F8FBFC]" : "text-gray-700"}`}
                    >
                      {status === "All" ? status : status.replace("_", " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button variant="primary" onClick={onAddTruck} className="whitespace-nowrap h-[38px] text-sm">
              <Plus size={18} />
              Add Truck
            </Button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
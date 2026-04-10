import { useState } from "react";
import { Plus, Filter, ChevronDown } from "lucide-react";

export default function FleetHeader({ onAddTruck, onFilterChange }) {
  // State to manage if the dropdown is visible
  const [isOpen, setIsOpen] = useState(false);
  // State to show which filter is currently selected on the button
  const [selectedStatus, setSelectedStatus] = useState("All");

  const truckStatuses = ["All", "AVAILABLE", "IN_USE", "IN_SHOP", "UNDER_MAINTENANCE"];

  const handleSelect = (status) => {
    setSelectedStatus(status);
    setIsOpen(false); // Close dropdown after selecting
    
    if (onFilterChange) {
      onFilterChange(status);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 className="text-2xl font-bold text-[#1B4B75] mb-1">Fleet Board</h2>
        <p className="text-gray-500 text-sm">Manage Fleet details and information</p>
      </div>
      
      <div className="flex items-center gap-3">
        
        {/* FILTER DROPDOWN WRAPPER */}
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg font-medium border border-gray-200 flex items-center gap-2 hover:bg-gray-200 transition"
          >
            <Filter size={18} className="text-gray-400" />
            
            {/* Show "Truck Status" if nothing is selected, otherwise show the status (removing underscores for display) */}
            {selectedStatus === "All" ? "Truck Status" : selectedStatus.replace("_", " ")}
            
            <ChevronDown 
              size={16} 
              className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
            />
          </button>

          {/* THE DROPDOWN MENU */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-2 overflow-hidden">
              {truckStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => handleSelect(status)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50
                    ${selectedStatus === status ? "text-[#0F7AB2] font-semibold bg-[#F8FBFC]" : "text-gray-700"}
                  `}
                >
                  {status === "All" ? status : status.replace("_", " ")}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onAddTruck}
          className="bg-[#0F7AB2] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#0c628f] transition shadow-sm"
        >
          <Plus size={20} />
          Add Truck
        </button>
      </div>
    </div>
  );
}
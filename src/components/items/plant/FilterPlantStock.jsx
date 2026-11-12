// src/components/items/plant/FilterPlantStock.jsx
import { useState, useEffect, useRef } from "react";
import { Funnel, Flame, Package } from "lucide-react";

/**
 * FilterPlantStock — Standardized popover filter dropdown for Plant Warehouse inventory.
 * Follows FilterItem and FilterCustomer design specifications.
 */
export default function FilterPlantStock({
  label = "Filter Stock",
  onApply,
  activeFilters,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContainerType, setSelectedContainerType] = useState(
    activeFilters?.containerType || "ALL"
  );
  const [selectedStockLevel, setSelectedStockLevel] = useState(
    activeFilters?.stockLevel || "ALL"
  );

  const dropdownRef = useRef(null);

  const containerTypes = [
    { key: "ALL", label: "All Items" },
    { key: "CYLINDER", label: "Cylinders", icon: Flame },
    { key: "CANISTER", label: "Canisters", icon: Package },
  ];

  const stockLevels = [
    { key: "ALL", label: "All Stock Levels" },
    { key: "IN_STOCK", label: "In Stock (> 0 units)" },
    { key: "LOW_STOCK", label: "Low Stock (< 100 units)" },
    { key: "HAS_DEFECTIVE", label: "Has Defective Units" },
    { key: "HAS_EMPTY", label: "Has Empty Returns" },
  ];

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && activeFilters) {
        setSelectedContainerType(activeFilters.containerType || "ALL");
        setSelectedStockLevel(activeFilters.stockLevel || "ALL");
      }
      return next;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClearAll = () => {
    setSelectedContainerType("ALL");
    setSelectedStockLevel("ALL");
    if (onApply) {
      onApply({
        containerType: "ALL",
        stockLevel: "ALL",
      });
    }
    setIsOpen(false);
  };

  const handleApply = () => {
    if (onApply) {
      onApply({
        containerType: selectedContainerType,
        stockLevel: selectedStockLevel,
      });
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`bg-[#FCFEFE] hover:bg-[#F3F8FB] text-[#0A4B6E] px-3 py-1.5 rounded-full text-xs font-semibold border border-[#0A4B6E]/30 hover:border-[#0A4B6E]/60 flex items-center gap-1.5 transition-all duration-150 h-[30px] min-w-[110px] justify-between cursor-pointer shadow-2xs ${className}`}
      >
        <span>{label}</span>
        <Funnel size={12} className="text-[#0A4B6E] shrink-0" />
      </button>

      {/* Popover Card Dropdown */}
      <div
        className={`absolute right-0 mt-1.5 w-[290px] bg-white border border-[#0A4B6E]/20 rounded-2xl shadow-xl z-30 p-3.5 origin-top-right transition-all duration-150 ease-out ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-1.5 text-[#0A4B6E] font-bold text-xs">
            <Funnel size={12} className="text-[#0A4B6E]" />
            <span>Filter Plant Stock</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-[10px] font-bold text-gray-400 hover:text-gray-700 uppercase tracking-wider cursor-pointer"
          >
            CLOSE
          </button>
        </div>

        {/* Section 1: Container Type */}
        <div className="mb-3.5">
          <label className="block text-[11px] font-bold text-[#6D8AA2] uppercase tracking-wider mb-1.5">
            Container Type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {containerTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedContainerType === type.key;
              return (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => setSelectedContainerType(type.key)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? "bg-[#0A4B6E] text-white border-[#0A4B6E] font-semibold shadow-2xs"
                      : "bg-[#F3F5F5] text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {Icon && <Icon size={12} />}
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Stock Level / Availability */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold text-[#6D8AA2] uppercase tracking-wider mb-1.5">
            Stock Availability
          </label>
          <div className="flex flex-col gap-1">
            {stockLevels.map((lvl) => {
              const isSelected = selectedStockLevel === lvl.key;
              return (
                <button
                  key={lvl.key}
                  type="button"
                  onClick={() => setSelectedStockLevel(lvl.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-[#E8F3F8] text-[#0A4B6E] font-semibold border border-[#BCE1F1]"
                      : "text-gray-700 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <span>{lvl.label}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A4B6E]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] text-xs font-bold rounded-full shadow-2xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

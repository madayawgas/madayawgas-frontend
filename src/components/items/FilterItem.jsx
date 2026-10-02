// src/components/items/FilterItem.jsx
import { useState, useEffect, useRef } from "react";
import { Funnel } from "lucide-react";
import Button from "../ui/Button";

export default function FilterItem({
  label = "Filter Items",
  onApply,
  activeFilters,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(activeFilters?.status || "");
  const [selectedCategory, setSelectedCategory] = useState(
    activeFilters?.category || "All Categories"
  );
  const [selectedContainerType, setSelectedContainerType] = useState(
    activeFilters?.containerType || "All"
  );

  const dropdownRef = useRef(null);

  const categories = [
    "All Categories",
    "LPG Cylinder",
    "Canister",
  ];

  const containerTypes = [
    { key: "All", label: "All" },
    { key: "CYLINDER", label: "CYLINDER" },
    { key: "CANISTER", label: "CANISTER" },
  ];

  const statuses = [
    { key: "ACTIVE", label: "ACTIVE", activeBg: "bg-emerald-600 text-white border-emerald-600", inactiveBg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { key: "INACTIVE", label: "INACTIVE", activeBg: "bg-gray-600 text-white border-gray-600", inactiveBg: "bg-gray-100 text-gray-600 border-gray-200" },
  ];

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && activeFilters) {
        setSelectedStatus(activeFilters.status || "");
        setSelectedCategory(activeFilters.category || "All Categories");
        setSelectedContainerType(activeFilters.containerType || "All");
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
    setSelectedStatus("");
    setSelectedCategory("All Categories");
    setSelectedContainerType("All");
    if (onApply) {
      onApply({
        status: "",
        category: "All Categories",
        containerType: "All",
      });
    }
    setIsOpen(false);
  };

  const handleApply = () => {
    if (onApply) {
      onApply({
        status: selectedStatus,
        category: selectedCategory,
        containerType: selectedContainerType,
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

      {/* Filter Card Dropdown */}
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
            <span>Filter Items</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-[10px] font-bold text-gray-400 hover:text-gray-700 uppercase tracking-wider cursor-pointer"
          >
            CLOSE
          </button>
        </div>

        {/* Status Filter Group */}
        <div className="mb-3 text-left">
          <label className="block text-[11px] font-bold text-[#0A4B6E] mb-1.5 uppercase tracking-wide">
            Status:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map(({ key, label, activeBg, inactiveBg }) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setSelectedStatus((prev) => (prev === key ? "" : key))
                }
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer active:scale-95 ${
                  selectedStatus === key ? activeBg : `${inactiveBg} opacity-80 hover:opacity-100`
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Container Type Filter Group */}
        <div className="mb-3 text-left">
          <label className="block text-[11px] font-bold text-[#0A4B6E] mb-1.5 uppercase tracking-wide">
            Container Type:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {containerTypes.map((ct) => (
              <button
                key={ct.key}
                type="button"
                onClick={() => setSelectedContainerType(ct.key)}
                className={`px-2.5 py-0.5 text-[11px] rounded-full border transition-all cursor-pointer active:scale-95 ${
                  selectedContainerType === ct.key
                    ? "bg-[#0A4B6E] text-white border-[#0A4B6E] font-semibold shadow-2xs"
                    : "bg-[#F3F5F5] text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Filter Group */}
        <div className="mb-3.5 text-left">
          <label className="block text-[11px] font-bold text-[#0A4B6E] mb-1.5 uppercase tracking-wide">
            Category:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-0.5 text-[11px] rounded-full border transition-all cursor-pointer active:scale-95 ${
                  selectedCategory === cat
                    ? "bg-[#0A4B6E] text-white border-[#0A4B6E] font-semibold shadow-2xs"
                    : "bg-[#F3F5F5] text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <Button
            variant="secondary"
            onClick={handleClearAll}
            className="!px-2.5 !py-1 !text-[10px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wider !rounded-full !h-[26px]"
          >
            CLEAR ALL
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            className="!px-3 !py-1 !text-[10px] font-bold uppercase tracking-wider !rounded-full !h-[26px]"
          >
            APPLY RESULT
          </Button>
        </div>
      </div>
    </div>
  );
}

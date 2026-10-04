import { useState, useEffect, useRef } from "react";
import { Funnel } from "lucide-react";
import Button from "../../ui/Button";

const TYPE_OPTIONS = [
  { key: "ALL", label: "All Types", activeBg: "bg-[#0A4B6E] text-white border-[#0A4B6E]", inactiveBg: "bg-[#F3F5F5] text-gray-700 border-gray-200" },
  { key: "PREVENTIVE", label: "Preventive", activeBg: "bg-blue-600 text-white border-blue-600", inactiveBg: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "CORRECTIVE", label: "Corrective", activeBg: "bg-amber-600 text-white border-amber-600", inactiveBg: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "OVERHAUL", label: "Overhaul", activeBg: "bg-purple-600 text-white border-purple-600", inactiveBg: "bg-purple-50 text-purple-700 border-purple-200" },
  { key: "EMERGENCY", label: "Emergency", activeBg: "bg-rose-600 text-white border-rose-600", inactiveBg: "bg-rose-50 text-rose-700 border-rose-200" },
];

export default function FilterMaintenanceLogs({
  label = "Filter Types",
  selectedType = "ALL",
  onApply,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState(selectedType);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setType(selectedType);
  }, [selectedType]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApply = () => {
    if (onApply) {
      onApply(type);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setType("ALL");
    if (onApply) {
      onApply("ALL");
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`bg-[#FCFEFE] hover:bg-[#F3F8FB] text-[#0A4B6E] px-3 py-1.5 rounded-full text-xs font-semibold border border-[#0A4B6E]/30 hover:border-[#0A4B6E]/60 flex items-center gap-1.5 transition-all duration-150 h-[30px] min-w-[110px] justify-between cursor-pointer shadow-2xs ${className}`}
      >
        <span>{label}</span>
        <Funnel size={12} className="text-[#0A4B6E] shrink-0" />
      </button>

      {/* Filter Card Dropdown */}
      <div
        className={`absolute right-0 mt-1.5 w-[290px] bg-white border border-[#0A4B6E]/20 rounded-2xl shadow-xl z-50 p-3.5 origin-top-right transition-all duration-150 ease-out ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-1.5 text-[#0A4B6E] font-bold text-xs">
            <Funnel size={12} className="text-[#0A4B6E]" />
            <span>Filter Maintenance Types</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-[10px] font-bold text-gray-400 hover:text-gray-700 uppercase tracking-wider cursor-pointer"
          >
            CLOSE
          </button>
        </div>

        {/* Maintenance Type Selection Group */}
        <div className="mb-3 text-left">
          <label className="block text-[11px] font-bold text-[#0A4B6E] mb-1.5 uppercase tracking-wide">
            Service Type:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TYPE_OPTIONS.map((opt) => {
              const isSelected = type === opt.key;

              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setType(opt.key)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer active:scale-95 ${
                    isSelected ? opt.activeBg : `${opt.inactiveBg} opacity-80 hover:opacity-100`
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <Button
            variant="secondary"
            onClick={handleClear}
            className="!px-2.5 !py-1 !text-[10px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wider !rounded-full !h-[26px]"
          >
            CLEAR ALL
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            className="!px-3 !py-1 !text-[10px] font-bold uppercase tracking-wider !rounded-full !h-[26px]"
          >
            APPLY FILTER
          </Button>
        </div>
      </div>
    </div>
  );
}

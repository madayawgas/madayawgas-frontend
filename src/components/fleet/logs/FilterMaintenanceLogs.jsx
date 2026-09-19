// src/components/fleet/logs/FilterMaintenanceLogs.jsx
import { useState, useEffect, useRef } from "react";
import { Funnel } from "lucide-react";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";

const TYPE_OPTIONS = [
  { key: "ALL", label: "All Types", variant: "neutral" },
  { key: "PREVENTIVE", label: "Preventive", variant: "info" },
  { key: "CORRECTIVE", label: "Corrective", variant: "warning" },
  { key: "OVERHAUL", label: "Overhaul", variant: "roles" },
  { key: "EMERGENCY", label: "Emergency", variant: "danger" },
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
        className={`bg-[#FCFEFE] text-[#0A4B6E] px-4 py-2 rounded-full text-sm border border-[#0A4B6E] flex items-center gap-2 hover:bg-gray-100 transition-all duration-200 h-[38px] min-w-[140px] justify-between cursor-pointer ${className}`}
      >
        <span>{label}</span>
        <Funnel size={16} className="text-[#0A4B6E]" />
      </button>

      {/* Filter Card Dropdown */}
      <div
        className={`absolute right-0 mt-2 w-[340px] bg-white border border-[#0A4B6E]/30 rounded-2xl shadow-xl z-50 p-5 origin-top-right transition-all duration-200 ease-out ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-1.5 text-[#0A4B6E] font-bold text-sm">
            <span>Filter Maintenance Types</span>
            <Funnel size={14} className="text-[#0A4B6E]" />
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-[11px] font-bold text-gray-400 hover:text-gray-700 uppercase tracking-wider cursor-pointer"
          >
            CLOSE
          </button>
        </div>

        {/* Maintenance Type Selection Group */}
        <div className="mb-4 text-left">
          <label className="block text-xs font-bold text-[#0A4B6E] mb-2">
            Service Type:
          </label>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((opt) => {
              const isSelected = type === opt.key;

              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setType(opt.key)}
                  className="cursor-pointer transition-all active:scale-95"
                >
                  <Badge
                    variant={opt.variant}
                    className={`border-2 transition-all ${
                      isSelected
                        ? "border-[#0A4B6E] opacity-100 shadow-xs font-bold"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    {opt.label}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <Button
            variant="secondary"
            onClick={handleClear}
            className="!px-3 !py-1.5 !text-[11px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wider !rounded-full"
          >
            CLEAR ALL
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            className="!px-4 !py-1.5 !text-[11px] font-bold uppercase tracking-wider !rounded-full"
          >
            APPLY FILTER
          </Button>
        </div>
      </div>
    </div>
  );
}


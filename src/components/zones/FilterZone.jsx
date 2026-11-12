// src/components/zones/FilterZone.jsx
import React, { useState, useEffect, useRef } from "react";
import { Funnel } from "lucide-react";
import Button from "../ui/Button.jsx";
import DateFilterGroup from "../users/DateFilterGroup.jsx";

export default function FilterZone({
  label = "Filter Zones",
  initialFilters = { status: "ALL", dateFrom: "", dateTo: "" },
  onApply,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(initialFilters.status || "ALL");
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom || "");
  const [dateTo, setDateTo] = useState(initialFilters.dateTo || "");

  const dropdownRef = useRef(null);

  // Sync state if initialFilters changes externally
  useEffect(() => {
    setStatus(initialFilters.status || "ALL");
    setDateFrom(initialFilters.dateFrom || "");
    setDateTo(initialFilters.dateTo || "");
  }, [initialFilters.status, initialFilters.dateFrom, initialFilters.dateTo]);

  // Click outside listener
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
    setStatus("ALL");
    setDateFrom("");
    setDateTo("");
  };

  const handleApply = () => {
    if (onApply) {
      onApply({
        status,
        dateFrom,
        dateTo,
      });
    }
    setIsOpen(false);
  };

  const statuses = [
    { key: "ALL", label: "ALL STATUSES" },
    { key: "ACTIVE", label: "ACTIVE", activeBg: "bg-emerald-600 text-white border-emerald-600", inactiveBg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { key: "INACTIVE", label: "INACTIVE", activeBg: "bg-gray-600 text-white border-gray-600", inactiveBg: "bg-gray-100 text-gray-600 border-gray-200" },
  ];

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
            <span>Filter Service Zones</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-[10px] font-bold text-gray-400 hover:text-gray-700 uppercase tracking-wider cursor-pointer"
          >
            CLOSE
          </button>
        </div>

        {/* Status Filter Section */}
        <div className="mb-3 text-left">
          <label className="block text-[11px] font-bold text-[#0A4B6E] mb-1.5 uppercase tracking-wide">
            Operational Status:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map(({ key, label, activeBg, inactiveBg }) => {
              const isSelected = status === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? activeBg || "bg-[#0A4B6E] text-white border-[#0A4B6E]"
                      : inactiveBg || "bg-[#F8FAFC] text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Filter Section */}
        <DateFilterGroup
          dateFrom={dateFrom}
          dateTo={dateTo}
          onFromChange={(e) => setDateFrom(e.target.value)}
          onToChange={(e) => setDateTo(e.target.value)}
        />

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

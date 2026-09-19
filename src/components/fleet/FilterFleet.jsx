// src/components/fleet/FilterFleet.jsx
import { useState, useEffect, useRef } from "react";
import { Funnel } from "lucide-react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import DateFilterGroup from "../users/DateFilterGroup";
import DriverFilterGroup from "./DriverFilterGroup";

export default function FilterFleet({
  label = "Filter Trucks",
  activeFilters = {},
  onApply,
  className = "",
  driversList = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(activeFilters.status || "");
  const [selectedDriver, setSelectedDriver] = useState(activeFilters.driver || "All Drivers");
  const [selectedPmStatus, setSelectedPmStatus] = useState(activeFilters.pmStatus || "");
  const [dateFrom, setDateFrom] = useState(activeFilters.dateFrom || "");
  const [dateTo, setDateTo] = useState(activeFilters.dateTo || "");

  const dropdownRef = useRef(null);

  const statuses = [
    { key: "ACTIVE", variant: "success", activeBorder: "border-green-700" },
    { key: "UNDER MAINTENANCE", variant: "danger", activeBorder: "border-red-700" },
    { key: "INACTIVE", variant: "deactivated", activeBorder: "border-gray-700" },
    { key: "RETIRED", variant: "warning", activeBorder: "border-amber-700" },
  ];

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setSelectedStatus(activeFilters.status || "");
        setSelectedDriver(activeFilters.driver || "All Drivers");
        setSelectedPmStatus(activeFilters.pmStatus || "");
        setDateFrom(activeFilters.dateFrom || "");
        setDateTo(activeFilters.dateTo || "");
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
    setSelectedDriver("All Drivers");
    setSelectedPmStatus("");
    setDateFrom("");
    setDateTo("");
    if (onApply) {
      onApply({
        status: "",
        driver: "All Drivers",
        pmStatus: "",
        dateFrom: "",
        dateTo: "",
      });
    }
    setIsOpen(false);
  };

  const handleApply = () => {
    if (onApply) {
      onApply({
        status: selectedStatus,
        driver: selectedDriver,
        pmStatus: selectedPmStatus,
        dateFrom,
        dateTo,
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
        className={`bg-[#FCFEFE] text-[#0A4B6E] px-4 py-2 rounded-full text-sm border border-[#0A4B6E] flex items-center gap-2 hover:bg-gray-100 transition-all duration-200 h-[38px] min-w-[140px] justify-between cursor-pointer ${className}`}
      >
        <span>{label}</span>
        <Funnel size={16} className="text-[#0A4B6E]" />
      </button>

      {/* Filter Card Dropdown */}
      <div
        className={`absolute right-0 mt-2 w-[360px] bg-white border border-[#0A4B6E]/30 rounded-2xl shadow-xl z-50 p-5 origin-top-right transition-all duration-200 ease-out ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-1.5 text-[#0A4B6E] font-bold text-sm">
            <span>Filter Trucks</span>
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

        {/* Status Filter Group */}
        <div className="mb-4 text-left">
          <label className="block text-xs font-bold text-[#0A4B6E] mb-2">
            Operational Status:
          </label>
          <div className="flex flex-wrap gap-2">
            {statuses.map(({ key, variant, activeBorder }) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setSelectedStatus((prev) => (prev === key ? "" : key))
                }
                className="cursor-pointer transition-all active:scale-95"
              >
                <Badge
                  variant={variant}
                  className={`border-2 transition-all ${
                    selectedStatus === key
                      ? `${activeBorder} opacity-100 shadow-xs`
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  {key}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* 5,000-km PM Health Filter Group */}
        <div className="mb-4 text-left">
          <label className="block text-xs font-bold text-[#0A4B6E] mb-2">
            5,000-KM Maintenance Condition:
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setSelectedPmStatus((prev) => (prev === "PM_DUE" ? "" : "PM_DUE"))
              }
              className="cursor-pointer transition-all active:scale-95"
            >
              <Badge
                variant="danger"
                className={`border-2 transition-all ${
                  selectedPmStatus === "PM_DUE"
                    ? "border-red-700 opacity-100 shadow-xs"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                PM Due (≥ 5,000 KM)
              </Badge>
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedPmStatus((prev) => (prev === "NORMAL" ? "" : "NORMAL"))
              }
              className="cursor-pointer transition-all active:scale-95"
            >
              <Badge
                variant="success"
                className={`border-2 transition-all ${
                  selectedPmStatus === "NORMAL"
                    ? "border-green-700 opacity-100 shadow-xs"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                Normal (&lt; 5,000 KM)
              </Badge>
            </button>
          </div>
        </div>

        {/* Driver Assignment Filter Group */}
        <DriverFilterGroup
          driversList={driversList}
          selectedDriver={selectedDriver}
          onChange={setSelectedDriver}
        />

        {/* Date Range Filter Group */}
        <DateFilterGroup
          dateFrom={dateFrom}
          dateTo={dateTo}
          onFromChange={(e) => setDateFrom(e.target.value)}
          onToChange={(e) => setDateTo(e.target.value)}
        />

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <Button
            variant="secondary"
            onClick={handleClearAll}
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

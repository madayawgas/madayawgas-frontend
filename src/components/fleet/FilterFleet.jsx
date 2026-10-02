import { useState, useEffect, useRef } from "react";
import { Funnel } from "lucide-react";
import Button from "../ui/Button";
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
    { key: "ACTIVE", label: "ACTIVE", activeBg: "bg-emerald-600 text-white border-emerald-600", inactiveBg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { key: "UNDER MAINTENANCE", label: "UNDER MAINTENANCE", activeBg: "bg-rose-600 text-white border-rose-600", inactiveBg: "bg-rose-50 text-rose-700 border-rose-200" },
    { key: "INACTIVE", label: "INACTIVE", activeBg: "bg-gray-600 text-white border-gray-600", inactiveBg: "bg-gray-100 text-gray-600 border-gray-200" },
    { key: "RETIRED", label: "RETIRED", activeBg: "bg-amber-600 text-white border-amber-600", inactiveBg: "bg-amber-50 text-amber-700 border-amber-200" },
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
        className={`bg-[#FCFEFE] hover:bg-[#F3F8FB] text-[#0A4B6E] px-3 py-1.5 rounded-full text-xs font-semibold border border-[#0A4B6E]/30 hover:border-[#0A4B6E]/60 flex items-center gap-1.5 transition-all duration-150 h-[30px] min-w-[110px] justify-between cursor-pointer shadow-2xs ${className}`}
      >
        <span>{label}</span>
        <Funnel size={12} className="text-[#0A4B6E] shrink-0" />
      </button>

      {/* Filter Card Dropdown */}
      <div
        className={`absolute right-0 mt-1.5 w-[300px] bg-white border border-[#0A4B6E]/20 rounded-2xl shadow-xl z-50 p-3.5 origin-top-right transition-all duration-150 ease-out ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-1.5 text-[#0A4B6E] font-bold text-xs">
            <Funnel size={12} className="text-[#0A4B6E]" />
            <span>Filter Trucks</span>
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
            Operational Status:
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

        {/* 5,000-km PM Health Filter Group */}
        <div className="mb-3 text-left">
          <label className="block text-[11px] font-bold text-[#0A4B6E] mb-1.5 uppercase tracking-wide">
            5,000-KM Maintenance Condition:
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() =>
                setSelectedPmStatus((prev) => (prev === "PM_DUE" ? "" : "PM_DUE"))
              }
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer active:scale-95 ${
                selectedPmStatus === "PM_DUE"
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-rose-50 text-rose-700 border-rose-200 opacity-80 hover:opacity-100"
              }`}
            >
              PM Due (≥ 5k KM)
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedPmStatus((prev) => (prev === "NORMAL" ? "" : "NORMAL"))
              }
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer active:scale-95 ${
                selectedPmStatus === "NORMAL"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 opacity-80 hover:opacity-100"
              }`}
            >
              Normal (&lt; 5k KM)
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
            APPLY FILTER
          </Button>
        </div>
      </div>
    </div>
  );
}

// src/components/route-dispatch/FilterRoute.jsx
import { useState, useEffect, useRef } from "react";
import { Funnel, Calendar, MapPin, Check } from "lucide-react";

export default function FilterRoute({
  label = "Filter Trips",
  activeFilters = {},
  onApply,
  zonesList = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDateScope, setSelectedDateScope] = useState(activeFilters.dateScope || "all");
  const [selectedStatus, setSelectedStatus] = useState(activeFilters.status || "");
  const [selectedZone, setSelectedZone] = useState(activeFilters.zone || "All Zones");
  const [dateFrom, setDateFrom] = useState(activeFilters.dateFrom || "");
  const [dateTo, setDateTo] = useState(activeFilters.dateTo || "");

  const dropdownRef = useRef(null);

  const statuses = [
    { key: "IN_PROGRESS", label: "Out on Route", activeBg: "bg-emerald-600 text-white border-emerald-600", inactiveBg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { key: "AWAITING_SYNC", label: "Pending Reconciliation", activeBg: "bg-amber-600 text-white border-amber-600", inactiveBg: "bg-amber-50 text-amber-700 border-amber-200" },
    { key: "SETTLED", label: "Settled", activeBg: "bg-[#0A4B6E] text-white border-[#0A4B6E]", inactiveBg: "bg-blue-50 text-[#0A4B6E] border-blue-200" },
    { key: "FLAGGED_VARIANCE", label: "Flagged Variance", activeBg: "bg-rose-600 text-white border-rose-600", inactiveBg: "bg-rose-50 text-rose-700 border-rose-200" },
  ];

  const dateScopes = [
    { key: "all", label: "All Trips" },
    { key: "today", label: "Today Only" },
    { key: "yesterday", label: "Yesterday" },
  ];

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setSelectedDateScope(activeFilters.dateScope || "all");
        setSelectedStatus(activeFilters.status || "");
        setSelectedZone(activeFilters.zone || "All Zones");
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
    setSelectedDateScope("all");
    setSelectedStatus("");
    setSelectedZone("All Zones");
    setDateFrom("");
    setDateTo("");
    if (onApply) {
      onApply({
        dateScope: "all",
        status: "",
        zone: "All Zones",
        dateFrom: "",
        dateTo: "",
      });
    }
    setIsOpen(false);
  };

  const handleApply = () => {
    if (onApply) {
      onApply({
        dateScope: selectedDateScope,
        status: selectedStatus,
        zone: selectedZone,
        dateFrom,
        dateTo,
      });
    }
    setIsOpen(false);
  };

  // Active filters count indicator
  const activeCount = [
    selectedDateScope && selectedDateScope !== "all",
    Boolean(selectedStatus),
    selectedZone && selectedZone !== "All Zones",
    Boolean(dateFrom),
    Boolean(dateTo),
  ].filter(Boolean).length;

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer border shadow-2xs ${
          isOpen || activeCount > 0
            ? "bg-[#0A4B6E] text-[#FFDF2C] border-[#0A4B6E]"
            : "bg-[#EDF3F7] text-[#486581] border-[#D5E3EC] hover:text-[#0A4B6E] hover:bg-white"
        }`}
      >
        <Funnel size={13} />
        <span>{label}</span>
        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-[#FFDF2C] text-[#0A4B6E] text-[10px] font-bold flex items-center justify-center shrink-0">
            {activeCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#D5E3EC] p-4 z-50 animate-scale-in text-left">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Funnel size={15} className="text-[#0A4B6E]" />
              <h4 className="text-xs font-bold text-[#0A4B6E]">Filter Trip Deployments</h4>
            </div>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] font-semibold text-[#6D8AA2] hover:text-rose-600 transition-colors cursor-pointer"
            >
              Reset All
            </button>
          </div>

          <div className="space-y-3.5 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
            {/* 1. Date Scope Quick Selector */}
            <div>
              <label className="text-[11px] font-bold text-[#0A4B6E] flex items-center gap-1.5 mb-1.5">
                <Calendar size={12} /> Date Scope
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {dateScopes.map((scope) => (
                  <button
                    key={scope.key}
                    type="button"
                    onClick={() => {
                      setSelectedDateScope(scope.key);
                      if (scope.key !== "all") {
                        setDateFrom("");
                        setDateTo("");
                      }
                    }}
                    className={`py-1.5 px-2 text-center rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      selectedDateScope === scope.key
                        ? "bg-[#0A4B6E] text-[#FFDF2C] border-[#0A4B6E] shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {scope.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Custom Date Range */}
            <div>
              <label className="text-[11px] font-bold text-[#0A4B6E] flex items-center gap-1.5 mb-1.5">
                <Calendar size={12} /> Custom Date Range
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">From Date:</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      if (e.target.value) setSelectedDateScope("custom");
                    }}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-[#0A4B6E]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">To Date:</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      if (e.target.value) setSelectedDateScope("custom");
                    }}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-[#0A4B6E]"
                  />
                </div>
              </div>
            </div>

            {/* 3. Operational Status Filter */}
            <div>
              <label className="text-[11px] font-bold text-[#0A4B6E] block mb-1.5">
                Trip Status
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {statuses.map((st) => {
                  const isSelected = selectedStatus === st.key;
                  return (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setSelectedStatus(isSelected ? "" : st.key)}
                      className={`p-2 rounded-lg text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                        isSelected ? st.activeBg : st.inactiveBg
                      }`}
                    >
                      <span className="truncate">{st.label}</span>
                      {isSelected && <Check size={12} className="shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Service Zone Filter */}
            <div>
              <label className="text-[11px] font-bold text-[#0A4B6E] flex items-center gap-1.5 mb-1.5">
                <MapPin size={12} /> Service Zone
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-[#0A4B6E] bg-white cursor-pointer"
              >
                <option value="All Zones">All Service Zones</option>
                {zonesList.map((z) => (
                  <option key={z.id || z.code} value={z.code || z.name}>
                    {z.code} — {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#0A4B6E] text-white hover:bg-[#0E384E] transition cursor-pointer shadow-xs"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

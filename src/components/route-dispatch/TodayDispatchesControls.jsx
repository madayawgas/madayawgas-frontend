// src/components/route-dispatch/TodayDispatchesControls.jsx
import React from "react";
import {
  Truck,
  Clock,
  AlertTriangle,
  LayoutGrid,
  List,
  Plus,
  X,
  MapPin,
} from "lucide-react";
import SearchBar from "../ui/SearchBar";
import FilterDropdown from "../ui/FilterDropdown";

export default function TodayDispatchesControls({
  statusTab = "ALL",
  onStatusTabChange,
  counts = { all: 0, outOnRoad: 0, ready: 0, unavailable: 0 },
  searchTerm = "",
  onSearchChange,
  selectedZone = "ALL",
  onZoneChange,
  zonesList = [],
  viewMode = "table",
  onViewModeChange,
  canManage = false,
  onOpenDispatchModal,
}) {
  // Format options for Zone FilterDropdown
  const zoneOptions = [
    { label: "All Service Zones", value: "ALL" },
    ...zonesList.map((z) => ({
      label: `${z.code || z.zoneCode} - ${z.name || z.zoneName}`,
      value: z.id || z.code,
    })),
  ];

  const selectedZoneLabel =
    selectedZone === "ALL"
      ? "All Service Zones"
      : zoneOptions.find((opt) => opt.value === selectedZone)?.label || "Service Zone";

  return (
    <div className="shrink-0 space-y-3 pb-3 border-b border-[#D5E3EC]">
      {/* 1. TOP ROW: Interactive Status Filter Tabs (Segmented Control) & Primary Dispatch Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="inline-flex items-center p-1 bg-[#EDF3F7] rounded-full border border-[#D5E3EC] shadow-2xs gap-1 overflow-x-auto custom-scrollbar max-w-full">
          {/* ALL TODAY */}
          <button
            type="button"
            onClick={() => onStatusTabChange("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              statusTab === "ALL"
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/60 font-medium"
            }`}
          >
            <span>All Today</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                statusTab === "ALL"
                  ? "bg-white/20 text-[#FFDF2C]"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {counts.all}
            </span>
          </button>

          {/* OUT ON THE ROAD */}
          <button
            type="button"
            onClick={() => onStatusTabChange("OUT_ON_ROAD")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              statusTab === "OUT_ON_ROAD"
                ? "bg-emerald-700 text-white shadow-2xs font-bold"
                : "text-emerald-800 hover:bg-emerald-50/80 font-medium"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Out on the Road</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                statusTab === "OUT_ON_ROAD"
                  ? "bg-white/25 text-white"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {counts.outOnRoad}
            </span>
          </button>

          {/* READY TO DISPATCH */}
          <button
            type="button"
            onClick={() => onStatusTabChange("READY")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              statusTab === "READY"
                ? "bg-[#0A4B6E] text-white shadow-2xs font-bold"
                : "text-[#0A4B6E] hover:bg-blue-50/80 font-medium"
            }`}
          >
            <Clock size={12} className={statusTab === "READY" ? "text-[#FFDF2C]" : "text-[#0A4B6E]"} />
            <span>Ready to Dispatch</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                statusTab === "READY"
                  ? "bg-white/20 text-white"
                  : "bg-blue-100 text-[#0A4B6E]"
              }`}
            >
              {counts.ready}
            </span>
          </button>

          {/* UNAVAILABLE VEHICLES */}
          {counts.unavailable > 0 && (
            <button
              type="button"
              onClick={() => onStatusTabChange("UNAVAILABLE")}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                statusTab === "UNAVAILABLE"
                  ? "bg-amber-600 text-white shadow-2xs font-bold"
                  : "text-amber-800 hover:bg-amber-50/80 font-medium"
              }`}
            >
              <AlertTriangle size={12} className={statusTab === "UNAVAILABLE" ? "text-white" : "text-amber-700"} />
              <span>Unavailable</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                  statusTab === "UNAVAILABLE"
                    ? "bg-white/25 text-white"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {counts.unavailable}
              </span>
            </button>
          )}
        </div>

        {/* Primary Action Button: Dispatch Truck */}
        {canManage && (
          <button
            type="button"
            onClick={onOpenDispatchModal}
            className="self-start lg:self-auto flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs px-4 py-2 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95 uppercase tracking-wider text-[11px] shrink-0"
          >
            <Plus size={14} />
            <span>Dispatch Truck</span>
          </button>
        )}
      </div>

      {/* 2. BOTTOM CONTROLS ROW: Search Bar, Zone Filter Dropdown, Active Chips & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Quick Search */}
        <SearchBar
          placeholder="Search vehicle plate, crew, zone, model..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full sm:w-72 md:w-80"
        />

        {/* Right: Filters & View Switcher */}
        <div className="flex items-center gap-2 justify-end flex-wrap">
          {/* Active Filter Chips */}
          {selectedZone !== "ALL" && (
            <span className="inline-flex items-center gap-1.5 h-[30px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs">
              <MapPin size={11} className="text-[#0A4B6E] shrink-0" />
              <span className="max-w-[130px] truncate">{selectedZoneLabel}</span>
              <button
                type="button"
                onClick={() => onZoneChange("ALL")}
                className="hover:text-rose-600 transition-colors cursor-pointer"
                title="Clear Zone Filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {statusTab !== "ALL" && (
            <span className="inline-flex items-center gap-1.5 h-[30px] px-2.5 rounded-full bg-[#EDF3F7] text-slate-700 border border-slate-300 text-[11px] font-medium transition-all shadow-2xs">
              <span>Filter:</span>
              <strong className="text-[#0A4B6E]">
                {statusTab === "OUT_ON_ROAD"
                  ? "Out on the Road"
                  : statusTab === "READY"
                  ? "Ready to Dispatch"
                  : "Unavailable"}
              </strong>
              <button
                type="button"
                onClick={() => onStatusTabChange("ALL")}
                className="hover:text-rose-600 transition-colors cursor-pointer"
                title="Clear Status Filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {/* Zone Filter Dropdown */}
          {zonesList.length > 0 && (
            <FilterDropdown
              label="Service Zone"
              options={zoneOptions}
              value={selectedZone}
              onChange={(opt) => onZoneChange(typeof opt === "object" && opt !== null ? opt.value : opt)}
            />
          )}

          {/* Dual View Mode Switcher (Table vs Cards) */}
          <div className="inline-flex items-center p-0.5 bg-[#EDF3F7] rounded-full border border-[#D5E3EC] shadow-2xs">
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                viewMode === "table"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                  : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/60"
              }`}
              title="Table View (Enterprise Density)"
            >
              <List size={13} />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                  : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/60"
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid size={13} />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

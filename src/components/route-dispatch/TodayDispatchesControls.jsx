// src/components/route-dispatch/TodayDispatchesControls.jsx
import React from "react";
import {
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
      {/* Top Row: Segmented Status Control Bar & Primary Dispatch Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs (The single clean bar) */}
        <div className="inline-flex items-center p-1 bg-[#EDF3F7] rounded-full border border-[#D5E3EC] shadow-2xs gap-1 overflow-x-auto custom-scrollbar max-w-full">
          {/* ALL TODAY */}
          <button
            type="button"
            onClick={() => onStatusTabChange("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              statusTab === "ALL"
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                : "text-[#3E5C76] hover:text-[#0A4B6E] hover:bg-white/60 font-semibold"
            }`}
          >
            <span>All Today</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold min-w-[18px] text-center ${
                statusTab === "ALL" ? "bg-white/20 text-[#FFDF2C]" : "bg-slate-200 text-slate-700"
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
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                : "text-[#3E5C76] hover:text-[#0A4B6E] hover:bg-white/60 font-semibold"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Out on Route</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold min-w-[18px] text-center ${
                statusTab === "OUT_ON_ROAD" ? "bg-white/20 text-[#FFDF2C]" : "bg-emerald-100 text-emerald-800"
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
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                : "text-[#3E5C76] hover:text-[#0A4B6E] hover:bg-white/60 font-semibold"
            }`}
          >
            <Clock size={12} className={statusTab === "READY" ? "text-[#FFDF2C]" : "text-[#0A4B6E]"} />
            <span>Ready to Dispatch</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold min-w-[18px] text-center ${
                statusTab === "READY" ? "bg-white/20 text-[#FFDF2C]" : "bg-blue-100 text-[#0A4B6E]"
              }`}
            >
              {counts.ready}
            </span>
          </button>

          {/* UNAVAILABLE / GROUNDED (Kept stable with 0 count) */}
          <button
            type="button"
            onClick={() => onStatusTabChange("UNAVAILABLE")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              statusTab === "UNAVAILABLE"
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                : "text-amber-800 hover:text-[#0A4B6E] hover:bg-white/60 font-semibold"
            }`}
          >
            <AlertTriangle size={12} className={statusTab === "UNAVAILABLE" ? "text-[#FFDF2C]" : "text-amber-700"} />
            <span>Unavailable</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold min-w-[18px] text-center ${
                statusTab === "UNAVAILABLE" ? "bg-white/20 text-[#FFDF2C]" : "bg-amber-100 text-amber-800"
              }`}
            >
              {counts.unavailable}
            </span>
          </button>
        </div>

        {/* Primary Action Button: Dispatch Truck */}
        {canManage && (
          <button
            type="button"
            onClick={onOpenDispatchModal}
            className="self-start sm:self-auto flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs px-4 py-2 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95 uppercase tracking-wider shrink-0"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Dispatch Truck</span>
          </button>
        )}
      </div>

      {/* Bottom Filtering Row: Search Bar, Service Zone & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-0.5">
        <SearchBar
          placeholder="Search plate, crew, zone..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full sm:w-72 md:w-80"
        />

        <div className="flex items-center gap-2 justify-end flex-wrap">
          {selectedZone !== "ALL" && (
            <span className="inline-flex items-center gap-1.5 h-[30px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-semibold transition-all shadow-2xs">
              <MapPin size={11} className="text-[#0A4B6E] shrink-0" />
              <span className="max-w-[130px] truncate">{selectedZoneLabel}</span>
              <button
                type="button"
                onClick={() => onZoneChange("ALL")}
                className="hover:text-rose-600 transition-colors cursor-pointer"
                aria-label="Clear Service Zone Filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {zonesList.length > 0 && (
            <FilterDropdown
              label="Service Zone"
              options={zoneOptions}
              value={selectedZone}
              onChange={(opt) => onZoneChange(typeof opt === "object" && opt !== null ? opt.value : opt)}
            />
          )}

          {/* View Mode Switcher (Table vs Cards) */}
          <div className="inline-flex items-center p-0.5 bg-[#EDF3F7] rounded-full border border-[#D5E3EC] shadow-2xs">
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                viewMode === "table"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                  : "text-[#3E5C76] hover:text-[#0A4B6E] hover:bg-white/60"
              }`}
              title="Table View (Master-Detail)"
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
                  : "text-[#3E5C76] hover:text-[#0A4B6E] hover:bg-white/60"
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

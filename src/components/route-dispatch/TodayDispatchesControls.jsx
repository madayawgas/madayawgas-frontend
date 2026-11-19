// src/components/route-dispatch/TodayDispatchesControls.jsx
import React from "react";
import {
  LayoutGrid,
  List,
  Plus,
  X,
  MapPin,
  Layers,
  PackageCheck,
  CheckCircle2,
  ArrowLeft,
  Filter,
  Truck,
} from "lucide-react";
import SearchBar from "../ui/SearchBar";
import FilterDropdown from "../ui/FilterDropdown";

export default function TodayDispatchesControls({
  viewSection = "VEHICLES", // "VEHICLES" | "COMPLETED"
  onViewSectionChange,
  statusFilter = "ALL",
  onStatusFilterChange,
  counts = {
    vehiclesTotal: 0,
    outOnRoad: 0,
    returned: 0,
    ready: 0,
    unavailable: 0,
    completedTotal: 0,
    completedAttention: 0,
  },
  searchTerm = "",
  onSearchChange,
  selectedZone = "ALL",
  onZoneChange,
  zonesList = [],
  viewMode = "table",
  onViewModeChange,
  canManage = false,
  onOpenDispatchModal,
  onNavigateCheckIn,
  plantInventory = [],
}) {
  const isCompletedView = viewSection === "COMPLETED";

  // Status filter options adapt to the active section
  const statusOptions = isCompletedView
    ? [
        { label: `All Completed (${counts.completedTotal || 0})`, value: "ALL" },
        { label: "Settled", value: "SETTLED" },
        { label: "Flagged Variance", value: "FLAGGED_VARIANCE" },
        { label: "Pending Sales", value: "AWAITING_SYNC" },
      ]
    : [
        { label: `All Vehicles (${counts.vehiclesTotal || 0})`, value: "ALL" },
        { label: `Ready to Dispatch (${counts.ready || 0})`, value: "READY" },
        { label: `Out on Route (${counts.outOnRoad || 0})`, value: "OUT_ON_ROAD" },
        { label: `Returned (${counts.returned || 0})`, value: "RETURNED" },
        { label: `Unavailable (${counts.unavailable || 0})`, value: "UNAVAILABLE" },
      ];

  const selectedStatusLabel =
    statusFilter === "ALL"
      ? "All"
      : statusOptions.find((opt) => opt.value === statusFilter)?.label?.replace(/\s*\(\d+\)$/, "") ||
        statusFilter;

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

  // Filter top active products for read-only yard stock ticker
  const yardStockSummary = Array.isArray(plantInventory)
    ? plantInventory
        .filter((item) => (Number(item.quantityFilled || item.quantity_filled) || 0) > 0)
        .slice(0, 4)
    : [];

  return (
    <div className="shrink-0 space-y-2.5 pb-3 border-b border-[#D5E3EC]">
      {/* Top Row: View Context Title & Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Contextual Section Heading */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isCompletedView ? (
            <>
              <button
                type="button"
                onClick={() => onViewSectionChange && onViewSectionChange("VEHICLES")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#EDF3F7] hover:bg-[#DCE8F0] text-[#0A4B6E] transition-colors cursor-pointer"
                title="Return to Today's Vehicles"
              >
                <ArrowLeft size={13} strokeWidth={2.5} />
                <span>Back to Vehicles</span>
              </button>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700" />
                <span className="text-sm font-bold text-[#0A4B6E]">
                  Completed Runs Today
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F3F8] text-[#0A4B6E]">
                  {counts.completedTotal || 0}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-[#0A4B6E]" />
                <span className="text-sm font-bold text-[#0A4B6E]">
                  Today&apos;s Vehicles
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F3F8] text-[#0A4B6E]">
                  {counts.vehiclesTotal || 0}
                </span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-[11px] text-[#3E5C76] font-medium">
                <span>·</span>
                <span className="text-[#0A4B6E] font-semibold">{counts.ready || 0} Ready</span>
                <span>·</span>
                <span className="text-emerald-700 font-semibold">{counts.outOnRoad || 0} On Route</span>
                {counts.returned > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-amber-700 font-semibold">{counts.returned} Returned</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Completed Runs Toggle, Check In Return & Dispatch Vehicle */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() =>
              onViewSectionChange &&
              onViewSectionChange(isCompletedView ? "VEHICLES" : "COMPLETED")
            }
            className={`flex items-center gap-1.5 font-bold text-xs px-3.5 py-2 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95 uppercase tracking-wider border ${
              isCompletedView
                ? "bg-[#0A4B6E] text-[#FFDF2C] border-[#0A4B6E]"
                : "bg-white border-[#CBD5E1] hover:bg-[#F3F5F5] hover:border-[#94A3B8] text-[#0A4B6E]"
            }`}
            title="View and re-reconcile today's completed runs"
          >
            <CheckCircle2
              size={14}
              className={isCompletedView ? "text-[#FFDF2C]" : "text-emerald-700"}
              strokeWidth={2.5}
            />
            <span>Completed Runs</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold min-w-[20px] text-center ${
                isCompletedView
                  ? "bg-white/20 text-[#FFDF2C]"
                  : counts.completedAttention > 0
                  ? "bg-rose-100 text-rose-800"
                  : "bg-[#E8F3F8] text-[#0A4B6E]"
              }`}
            >
              {counts.completedTotal || 0}
            </span>
          </button>

          {canManage && onNavigateCheckIn && (
            <button
              type="button"
              onClick={onNavigateCheckIn}
              className="flex items-center gap-1.5 bg-white border border-[#CBD5E1] hover:bg-[#F3F5F5] hover:border-[#94A3B8] text-[#0A4B6E] font-bold text-xs px-3.5 py-2 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95 uppercase tracking-wider"
              title="Open dock return check-in workspace"
            >
              <PackageCheck size={14} className="text-[#0A4B6E]" strokeWidth={2.5} />
              <span>Check In Return</span>
            </button>
          )}

          {canManage && (
            <button
              type="button"
              onClick={onOpenDispatchModal}
              className="flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs px-4 py-2 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95 uppercase tracking-wider"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Dispatch Vehicle</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtle Read-Only Yard Stock Situational Awareness Strip (Zero emojis, vector icon) */}
      {yardStockSummary.length > 0 && (
        <div className="flex items-center gap-2 py-1 px-3 bg-[#F4F9FC] border border-[#CBD5E1]/60 rounded-xl text-xs overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1.5 text-[#0A4B6E] font-bold text-[11px] shrink-0 uppercase tracking-wider">
            <Layers size={13} className="text-[#0A4B6E]" />
            <span>Bunawan Yard Stock:</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#3E5C76] font-medium shrink-0">
            {yardStockSummary.map((item, idx) => (
              <span key={item.productId || idx} className="inline-flex items-center gap-1">
                <span className="font-semibold text-slate-800">{item.productName}:</span>
                <strong className="text-[#0A4B6E]">
                  {Number(item.quantityFilled || item.quantity_filled || 0).toLocaleString()} units
                </strong>
                {item.containerType === "CANISTER" && item.cratesFilled > 0 && (
                  <span className="text-[#3E5C76]">({item.cratesFilled} crt)</span>
                )}
                {idx < yardStockSummary.length - 1 && <span className="text-slate-300 ml-2">·</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Filtering Row: Search Bar, Status Dropdown, Service Zone & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-0.5">
        <SearchBar
          placeholder="Search plate, crew, zone..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full sm:w-72 md:w-80"
        />

        <div className="flex items-center gap-2 justify-end flex-wrap">
          {statusFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1.5 h-[30px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-semibold transition-all shadow-2xs">
              <Filter size={11} className="text-[#0A4B6E] shrink-0" />
              <span className="max-w-[140px] truncate">{selectedStatusLabel}</span>
              <button
                type="button"
                onClick={() => onStatusFilterChange("ALL")}
                className="hover:text-rose-600 transition-colors cursor-pointer"
                aria-label="Clear Status Filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

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

          <FilterDropdown
            label="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={(opt) =>
              onStatusFilterChange(typeof opt === "object" && opt !== null ? opt.value : opt)
            }
          />

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

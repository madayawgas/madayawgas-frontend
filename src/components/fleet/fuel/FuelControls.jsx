import { useState } from "react";
import {
  RotateCcw,
  FileText,
  BarChart3,
} from "lucide-react";
import SearchBar from "../../ui/SearchBar";

const PERIOD_PRESETS = [
  { key: "today", label: "Today" },
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_90_days", label: "3 Months" },
  { key: "6_months", label: "6 Months" },
  { key: "this_year", label: "12 Months" },
  { key: "custom", label: "Custom Range" },
];

export default function FuelControls({
  period = "this_month",
  onPeriodChange,
  startDate = "",
  endDate = "",
  onDateRangeChange,
  selectedVehicleId = "",
  onVehicleChange,
  trucks = [],
  searchQuery = "",
  onSearchChange,
  viewMode = "analytics", // 'analytics' | 'logs'
  onViewModeChange,
  onRefresh,
  isLoading = false,
}) {
  const [showCustomDates, setShowCustomDates] = useState(period === "custom");
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  const handlePresetSelect = (presetKey) => {
    if (presetKey === "custom") {
      setShowCustomDates(true);
      onPeriodChange("custom");
      return;
    }
    setShowCustomDates(false);

    if (presetKey === "6_months") {
      const today = new Date();
      const sixMonthsAgo = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000);
      onDateRangeChange(
        sixMonthsAgo.toISOString().split("T")[0],
        today.toISOString().split("T")[0],
        "6_months"
      );
    } else {
      onPeriodChange(presetKey);
    }
  };

  const handleApplyCustomDates = (e) => {
    e?.preventDefault();
    if (customStart && customEnd) {
      onDateRangeChange(customStart, customEnd, "custom");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Top Row: Search, Vehicle Filter, View Switcher & Refresh */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <SearchBar
          placeholder="Search by vehicle plate, model, or driver..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange("")}
          className="w-full max-w-md"
        />

        {/* Filter Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 justify-end shrink-0">
          {/* Vehicle Filter Selector */}
          <select
            value={selectedVehicleId}
            onChange={(e) => onVehicleChange(e.target.value)}
            className="px-3.5 py-1.5 text-xs bg-white rounded-full border border-[#0A4B6E]/30 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/20 text-[#0A4B6E] font-semibold cursor-pointer shadow-2xs max-w-[180px]"
          >
            <option value="">All Vehicles</option>
            {trucks.map((t) => {
              const id = t.id || t.truckId;
              return (
                <option key={id} value={id}>
                  {t.plateNumber} {t.model ? `(${t.model})` : ""}
                </option>
              );
            })}
          </select>

          {/* View Mode Segmented Pill */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-full border border-slate-200/80 gap-1">
            <button
              type="button"
              onClick={() => onViewModeChange("logs")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "logs"
                  ? "bg-[#0B4A6E] text-[#FFDF2C] shadow-xs"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              <FileText size={13} />
              <span>Fuel Log Entries</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange("analytics")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "analytics"
                  ? "bg-[#0B4A6E] text-[#FFDF2C] shadow-xs"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              <BarChart3 size={13} />
              <span>Vehicle Breakdown</span>
            </button>
          </div>

          {/* Refresh Action Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-[#0A4B6E] font-semibold text-xs px-3.5 py-1.5 rounded-full transition-colors cursor-pointer shadow-2xs active:scale-95"
            title="Refresh fuel telemetry"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-[#0A4B6E] ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Bottom Row: Time Range Segmented Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-200/80">
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-full border border-slate-200/80 gap-1 overflow-x-auto max-w-full">
          {PERIOD_PRESETS.map((p) => {
            const isActive = period === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePresetSelect(p.key)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#0B4A6E] text-[#FFDF2C] shadow-xs"
                    : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Custom Date Pickers */}
        {showCustomDates && (
          <form
            onSubmit={handleApplyCustomDates}
            className="flex items-center gap-2 bg-[#E8F3F8] p-1.5 rounded-2xl border border-[#9BCBE3] shadow-xs"
          >
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                required
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-white border border-[#0A4B6E]/30 text-xs text-[#0A4B6E] font-medium focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/20"
              />
              <span className="text-[#588094] font-bold text-xs">to</span>
              <input
                type="date"
                required
                min={customStart}
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-white border border-[#0A4B6E]/30 text-xs text-[#0A4B6E] font-medium focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/20"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1 rounded-xl text-xs font-bold bg-[#0A4B6E] hover:bg-[#083853] text-[#FFDF2C] uppercase tracking-wider cursor-pointer transition-all shadow-2xs"
            >
              Apply
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

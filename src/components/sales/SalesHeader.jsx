// src/components/sales/SalesHeader.jsx
import { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  Truck,
  Receipt,
  FileCheck2,
  Calendar,
  RotateCcw,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function SalesHeader({
  activeTab = "analytics",
  onTabChange,
  metricsSummary = {},
  tripsCount = 0,
  transactionsCount = 0,
  invoicesCount = 0,
  unverifiedGcashCount = 0,
  dateRangePreset = "last30",
  onDateRangeChange,
  isLiveConnected = true,
  onRefresh,
  isRefreshing = false,
}) {
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const dateMenuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target)) {
        setIsDateMenuOpen(false);
      }
    }
    if (isDateMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDateMenuOpen]);

  const datePresets = [
    { key: "today", label: "Today" },
    { key: "last7", label: "Last 7 Days" },
    { key: "last30", label: "Last 30 Days" },
    { key: "thisMonth", label: "This Month" },
    { key: "all", label: "All Time" },
  ];

  const activePresetLabel =
    datePresets.find((p) => p.key === dateRangePreset)?.label || "Last 30 Days";

  return (
    <div className="flex flex-col mb-4">
      {/* 1. TOP: Centered Segmented Control View Switcher */}
      <div className="w-full flex items-center justify-center mb-3">
        <div className="inline-flex items-center p-1 bg-[#EDF3F7] rounded-full border border-[#D5E3EC] shadow-inner gap-1 max-w-full overflow-x-auto custom-scrollbar">
          {/* Tab 1: Overview & Analytics */}
          <button
            type="button"
            onClick={() => onTabChange("analytics")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "analytics"
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-sm font-bold scale-[1.02]"
                : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>Overview & Analytics</span>
            {metricsSummary.totalGrossSales !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                  activeTab === "analytics"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/90 text-slate-600"
                }`}
              >
                ₱{(Number(metricsSummary.totalGrossSales) || 0).toLocaleString()}
              </span>
            )}
          </button>

          {/* Tab 2: Vehicle & Trip Deliveries */}
          <button
            type="button"
            onClick={() => onTabChange("deliveries")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "deliveries"
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-sm font-bold scale-[1.02]"
                : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
            }`}
          >
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span>Vehicle & Trip Deliveries</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                activeTab === "deliveries"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/90 text-slate-600"
              }`}
            >
              {tripsCount}
            </span>
          </button>

          {/* Tab 3: Transaction Records */}
          <button
            type="button"
            onClick={() => onTabChange("transactions")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "transactions"
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-sm font-bold scale-[1.02]"
                : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
            }`}
          >
            <Receipt className="w-3.5 h-3.5 shrink-0" />
            <span>Transaction Records</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                activeTab === "transactions"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/90 text-slate-600"
              }`}
            >
              {transactionsCount}
            </span>
          </button>

          {/* Tab 4: Invoices & Settlements */}
          <button
            type="button"
            onClick={() => onTabChange("invoices")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "invoices"
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-sm font-bold scale-[1.02]"
                : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
            <span>Invoices & Settlements</span>
            {unverifiedGcashCount > 0 ? (
              <span className="bg-amber-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold animate-pulse">
                {unverifiedGcashCount} unverified
              </span>
            ) : (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                  activeTab === "invoices"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/90 text-slate-600"
                }`}
              >
                {invoicesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. BOTTOM: Context-Aware Indicators & Date Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#6D8AA2]/20 gap-3 min-h-[44px]">
        {/* Left: Operational Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* WebSocket Status Indicator */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isLiveConnected
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
            title={isLiveConnected ? "Real-time updates active via WebSocket" : "Offline / Reconnecting"}
          >
            {isLiveConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <Wifi size={12} className="text-emerald-700" />
                <span>Live Feed</span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-slate-400" />
                <span>Reconnecting...</span>
              </>
            )}
          </span>

          {/* Read-Only POS Notice */}
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-semibold text-xs shadow-2xs">
            <span>Read-Only Operations & Monitoring</span>
          </span>
        </div>

        {/* Right: Date Range Preset Picker & Refresh */}
        <div className="flex items-center gap-2 h-[30px]">
          {/* Date Range Selector Dropdown */}
          <div className="relative" ref={dateMenuRef}>
            <button
              type="button"
              onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-[#0A4B6E] font-semibold text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer shadow-2xs active:scale-95 h-[30px]"
            >
              <Calendar size={13} className="text-[#0A4B6E]" />
              <span>{activePresetLabel}</span>
            </button>

            {isDateMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-30 animate-scale-in">
                {datePresets.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => {
                      setIsDateMenuOpen(false);
                      onDateRangeChange(preset.key);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold cursor-pointer transition-colors flex items-center justify-between ${
                      dateRangePreset === preset.key
                        ? "bg-[#E8F3F8] text-[#0A4B6E]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{preset.label}</span>
                    {dateRangePreset === preset.key && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0A4B6E]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Refresh Trigger */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center w-[30px] h-[30px] bg-white hover:bg-slate-50 border border-slate-300 text-[#0A4B6E] rounded-full transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            title="Refresh authoritative records"
          >
            <RotateCcw size={13} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}

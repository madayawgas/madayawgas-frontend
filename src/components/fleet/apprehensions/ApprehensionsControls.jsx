// src/components/fleet/apprehensions/ApprehensionsControls.jsx
import { RotateCcw } from "lucide-react";
import SearchBar from "../../ui/SearchBar";

const STATUS_FILTERS = [
  { key: "ALL", label: "All Citations" },
  { key: "RECORDED", label: "Open / Recorded" },
  { key: "SETTLED", label: "Settled" },
  { key: "DISPUTED", label: "Disputed" },
  { key: "CANCELLED", label: "Cancelled" },
];

const AGENCIES = ["ALL", "LTO", "CTTMO", "PNP-HPG", "DPWH", "MMDA"];

export default function ApprehensionsControls({
  searchQuery = "",
  onSearchChange,
  statusFilter = "ALL",
  onStatusChange,
  agencyFilter = "ALL",
  onAgencyChange,
  onRefresh,
  isLoading = false,
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* 1. Top Row: Search, Agency Filter & Refresh */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <SearchBar
          placeholder="Search by ticket#, plate, driver, or agency..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange("")}
          className="w-full max-w-md"
        />

        {/* Filter Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 justify-end shrink-0">
          {/* Agency Filter Selector */}
          <select
            value={agencyFilter}
            onChange={(e) => onAgencyChange(e.target.value)}
            className="px-3.5 py-1.5 text-xs bg-white rounded-full border border-[#0A4B6E]/30 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/20 text-[#0A4B6E] font-semibold cursor-pointer shadow-2xs max-w-[160px]"
          >
            {AGENCIES.map((agency) => (
              <option key={agency} value={agency}>
                {agency === "ALL" ? "All Agencies" : agency}
              </option>
            ))}
          </select>

          {/* Refresh Action Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-[#0A4B6E] font-semibold text-xs px-3.5 py-1.5 rounded-full transition-colors cursor-pointer shadow-2xs active:scale-95"
            title="Refresh apprehensions list"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-[#0A4B6E] ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Bottom Row: Status Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-200/80">
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-full border border-slate-200/80 gap-1 overflow-x-auto max-w-full">
          {STATUS_FILTERS.map((s) => {
            const isActive = statusFilter === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => onStatusChange(s.key)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#0B4A6E] text-[#FFDF2C] shadow-xs"
                    : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

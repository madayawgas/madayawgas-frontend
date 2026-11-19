// src/components/sales/SalesPageHeader.jsx
import { Calendar, RefreshCw } from "lucide-react";
import { SALES_DATE_PRESETS } from "../../hooks/useSalesDateRange.js";

/**
 * Standardized header bar for Sales module pages, matching CustomerHeader & FleetHeader.
 * Displays concise metric pills on the left and Asia/Manila date-range controls on the right.
 */
export default function SalesPageHeader({
  pills = [],
  dateRangePreset,
  onDateRangeChange,
  dateRangeOptions = SALES_DATE_PRESETS,
  onRefresh,
  isRefreshing = false,
  actions = null,
}) {
  return (
    <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#6D8AA2]/20 mb-4 gap-3">
      {/* Left: Operational Metric Pills */}
      <div className="flex flex-wrap items-center gap-2.5">
        {pills.map((pill, idx) => {
          const Icon = pill.icon;
          const isButton = typeof pill.onClick === "function";
          const toneMap = {
            info: "bg-[#E8F3F8] text-[#0A4B6E] border-[#BCE1F1]",
            success: "bg-emerald-50 text-emerald-800 border-emerald-200",
            warning: "bg-amber-50 text-amber-800 border-amber-200",
            active: "bg-[#0A4B6E] text-[#FFDF2C] border-[#0A4B6E]",
          };
          const classes = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-bold text-xs shadow-2xs h-[30px] transition-colors ${
            toneMap[pill.tone] || toneMap.info
          } ${isButton ? "cursor-pointer hover:opacity-90" : ""}`;

          if (isButton) {
            return (
              <button
                key={idx}
                type="button"
                onClick={pill.onClick}
                className={classes}
              >
                {Icon && <Icon size={13} />}
                <span>{pill.label}</span>
              </button>
            );
          }

          return (
            <span key={idx} className={classes}>
              {Icon && <Icon size={13} />}
              <span>{pill.label}</span>
            </span>
          );
        })}
      </div>

      {/* Right: Date Range Filter & Actions */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {actions}

        {typeof onDateRangeChange === "function" && (
          <div className="inline-flex items-center gap-1.5 bg-[#FCFEFE] border border-[#0A4B6E]/30 rounded-full px-3 h-[30px] shadow-2xs">
            <Calendar size={13} className="text-[#0A4B6E] shrink-0" />
            <label htmlFor="sales-date-range" className="sr-only">
              Date Range
            </label>
            <select
              id="sales-date-range"
              value={dateRangePreset}
              onChange={(e) => onDateRangeChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#0A4B6E] focus:outline-none cursor-pointer pr-1"
            >
              {dateRangeOptions.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {typeof onRefresh === "function" && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh sales data"
            title="Refresh data"
            className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-full bg-[#FCFEFE] hover:bg-[#E8F3F8] text-[#0A4B6E] border border-[#0A4B6E]/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? "animate-spin" : ""}
            />
          </button>
        )}
      </div>
    </div>
  );
}

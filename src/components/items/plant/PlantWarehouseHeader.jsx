// src/components/items/plant/PlantWarehouseHeader.jsx
import { Layers, SlidersHorizontal, RefreshCw, AlertOctagon, RotateCcw } from "lucide-react";

/**
 * PlantWarehouseHeader — Standardized page header for Bunawan Plant Warehouse.
 * Directly aligns with CustomerHeader: metric summary pills on the left, action controls on the right.
 * Eliminates redundant title/subtitle as Layout.jsx top navbar already renders the page title.
 */
export default function PlantWarehouseHeader({
  metrics = {
    totalFilled: 0,
    totalEmpty: 0,
    totalDefective: 0,
    totalUnits: 0,
    cratesFilled: 0,
    cratesEmpty: 0,
  },
  onOpenAdjustmentModal,
  canManage = true,
  onRefresh,
  isLoading = false,
}) {
  return (
    <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#6D8AA2]/20 mb-3.5 gap-3">
      {/* Left: Operational Metric Summary Pills Strip */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Total Yard Units */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs h-[30px]">
          <Layers size={13} className="text-[#0A4B6E]" />
          <span>{(metrics.totalUnits || 0).toLocaleString()} Total Units</span>
        </span>

        {/* Sale-Ready Filled */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs shadow-2xs h-[30px]">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>{(metrics.totalFilled || 0).toLocaleString()} Sale-Ready Filled</span>
          {metrics.cratesFilled > 0 && (
            <span className="text-[10px] text-emerald-700 font-semibold ml-0.5">
              ({metrics.cratesFilled} cr)
            </span>
          )}
        </span>

        {/* Empty Good Returns */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0F7FA] text-[#0A4B6E] border border-[#CBD5E1] font-bold text-xs shadow-2xs h-[30px]">
          <RotateCcw size={13} className="text-[#0A4B6E]" />
          <span>{(metrics.totalEmpty || 0).toLocaleString()} Empty Returns</span>
          {metrics.cratesEmpty > 0 && (
            <span className="text-[10px] text-[#0A4B6E]/70 font-semibold ml-0.5">
              ({metrics.cratesEmpty} cr)
            </span>
          )}
        </span>

        {/* Defective Units */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-bold text-xs shadow-2xs h-[30px] ${
            (metrics.totalDefective || 0) > 0
              ? "bg-rose-50 text-[#C93B32] border-rose-200"
              : "bg-slate-50 text-slate-500 border-slate-200"
          }`}
        >
          <AlertOctagon
            size={13}
            className={(metrics.totalDefective || 0) > 0 ? "text-[#C93B32]" : "text-slate-400"}
          />
          <span>{(metrics.totalDefective || 0).toLocaleString()} Defective</span>
        </span>
      </div>

      {/* Right: Action Controls (Adjust Stock + Refresh) */}
      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
        {canManage && (
          <button
            type="button"
            onClick={onOpenAdjustmentModal}
            className="flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer h-[30px]"
          >
            <SlidersHorizontal size={13} strokeWidth={2.5} />
            <span>Adjust Stock</span>
          </button>
        )}

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh warehouse stock"
            aria-label="Refresh warehouse stock"
            className="p-1.5 rounded-full text-slate-500 hover:text-[#0A4B6E] hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200 h-[30px] w-[30px] flex items-center justify-center"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        )}
      </div>
    </div>
  );
}

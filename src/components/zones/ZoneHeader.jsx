// src/components/zones/ZoneHeader.jsx
import React from "react";
import { Plus, MapPin, RefreshCw } from "lucide-react";

export default function ZoneHeader({
  onAddZone,
  onRefresh,
  isLoading = false,
  canManage = true,
  summary = null,
}) {
  const total = summary?.total ?? 0;
  const active = summary?.active ?? 0;
  const inactive = summary?.inactive ?? 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#6D8AA2]/20 mb-4 gap-3">
      {/* Left side: Live Metric Summary Pills */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs h-[30px]">
          <MapPin size={13} className="text-[#0A4B6E]" />
          <span>{total} Service Delivery Zones</span>
        </span>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs shadow-2xs h-[30px]">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>{active} Active</span>
        </span>

        {inactive > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 font-bold text-xs shadow-2xs h-[30px]">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span>{inactive} Inactive</span>
          </span>
        )}
      </div>

      {/* Right side: Actions (Refresh + Add Service Zone) */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh service zones"
            className="w-[30px] h-[30px] rounded-full border border-[#0A4B6E]/30 bg-white hover:bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          </button>
        )}

        {canManage && (
          <button
            type="button"
            onClick={onAddZone}
            className="flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer h-[30px]"
          >
            <Plus size={14} />
            <span>Add Service Zone</span>
          </button>
        )}
      </div>
    </div>
  );
}

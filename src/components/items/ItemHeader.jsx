// src/components/items/ItemHeader.jsx
import { Plus, Layers, Flame, Package } from "lucide-react";

export default function ItemHeader({
  activeSubTab = "catalog",
  onTabChange,
  onAddItem,
  canCreate = true,
  itemSummary = null,
  plantStockCount = 0,
  totalYardFilledUnits = 0,
}) {
  return (
    <div className="sticky -top-3 md:-top-4 z-20 bg-white pt-1 pb-1 mb-3">
      {/* 1. TOP: Centered Segmented Control View Switcher */}
      {onTabChange && (
        <div className="w-full flex items-center justify-center mb-3">
          <div className="inline-flex items-center p-1 bg-[#EDF3F7] rounded-full border border-[#D5E3EC] shadow-inner gap-1 max-w-full overflow-x-auto custom-scrollbar">
            {/* Catalog Tab */}
            <button
              type="button"
              onClick={() => onTabChange("catalog")}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSubTab === "catalog"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-sm font-bold scale-[1.02]"
                  : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Item Profiles Catalog</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                  activeSubTab === "catalog"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/90 text-slate-600"
                }`}
              >
                {itemSummary?.total || 0}
              </span>
            </button>

            {/* Plant Yard Bulk Stock Tab */}
            <button
              type="button"
              onClick={() => onTabChange("plant")}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSubTab === "plant"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-sm font-bold scale-[1.02]"
                  : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
              }`}
            >
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span>Bunawan Yard Bulk Stock</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                  activeSubTab === "plant"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/90 text-slate-600"
                }`}
              >
                {plantStockCount || 3}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 2. BOTTOM: Overview Badges & Action Button (Only for Catalog Tab) */}
      {activeSubTab === "catalog" && (
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#6D8AA2]/20 gap-3">
          {/* Left side: Soft Operational Overview indicators */}
          <div className="flex flex-wrap items-center gap-2.5">
            {itemSummary && (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs h-[30px]">
                  <Layers size={13} className="text-[#0A4B6E]" />
                  <span>{itemSummary.total || 0} Registered Products</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs shadow-2xs h-[30px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>{itemSummary.active || 0} Active</span>
                </span>

                {totalYardFilledUnits > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 font-bold text-xs shadow-2xs h-[30px]">
                    <Package size={13} className="text-teal-700" />
                    <span>{totalYardFilledUnits.toLocaleString()} Yard Bulk Units</span>
                  </span>
                )}

                {itemSummary.cylinders > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF9D6] text-[#0A4B6E] border border-[#FFE866]/80 font-bold text-xs shadow-2xs h-[30px]">
                    <Flame size={13} className="text-amber-600" />
                    <span>{itemSummary.cylinders} Cylinders</span>
                  </span>
                )}

                {itemSummary.canisters > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E6F4FA] text-[#0A4B6E] border border-[#BCE1F1]/80 font-bold text-xs shadow-2xs h-[30px]">
                    <Package size={13} className="text-[#0A4B6E]" />
                    <span>{itemSummary.canisters} Canisters</span>
                  </span>
                )}

                {itemSummary.inactive > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold text-xs shadow-2xs h-[30px]">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>{itemSummary.inactive} Inactive</span>
                  </span>
                )}
              </>
            )}
          </div>

          {/* Right side: Add New Item Action */}
          {canCreate && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onAddItem}
                className="flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer h-[30px]"
              >
                <Plus size={14} />
                <span>Add New Item</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

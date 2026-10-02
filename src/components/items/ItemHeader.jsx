// src/components/items/ItemHeader.jsx
import { Plus, Layers, Flame, Package } from "lucide-react";

export default function ItemHeader({
  onAddItem,
  canCreate = true,
  itemSummary = null,
}) {
  return (
    <div className="sticky -top-3 md:-top-4 z-20 bg-white pt-1 pb-1 mb-3">
      {/* Overview Badges & Action Button */}
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
    </div>
  );
}

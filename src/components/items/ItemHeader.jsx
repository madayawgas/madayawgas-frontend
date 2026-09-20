// src/components/items/ItemHeader.jsx
import { Plus } from "lucide-react";

export default function ItemHeader({
  onAddItem,
  canCreate = true,
  itemSummary = null,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#6D8AA2] mb-6 gap-4">
      {/* Left side: Title & Soft Operational Overview indicators */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl md:text-[32px] font-bold text-[#1B4B75]">
          Item Profile
        </h1>

        {itemSummary && (
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>{itemSummary.active || 0} Active Products</span>
            </span>

            {itemSummary.inactive > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>{itemSummary.inactive} Inactive</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right side: Add New Item Action */}
      {canCreate && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAddItem}
            className="flex items-center gap-2 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs md:text-sm px-4 py-2.5 rounded-full shadow-xs transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
          >
            <Plus size={16} />
            <span>Add New Item</span>
          </button>
        </div>
      )}
    </div>
  );
}


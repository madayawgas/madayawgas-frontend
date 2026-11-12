// src/components/items/plant/PlantWarehouseCards.jsx
import { Package, Flame, SlidersHorizontal } from "lucide-react";

/**
 * PlantWarehouseCards — Tactile cards grid view for Bunawan Plant Warehouse bulk inventory.
 * Clean, modern product cards with condition breakdown, crate counts, and quick adjust actions.
 */
export default function PlantWarehouseCards({
  items = [],
  selectedProductId = null,
  onSelectProduct,
  onAdjustProduct,
  canManage = true,
}) {
  if (items.length === 0) {
    return (
      <div className="w-full py-16 text-center bg-white border border-dashed border-[#CBD5E1] rounded-2xl p-8 shadow-2xs">
        <Package size={32} className="mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-semibold text-[#0A4B6E]">No Plant Stock Logged</p>
        <p className="text-xs text-[#475569] mt-1">
          No inventory entries matching current search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) => {
        const pId = item.productId || item.product_id || item.id;
        const isSelected = pId === selectedProductId;
        const pName = item.productName || item.product_name || "LPG Product";
        const cType = item.containerType || item.container_type || "CYLINDER";
        const isCanister = cType === "CANISTER";
        const weight = item.netWeightKg !== undefined ? item.netWeightKg : item.net_weight_kg;

        const qFilled = Number(item.quantityFilled ?? item.quantity_filled ?? 0);
        const qEmpty = Number(item.quantityEmptyGood ?? item.quantity_empty_good ?? 0);
        const qDefect = Number(item.quantityDefective ?? item.quantity_defective ?? 0);
        const totalUnits = qFilled + qEmpty + qDefect;

        const crFilled = isCanister ? Math.floor(qFilled / 24) : null;
        const crEmpty = isCanister ? Math.floor(qEmpty / 24) : null;
        const crDefect = isCanister ? Math.floor(qDefect / 24) : null;

        return (
          <div
            key={pId}
            onClick={() => onSelectProduct && onSelectProduct(item)}
            className={`bg-white rounded-2xl border transition-all duration-150 p-4 flex flex-col justify-between cursor-pointer select-none shadow-2xs ${
              isSelected
                ? "border-2 border-[#0A4B6E] bg-[#E8F3F8]/30 shadow-sm"
                : "border-[#CBD5E1] hover:border-[#0A4B6E]/50 hover:shadow-sm"
            }`}
          >
            <div>
              {/* Product Card Top Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-[#0A4B6E] truncate">{pName}</h3>
                  <p className="text-xs text-[#475569] mt-0.5">
                    {isCanister ? "Butane Canister" : "LPG Cylinder"} · {weight} kg
                  </p>
                </div>

                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isCanister ? "bg-[#E8F3F8] text-[#0A4B6E]" : "bg-[#FFF9D6] text-amber-700"
                  }`}
                >
                  {isCanister ? <Package size={17} /> : <Flame size={17} />}
                </div>
              </div>

              {/* 3 Physical Condition Breakdown Strips */}
              <div className="space-y-2 text-xs">
                {/* Sale-Ready Filled */}
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-950 block">Sale-Ready Filled</span>
                    <span className="text-[10px] text-emerald-800">Ready for trip dispatch</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-900 block">
                      {qFilled.toLocaleString()}
                    </span>
                    {crFilled !== null && (
                      <span className="text-[10px] font-semibold text-emerald-700">
                        {crFilled} {crFilled === 1 ? "crate" : "crates"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Empty Good Returns */}
                <div className="p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#0A4B6E] block">Empty Good Returns</span>
                    <span className="text-[10px] text-[#475569]">Dock refill queue</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#0A4B6E] block">
                      {qEmpty.toLocaleString()}
                    </span>
                    {crEmpty !== null && (
                      <span className="text-[10px] font-semibold text-[#0A4B6E]/70">
                        {crEmpty} {crEmpty === 1 ? "crate" : "crates"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Defective Units */}
                <div className="p-2.5 bg-rose-50/60 border border-rose-200/80 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-rose-950 block">Defective Units</span>
                    <span className="text-[10px] text-rose-800">Damaged / leakers</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold block ${
                        qDefect > 0 ? "text-[#C93B32]" : "text-slate-600"
                      }`}
                    >
                      {qDefect.toLocaleString()}
                    </span>
                    {crDefect !== null && qDefect > 0 && (
                      <span className="text-[10px] font-semibold text-[#C93B32]">
                        {crDefect} {crDefect === 1 ? "crate" : "crates"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer: Total Units & Quick Action Button */}
            <div className="pt-3 mt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-[#475569] uppercase font-semibold block">
                  Total Yard Stock
                </span>
                <span className="font-bold text-slate-900">{totalUnits.toLocaleString()} units</span>
              </div>

              {canManage && (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onAdjustProduct && onAdjustProduct(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#0A4B6E] text-[#FFDF2C] hover:bg-[#0E384E] transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    <SlidersHorizontal size={12} />
                    <span>Adjust Stock</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

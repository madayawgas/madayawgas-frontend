// src/components/items/plant/PlantStockDetailPanel.jsx
import { useState, useEffect, useCallback } from "react";
import {
  RotateCcw,
  AlertOctagon,
  Warehouse,
  History,
  SlidersHorizontal,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { inventoryApi } from "../../../api/inventory.js";
import { formatPhilippineDateTime } from "../../../utils/date.js";

/**
 * PlantStockDetailPanel — Content body rendered inside SideDrawer for Bunawan Yard bulk inventory.
 * Follows CustomerDetailPanel pattern: clean section cards, visual gauge, and live adjustment history.
 */
export default function PlantStockDetailPanel({
  product = null,
  onOpenAdjustment,
  canManage = true,
}) {
  const [adjustments, setAdjustments] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const productId = product?.productId || product?.product_id || product?.id;
  const cType = product?.containerType || product?.container_type || "CYLINDER";
  const isCanister = cType === "CANISTER";

  const qFilled = Number(product?.quantityFilled ?? product?.quantity_filled ?? 0);
  const qEmpty = Number(product?.quantityEmptyGood ?? product?.quantity_empty_good ?? 0);
  const qDefect = Number(product?.quantityDefective ?? product?.quantity_defective ?? 0);
  const totalUnits = qFilled + qEmpty + qDefect;

  const crFilled = isCanister ? Math.floor(qFilled / 24) : null;
  const crEmpty = isCanister ? Math.floor(qEmpty / 24) : null;
  const crDefect = isCanister ? Math.floor(qDefect / 24) : null;

  // Proportional percentages for visual progress bar
  const pctFilled = totalUnits > 0 ? Math.round((qFilled / totalUnits) * 100) : 0;
  const pctEmpty = totalUnits > 0 ? Math.round((qEmpty / totalUnits) * 100) : 0;
  const pctDefect = totalUnits > 0 ? Math.round((qDefect / totalUnits) * 100) : 0;

  // Fetch recent stock adjustments for this product
  const fetchAdjustments = useCallback(async () => {
    if (!productId) return;
    try {
      setIsLoadingHistory(true);
      const list = await inventoryApi.getPlantAdjustments({ productId, limit: 10 });
      setAdjustments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Failed to fetch SKU adjustment history:", err);
      setAdjustments([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  if (!product) return null;

  return (
    <div className="flex flex-col gap-4 text-left font-sans">
      {/* 1. TOTAL INVENTORY & PROGRESS GAUGE */}
      <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl p-4 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#0A4B6E] uppercase tracking-wider">
            Total Yard Stock
          </span>
          <span className="text-base font-bold text-slate-900">
            {totalUnits.toLocaleString()} units
          </span>
        </div>

        {/* Condition Distribution Bar */}
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${pctFilled}%` }}
            title={`Filled: ${pctFilled}%`}
            className="bg-emerald-600 transition-all duration-300"
          />
          <div
            style={{ width: `${pctEmpty}%` }}
            title={`Empty: ${pctEmpty}%`}
            className="bg-[#0A4B6E] transition-all duration-300"
          />
          <div
            style={{ width: `${pctDefect}%` }}
            title={`Defective: ${pctDefect}%`}
            className="bg-[#C93B32] transition-all duration-300"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#475569] pt-1">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Filled: {pctFilled}%</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#0A4B6E]" />
            <span>Empty: {pctEmpty}%</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#C93B32]" />
            <span>Defect: {pctDefect}%</span>
          </span>
        </div>
      </div>

      {/* 2. THREE PHYSICAL CONDITION CARDS */}
      <div className="space-y-2 text-xs">
        {/* Sale-Ready Filled */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Warehouse size={16} className="text-emerald-700 shrink-0" />
            <div>
              <span className="font-bold text-slate-800 block">Sale-Ready (Filled)</span>
              <span className="text-[10px] text-[#475569]">Ready for truck dispatch staging</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="font-bold text-emerald-800 text-sm block">
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
        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <RotateCcw size={16} className="text-[#0A4B6E] shrink-0" />
            <div>
              <span className="font-bold text-slate-800 block">Empty Good (Returns)</span>
              <span className="text-[10px] text-[#475569]">Customer returns ready for refill dock</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="font-bold text-[#0A4B6E] text-sm block">
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
        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertOctagon size={16} className="text-[#C93B32] shrink-0" />
            <div>
              <span className="font-bold text-slate-800 block">Defective Units</span>
              <span className="text-[10px] text-[#475569]">Damaged valves or leaking bodies</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span
              className={`font-bold text-sm block ${
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

      {/* 3. QUICK ACTION BUTTON */}
      {canManage && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onOpenAdjustment && onOpenAdjustment(product)}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-[#0A4B6E] text-[#FFDF2C] hover:bg-[#0E384E] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 uppercase tracking-wider active:scale-95"
          >
            <SlidersHorizontal size={13} strokeWidth={2.5} />
            <span>Adjust Stock for This Product</span>
          </button>
        </div>
      )}

      {/* 4. RECENT STOCK ADJUSTMENT AUDIT LOG */}
      <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#0A4B6E] flex items-center gap-1.5 uppercase tracking-wider">
            <History size={13} />
            <span>Recent Stock Adjustments</span>
          </span>
          <span className="text-[10px] text-[#475569] font-medium">
            {adjustments.length} logged
          </span>
        </div>

        {isLoadingHistory ? (
          <div className="py-4 text-center text-xs text-[#475569]">
            Loading adjustment history...
          </div>
        ) : adjustments.length === 0 ? (
          <div className="py-4 text-center text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
            No recent manual adjustments logged for this item.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
            {adjustments.map((adj) => {
              const delta = Number(adj.delta_quantity ?? adj.deltaQuantity ?? 0);
              const isPositive = delta > 0;
              const targetCond = adj.target_condition || adj.targetCondition || "FILLED";

              return (
                <div
                  key={adj.id}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#0A4B6E]">
                      {targetCond.replace("_", " ")}
                    </span>

                    <span
                      className={`font-mono font-bold text-xs flex items-center gap-0.5 ${
                        isPositive ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      <span>{isPositive ? `+${delta}` : delta}</span>
                    </span>
                  </div>

                  {adj.reason && (
                    <p className="text-[11px] text-slate-700 italic truncate">
                      "{adj.reason}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-200/60">
                    <span>
                      {adj.recorded_by_first_name
                        ? `${adj.recorded_by_first_name} ${adj.recorded_by_last_name || ""}`.trim()
                        : "Supervisor"}
                    </span>
                    <span>
                      {formatPhilippineDateTime(adj.recorded_at || adj.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

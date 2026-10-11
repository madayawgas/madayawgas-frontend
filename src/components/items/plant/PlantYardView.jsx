// src/components/items/plant/PlantYardView.jsx
import { Layers, Download, AlertOctagon, Scale, Package, Flame } from "lucide-react";

export default function PlantYardView({
  plantStock = [],
  onOpenRestock,
  onOpenQuarantine,
  onOpenSuggestedSplit,
  canManage = true,
  canViewSplit = true,
}) {
  const totalFilledUnits = plantStock.reduce(
    (acc, p) => acc + (p.quantityFilled ?? p.quantity_filled ?? 0),
    0
  );
  const totalEmptyUnits = plantStock.reduce(
    (acc, p) => acc + (p.quantityEmptyGood ?? p.quantity_empty_good ?? 0),
    0
  );
  const totalDefectiveUnits = plantStock.reduce(
    (acc, p) => acc + (p.quantityDefective ?? p.quantity_defective ?? 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Top Indicators & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#6D8AA2]/20 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs">
            <Layers size={13} className="text-[#0A4B6E]" />
            <span>Master Bunawan Yard Stock</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>{totalFilledUnits.toLocaleString()} Filled Units</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-[#0A4B6E] border border-blue-200 font-bold text-xs shadow-2xs">
            <span>{totalEmptyUnits.toLocaleString()} Empty Returns</span>
          </span>

          {totalDefectiveUnits > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-[#D93025] border border-rose-200 font-bold text-xs shadow-2xs">
              <span>{totalDefectiveUnits.toLocaleString()} Quarantined</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canViewSplit && (
            <button
              type="button"
              onClick={onOpenSuggestedSplit}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-[#D5E3EC] text-[#0A4B6E] font-bold text-xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs h-[32px]"
            >
              <Scale size={14} />
              <span>Suggested Split</span>
            </button>
          )}

          {canManage && (
            <>
              <button
                type="button"
                onClick={onOpenQuarantine}
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-[#D93025] border border-rose-200 font-bold text-xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs h-[32px]"
              >
                <AlertOctagon size={14} />
                <span>Quarantine Defects</span>
              </button>

              <button
                type="button"
                onClick={onOpenRestock}
                className="flex items-center gap-1.5 bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] font-bold text-xs px-4 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95 h-[32px]"
              >
                <Download size={14} />
                <span>+ Supplier Restock</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Product Stock Cards */}
      {plantStock.length === 0 ? (
        <div className="py-16 text-center bg-[#E8F3F8]/40 border border-dashed border-[#BCE1F1] rounded-2xl p-8">
          <Package size={28} className="mx-auto text-[#0A4B6E] mb-2" />
          <p className="text-[#0A4B6E] font-bold text-sm">No Plant Yard Stock Records Found</p>
          <p className="text-[#6D8AA2] text-xs mt-1">
            Physical inventory is currently loading or no stock is logged at Bunawan yard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plantStock.map((item) => {
            const pId = item.productId || item.product_id || item.id;
            const pName = item.productName || item.product_name || "Product";
            const cType = item.containerType || item.container_type || "CYLINDER";
            const weight = item.netWeightKg !== undefined ? item.netWeightKg : item.net_weight_kg;
            const qFilled = item.quantityFilled ?? item.quantity_filled ?? 0;
            const qEmpty = item.quantityEmptyGood ?? item.quantity_empty_good ?? 0;
            const qDefective = item.quantityDefective ?? item.quantity_defective ?? 0;
            const crFilled =
              item.cratesFilled !== undefined
                ? item.cratesFilled
                : cType === "CANISTER"
                ? Math.floor(qFilled / 24)
                : null;
            const crEmpty =
              item.cratesEmptyGood !== undefined
                ? item.cratesEmptyGood
                : cType === "CANISTER"
                ? Math.floor(qEmpty / 24)
                : null;
            const crDef =
              item.cratesDefective !== undefined
                ? item.cratesDefective
                : cType === "CANISTER"
                ? Math.floor(qDefective / 24)
                : null;

            return (
              <div
                key={pId}
                className="bg-white rounded-2xl border border-[#D5E3EC] p-5 shadow-xs hover:border-[#0A4B6E]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-sm text-[#0A4B6E]">{pName}</h3>
                      <span className="text-[11px] font-semibold text-[#6D8AA2] bg-[#EDF3F7] px-2 py-0.5 rounded-full">
                        {cType} · {weight} kg
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center font-bold">
                      {cType === "CANISTER" ? <Package size={15} /> : <Flame size={15} />}
                    </div>
                  </div>

                  {/* Three-Condition Buckets */}
                  <div className="space-y-2.5">
                    {/* 1. Filled Good Yard Stock */}
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-800 font-black uppercase tracking-wider block">
                          Filled Good Yard Stock
                        </span>
                        <span className="text-[11px] text-emerald-700">Ready for dispatch loading</span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-emerald-900 block">
                          {qFilled.toLocaleString()} Units
                        </span>
                        {crFilled !== null && (
                          <span className="text-[11px] font-bold text-emerald-700">
                            {crFilled} Crates
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 2. Empty Good Canisters */}
                    <div className="p-3 bg-[#E8F3F8]/70 border border-[#BCE1F1] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#0A4B6E] font-black uppercase tracking-wider block">
                          Empty Good Returns
                        </span>
                        <span className="text-[11px] text-[#6D8AA2]">Customer returns for refill</span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-[#0A4B6E] block">
                          {qEmpty.toLocaleString()} Units
                        </span>
                        {crEmpty !== null && (
                          <span className="text-[11px] font-bold text-[#6D8AA2]">
                            {crEmpty} Crates
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 3. Defective Quarantined */}
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-rose-800 font-black uppercase tracking-wider block">
                          Quarantined Defective
                        </span>
                        <span className="text-[11px] text-rose-600">Leakers / damaged valves</span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-rose-900 block">
                          {qDefective.toLocaleString()} Units
                        </span>
                        {crDef !== null && (
                          <span className="text-[11px] font-bold text-rose-700">
                            {crDef} Crates
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Last audit footer */}
                <div className="pt-3 mt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-slate-400">
                  <span>Bunawan Yard Buffer</span>
                  <span>Updated: {item.updatedAt || item.updated_at ? new Date(item.updatedAt || item.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

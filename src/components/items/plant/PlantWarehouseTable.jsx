// src/components/items/plant/PlantWarehouseTable.jsx
import { Package, Flame, SlidersHorizontal, ChevronRight, AlertOctagon } from "lucide-react";
import { formatPhilippineDateShort, formatPhilippineTime } from "../../../utils/date.js";

/**
 * PlantWarehouseTable — Master high-density table for Bunawan Plant Warehouse bulk inventory.
 * Conforms to AGENTS.md Section 3.D: sticky header, independent scroll container, row hover/select states.
 */
export default function PlantWarehouseTable({
  items = [],
  selectedProductId = null,
  onSelectProduct,
  onAdjustProduct,
  canManage = true,
}) {
  return (
    <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-[#CBD5E1] shadow-2xs overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <table className="w-full text-xs text-left border-collapse min-w-[750px]">
          {/* STICKY TABLE HEADER */}
          <thead className="sticky top-0 z-10 select-none">
            <tr className="bg-[#0D4B6E] text-white text-[11px] uppercase tracking-wider font-semibold shadow-xs">
              <th className="py-3 px-4">Product & Specification</th>
              <th className="py-3 px-3 text-center">Sale-Ready (Filled)</th>
              <th className="py-3 px-3 text-center">Empty Good (Returns)</th>
              <th className="py-3 px-3 text-center">Defective Units</th>
              <th className="py-3 px-3 text-center">Total Yard Stock</th>
              <th className="py-3 px-3 text-center">Last Updated</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center text-slate-500">
                  <Package size={30} className="mx-auto text-slate-400 mb-2" />
                  <p className="font-semibold text-slate-700 text-sm">No plant stock items found</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Try adjusting your search query or filter criteria.
                  </p>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const pId = item.productId || item.product_id || item.id;
                const isSelected = pId === selectedProductId;
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

                const lastUpdatedDate = item.lastCountedAt || item.updatedAt || item.updated_at;

                return (
                  <tr
                    key={pId}
                    onClick={() => onSelectProduct && onSelectProduct(item)}
                    className={`transition-colors cursor-pointer select-none ${
                      isSelected
                        ? "bg-[#E2EDF3] text-[#0A4B6E] font-semibold"
                        : "hover:bg-[#F4F9FC]"
                    }`}
                  >
                    {/* Product & Specification */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isCanister ? "bg-[#E8F3F8] text-[#0A4B6E]" : "bg-[#FFF9D6] text-amber-700"
                          }`}
                        >
                          {isCanister ? <Package size={16} /> : <Flame size={16} />}
                        </div>
                        <div>
                          <div className="font-bold text-[#0A4B6E] text-xs">
                            {item.productName || item.product_name}
                          </div>
                          <div className="text-[10px] text-[#475569] flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium text-slate-700">
                              {isCanister ? "Canister" : "Cylinder"}
                            </span>
                            <span>·</span>
                            <span>{weight} kg</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Sale-Ready Filled */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-emerald-800 text-xs block">
                        {qFilled.toLocaleString()}
                      </span>
                      {crFilled !== null && (
                        <span className="text-[10px] font-semibold text-emerald-700 block">
                          {crFilled} {crFilled === 1 ? "crate" : "crates"}
                        </span>
                      )}
                    </td>

                    {/* Empty Good Returns */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-[#0A4B6E] text-xs block">
                        {qEmpty.toLocaleString()}
                      </span>
                      {crEmpty !== null && (
                        <span className="text-[10px] font-semibold text-[#0A4B6E]/70 block">
                          {crEmpty} {crEmpty === 1 ? "crate" : "crates"}
                        </span>
                      )}
                    </td>

                    {/* Defective Units */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-bold text-xs block ${
                          qDefect > 0 ? "text-[#C93B32]" : "text-slate-500"
                        }`}
                      >
                        {qDefect.toLocaleString()}
                      </span>
                      {crDefect !== null && qDefect > 0 && (
                        <span className="text-[10px] font-semibold text-[#C93B32]/80 block">
                          {crDefect} {crDefect === 1 ? "crate" : "crates"}
                        </span>
                      )}
                    </td>

                    {/* Total Yard Units */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-slate-900 text-xs block">
                        {totalUnits.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        units
                      </span>
                    </td>

                    {/* Last Updated */}
                    <td className="py-3 px-3 text-center text-[11px] text-slate-500 whitespace-nowrap">
                      {lastUpdatedDate ? (
                        <div>
                          <div className="font-medium text-slate-700">
                            {formatPhilippineDateShort(lastUpdatedDate)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatPhilippineTime(lastUpdatedDate)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => onAdjustProduct && onAdjustProduct(item)}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E8F3F8] hover:bg-[#0A4B6E] text-[#0A4B6E] hover:text-[#FFDF2C] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Adjust or audit stock balance"
                          >
                            <SlidersHorizontal size={11} />
                            <span>Adjust</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectProduct && onSelectProduct(item)}
                          className="p-1 rounded-full text-slate-400 hover:text-[#0A4B6E] hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View product yard audit details"
                          aria-label={`View details for ${item.productName || item.product_name}`}
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

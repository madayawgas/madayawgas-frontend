// src/components/items/plant/SuggestedSplitModal.jsx
import { useState } from "react";
import { createPortal } from "react-dom";
import { Scale, X, Truck } from "lucide-react";

export default function SuggestedSplitModal({
  isOpen,
  onClose,
  plantStock = [],
}) {
  const [productId, setProductId] = useState(plantStock[0]?.productId || "");
  const [activeTripCount, setActiveTripCount] = useState(3);

  if (!isOpen) return null;

  const selectedItem = plantStock.find((p) => p.productId === productId) || plantStock[0];
  const available = selectedItem?.quantityFilled || 0;
  const count = Math.max(1, Number(activeTripCount) || 1);

  const suggestedUnits = Math.floor(available / count);
  const suggestedCrates = Math.floor(suggestedUnits / 24);
  const remainder = available % count;

  const modalNode = (
    <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-[#D5E3EC] max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center font-bold">
              <Scale size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A4B6E]">Equal Truck Loading Split Helper</h3>
              <p className="text-[11px] text-[#6D8AA2]">Distribute available yard stock across active trucks</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#0A4B6E] mb-1">Select Product Item</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] focus:outline-[#0A4B6E]"
            >
              {plantStock.map((p) => (
                <option key={p.productId} value={p.productId}>
                  {p.productName} ({p.quantityFilled?.toLocaleString()} Units Available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#0A4B6E] mb-1">Active Scheduled Trucks Count</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="20"
                value={activeTripCount}
                onChange={(e) => setActiveTripCount(e.target.value)}
                className="w-24 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs font-bold text-center text-[#0A4B6E]"
              />
              <span className="text-[#6D8AA2] text-[11px]">Trucks deploying today</span>
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-[#EDF3F7] rounded-xl p-4 border border-[#D5E3EC] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D5E3EC]">
              <span className="text-[#486581] font-semibold">Total Stock Available:</span>
              <span className="font-bold text-[#0A4B6E] text-sm">{available.toLocaleString()} Units</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-emerald-800 flex items-center gap-1.5">
                  <Truck size={14} /> Suggested Load per Truck:
                </span>
                <span className="text-base font-black text-emerald-900">
                  {suggestedUnits.toLocaleString()} Units
                </span>
              </div>
              {selectedItem?.containerType === "CANISTER" && (
                <div className="text-[11px] text-emerald-700 font-semibold text-right">
                  ≈ {suggestedCrates} Crates per Truck
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#6D8AA2]">
              <span>Remaining Buffer at Yard:</span>
              <span className="font-bold text-[#0A4B6E]">{remainder} Units</span>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full text-xs font-bold bg-[#0A4B6E] text-white hover:bg-[#0E384E] cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

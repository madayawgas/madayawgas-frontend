// src/components/route-dispatch/MiddayReloadModal.jsx
import { useState } from "react";
import { createPortal } from "react-dom";
import { Layers, X, Plus, Trash2, Truck } from "lucide-react";
import { isCanisterProduct } from "../../utils/product.js";

export default function MiddayReloadModal({
  isOpen,
  onClose,
  trip,
  products = [],
  onAddLoad,
}) {
  const [remarks, setRemarks] = useState("Midday plant reload manifest");
  const [items, setItems] = useState(() => [
    {
      productId: products[0]?.id || "",
      condition: "FILLED",
      quantityUnits: 24,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: products[0]?.id || "",
        condition: "FILLED",
        quantityUnits: 24,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);

      const validLoads = items.filter((i) => Number(i.quantityUnits) > 0);
      if (validLoads.length === 0) {
        throw new Error("Please specify at least one product item with quantity > 0");
      }

      await onAddLoad(trip.id, {
        transferType: "MIDDAY_RELOAD",
        remarks,
        items: validLoads.map((i) => ({
          productId: i.productId,
          condition: i.condition,
          quantityUnits: Number(i.quantityUnits),
        })),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to record reload manifest");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !trip) return null;

  const modalNode = (
    <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-[#D5E3EC] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar animate-scale-in">
        {/* Header with Truck Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Truck size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A4B6E]">Midday Staging Reload</h3>
              <p className="text-[11px] text-[#3E5C76]">
                Vehicle: <strong className="text-[#0A4B6E]">{trip.truckPlate}</strong> · {trip.zoneCode || trip.zoneName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-[#D93025] rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#0A4B6E] mb-1">Transfer Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-slate-800 focus:outline-[#0A4B6E]"
            />
          </div>

          {/* Reload Items Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#0A4B6E]">Reload Line Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[#0A4B6E] hover:text-[#0E384E] font-bold text-[11px] flex items-center gap-1 cursor-pointer bg-white border border-[#CBD5E1] hover:bg-slate-50 px-2.5 py-1 rounded-full shadow-2xs"
              >
                <Plus size={13} strokeWidth={2.5} /> Add Item
              </button>
            </div>

            <div className="space-y-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
              {items.map((item, idx) => {
                const selectedProd =
                  products.find((p) => p.id === item.productId) || products[0];
                const isCanister = isCanisterProduct(selectedProd);
                const crates = Math.floor(Number(item.quantityUnits || 0) / 24);

                return (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                    <div className="flex-1">
                      <label className="sr-only">Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                        aria-label={`Product item ${idx + 1}`}
                        className="w-full bg-white border border-[#CBD5E1] rounded-md p-1.5 text-xs text-[#0A4B6E] font-semibold"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.containerType})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <label className="sr-only">Quantity Units</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantityUnits}
                        onChange={(e) => handleItemChange(idx, "quantityUnits", e.target.value)}
                        aria-label={`Quantity units ${idx + 1}`}
                        placeholder="Units"
                        className="w-full bg-white border border-[#CBD5E1] rounded-md p-1.5 text-xs font-bold text-center text-[#0A4B6E]"
                      />
                    </div>

                    <div className="text-[11px] text-[#3E5C76] font-semibold w-20 text-right shrink-0">
                      {isCanister && crates > 0 ? `${crates} crates` : ""}
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        aria-label={`Remove reload item ${idx + 1}`}
                        className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] transition-all cursor-pointer shadow-2xs uppercase tracking-wider disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? "Recording..." : "Record Reload Manifest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

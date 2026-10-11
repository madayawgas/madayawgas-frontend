// src/components/route-dispatch/MiddayReloadModal.jsx
import { useState } from "react";
import { Layers, X, Plus, Trash2 } from "lucide-react";

export default function MiddayReloadModal({
  isOpen,
  onClose,
  trip,
  products = [],
  onAddLoad,
}) {
  const [remarks, setRemarks] = useState("Midday plant reload manifest");
  const [items, setItems] = useState([
    {
      productId: products[0]?.id || "e9b21f37-142c-4f76-96f3-a3d8b02e7b91",
      condition: "FILLED",
      quantityUnits: 48,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !trip) return null;

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
      await onAddLoad(trip.id, {
        transferType: "DISPATCH_LOAD",
        remarks,
        items: items.map((i) => ({
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

  return (
    <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#D5E3EC] max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center font-bold">
              <Layers size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A4B6E]">Midday Staging Reload</h3>
              <p className="text-[11px] text-[#6D8AA2]">Vehicle: <strong className="text-[#0A4B6E]">{trip.truckPlate}</strong> · {trip.zoneCode || trip.zoneName}</p>
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
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs focus:outline-[#0A4B6E]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#0A4B6E]">Reload Line Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[#0A4B6E] hover:text-[#0E384E] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add Product
              </button>
            </div>

            <div className="space-y-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
              {items.map((item, idx) => {
                const crates = Math.floor(Number(item.quantityUnits || 0) / 24);

                return (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-[#E2E8F0]">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                      className="flex-1 bg-white border border-[#CBD5E1] rounded-md p-1.5 text-xs text-[#0A4B6E] font-medium"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        value={item.quantityUnits}
                        onChange={(e) => handleItemChange(idx, "quantityUnits", e.target.value)}
                        className="w-full bg-white border border-[#CBD5E1] rounded-md p-1.5 text-xs font-bold text-center"
                      />
                    </div>

                    <span className="text-[11px] text-[#6D8AA2] font-semibold w-16 text-right">
                      {crates > 0 ? `${crates} crt` : ""}
                    </span>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-full text-xs font-bold bg-[#0A4B6E] text-white hover:bg-[#0E384E] cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Recording..." : "Record Reload Manifest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

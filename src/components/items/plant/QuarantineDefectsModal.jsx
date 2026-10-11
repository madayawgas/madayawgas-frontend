// src/components/items/plant/QuarantineDefectsModal.jsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertOctagon, X } from "lucide-react";

export default function QuarantineDefectsModal({
  isOpen,
  onClose,
  plantStock = [],
  onQuarantine,
  defaultProductId,
}) {
  const [productId, setProductId] = useState(defaultProductId || plantStock[0]?.productId || "");
  const [sourceCondition, setSourceCondition] = useState("FILLED");
  const [quantityUnits, setQuantityUnits] = useState(10);
  const [reason, setReason] = useState("Damaged valve / leaker identified during yard inspection");

  useEffect(() => {
    if (defaultProductId) {
      setProductId(defaultProductId);
    } else if (plantStock[0]?.productId) {
      setProductId((prev) => prev || plantStock[0].productId);
    }
  }, [defaultProductId, isOpen, plantStock]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);
      await onQuarantine({
        productId: productId || plantStock[0]?.productId,
        sourceCondition,
        quantityUnits: Number(quantityUnits),
        reason,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to quarantine defects");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalNode = (
    <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-[#D5E3EC] max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <AlertOctagon size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A4B6E]">Quarantine Yard Defects</h3>
              <p className="text-[11px] text-[#6D8AA2]">Isolate leakers or defective canisters</p>
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
            <label className="block font-bold text-[#0A4B6E] mb-1">Product Item *</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] focus:outline-[#0A4B6E]"
              required
            >
              {plantStock.map((p) => (
                <option key={p.productId} value={p.productId}>
                  {p.productName} ({p.containerType})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#0A4B6E] mb-1">Source Bucket *</label>
              <select
                value={sourceCondition}
                onChange={(e) => setSourceCondition(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] focus:outline-[#0A4B6E]"
              >
                <option value="FILLED">Filled Yard Stock</option>
                <option value="EMPTY_GOOD">Empty Returns Stock</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#0A4B6E] mb-1">Defective Units *</label>
              <input
                type="number"
                min="1"
                value={quantityUnits}
                onChange={(e) => setQuantityUnits(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-rose-300 rounded-xl p-2.5 text-xs font-bold text-rose-700 focus:outline-rose-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#0A4B6E] mb-1">Defect Reason / Inspection Finding</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs focus:outline-[#0A4B6E]"
              required
            />
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
              className="px-5 py-2 rounded-full text-xs font-bold bg-[#D93025] text-white hover:bg-rose-700 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Quarantining..." : "Move to Defective Bucket ➔"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

// src/components/items/plant/SupplierRestockModal.jsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, X } from "lucide-react";

export default function SupplierRestockModal({
  isOpen,
  onClose,
  plantStock = [],
  onRestock,
  defaultProductId,
}) {
  const initialId = defaultProductId || plantStock[0]?.productId || plantStock[0]?.id || "";
  const [productId, setProductId] = useState(initialId);
  const [quantityUnits, setQuantityUnits] = useState(2400);
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("INV-SUP-2026-001");
  const [reason, setReason] = useState("Direct factory delivery from manufacturer");

  useEffect(() => {
    if (defaultProductId) {
      setProductId(defaultProductId);
    } else if (plantStock.length > 0) {
      const firstId = plantStock[0]?.productId || plantStock[0]?.id || "";
      setProductId((prev) => prev || firstId);
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
      await onRestock({
        productId: productId || plantStock[0]?.productId || plantStock[0]?.id,
        condition: "FILLED",
        quantityUnits: Number(quantityUnits),
        supplierInvoiceNumber,
        reason,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to record supplier restock");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedItem =
    plantStock.find((p) => (p.productId || p.id) === productId) || plantStock[0];
  const crates = Math.floor(Number(quantityUnits || 0) / 24);

  const modalNode = (
    <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-[#D5E3EC] max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <Download size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A4B6E]">Supplier Bulk Restock</h3>
              <p className="text-[11px] text-[#6D8AA2]">Stock-in shipment directly to Bunawan Yard</p>
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
              {plantStock.map((p) => {
                const pId = p.productId || p.id;
                const pName = p.productName || p.name;
                return (
                  <option key={pId} value={pId}>
                    {pName} ({p.containerType})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#0A4B6E] mb-1">Quantity (Units) *</label>
              <input
                type="number"
                min="1"
                value={quantityUnits}
                onChange={(e) => setQuantityUnits(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs font-bold text-[#0A4B6E] focus:outline-[#0A4B6E]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#0A4B6E] mb-1">Equivalent Crates</label>
              <div className="p-2.5 bg-[#EDF3F7] rounded-xl text-xs font-bold text-[#0A4B6E] flex items-center justify-center">
                {selectedItem?.containerType === "CANISTER" ? `${crates} Crates` : "N/A (Cylinder)"}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#0A4B6E] mb-1">Supplier Invoice Number</label>
            <input
              type="text"
              value={supplierInvoiceNumber}
              onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-SUP-2026-100"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs focus:outline-[#0A4B6E]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#0A4B6E] mb-1">Restock Reason / Source</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs focus:outline-[#0A4B6E]"
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
              className="px-5 py-2 rounded-full text-xs font-bold bg-[#0A4B6E] text-[#FFDF2C] hover:bg-[#0E384E] cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Restocking..." : "Record Bulk Restock ➔"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

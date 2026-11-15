// src/components/sales/VerifyPaymentModal.jsx
import { useState } from "react";
import { ShieldCheck, ExternalLink, CreditCard, AlertCircle } from "lucide-react";
import { salesApi } from "../../api/sales.js";
import { resolveMediaUrl } from "../../utils/media.js";
import Modal from "../ui/Modal";
import DocumentViewerModal from "../ui/DocumentViewerModal";

/**
 * Proof-aware payment verification modal.
 * Displays GCash reference number and inline receipt proof preview so supervisors
 * never verify settlements blindly.
 */
export default function VerifyPaymentModal({
  invoice,
  isOpen,
  onClose,
  onVerified,
}) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [enlargeProof, setEnlargeProof] = useState(false);

  if (!isOpen || !invoice) return null;

  const invoiceNumber =
    invoice.invoice_number || invoice.invoiceNumber || "Invoice";
  const customerName =
    invoice.customer_name || invoice.customerName || "Customer on File";
  const totalAmount = Number(invoice.total_amount || invoice.totalAmount || 0);
  const refNum =
    invoice.payment_reference_number || invoice.paymentReferenceNumber || "";
  const proofTarget =
    invoice.payment_proof_url ||
    invoice.paymentProofUrl ||
    invoice.payment_proof_key ||
    invoice.paymentProofKey ||
    "";
  const resolvedProofUrl = proofTarget ? resolveMediaUrl(proofTarget) : null;

  const handleConfirm = async () => {
    try {
      setIsVerifying(true);
      setError("");
      const updated = await salesApi.verifyInvoice(invoice.id);
      if (onVerified) onVerified(updated);
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to verify payment. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Verify GCash Payment"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4 text-xs">
          {/* Summary */}
          <div className="bg-[#F8FBFC] border border-[#BCE1F1]/70 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[#6D8AA2] font-medium">Invoice</span>
              <span className="font-bold text-[#0A4B6E]">{invoiceNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6D8AA2] font-medium">Customer</span>
              <span className="font-semibold text-slate-800">{customerName}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-[#6D8AA2] font-medium">Amount Remitted</span>
              <span className="text-base font-bold text-[#0A4B6E] tabular-nums">
                ₱{totalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* GCash Reference & Proof Preview */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0A4B6E] flex items-center gap-1.5">
                <CreditCard size={14} className="text-[#0F7AB2]" />
                <span>GCash Reference No.</span>
              </span>
              <span className="font-mono font-bold text-slate-900">
                {refNum || "Not provided"}
              </span>
            </div>

            {resolvedProofUrl ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setEnlargeProof(true)}
                  className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50 h-40 w-full flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4B6E]"
                >
                  <img
                    src={resolvedProofUrl}
                    alt={`GCash receipt proof for ${invoiceNumber}`}
                    className="max-h-full max-w-full object-contain"
                  />
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0A4B6E]/90 text-white text-xs font-semibold shadow-sm">
                    <ExternalLink size={12} />
                    <span>Enlarge</span>
                  </span>
                </button>
              </div>
            ) : (
              <div className="py-4 px-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-800 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>No receipt screenshot uploaded for this invoice.</span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[#C93B32] font-medium">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isVerifying}
              className="px-4 py-2 rounded-full text-xs font-bold text-[#0A4B6E] hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isVerifying}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] text-xs font-bold uppercase tracking-wider shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck size={14} />
              <span>{isVerifying ? "Verifying..." : "Confirm Verification"}</span>
            </button>
          </div>
        </div>
      </Modal>

      {enlargeProof && proofTarget && (
        <DocumentViewerModal
          isOpen={enlargeProof}
          onClose={() => setEnlargeProof(false)}
          item={proofTarget}
          storageKey={proofTarget}
          title={`Payment Receipt — ${invoiceNumber}`}
        />
      )}
    </>
  );
}

// src/components/sales/TransactionDetailDrawer.jsx
import { useEffect, useState } from "react";
import {
  X,
  Receipt,
  User,
  MapPin,
  Calendar,
  Banknote,
  CreditCard,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { salesApi } from "../../api/sales.js";
import { formatPhilippineDateTime } from "../../utils/date.js";
import DocumentViewerModal from "../ui/DocumentViewerModal";

export default function TransactionDetailDrawer({
  transaction,
  onClose,
  isClosing = false,
}) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProofKey, setSelectedProofKey] = useState(null);

  useEffect(() => {
    if (!transaction?.id) return;
    let isMounted = true;
    setIsLoading(true);

    salesApi
      .getTransactionById(transaction.id)
      .then((data) => {
        if (isMounted) setDetails(data);
      })
      .catch((err) => {
        console.error("Failed to load transaction details:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [transaction?.id]);

  if (!transaction) return null;

  const tx = details || transaction;
  const items = tx.items || [];
  const invoice = tx.invoice || null;
  const isCancelled = (tx.status || "").toUpperCase() === "CANCELLED";

  return (
    <>
      <div
        className={`w-full lg:w-[450px] xl:w-[490px] shrink-0 h-full flex flex-col bg-white border-l border-[#BCE1F1]/60 shadow-xl z-20 ${
          isClosing ? "animate-slide-fade-out" : "animate-slide-fade-in"
        }`}
      >
        {/* Top Header */}
        <div className="shrink-0 p-4 border-b border-slate-200 flex items-center justify-between bg-[#F8FBFC]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D8AA2]">
              Sales Transaction Record
            </span>
            <h2 className="text-base font-bold text-[#0A4B6E] flex items-center gap-2">
              <span>{tx.transaction_no || tx.transactionNo}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isCancelled
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}
              >
                {tx.status}
              </span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4 text-xs">
          {/* 1. Timestamps & Agent Attribution */}
          <div className="bg-[#E8F3F8]/40 p-3 rounded-xl border border-[#BCE1F1]/50 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#6D8AA2]">Wall-Clock Transacted:</span>
              <span className="font-semibold text-slate-800">
                {formatPhilippineDateTime(tx.transacted_at || tx.transactedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#6D8AA2]">Server Sync Ingest:</span>
              <span className="font-semibold text-slate-800">
                {formatPhilippineDateTime(tx.synced_at || tx.syncedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#BCE1F1]/40">
              <span className="text-[#6D8AA2]">Recorded By Sales Agent:</span>
              <span className="font-semibold text-[#0A4B6E]">
                {tx.recorded_by_name || tx.recordedByName || tx.recorded_by_username || "Sales Agent"}
              </span>
            </div>
          </div>

          {/* 2. Customer Profile Section */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D8AA2]">
              Customer Information
            </span>
            <div className="text-sm font-bold text-[#0A4B6E]">
              {tx.customer_name || tx.customerName || "Customer"}
            </div>
            {tx.customer_business_name && (
              <div className="text-[11px] font-semibold text-slate-700">
                {tx.customer_business_name}
              </div>
            )}
            <div className="text-[11px] text-slate-600 flex items-start gap-1.5 mt-1">
              <MapPin size={12} className="shrink-0 mt-0.5 text-[#6D8AA2]" />
              <span>{tx.customer_delivery_address || tx.customer_address || "Delivery Address on File"}</span>
            </div>
            {tx.customer_contact_number && (
              <div className="text-[11px] text-slate-600 mt-0.5">
                Contact: <span className="font-semibold text-slate-800">{tx.customer_contact_number}</span>
              </div>
            )}
          </div>

          {/* 3. Itemized Order Lines */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D8AA2]">
                Order Items ({items.length})
              </span>
            </div>

            {isLoading ? (
              <div className="py-6 text-center text-slate-400">Loading order items...</div>
            ) : items.length === 0 ? (
              <div className="py-4 text-center text-slate-400">Zero-sale pickup stop (no products sold)</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#E8F3F8]/50 text-[#0A4B6E] font-bold border-b border-[#BCE1F1]">
                    <tr>
                      <th className="py-1.5 px-2">SKU</th>
                      <th className="py-1.5 px-2 text-right">Sold</th>
                      <th className="py-1.5 px-2 text-right">Unit Price</th>
                      <th className="py-1.5 px-2 text-right">Subtotal</th>
                      <th className="py-1.5 px-2 text-right">Empties</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-2 font-medium text-slate-800">
                          {item.product_name || item.productName}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-slate-700">
                          {item.quantity_sold || item.quantitySold}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-600">
                          ₱{Number(item.unit_price_at_sale || item.unitPriceAtSale || 0).toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-[#0A4B6E]">
                          ₱{Number(item.subtotal_amount || item.subtotalAmount || 0).toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-right text-emerald-700 font-semibold">
                          {item.empties_returned || item.emptiesReturned || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 4. Payment Settlement & Invoice Card */}
          {invoice && (
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D8AA2]">
                Payment Settlement & Invoice
              </span>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#6D8AA2] block">Invoice Series</span>
                  <span className="font-bold text-slate-800">{invoice.invoice_number || invoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-[#6D8AA2] block">Declaration Slip</span>
                  <span className="font-semibold text-slate-800">{invoice.declaration_number || invoice.declarationNumber || "N/A"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-600">Total Invoice Amount:</span>
                <span className="text-base font-bold text-[#0A4B6E]">
                  ₱{Number(invoice.total_amount || invoice.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#6D8AA2]">Payment Method:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  {invoice.payment_method === "CASH" ? (
                    <>
                      <Banknote size={13} className="text-emerald-600" />
                      <span>Cash on Delivery</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={13} className="text-sky-600" />
                      <span>GCash Transfer</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#6D8AA2]">Payment Status:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    invoice.payment_status === "VERIFIED"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {invoice.payment_status}
                </span>
              </div>

              {invoice.payment_reference_number && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#6D8AA2]">GCash Reference No:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {invoice.payment_reference_number}
                  </span>
                </div>
              )}

              {invoice.payment_proof_key && (
                <button
                  type="button"
                  onClick={() => setSelectedProofKey(invoice.payment_proof_key)}
                  className="mt-1 text-xs text-[#0F7AB2] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ExternalLink size={12} />
                  <span>View Uploaded Payment Receipt Proof</span>
                </button>
              )}
            </div>
          )}

          {/* 5. Cancellation Audit Trail (if cancelled) */}
          {isCancelled && (
            <div className="border border-rose-200 rounded-xl p-3.5 bg-rose-50/50 flex flex-col gap-1 text-[11px]">
              <span className="font-bold text-rose-800 flex items-center gap-1">
                <AlertTriangle size={13} />
                <span>Voided / Cancelled Transaction</span>
              </span>
              <p className="text-rose-900 mt-1">
                Reason: {tx.cancellation_reason || tx.cancellationReason || "No cancellation reason recorded."}
              </p>
              {tx.cancelled_by_name && (
                <span className="text-rose-700 text-[10px]">
                  Voided by {tx.cancelled_by_name} on {formatPhilippineDateTime(tx.cancelled_at)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pinned Bottom Close Button */}
        <div className="shrink-0 p-4 border-t border-slate-200 bg-[#F8FBFC]">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider py-2.5 rounded-full shadow-2xs transition-all cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>

      {/* Proof Modal */}
      {selectedProofKey && (
        <DocumentViewerModal
          isOpen={Boolean(selectedProofKey)}
          onClose={() => setSelectedProofKey(null)}
          item={selectedProofKey}
          storageKey={selectedProofKey}
          title="Payment Receipt Screenshot"
        />
      )}
    </>
  );
}

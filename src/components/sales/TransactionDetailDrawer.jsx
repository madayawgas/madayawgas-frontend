// src/components/sales/TransactionDetailDrawer.jsx
import { useEffect, useState } from "react";
import {
  Receipt,
  MapPin,
  Banknote,
  CreditCard,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { salesApi } from "../../api/sales.js";
import { formatPhilippineDateTime } from "../../utils/date.js";
import SideDrawer from "../ui/SideDrawer";
import Badge from "../ui/Badge";
import InfoTooltip from "../ui/InfoTooltip";
import DocumentViewerModal from "../ui/DocumentViewerModal";

const ORDER_STATUS_META = {
  COMPLETED: { label: "Completed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
};

export default function TransactionDetailDrawer({
  transaction,
  isOpen = false,
  onClose,
  canVerify = false,
  onRequestVerify,
  refreshKey = 0,
}) {
  const [detailsState, setDetailsState] = useState({
    id: null,
    data: null,
    refreshKey: 0,
  });
  const [loadedId, setLoadedId] = useState(null);
  const [selectedProofKey, setSelectedProofKey] = useState(null);

  useEffect(() => {
    if (!isOpen || !transaction?.id) return;
    let isMounted = true;
    const targetId = transaction.id;

    salesApi
      .getTransactionById(targetId)
      .then((data) => {
        if (isMounted) setDetailsState({ id: targetId, data, refreshKey });
      })
      .catch((err) => {
        console.error("Failed to load transaction details:", err);
      })
      .finally(() => {
        if (isMounted) setLoadedId(targetId);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, transaction?.id, refreshKey]);

  const details =
    detailsState.id === transaction?.id ? detailsState.data : null;
  const isLoading = Boolean(isOpen && transaction?.id && loadedId !== transaction.id);

  const isOptimisticallyVerified =
    details &&
    detailsState.refreshKey !== refreshKey &&
    (
      transaction?.payment_status ||
      transaction?.paymentStatus ||
      ""
    ).toUpperCase() === "VERIFIED";

  const baseTx = details || transaction || {};
  const tx = isOptimisticallyVerified
    ? {
        ...baseTx,
        payment_status: "VERIFIED",
        paymentStatus: "VERIFIED",
        ...(baseTx.invoice
          ? {
              invoice: {
                ...baseTx.invoice,
                payment_status: "VERIFIED",
                paymentStatus: "VERIFIED",
              },
            }
          : {}),
      }
    : baseTx;
  const items = tx.items || [];
  const invoice = tx.invoice || null;
  const orderStatus = (
    tx.status ||
    tx.order_status ||
    tx.orderStatus ||
    transaction?.status ||
    "COMPLETED"
  ).toUpperCase();
  const isCancelled = orderStatus === "CANCELLED";

  const payMethod = (
    invoice?.payment_method ||
    invoice?.paymentMethod ||
    tx.payment_method ||
    tx.paymentMethod ||
    "CASH"
  ).toUpperCase();
  const invoicePaymentStatus = (
    invoice?.payment_status ||
    invoice?.paymentStatus ||
    tx.payment_status ||
    tx.paymentStatus ||
    ""
  ).toUpperCase();
  const isUnverifiedGcash =
    payMethod === "GCASH" && invoicePaymentStatus === "PAID_UNVERIFIED";

  const headerBadge = isCancelled
    ? ORDER_STATUS_META.CANCELLED
    : isUnverifiedGcash
    ? { label: "Pending Review", variant: "warning" }
    : ORDER_STATUS_META[orderStatus] || {
        label: orderStatus.replace(/_/g, " "),
        variant: "neutral",
      };

  const paymentBadge = headerBadge;

  const proofTarget =
    invoice?.payment_proof_url ||
    invoice?.paymentProofUrl ||
    invoice?.payment_proof_key ||
    invoice?.paymentProofKey ||
    null;

  const footer = (
    <div className="flex items-center gap-2.5">
      {isUnverifiedGcash && canVerify && typeof onRequestVerify === "function" && (
        <button
          type="button"
          onClick={() =>
            onRequestVerify({
              ...invoice,
              customer_name: tx.customer_name || tx.customerName,
            })
          }
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#0A4B6E] hover:bg-[#083b57] text-[#FFDF2C] font-bold text-xs uppercase tracking-wider py-2.5 rounded-full shadow-2xs transition-all cursor-pointer"
        >
          <ShieldCheck size={14} />
          <span>Verify GCash</span>
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="flex-1 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider py-2.5 rounded-full shadow-2xs transition-all cursor-pointer"
      >
        Close
      </button>
    </div>
  );

  return (
    <>
      <SideDrawer
        isOpen={isOpen && Boolean(transaction)}
        onClose={onClose}
        title={tx.transaction_no || tx.transactionNo || "Transaction Details"}
        subtitle={
          tx.recorded_by_name || tx.recordedByName
            ? `Recorded by ${tx.recorded_by_name || tx.recordedByName}`
            : "Sales Transaction Record"
        }
        icon={Receipt}
        badge={<Badge variant={headerBadge.variant}>{headerBadge.label}</Badge>}
        footer={footer}
        width="max-w-md sm:max-w-lg"
      >
        <div className="flex flex-col gap-4 text-xs">
          {/* 1. Timestamps */}
          <div className="bg-[#E8F3F8]/40 p-3.5 rounded-xl border border-[#BCE1F1]/60 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[#6D8AA2] font-medium flex items-center gap-1">
                <span>Transacted</span>
                <InfoTooltip
                  align="left"
                  position="bottom"
                  text="Device time recorded when the mobile crew completed the stop (even if offline)."
                  label="About transacted time"
                />
              </span>
              <span className="font-semibold text-slate-800">
                {formatPhilippineDateTime(tx.transacted_at || tx.transactedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6D8AA2] font-medium flex items-center gap-1">
                <span>Synced</span>
                <InfoTooltip
                  align="left"
                  position="bottom"
                  text="Server timestamp when the field device uploaded this record to the plant database."
                  label="About sync time"
                />
              </span>
              <span className="font-semibold text-slate-800">
                {formatPhilippineDateTime(tx.synced_at || tx.syncedAt)}
              </span>
            </div>
          </div>

          {/* 2. Customer Profile */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[#6D8AA2]">Customer</span>
            <div className="text-sm font-bold text-[#0A4B6E]">
              {tx.customer_name || tx.customerName || "Customer"}
            </div>
            {tx.customer_business_name && (
              <div className="text-xs font-semibold text-slate-700">
                {tx.customer_business_name}
              </div>
            )}
            <div className="text-xs text-slate-600 flex items-start gap-1.5 mt-0.5">
              <MapPin size={13} className="shrink-0 mt-0.5 text-[#6D8AA2]" />
              <span>
                {tx.customer_delivery_address ||
                  tx.customer_address ||
                  "Delivery address on file"}
              </span>
            </div>
            {tx.customer_contact_number && (
              <div className="text-xs text-slate-600">
                Contact:{" "}
                <span className="font-semibold text-slate-800">
                  {tx.customer_contact_number}
                </span>
              </div>
            )}
          </div>

          {/* 3. Itemized Order Lines */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white flex flex-col gap-2">
            <span className="text-xs font-bold text-[#0A4B6E]">
              Order Items ({items.length})
            </span>

            {isLoading ? (
              <div className="py-6 text-center text-slate-500">
                Loading order items...
              </div>
            ) : items.length === 0 ? (
              <div className="py-4 text-center text-slate-500">
                Zero-sale pickup stop (no products sold)
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#E8F3F8]/50 text-[#0A4B6E] font-bold border-b border-[#BCE1F1]">
                    <tr>
                      <th className="py-2 px-2">Product</th>
                      <th className="py-2 px-2 text-right">Sold</th>
                      <th className="py-2 px-2 text-right">Price</th>
                      <th className="py-2 px-2 text-right">Subtotal</th>
                      <th className="py-2 px-2 text-right">Empties</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-2 font-medium text-slate-800">
                          {item.product_name || item.productName}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-slate-700 tabular-nums">
                          {item.quantity_sold || item.quantitySold}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-600 tabular-nums">
                          ₱
                          {Number(
                            item.unit_price_at_sale || item.unitPriceAtSale || 0
                          ).toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-[#0A4B6E] tabular-nums">
                          ₱
                          {Number(
                            item.subtotal_amount || item.subtotalAmount || 0
                          ).toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-right text-emerald-700 font-semibold tabular-nums">
                          {item.empties_returned || item.emptiesReturned || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 4. Payment Settlement & Invoice */}
          {invoice && (
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white flex flex-col gap-2.5">
              <span className="text-xs font-bold text-[#0A4B6E]">
                Invoice & Payment
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#6D8AA2] block">Invoice No.</span>
                  <span className="font-bold text-slate-800">
                    {invoice.invoice_number || invoice.invoiceNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[#6D8AA2] flex items-center gap-1">
                    <span>Declaration Slip</span>
                    <InfoTooltip
                      align="right"
                      text="Field paper receipt or trip declaration number issued on delivery."
                      label="About declaration slip"
                    />
                  </span>
                  <span className="font-semibold text-slate-800">
                    {invoice.declaration_number ||
                      invoice.declarationNumber ||
                      "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-600">Total Amount</span>
                <span className="text-base font-bold text-[#0A4B6E] tabular-nums">
                  ₱
                  {Number(
                    invoice.total_amount || invoice.totalAmount || 0
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#6D8AA2]">Method</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  {(invoice.payment_method || invoice.paymentMethod) === "CASH" ? (
                    <>
                      <Banknote size={14} className="text-emerald-600" />
                      <span>Cash on Delivery</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={14} className="text-[#0F7AB2]" />
                      <span>GCash Transfer</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#6D8AA2]">Verification</span>
                <Badge variant={paymentBadge.variant}>
                  {paymentBadge.label}
                </Badge>
              </div>

              {(invoice.payment_reference_number ||
                invoice.paymentReferenceNumber) && (
                <div className="flex items-center justify-between">
                  <span className="text-[#6D8AA2]">GCash Reference</span>
                  <span className="font-mono font-bold text-slate-800">
                    {invoice.payment_reference_number ||
                      invoice.paymentReferenceNumber}
                  </span>
                </div>
              )}

              {proofTarget && (
                <button
                  type="button"
                  onClick={() => setSelectedProofKey(proofTarget)}
                  className="mt-1 text-xs text-[#0F7AB2] hover:underline flex items-center gap-1.5 font-semibold cursor-pointer"
                >
                  <ExternalLink size={13} />
                  <span>View Receipt Screenshot</span>
                </button>
              )}
            </div>
          )}

          {/* 5. Cancellation Audit Trail */}
          {isCancelled && (
            <div className="border border-rose-200 rounded-xl p-3.5 bg-rose-50/60 flex flex-col gap-1">
              <span className="font-bold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle size={14} />
                <span>Cancelled Transaction</span>
              </span>
              <p className="text-rose-900 mt-1">
                {tx.cancellation_reason ||
                  tx.cancellationReason ||
                  "No cancellation reason recorded."}
              </p>
              {tx.cancelled_by_name && (
                <span className="text-rose-700">
                  Voided by {tx.cancelled_by_name} on{" "}
                  {formatPhilippineDateTime(tx.cancelled_at)}
                </span>
              )}
            </div>
          )}
        </div>
      </SideDrawer>

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

// src/components/sales/InvoicesTab.jsx
import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  FileCheck2,
  CheckCircle2,
  Clock,
  Banknote,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { salesApi } from "../../api/sales.js";
import { formatPhilippineDateTime, formatPhilippineDate } from "../../utils/date.js";
import Pagination from "../ui/Pagination";
import Modal from "../ui/Modal";
import DocumentViewerModal from "../ui/DocumentViewerModal";

export default function InvoicesTab({
  invoices = [],
  isLoading = false,
  searchTerm = "",
  onSearchChange,
  paymentMethodFilter = "",
  onPaymentMethodChange,
  statusFilter = "",
  onStatusChange,
  canVerify = false,
  onInvoiceVerified,
}) {
  const [selectedProofKey, setSelectedProofKey] = useState(null);
  const [invoiceToVerify, setInvoiceToVerify] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filter invoices locally
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        !searchTerm ||
        (inv.invoice_number || inv.invoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.declaration_number || inv.declarationNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.payment_reference_number || inv.paymentReferenceNumber || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchMethod =
        !paymentMethodFilter ||
        (inv.payment_method || inv.paymentMethod || "").toUpperCase() === paymentMethodFilter.toUpperCase();

      const matchStatus =
        !statusFilter ||
        (inv.payment_status || inv.paymentStatus || "").toUpperCase() === statusFilter.toUpperCase();

      return matchSearch && matchMethod && matchStatus;
    });
  }, [invoices, searchTerm, paymentMethodFilter, statusFilter]);

  const totalPages = Math.ceil(filteredInvoices.length / limit) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredInvoices.slice(start, start + limit);
  }, [filteredInvoices, page, limit]);

  const handleConfirmVerify = async () => {
    if (!invoiceToVerify) return;
    try {
      setIsVerifying(true);
      setVerifyError("");
      const updated = await salesApi.verifyInvoice(invoiceToVerify.id);
      if (onInvoiceVerified) onInvoiceVerified(updated);
      setInvoiceToVerify(null);
    } catch (err) {
      setVerifyError(err.message || "Failed to verify invoice payment.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
      {/* Controls Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice #, declaration #, or reference #..."
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-slate-300 rounded-full focus:outline-none focus:border-[#0A4B6E] focus:ring-1 focus:ring-[#0A4B6E] transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-[#6D8AA2]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                onStatusChange(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-white border border-slate-300 rounded-full px-3 py-1 font-semibold text-[#0A4B6E] focus:outline-none focus:border-[#0A4B6E] cursor-pointer"
            >
              <option value="">All Verification States</option>
              <option value="PAID_UNVERIFIED">Pending Review (Unverified)</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-[#6D8AA2]">Method:</span>
            <select
              value={paymentMethodFilter}
              onChange={(e) => {
                onPaymentMethodChange(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-white border border-slate-300 rounded-full px-3 py-1 font-semibold text-[#0A4B6E] focus:outline-none focus:border-[#0A4B6E] cursor-pointer"
            >
              <option value="">All Methods</option>
              <option value="CASH">Cash on Delivery</option>
              <option value="GCASH">GCash Transfer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden border border-[#0A4B6E]/15 rounded-2xl bg-white shadow-xs">
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#E8F3F8]/70 text-[#0A4B6E] font-bold sticky top-0 z-10 border-b border-[#0A4B6E]/15 backdrop-blur-xs select-none">
              <tr>
                <th className="py-3 px-3.5 whitespace-nowrap">Invoice & Declaration</th>
                <th className="py-3 px-3 whitespace-nowrap">Transacted Date</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Total Amount</th>
                <th className="py-3 px-3 whitespace-nowrap">Payment Method</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-3 whitespace-nowrap">Proof / Reference</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap">Supervisor Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading sales invoices...
                  </td>
                </tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No sales invoices found matching criteria
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => {
                  const method = (inv.payment_method || inv.paymentMethod || "CASH").toUpperCase();
                  const status = (inv.payment_status || inv.paymentStatus || "PAID_UNVERIFIED").toUpperCase();
                  const isVerified = status === "VERIFIED";
                  const totalAmount = Number(inv.total_amount || inv.totalAmount || 0);
                  const proofKey = inv.payment_proof_key || inv.paymentProofKey;
                  const refNum = inv.payment_reference_number || inv.paymentReferenceNumber;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Invoice & Declaration Series */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-[#0A4B6E]">
                          {inv.invoice_number || inv.invoiceNumber}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Decl: {inv.declaration_number || inv.declarationNumber || "N/A"}
                        </div>
                      </td>

                      {/* Transacted Date */}
                      <td className="py-2.5 px-3 text-slate-600">
                        {formatPhilippineDateTime(inv.transacted_at || inv.transactedAt)}
                      </td>

                      {/* Total Amount */}
                      <td className="py-2.5 px-3 text-right font-bold text-[#0A4B6E]">
                        ₱{totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Payment Method */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {method === "CASH" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                              <Banknote size={11} />
                              <span>CASH</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 text-[10px] font-bold border border-sky-200">
                              <CreditCard size={11} />
                              <span>GCASH</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isVerified
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      {/* Proof / Reference */}
                      <td className="py-2.5 px-3">
                        {refNum && (
                          <div className="font-mono text-[11px] text-slate-700">
                            Ref: {refNum}
                          </div>
                        )}
                        {proofKey ? (
                          <button
                            type="button"
                            onClick={() => setSelectedProofKey(proofKey)}
                            className="text-[10px] text-[#0F7AB2] hover:underline flex items-center gap-1 font-semibold cursor-pointer mt-0.5"
                          >
                            <ExternalLink size={11} />
                            <span>View Proof</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">No screenshot</span>
                        )}
                      </td>

                      {/* Supervisor Action */}
                      <td className="py-2.5 px-3.5 text-center">
                        {!isVerified && canVerify ? (
                          <button
                            type="button"
                            onClick={() => setInvoiceToVerify(inv)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0A4B6E] hover:bg-[#073650] text-[#FFDF2C] text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            <ShieldCheck size={12} />
                            <span>Verify Payment</span>
                          </button>
                        ) : isVerified ? (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                            <CheckCircle2 size={13} />
                            <span>Confirmed</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredInvoices.length}
          limit={limit}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      </div>

      {/* Verification Confirmation Modal */}
      {invoiceToVerify && (
        <Modal
          isOpen={Boolean(invoiceToVerify)}
          onClose={() => setInvoiceToVerify(null)}
          title="Confirm Payment Verification"
        >
          <div className="flex flex-col gap-3 text-xs">
            <p className="text-slate-600">
              Are you sure you want to verify the settlement for invoice{" "}
              <strong className="text-[#0A4B6E]">
                {invoiceToVerify.invoice_number || invoiceToVerify.invoiceNumber}
              </strong>{" "}
              amounting to{" "}
              <strong className="text-emerald-700">
                ₱{Number(invoiceToVerify.total_amount || invoiceToVerify.totalAmount || 0).toFixed(2)}
              </strong>
              ?
            </p>

            {verifyError && (
              <p className="text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg">
                {verifyError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setInvoiceToVerify(null)}
                className="px-4 py-1.5 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVerify}
                disabled={isVerifying}
                className="px-4 py-1.5 rounded-full bg-[#0A4B6E] hover:bg-[#073650] text-[#FFDF2C] font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isVerifying ? "Verifying..." : "Confirm Verification"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Proof Modal */}
      {selectedProofKey && (
        <DocumentViewerModal
          isOpen={Boolean(selectedProofKey)}
          onClose={() => setSelectedProofKey(null)}
          item={selectedProofKey}
          storageKey={selectedProofKey}
          title="Payment Proof Attachment"
        />
      )}
    </div>
  );
}

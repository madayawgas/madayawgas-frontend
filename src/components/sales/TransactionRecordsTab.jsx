// src/components/sales/TransactionRecordsTab.jsx
import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Receipt,
  Calendar,
  Banknote,
  CreditCard,
  ChevronRight,
  X,
} from "lucide-react";
import { formatPhilippineDateTime, formatPhilippineDate } from "../../utils/date.js";
import Pagination from "../ui/Pagination";
import TransactionDetailDrawer from "./TransactionDetailDrawer";

export default function TransactionRecordsTab({
  transactions = [],
  isLoading = false,
  searchTerm = "",
  onSearchChange,
  statusFilter = "",
  onStatusChange,
  paymentMethodFilter = "",
  onPaymentMethodChange,
}) {
  const [selectedTx, setSelectedTx] = useState(null);
  const [isClosingDrawer, setIsClosingDrawer] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        !searchTerm ||
        (tx.transaction_no || tx.transactionNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.invoice_number || tx.invoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.customer_name || tx.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.customer_business_name || tx.customerBusinessName || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        !statusFilter ||
        (tx.status || "").toUpperCase() === statusFilter.toUpperCase();

      const matchPayment =
        !paymentMethodFilter ||
        (tx.payment_method || tx.paymentMethod || "").toUpperCase() === paymentMethodFilter.toUpperCase();

      return matchSearch && matchStatus && matchPayment;
    });
  }, [transactions, searchTerm, statusFilter, paymentMethodFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / limit) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredTransactions.slice(start, start + limit);
  }, [filteredTransactions, page, limit]);

  const handleOpenDrawer = (tx) => {
    setSelectedTx(tx);
    setIsClosingDrawer(false);
  };

  const handleCloseDrawer = () => {
    setIsClosingDrawer(true);
    setTimeout(() => {
      setSelectedTx(null);
      setIsClosingDrawer(false);
    }, 250);
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
            placeholder="Search by transaction #, invoice #, customer name..."
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-slate-300 rounded-full focus:outline-none focus:border-[#0A4B6E] focus:ring-1 focus:ring-[#0A4B6E] transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filter Dropdowns */}
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
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-[#6D8AA2]">Payment:</span>
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

      {/* Main Content: Table on Left + Optional Detail Drawer on Right */}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden border border-[#0A4B6E]/15 rounded-2xl bg-white shadow-xs">
        {/* Master Table Container */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#E8F3F8]/70 text-[#0A4B6E] font-bold sticky top-0 z-10 border-b border-[#0A4B6E]/15 backdrop-blur-xs select-none">
                <tr>
                  <th className="py-3 px-3.5 whitespace-nowrap">Transaction No</th>
                  <th className="py-3 px-3 whitespace-nowrap">Transacted Date</th>
                  <th className="py-3 px-3 whitespace-nowrap">Customer</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Total Amount</th>
                  <th className="py-3 px-3 whitespace-nowrap">Payment Settlement</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Order Status</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading sales transactions...
                    </td>
                  </tr>
                ) : paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No sales transactions found matching criteria
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => {
                    const isSelected = selectedTx?.id === tx.id;
                    const isCancelled = (tx.status || "").toUpperCase() === "CANCELLED";
                    const paymentMethod = (tx.payment_method || tx.paymentMethod || "CASH").toUpperCase();
                    const paymentStatus = (tx.payment_status || tx.paymentStatus || "").toUpperCase();
                    const totalAmount = Number(tx.total_amount || tx.totalAmount || 0);

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => handleOpenDrawer(tx)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#E2EDF3] font-semibold"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* Transaction Reference */}
                        <td className="py-2.5 px-3.5 font-bold text-[#0A4B6E]">
                          {tx.transaction_no || tx.transactionNo}
                        </td>

                        {/* Transacted Date */}
                        <td className="py-2.5 px-3 text-slate-600">
                          {formatPhilippineDateTime(tx.transacted_at || tx.transactedAt)}
                        </td>

                        {/* Customer */}
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">
                            {tx.customer_name || tx.customerName || "Customer"}
                          </div>
                          {tx.customer_business_name && (
                            <div className="text-[10px] text-slate-500">
                              {tx.customer_business_name}
                            </div>
                          )}
                        </td>

                        {/* Total Amount */}
                        <td className="py-2.5 px-3 text-right font-bold text-[#0A4B6E]">
                          ₱{totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Payment Settlement */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            {paymentMethod === "CASH" ? (
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

                            {paymentStatus && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                                  paymentStatus === "VERIFIED"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {paymentStatus}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Order Status */}
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isCancelled
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-2.5 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(tx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F3F8] hover:bg-[#d5e8f3] text-[#0A4B6E] text-[11px] font-bold transition-all cursor-pointer"
                          >
                            <span>Inspect</span>
                            <ChevronRight size={12} />
                          </button>
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
            totalItems={filteredTransactions.length}
            limit={limit}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        </div>

        {/* Slide-in Detail Drawer */}
        {selectedTx && (
          <TransactionDetailDrawer
            transaction={selectedTx}
            onClose={handleCloseDrawer}
            isClosing={isClosingDrawer}
          />
        )}
      </div>
    </div>
  );
}

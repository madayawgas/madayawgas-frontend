// src/pages/SalesAndDelivery/TransactionsInvoicesPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Receipt,
  Clock,
  Banknote,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";
import { salesApi } from "../../api/sales.js";
import { formatPhilippineDateShort } from "../../utils/date.js";
import { useSalesDateRange } from "../../hooks/useSalesDateRange.js";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh.js";
import SalesPageHeader from "../../components/sales/SalesPageHeader";
import TransactionDetailDrawer from "../../components/sales/TransactionDetailDrawer";
import VerifyPaymentModal from "../../components/sales/VerifyPaymentModal";
import SearchBar from "../../components/ui/SearchBar";
import FilterDropdown from "../../components/ui/FilterDropdown";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import ToastNotification from "../../components/ui/ToastNotifications";

const CACHE_KEY_TRANSACTIONS = "app_sales_transactions_v2_cache";

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "All Methods" },
  { value: "CASH", label: "Cash" },
  { value: "GCASH", label: "GCash" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PAID_UNVERIFIED", label: "Pending Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const matchesStatusFilter = (row, statusFilter) => {
  if (!statusFilter) return true;
  const orderStatus = (row.status || "COMPLETED").toUpperCase();
  const payMethod = (
    row.payment_method ||
    row.paymentMethod ||
    "CASH"
  ).toUpperCase();
  const payStatus = (
    row.payment_status ||
    row.paymentStatus ||
    ""
  ).toUpperCase();
  const isPendingReview =
    orderStatus !== "CANCELLED" &&
    payMethod === "GCASH" &&
    payStatus === "PAID_UNVERIFIED";

  if (statusFilter === "PAID_UNVERIFIED") return isPendingReview;
  if (statusFilter === "COMPLETED") {
    return orderStatus !== "CANCELLED" && !isPendingReview;
  }
  if (statusFilter === "CANCELLED") return orderStatus === "CANCELLED";
  return true;
};

export default function TransactionsInvoicesPage() {
  const { can } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dateRangePreset, setDateRangePreset, dateFilter } =
    useSalesDateRange("last30");

  const canVerifyInvoice = can ? can(PERMISSIONS.SALES_UPDATE) : false;

  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("paymentStatus") || ""
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [records, setRecords] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_TRANSACTIONS);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return [];
  });
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const [selectedTx, setSelectedTx] = useState(null);
  const [invoiceToVerify, setInvoiceToVerify] = useState(null);
  const [drawerRefreshKey, setDrawerRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [toast, setToast] = useState(null);

  const isPendingQueue = statusFilter === "PAID_UNVERIFIED";

  const fetchRecords = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setIsRefreshing(true);
      setFetchError("");
      try {
        const queryParams = {
          page,
          limit,
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate,
          search: searchTerm || undefined,
          paymentMethod:
            paymentMethodFilter || (isPendingQueue ? "GCASH" : undefined),
          ...(isPendingQueue
            ? { paymentStatus: "PAID_UNVERIFIED" }
            : { status: statusFilter || undefined }),
        };

        const res = isPendingQueue
          ? await salesApi.getInvoices(queryParams)
          : await salesApi.getTransactions(queryParams);

        const items =
          res?.items ||
          res?.transactions ||
          res?.invoices ||
          (Array.isArray(res) ? res : []);
        const resMeta = res?.meta || {
          total: items.length,
          totalPages: Math.ceil(items.length / limit) || 1,
        };

        const filteredItems = statusFilter
          ? items.filter((row) => matchesStatusFilter(row, statusFilter))
          : items;
        const removedCount = items.length - filteredItems.length;
        const rawTotal = resMeta.total ?? items.length;
        const adjustedTotal = Math.max(
          filteredItems.length,
          rawTotal - removedCount
        );

        setRecords(filteredItems);
        setMeta({
          total: adjustedTotal,
          totalPages:
            removedCount > 0 && adjustedTotal <= limit
              ? 1
              : resMeta.totalPages ?? (Math.ceil(adjustedTotal / limit) || 1),
        });

        if (
          !searchTerm &&
          !paymentMethodFilter &&
          !statusFilter &&
          page === 1
        ) {
          try {
            localStorage.setItem(CACHE_KEY_TRANSACTIONS, JSON.stringify(items));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setFetchError(
          err?.message || "Unable to load transactions. Showing cached data."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      page,
      limit,
      dateFilter.startDate,
      dateFilter.endDate,
      searchTerm,
      paymentMethodFilter,
      statusFilter,
      isPendingQueue,
    ]
  );

  useEffect(() => {
    fetchRecords(false);
  }, [fetchRecords]);

  useRealtimeRefresh({
    events: ["SALES_BATCH_SYNCED", "SALES_INVOICE_VERIFIED"],
    onRefresh: () => fetchRecords(false),
  });

  const handleStatusChange = (nextStatus) => {
    setStatusFilter(nextStatus);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (nextStatus === "PAID_UNVERIFIED") {
      next.set("paymentStatus", "PAID_UNVERIFIED");
    } else {
      next.delete("paymentStatus");
    }
    setSearchParams(next, { replace: true });
  };

  const handleInvoiceVerified = (updatedInvoice) => {
    setToast({
      type: "success",
      message: "GCash payment verified and recorded.",
    });
    setSelectedTx((prev) =>
      prev
        ? {
            ...prev,
            payment_status: "VERIFIED",
            paymentStatus: "VERIFIED",
            ...(updatedInvoice
              ? { invoice: { ...(prev.invoice || {}), ...updatedInvoice } }
              : {}),
          }
        : null
    );
    setDrawerRefreshKey((prev) => prev + 1);
    fetchRecords(false);
  };

  const getRowStatusBadge = (row) => {
    const orderStatus = (row.status || "COMPLETED").toUpperCase();
    const payMethod = (
      row.payment_method ||
      row.paymentMethod ||
      "CASH"
    ).toUpperCase();
    const payStatus = (
      row.payment_status ||
      row.paymentStatus ||
      ""
    ).toUpperCase();

    if (orderStatus === "CANCELLED") {
      return { label: "Cancelled", variant: "danger" };
    }
    if (payMethod === "GCASH" && payStatus === "PAID_UNVERIFIED") {
      return { label: "Pending Review", variant: "warning" };
    }
    return { label: "Completed", variant: "success" };
  };

  const headerPills = [
    {
      icon: Receipt,
      label: isPendingQueue
        ? `${meta.total} Pending Review`
        : `${meta.total} Transactions`,
      tone: isPendingQueue ? "warning" : "info",
    },
    {
      icon: Clock,
      label: "Pending GCash Review",
      tone: isPendingQueue ? "active" : "warning",
      onClick: () =>
        handleStatusChange(isPendingQueue ? "" : "PAID_UNVERIFIED"),
    },
  ];

  return (
    <div className="h-[calc(100vh-112px)] md:h-[calc(100vh-128px)] overflow-hidden flex flex-col">
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <SalesPageHeader
        pills={headerPills}
        dateRangePreset={dateRangePreset}
        onDateRangeChange={(val) => {
          setDateRangePreset(val);
          setPage(1);
        }}
        onRefresh={() => fetchRecords(true)}
        isRefreshing={isRefreshing}
      />

      {fetchError && (
        <div className="shrink-0 mb-3 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-[#C93B32] flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-medium">
            <AlertCircle size={15} />
            <span>{fetchError}</span>
          </span>
          <button
            type="button"
            onClick={() => fetchRecords(true)}
            className="font-bold underline cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
        <SearchBar
          placeholder="Search transaction #, invoice #, customer, or ref #..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="flex-1 max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="All Methods"
            options={PAYMENT_METHOD_OPTIONS}
            value={paymentMethodFilter}
            onChange={(opt) => {
              setPaymentMethodFilter(opt?.value ?? "");
              setPage(1);
            }}
          />
          <FilterDropdown
            label="All Statuses"
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(opt) => handleStatusChange(opt?.value ?? "")}
          />
          {(searchTerm || paymentMethodFilter || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setPaymentMethodFilter("");
                handleStatusChange("");
              }}
              className="text-xs font-bold text-[#0F7AB2] hover:underline px-2 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Standardized Master Table */}
      <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead className="bg-[#0D4B6E] text-white text-xs md:text-sm sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  {isPendingQueue ? "Invoice #" : "Transaction #"}
                </th>
                <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  Customer
                </th>
                <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  Date
                </th>
                <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap">
                  Amount
                </th>
                <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  Payment
                </th>
                <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] text-center whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    {isPendingQueue
                      ? "No pending GCash payments to review"
                      : "No transactions match your filters"}
                  </td>
                </tr>
              ) : (
                records.map((row) => {
                  const txId = row.transaction_id || row.transactionId || row.id;
                  const isSelected = selectedTx?.id === txId;
                  const method = (
                    row.payment_method ||
                    row.paymentMethod ||
                    "CASH"
                  ).toUpperCase();
                  const totalAmount = Number(
                    row.total_amount || row.totalAmount || 0
                  );
                  const statusBadge = getRowStatusBadge(row);

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedTx({ ...row, id: txId })}
                      className={`transition-colors duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-[#E2EDF3] text-[#0A4B6E] font-semibold"
                          : "bg-white hover:bg-[#F4F9FC]"
                      }`}
                    >
                      <td className="py-3.5 px-3 md:px-4 font-bold text-[#0A4B6E] whitespace-nowrap">
                        {row.transaction_no ||
                          row.transactionNo ||
                          row.invoice_number ||
                          row.invoiceNumber}
                      </td>

                      <td className="py-3.5 px-3 md:px-4 font-medium text-slate-800 max-w-[200px] truncate">
                        {row.customer_name || row.customerName || "Customer"}
                      </td>

                      <td className="py-3.5 px-3 md:px-4 text-slate-600 whitespace-nowrap">
                        {formatPhilippineDateShort(
                          row.transacted_at || row.transactedAt
                        )}
                      </td>

                      <td className="py-3.5 px-3 md:px-4 text-right font-bold text-[#0A4B6E] tabular-nums whitespace-nowrap">
                        ₱
                        {totalAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td className="py-3.5 px-3 md:px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                          {method === "CASH" ? (
                            <>
                              <Banknote size={14} className="text-emerald-600" />
                              <span>Cash</span>
                            </>
                          ) : (
                            <>
                              <CreditCard size={14} className="text-[#0F7AB2]" />
                              <span>GCash</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 md:px-4 text-center whitespace-nowrap">
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          limit={limit}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      </div>

      <TransactionDetailDrawer
        transaction={selectedTx}
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        canVerify={canVerifyInvoice}
        onRequestVerify={(inv) => setInvoiceToVerify(inv)}
        refreshKey={drawerRefreshKey}
      />

      <VerifyPaymentModal
        invoice={invoiceToVerify}
        isOpen={Boolean(invoiceToVerify)}
        onClose={() => setInvoiceToVerify(null)}
        onVerified={handleInvoiceVerified}
      />
    </div>
  );
}

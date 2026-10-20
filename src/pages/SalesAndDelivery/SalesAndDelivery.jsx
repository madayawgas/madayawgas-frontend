// src/pages/SalesAndDelivery/SalesAndDelivery.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";
import { salesApi } from "../../api/sales.js";
import {
  getPhilippineTodayString,
  toPhilippineDateInputString,
} from "../../utils/date.js";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh.js";

import SalesHeader from "../../components/sales/SalesHeader";
import SalesOverviewTab from "../../components/sales/SalesOverviewTab";
import TripDeliveriesTab from "../../components/sales/TripDeliveriesTab";
import TransactionRecordsTab from "../../components/sales/TransactionRecordsTab";
import InvoicesTab from "../../components/sales/InvoicesTab";
import ToastNotification from "../../components/ui/ToastNotifications";

const CACHE_KEY_ANALYTICS = "app_sales_analytics_cache";
const CACHE_KEY_TRIPS = "app_sales_trips_cache";
const CACHE_KEY_TRANSACTIONS = "app_sales_transactions_cache";
const CACHE_KEY_INVOICES = "app_sales_invoices_cache";

export default function SalesAndDelivery() {
  const { can } = useAuth();
  const { isConnected: isLiveConnected } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "analytics";
  const [dateRangePreset, setDateRangePreset] = useState("last30");
  const [timeframe, setTimeframe] = useState("monthly");

  // Filtering & Search States
  const [tripsSearch, setTripsSearch] = useState("");
  const [tripsStatus, setTripsStatus] = useState("");
  const [txSearch, setTxSearch] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [txPayment, setTxPayment] = useState("");
  const [invSearch, setInvSearch] = useState("");
  const [invPayment, setInvPayment] = useState("");
  const [invStatus, setInvStatus] = useState("");

  const [toast, setToast] = useState(null);

  // RBAC Permission Guards
  const canVerifyInvoice = can ? can(PERMISSIONS.SALES_VIEW) : false;

  // Date Boundaries Calculation based on Preset
  const dateFilter = useMemo(() => {
    const today = new Date();
    const todayStr = getPhilippineTodayString();

    if (dateRangePreset === "today") {
      return { startDate: `${todayStr}T00:00:00.000Z`, endDate: `${todayStr}T23:59:59.999Z` };
    }
    if (dateRangePreset === "last7") {
      const d7 = new Date(today);
      d7.setDate(d7.getDate() - 7);
      return { startDate: d7.toISOString(), endDate: today.toISOString() };
    }
    if (dateRangePreset === "last30") {
      const d30 = new Date(today);
      d30.setDate(d30.getDate() - 30);
      return { startDate: d30.toISOString(), endDate: today.toISOString() };
    }
    if (dateRangePreset === "thisMonth") {
      const mStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: mStart.toISOString(), endDate: today.toISOString() };
    }
    return { startDate: null, endDate: null };
  }, [dateRangePreset]);

  // Main Datasets
  const [analyticsData, setAnalyticsData] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_ANALYTICS);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return {};
  });

  const [trips, setTrips] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_TRIPS);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return [];
  });

  const [transactions, setTransactions] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_TRANSACTIONS);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return [];
  });

  const [invoices, setInvoices] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_INVOICES);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Authoritative Refresh Callback
  const refreshAll = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setIsRefreshing(true);
      try {
        const queryParams = {
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate,
          timeframe,
        };

        const [analyticsRes, tripsRes, txRes, invRes] = await Promise.all([
          salesApi.getSalesAnalytics(queryParams),
          salesApi.getTripSalesPerformance(queryParams),
          salesApi.getTransactions(queryParams),
          salesApi.getInvoices(queryParams),
        ]);

        if (analyticsRes) {
          setAnalyticsData(analyticsRes);
          try {
            localStorage.setItem(CACHE_KEY_ANALYTICS, JSON.stringify(analyticsRes));
          } catch {
            // ignore
          }
        }

        const rawTrips = tripsRes?.items || tripsRes?.trips || tripsRes || [];
        if (Array.isArray(rawTrips)) {
          setTrips(rawTrips);
          try {
            localStorage.setItem(CACHE_KEY_TRIPS, JSON.stringify(rawTrips));
          } catch {
            // ignore
          }
        }

        const rawTx = txRes?.items || txRes?.transactions || txRes || [];
        if (Array.isArray(rawTx)) {
          setTransactions(rawTx);
          try {
            localStorage.setItem(CACHE_KEY_TRANSACTIONS, JSON.stringify(rawTx));
          } catch {
            // ignore
          }
        }

        const rawInv = invRes?.items || invRes?.invoices || invRes || [];
        if (Array.isArray(rawInv)) {
          setInvoices(rawInv);
          try {
            localStorage.setItem(CACHE_KEY_INVOICES, JSON.stringify(rawInv));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error("[SalesAndDelivery] Authoritative refresh failed:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [dateFilter, timeframe]
  );

  // Real-Time WebSocket Hook: Auto-refreshes state when events fire in room:sales or room:trips
  useRealtimeRefresh({
    events: [
      "SALES_BATCH_SYNCED",
      "SALES_TRANSACTION_CANCELLED",
      "SALES_INVOICE_VERIFIED",
      "TRIP_DISPATCHED",
      "TRIP_COMPLETED",
      "TRIP_RECONCILED",
      "TRIP_CANCELLED",
    ],
    cacheKeysToInvalidate: [
      CACHE_KEY_ANALYTICS,
      CACHE_KEY_TRIPS,
      CACHE_KEY_TRANSACTIONS,
      CACHE_KEY_INVOICES,
    ],
    onRefresh: () => {
      refreshAll(false);
      setToast({
        type: "success",
        title: "Live Update Received",
        message: "Sales & delivery dashboard synchronized with recent operational event.",
      });
    },
  });

  // Initial load & dependency effect
  useEffect(() => {
    refreshAll(true);
  }, [refreshAll]);

  // Handle Tab Navigation with URL params
  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  const unverifiedGcashCount = useMemo(() => {
    return invoices.filter(
      (inv) =>
        (inv.payment_method || inv.paymentMethod || "").toUpperCase() === "GCASH" &&
        (inv.payment_status || inv.paymentStatus || "").toUpperCase() === "PAID_UNVERIFIED"
    ).length;
  }, [invoices]);

  const handleInvoiceVerified = (updated) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === updated.id ? { ...i, ...updated, payment_status: "VERIFIED" } : i))
    );
    setToast({
      type: "success",
      title: "Invoice Verified",
      message: "Payment settlement successfully confirmed by supervisor.",
    });
    refreshAll(false);
  };

  return (
    <div className="w-full h-[calc(100vh-112px)] md:h-[calc(100vh-128px)] overflow-hidden flex flex-col pt-1">
      {/* 1. TOP HEADER & SUB-NAVIGATION */}
      <div className="shrink-0">
        <SalesHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          metricsSummary={analyticsData.summary}
          tripsCount={trips.length}
          transactionsCount={transactions.length}
          invoicesCount={invoices.length}
          unverifiedGcashCount={unverifiedGcashCount}
          dateRangePreset={dateRangePreset}
          onDateRangeChange={setDateRangePreset}
          isLiveConnected={isLiveConnected}
          onRefresh={() => refreshAll(true)}
          isRefreshing={isRefreshing}
        />
      </div>

      {/* 2. TAB CONTENT PANELS */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col">
        {/* Tab 1: Overview & Analytics */}
        {activeTab === "analytics" && (
          <SalesOverviewTab
            analyticsData={analyticsData}
            isLoading={isLoading}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />
        )}

        {/* Tab 2: Vehicle & Trip Deliveries */}
        {activeTab === "deliveries" && (
          <TripDeliveriesTab
            trips={trips}
            isLoading={isLoading}
            searchTerm={tripsSearch}
            onSearchChange={setTripsSearch}
            statusFilter={tripsStatus}
            onStatusChange={setTripsStatus}
          />
        )}

        {/* Tab 3: Transaction Records */}
        {activeTab === "transactions" && (
          <TransactionRecordsTab
            transactions={transactions}
            isLoading={isLoading}
            searchTerm={txSearch}
            onSearchChange={setTxSearch}
            statusFilter={txStatus}
            onStatusChange={setTxStatus}
            paymentMethodFilter={txPayment}
            onPaymentMethodChange={setTxPayment}
          />
        )}

        {/* Tab 4: Invoices & Payment Settlements */}
        {activeTab === "invoices" && (
          <InvoicesTab
            invoices={invoices}
            isLoading={isLoading}
            searchTerm={invSearch}
            onSearchChange={setInvSearch}
            paymentMethodFilter={invPayment}
            onPaymentMethodChange={setInvPayment}
            statusFilter={invStatus}
            onStatusChange={setInvStatus}
            canVerify={canVerifyInvoice}
            onInvoiceVerified={handleInvoiceVerified}
          />
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

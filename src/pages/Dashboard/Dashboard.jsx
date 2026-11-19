import { useState, useEffect, useCallback } from "react";
import StatCard from "../../components/dashboard/StatCard";
import SalesGraph from "../../components/dashboard/SalesGraph";
import FleetStatusCards from "../../components/dashboard/FleetStatusCards";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";
import { salesApi } from "../../api/sales.js";
import { fleetApi } from "../../api/fleet.js";
import { fuelApi } from "../../api/fuel.js";
import { tripsApi } from "../../api/trips.js";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh.js";
import {
  SALES_PERIOD_OPTIONS,
  computeSalesPeriodRange,
} from "../../utils/salesAnalytics.js";

const DASHBOARD_CACHE_KEY = "app_dashboard_cache_v2";

function readDashboardCache() {
  try {
    const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeDashboardCache(updater) {
  try {
    const current = readDashboardCache();
    const next = typeof updater === "function" ? updater(current) : updater;
    localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
}

const EMPTY_SALES_DATA = {
  summary: {},
  salesTrends: [],
  weekly: [],
  monthly: [],
  annually: [],
};

function formatPeso(val, decimals = 2) {
  const num = Number(val) || 0;
  return `₱ ${num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })}`;
}

export default function Dashboard() {
  const { currentUser, can } = useAuth();
  const canFleet = can ? (can(PERMISSIONS.FLEET_VIEW) || can(PERMISSIONS.FLEET_MANAGE)) : false;
  const canSales = can ? (can(PERMISSIONS.SALES_VIEW) || can(PERMISSIONS.SALES_VIEW_OWN)) : false;
  const canRoute = can
    ? (can(PERMISSIONS.ROUTE_VIEW) ||
        can(PERMISSIONS.ROUTE_VIEW_OWN) ||
        can(PERMISSIONS.ROUTE_MANAGE))
    : false;
  const canFuel = can
    ? (can(PERMISSIONS.FUEL_VIEW) || can(PERMISSIONS.FUEL_VIEW_OWN) || canFleet)
    : false;

  const [timeframe, setTimeframe] = useState("monthly");
  const initialCache = readDashboardCache();
  const initialTfCache = initialCache[timeframe] || null;

  const [isLoadingMetrics, setIsLoadingMetrics] = useState(!initialTfCache);

  const [salesData, setSalesData] = useState(
    () => initialTfCache?.salesData || EMPTY_SALES_DATA
  );
  const [fuelCost, setFuelCost] = useState(
    () => initialTfCache?.fuelCost ?? 0
  );

  const [truckCounts, setTruckCounts] = useState(() => {
    if (initialCache.truckCounts) {
      return initialCache.truckCounts;
    }
    try {
      const cached = localStorage.getItem("app_fleet_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return {
            available: parsed.filter(
              (t) => (t.status || "").toUpperCase() === "ACTIVE"
            ).length,
            inUse: 0,
            maintenance: parsed.filter(
              (t) => (t.status || "").toUpperCase() === "UNDER_MAINTENANCE"
            ).length,
            underRepair: 0,
          };
        }
      }
    } catch (e) {
      console.error("Error reading cached fleet items for dashboard:", e);
    }
    return {
      available: 0,
      inUse: 0,
      maintenance: 0,
      underRepair: 0,
    };
  });

  const handleTimeframeChange = (nextTf) => {
    setTimeframe(nextTf);
    const cachedTf = readDashboardCache()[nextTf];
    if (cachedTf) {
      setSalesData(cachedTf.salesData || EMPTY_SALES_DATA);
      setFuelCost(cachedTf.fuelCost ?? 0);
      setIsLoadingMetrics(false);
    } else {
      setIsLoadingMetrics(true);
    }
  };

  const loadDashboardData = useCallback(async () => {
    const cachedTf = readDashboardCache()[timeframe];
    if (!cachedTf) {
      setIsLoadingMetrics(true);
    }
    try {
      const {
        startDate,
        endDate,
        timeframe: apiTimeframe,
      } = computeSalesPeriodRange(timeframe);

      const salesPromise = canSales
        ? salesApi
            .getSalesOverview({ timeframe: apiTimeframe, startDate, endDate })
            .catch(() => null)
        : Promise.resolve(null);

      const fuelPromise = canFuel
        ? fuelApi
            .getFleetFuelAnalysis({
              ...(startDate ? { startDate } : {}),
              ...(endDate ? { endDate } : {}),
            })
            .catch(() => null)
        : Promise.resolve(null);

      const trucksPromise = canFleet
        ? fleetApi.getTrucks().catch(() => null)
        : Promise.resolve(null);

      const tripsPromise =
        canFleet || canRoute
          ? tripsApi.getTrips({ status: "IN_PROGRESS" }).catch(() => null)
          : Promise.resolve(null);

      const [salesRes, fuelRes, trucksRes, tripsRes] = await Promise.allSettled([
        salesPromise,
        fuelPromise,
        trucksPromise,
        tripsPromise,
      ]);

      let nextSalesData = null;
      if (salesRes.status === "fulfilled" && salesRes.value) {
        nextSalesData = salesRes.value;
        setSalesData(salesRes.value);
      }

      let nextFuelCost = null;
      if (fuelRes.status === "fulfilled" && fuelRes.value) {
        const totals = fuelRes.value?.fleetTotals || fuelRes.value || {};
        const cost = Number(totals.totalFuelCost ?? totals.fuelCost) || 0;
        nextFuelCost = cost;
        setFuelCost(cost);
      } else if (fuelRes.status === "fulfilled" && fuelRes.value === null) {
        nextFuelCost = 0;
        setFuelCost(0);
      }

      const trucks =
        trucksRes.status === "fulfilled" && Array.isArray(trucksRes.value)
          ? trucksRes.value
          : null;
      const inProgressTrips =
        tripsRes.status === "fulfilled" && Array.isArray(tripsRes.value)
          ? tripsRes.value
          : [];

      let nextTruckCounts = null;
      if (trucks) {
        const dispatchedTruckIds = new Set(
          inProgressTrips.map((t) => t.truckId).filter(Boolean)
        );
        const inUseCount = trucks.filter((t) =>
          dispatchedTruckIds.has(t.id)
        ).length;
        const availableCount = trucks.filter(
          (t) =>
            (t.status || "").toUpperCase() === "ACTIVE" &&
            !dispatchedTruckIds.has(t.id)
        ).length;
        const maintenanceCount = trucks.filter(
          (t) => (t.status || "").toUpperCase() === "UNDER_MAINTENANCE"
        ).length;

        nextTruckCounts = {
          available: availableCount,
          inUse: inUseCount,
          maintenance: maintenanceCount,
          underRepair: 0,
        };
        setTruckCounts(nextTruckCounts);
      }

      writeDashboardCache((prev) => ({
        ...prev,
        ...(nextTruckCounts ? { truckCounts: nextTruckCounts } : {}),
        [timeframe]: {
          salesData: nextSalesData ?? prev[timeframe]?.salesData ?? EMPTY_SALES_DATA,
          fuelCost: nextFuelCost ?? prev[timeframe]?.fuelCost ?? 0,
        },
      }));
    } catch {
      // Retain existing state on network failure
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [timeframe, canSales, canFuel, canFleet, canRoute]);

  useRealtimeRefresh({
    events: [
      "FLEET_VEHICLE_GROUNDED",
      "FLEET_VEHICLE_RELEASED",
      "VEHICLE_STATUS_UPDATED",
      "SALES_BATCH_SYNCED",
      "SALES_INVOICE_VERIFIED",
      "SALES_TRANSACTION_CANCELLED",
      "TRIP_DISPATCHED",
      "TRIP_ENDED",
      "TRIP_COMPLETED",
      "TRIP_CANCELLED",
      "FUEL_LOGGED",
    ],
    cacheKeysToInvalidate: ["app_fleet_cache", DASHBOARD_CACHE_KEY],
    onRefresh: loadDashboardData,
  });

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const summary = salesData?.summary || {};
  const grossIncome = Number(summary.totalGrossSales) || 0;
  const totalUnitsSold = Number(summary.totalUnitsSold) || 0;
  const costPerCan = totalUnitsSold > 0 ? fuelCost / totalUnitsSold : 0;

  const displayName = currentUser
    ? `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() ||
      currentUser.username ||
      "System Admin"
    : "System Admin";

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-5 pt-4">
      {/* ================= TOP HEADER BANNER & STAT CARDS ================= */}
      <div className="w-full bg-gradient-to-r from-[#072d42] via-[#0A4B6E] to-[#0D5C87] rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Header Title & Unified Timeframe Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
              Welcome, {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-sky-100/80 font-medium mt-1">
              Madayaw Petroleum & Gas Operations Overview
            </p>
          </div>

          <div
            role="group"
            aria-label="Dashboard timeframe filter"
            className="inline-flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1 self-start sm:self-auto shrink-0"
          >
            {SALES_PERIOD_OPTIONS.map((opt) => {
              const isActive = timeframe === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleTimeframeChange(opt.value)}
                  aria-pressed={isActive}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-[#FFDF2C] text-[#0A4B6E] shadow-xs font-bold"
                      : "text-white/85 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Top Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Gross Income"
            value={formatPeso(grossIncome)}
            isLoading={isLoadingMetrics}
          />
          <StatCard
            title="Total Units Sold"
            value={totalUnitsSold.toLocaleString()}
            isLoading={isLoadingMetrics}
          />
          <StatCard
            title="Total Fuel Cost"
            value={formatPeso(fuelCost)}
            isLoading={isLoadingMetrics}
          />
          <StatCard
            title="Cost per Can"
            value={formatPeso(costPerCan)}
            isLoading={isLoadingMetrics}
          />
        </div>
      </div>

      {/* ================= MAIN CONTENT SECTION ================= */}
      {(canFleet || canSales) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* LEFT / TOP SIDE: FLEET OPERATIONAL STATUS */}
          {canFleet && (
            <div className={`${canSales ? "lg:col-span-5" : "lg:col-span-12"} flex`}>
              <FleetStatusCards counts={truckCounts} />
            </div>
          )}

          {/* RIGHT SIDE: SALES GRAPH */}
          {canSales && (
            <div className={`${canFleet ? "lg:col-span-7" : "lg:col-span-12"} flex min-w-0`}>
              <SalesGraph
                salesData={salesData}
                timeframe={timeframe}
                isLoading={isLoadingMetrics}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

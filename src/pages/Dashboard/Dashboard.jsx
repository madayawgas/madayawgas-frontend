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

const TIMEFRAME_OPTIONS = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "annually", label: "Annually" },
];

/**
 * Compute rolling date bounds matching SalesAndDelivery.jsx:
 * - weekly   -> Last 7 Days
 * - monthly  -> Last 30 Days
 * - annually -> Last 365 Days
 */
function getTimeframeBounds(timeframe) {
  const today = new Date();
  const start = new Date(today);

  if (timeframe === "weekly") {
    start.setDate(start.getDate() - 7);
  } else if (timeframe === "annually") {
    start.setDate(start.getDate() - 365);
  } else {
    start.setDate(start.getDate() - 30);
  }

  return {
    startDate: start.toISOString(),
    endDate: today.toISOString(),
  };
}

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
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  const [salesData, setSalesData] = useState({
    summary: {},
    weekly: [],
    monthly: [],
    annually: [],
  });
  const [fuelCost, setFuelCost] = useState(0);

  const [truckCounts, setTruckCounts] = useState(() => {
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

  const loadDashboardData = useCallback(async () => {
    setIsLoadingMetrics(true);
    try {
      const { startDate, endDate } = getTimeframeBounds(timeframe);

      const salesPromise = canSales
        ? salesApi
            .getSalesOverview({ timeframe, startDate, endDate })
            .catch(() => null)
        : Promise.resolve(null);

      const fuelPromise = canFuel
        ? fuelApi
            .getFleetFuelAnalysis({ startDate, endDate })
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

      if (salesRes.status === "fulfilled" && salesRes.value) {
        setSalesData(salesRes.value);
      }

      if (fuelRes.status === "fulfilled" && fuelRes.value) {
        const totals = fuelRes.value?.fleetTotals || fuelRes.value || {};
        const cost = Number(totals.totalFuelCost ?? totals.fuelCost) || 0;
        setFuelCost(cost);
      } else if (fuelRes.status === "fulfilled" && fuelRes.value === null) {
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

        setTruckCounts({
          available: availableCount,
          inUse: inUseCount,
          maintenance: maintenanceCount,
          underRepair: 0,
        });
      }
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
      "SALES_BATCH_SYNCED",
      "SALES_TRANSACTION_CANCELLED",
      "TRIP_DISPATCHED",
      "TRIP_ENDED",
      "TRIP_COMPLETED",
      "TRIP_CANCELLED",
      "FUEL_LOGGED",
    ],
    cacheKeysToInvalidate: ["app_fleet_cache"],
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
            {TIMEFRAME_OPTIONS.map((opt) => {
              const isActive = timeframe === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTimeframe(opt.key)}
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
            <div className={`${canFleet ? "lg:col-span-7" : "lg:col-span-12"} flex`}>
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

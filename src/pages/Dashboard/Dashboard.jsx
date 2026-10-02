import { useState, useEffect, useCallback } from "react";
import StatCard from "../../components/dashboard/StatCard";
import SalesGraph from "../../components/dashboard/SalesGraph";
import FleetStatusCards from "../../components/dashboard/FleetStatusCards";
import MaintenanceDashboardSection from "../../components/dashboard/MaintenanceDashboardSection";
import { useAuth } from "../../context/AuthContext.jsx";
import { dashboardApi } from "../../api/dashboard.js";
import { salesApi } from "../../api/sales.js";
import { fleetApi } from "../../api/fleet.js";
import { customersApi } from "../../api/customers.js";
import mockSales from "../../mocks/sales.json";
import bgHeader from "../../assets/BG-Madayaw8.png";
import { hasUserRole } from "../../utils/userRoles.js";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const isSuperAdmin = hasUserRole(currentUser, "Super Admin");

  const [metrics, setMetrics] = useState({
    grossIncome: 1285000,
    costPerCan: 1.07,
  });

  const [customerCount, setCustomerCount] = useState(() => {
    try {
      const cached = localStorage.getItem("app_customers_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((c) => c.isActive !== false).length;
        }
      }
    } catch (e) {
      console.error("Error reading cached customers for dashboard:", e);
    }
    return 6;
  });

  const [totalTrucks, setTotalTrucks] = useState(() => {
    try {
      const cached = localStorage.getItem("app_fleet_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.length;
        }
      }
    } catch (e) {
      console.error("Error reading cached fleet items for dashboard:", e);
    }
    return 5;
  });

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
      available: 3,
      inUse: 0,
      maintenance: 2,
      underRepair: 0,
    };
  });

  const [salesData, setSalesData] = useState(mockSales.data);
  const [maintenanceLogs, setMaintenanceLogs] = useState(() => {
    try {
      const cached = localStorage.getItem("app_maintenance_logs_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error reading cached maintenance logs for dashboard:", e);
    }
    return [];
  });
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const refreshMaintenanceLogs = useCallback(async () => {
    if (!isSuperAdmin) return;
    setIsLoadingLogs(true);
    try {
      const res = await fleetApi.getMaintenanceLogs();
      const logs = res?.data?.logs || res?.logs || [];
      setMaintenanceLogs(logs);
    } catch (err) {
      console.error("Failed to load maintenance logs for dashboard:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const promises = [
          dashboardApi.getMetrics(),
          salesApi.getSalesOverview(),
          fleetApi.getTrucks(),
          customersApi.getCustomers(),
        ];

        if (isSuperAdmin) {
          promises.push(fleetApi.getMaintenanceLogs());
        }

        const results = await Promise.allSettled(promises);
        const [dashMetrics, sales, trucksData, customersData, logsData] = results;

        if (dashMetrics.status === "fulfilled" && dashMetrics.value) {
          setMetrics(dashMetrics.value);
        }

        if (sales.status === "fulfilled" && sales.value) {
          setSalesData(sales.value);
        }

        if (trucksData.status === "fulfilled" && Array.isArray(trucksData.value)) {
          const trucks = trucksData.value;
          setTotalTrucks(trucks.length);
          const activeCount = trucks.filter(
            (t) => (t.status || "").toUpperCase() === "ACTIVE"
          ).length;
          const maintenanceCount = trucks.filter(
            (t) => (t.status || "").toUpperCase() === "UNDER_MAINTENANCE"
          ).length;

          setTruckCounts({
            available: activeCount,
            inUse: 0,
            maintenance: maintenanceCount,
            underRepair: 0,
          });
        }

        if (
          customersData.status === "fulfilled" &&
          Array.isArray(customersData.value)
        ) {
          const activeCustomers = customersData.value.filter(
            (c) => c.isActive !== false
          ).length;
          setCustomerCount(activeCustomers);
        }

        if (
          isSuperAdmin &&
          logsData &&
          logsData.status === "fulfilled" &&
          logsData.value
        ) {
          const logs =
            logsData.value?.data?.logs || logsData.value?.logs || [];
          setMaintenanceLogs(logs);
        }
      } catch {
        // Retain fallback state on network failure
      }
    }
    loadDashboardData();
  }, [isSuperAdmin]);

  const {
    grossIncome = 0,
    costPerCan = 0,
  } = metrics;

  const fleetReadinessPercent =
    totalTrucks > 0
      ? Math.round((truckCounts.available / totalTrucks) * 100)
      : 0;

  const displayName = currentUser
    ? `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() ||
      currentUser.username ||
      "System Admin"
    : "System Admin";

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-5 pt-4">
      {/* ================= TOP HEADER BANNER & STAT CARDS ================= */}
      <div
        className="w-full bg-cover bg-center rounded-[3rem] p-10 md:p-10 relative overflow-hidden shadow-sm"
        style={{ backgroundImage: `url(${bgHeader})` }}
      >
        {/* Header Title */}
        <h1 className="text-3xl md:text-4xl font-semibold text-white mb-6 relative z-10">
          Welcome, {displayName}
        </h1>

        {/* Top Metric Cards Row (Overlaying Header) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
          <StatCard
            title="Gross Income"
            value={`₱ ${grossIncome.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}`}
          />
          <StatCard
            title="Cost per can"
            value={`₱ ${costPerCan.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}`}
          />
          <StatCard
            title="Active Customers"
            value={`${customerCount} Accounts`}
          />
          <StatCard
            title="Fleet Readiness"
            value={`${fleetReadinessPercent}% (${truckCounts.available}/${totalTrucks})`}
          />
        </div>
      </div>

      {/* ================= MAIN CONTENT SECTION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT / TOP SIDE: FLEET OPERATIONAL STATUS (5 COLUMNS) */}
        <div className="lg:col-span-5 flex">
          <FleetStatusCards counts={truckCounts} />
        </div>

        {/* RIGHT SIDE: SALES GRAPH (7 COLUMNS) */}
        <div className="lg:col-span-7 flex">
          <SalesGraph salesData={salesData} />
        </div>
      </div>

      {/* ================= SUPER ADMIN: HISTORICAL MAINTENANCE INTELLIGENCE ================= */}
      {isSuperAdmin && (
        <MaintenanceDashboardSection
          logs={maintenanceLogs}
          isLoading={isLoadingLogs}
          onRefresh={refreshMaintenanceLogs}
        />
      )}
    </div>
  );
}

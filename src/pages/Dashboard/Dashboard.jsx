// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import StatCard from "../../components/dashboard/StatCard";
import SalesGraph from "../../components/dashboard/SalesGraph";
import { useAuth } from "../../context/AuthContext.jsx";
import { dashboardApi } from "../../api/dashboard.js";
import { salesApi } from "../../api/sales.js";
import bgHeader from "../../assets/BG-Madayaw5.png";
import { Truck, Wrench } from "lucide-react";

export default function Dashboard() {
  const { currentUser } = useAuth();

  const [metrics, setMetrics] = useState({
    grossIncome: 1285000,
    costPerCan: 1.07,
    availableTrucksCount: 3,
    inUseTrucksCount: 3,
    inShopTrucksCount: 2,
    underRepairTrucksCount: 1,
  });

  const [salesData, setSalesData] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [dashMetrics, sales] = await Promise.all([
          dashboardApi.getMetrics(),
          salesApi.getSalesOverview(),
        ]);
        if (dashMetrics) setMetrics(dashMetrics);
        if (sales) setSalesData(sales);
      } catch {
        // Retain fallback state on network failure
      }
    }
    loadDashboardData();
  }, []);

  const {
    grossIncome = 0,
    costPerCan = 0,
    availableTrucksCount = 0,
    inUseTrucksCount = 0,
    inShopTrucksCount = 0,
    underRepairTrucksCount = 0,
  } = metrics;

  const displayName = currentUser
    ? `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() ||
      currentUser.username ||
      "System Admin"
    : "System Admin";

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6 p-4">
      {/* ================= TOP HEADER BANNER & STAT CARDS ================= */}
      <div
        className="w-full bg-cover bg-center rounded-[2rem] p-6 md:p-10 relative overflow-hidden shadow-sm"
        style={{ backgroundImage: `url(${bgHeader})` }}
      >
        {/* Header Title */}
        <h1 className="text-3xl md:text-4xl font-semibold text-white mb-6 relative z-10">
          Welcome, {displayName}
        </h1>

        {/* Top Metric Cards Row (Overlaying Header) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
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
            title="Gross Income"
            value={`₱ ${grossIncome.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}`}
          />
          <StatCard
            title="Gross Income"
            value={`₱ ${grossIncome.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}`}
          />
        </div>
      </div>

      {/* ================= MAIN CONTENT SECTION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / TOP SIDE: TRUCK STATUS SUMMARY GRID (4 COLUMNS) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          {/* Available */}
          <div className="bg-[#FFF9D6] p-10 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-md font-bold text-[#8C6D00]">Available</p>
              <h3 className="text-3xl font-bold text-[#8C6D00] mt-1">
                {availableTrucksCount}
              </h3>
            </div>
            <div className="w-12 h-12 bg-[#FFE866] rounded-xl flex items-center justify-center text-2xl">
              <Truck className="w-6 h-6 text-[#0F7AB2]" />
            </div>
          </div>

          {/* In Use */}
          <div className="bg-[#E6F4FA] p-11 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-md font-bold text-[#0F7AB2]">In Use</p>
              <h3 className="text-3xl font-bold text-[#0F7AB2] mt-1">
                {inUseTrucksCount}
              </h3>
            </div>
            <div className="w-12 h-12 bg-[#FFE866] rounded-xl flex items-center justify-center text-2xl">
              <Truck className="w-6 h-6 text-[#0F7AB2]" />
            </div>
          </div>

          {/* In Shop */}
          <div className="bg-[#E6F4FA] p-11 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-md font-bold text-[#0F7AB2]">In Shop</p>
              <h3 className="text-3xl font-bold text-[#0F7AB2] mt-1">
                {inShopTrucksCount}
              </h3>
            </div>
            <div className="w-12 h-12 bg-[#FFE866] rounded-xl flex items-center justify-center text-2xl">
              <Wrench size={24} color="#8C6D00" />
            </div>
          </div>

          {/* Under Repair */}
          <div className="bg-[#FFF9D6] p-9 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-md font-bold text-[#8C6D00]">Under Repair</p>
              <h3 className="text-3xl font-bold text-[#8C6D00] mt-1">
                {underRepairTrucksCount}
              </h3>
            </div>
            <div className="w-12 h-12 bg-[#FFE866] rounded-xl flex items-center justify-center text-2xl">
              <Wrench size={24} color="#8C6D00" />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: SALES GRAPH */}
        <div className="lg:col-span-7">
          <SalesGraph salesData={salesData} />
        </div>
      </div>
    </div>
  );
}
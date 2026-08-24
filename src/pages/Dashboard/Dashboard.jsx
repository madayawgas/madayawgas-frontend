// src/pages/Dashboard.jsx
import StatCard from "../../components/dashboard/StatCard";
import TruckList from "../../components/dashboard/TruckList";
import SalesGraph from "../../components/dashboard/SalesGraph";
import { useData } from "../../context/DataContext"; 
import bgHeader from "../../assets/BG-Madayaw5.png";

export default function Dashboard() {
  const { dashboardMetrics } = useData();
  const {
    grossIncome,
    costPerCan,
    availableTrucksCount,
    trucksUnderMaintenanceCount,
    availableTrucksList,
    maintenanceTrucksList,
  } = dashboardMetrics;

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6 p-4">
      {/* ================= TOP HEADER BANNER & STAT CARDS ================= */}
      <div 
        className="w-full bg-cover bg-center rounded-[2rem] p-6 md:p-10 relative overflow-hidden shadow-sm"
        style={{ backgroundImage: `url(${bgHeader})` }}
      >
        {/* Header Title */}
        <h1 className="text-3xl md:text-4xl font-semibold text-white mb-6 relative z-10">
          Welcome, System Admin
        </h1>

        {/* Top Metric Cards Row (Overlaying Header) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <StatCard 
            title="Gross Income"
            value={`₱ ${grossIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
          />
          <StatCard
            title="Cost per can"
            value={`₱ ${costPerCan.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
          />
          <StatCard
            title="Gross Income"
            value={`₱ ${grossIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
          />
          <StatCard
            title="Gross Income"
            value={`₱ ${grossIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
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
              <h3 className="text-3xl font-bold text-[#8C6D00] mt-1">{availableTrucksCount}</h3>
            </div>
            <div className="w-12 h-12 bg-[#FFE866] rounded-xl flex items-center justify-center text-2xl">
              🚚
            </div>
          </div>

          {/* In Use */}
          <div className="bg-[#E6F4FA] p-11 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-md font-bold text-[#0F7AB2]">In Use</p>
              <h3 className="text-3xl font-bold text-[#0F7AB2] mt-1">3</h3>
            </div>
            <div className="w-12 h-12 bg-[#FFE866] rounded-xl flex items-center justify-center text-2xl">
              🚚
            </div>
          </div>

          {/* In Shop */}
          <div className="bg-[#E6F4FA] p-11 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-md font-bold text-[#0F7AB2]">In Shop</p>
              <h3 className="text-3xl font-bold text-[#0F7AB2] mt-1">{trucksUnderMaintenanceCount}</h3>
            </div>
            <div className="w-12 h-12 bg-[#FFE866] rounded-xl flex items-center justify-center text-2xl">
              🔧
            </div>
          </div>

          {/* Under Repair */}
          <div className="bg-[#FFF9D6] p-9 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-md font-bold text-[#8C6D00]">Under Repair</p>
              <h3 className="text-3xl font-bold text-[#8C6D00] mt-1">1</h3>
            </div>
            <div className="w-12 h-12 bg-[#FFE866] rounded-xl flex items-center justify-center text-2xl">
              🔧
            </div>
          </div>

          {/* Original Truck Lists for detailed plate numbers */}
          {/* <div className="col-span-2 flex flex-col gap-4 mt-2">
            <TruckList
              title={`Available (${availableTrucksCount})`}
              trucks={availableTrucksList.map((truck) => truck.plateNumber)}
              status="available"
            />
            <TruckList
              title={`Under Maintenance (${trucksUnderMaintenanceCount})`}
              trucks={maintenanceTrucksList.map((truck) => truck.plateNumber)}
              status="maintenance"
            />
          </div> */}
        </div>

        {/* RIGHT SIDE: SALES GRAPH */}
        <div className="lg:col-span-7">
          <SalesGraph />
        </div>
      </div>
    </div>
  );
}
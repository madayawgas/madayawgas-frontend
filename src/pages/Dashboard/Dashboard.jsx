// src/pages/Dashboard.jsx
import StatCard from "../../components/dashboard/StatCard";
import TruckList from "../../components/dashboard/TruckList";
import SalesGraph from "../../components/dashboard/SalesGraph";
import { useData } from "../../context/DataContext"; // Adjust path if needed

export default function Dashboard() {
  //Extract the lists directly from the mock database function
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
    <div className="w-full max-w-[1400px] mx-auto">
      {/* Page Title */}
      <h2 className="text-2xl md:text-[28px] font-bold text-[#1B4B75] mb-6">
        Welcome, System Admin
      </h2>

      {/* Layout Grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column (Cards + Graph) */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Top Row Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Gross Income"
              value={`₱ ${grossIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <StatCard
              title="Cost Per Can"
              value={`₱ ${costPerCan.toFixed(4)}`}
            />
          </div>

          {/* Graph Section */}
          <SalesGraph />
        </div>

        {/* Right Column (Truck Lists) */}
        <div className="w-full lg:w-[320px] flex flex-col gap-6">
          <TruckList
            title={`Available (${availableTrucksCount})`} //Added the count to the title!
            // used plate numbers instead of Truck numbers
            trucks={availableTrucksList.map((truck) => truck.plateNumber)}
            status="available"
          />
          <TruckList
            title={`Under Maintenance (${trucksUnderMaintenanceCount})`}
            trucks={maintenanceTrucksList.map((truck) => truck.plateNumber)}
            status="maintenance"
          />
        </div>
      </div>
    </div>
  );
}

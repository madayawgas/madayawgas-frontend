// src/pages/Dashboard.jsx
import StatCard from "../../components/dashboard/StatCard";
import TruckList from "../../components/dashboard/TruckList";
import SalesGraph from "../../components/dashboard/SalesGraph";

export default function Dashboard() {
  // Mock Data
  const availableTrucks = ["Truck #1", "Truck #2", "Truck #3", "Truck #8", "Truck #4", "Truck #5", "Truck #6"];
  const maintenanceTrucks = ["Truck #7"];

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
            <StatCard title="Gross Income" value="₱ 123,456.00" />
            <StatCard title="Cost Per Can" value="₱ 789,100.00" />
          </div>

          {/* Graph Section */}
          <SalesGraph />
        </div>

        {/* Right Column (Truck Lists) */}
        <div className="w-full lg:w-[320px] flex flex-col gap-6">
          <TruckList
            title="Available"
            trucks={availableTrucks}
            status="available"
          />
          <TruckList
            title="On Maintenance"
            trucks={maintenanceTrucks}
            status="maintenance"
          />
        </div>

      </div>
    </div>
  );
}
// src/data/dashboardMockData.js
import { allUsers } from "./userMockData";
import { allHydratedTrucks } from "./truckMockData";
import { annualSales, mockFuelConsumption } from "./salesMockData";

// Calculate total gross sales based on the annual array
const grossIncome = annualSales.reduce(
  (total, year) => total + year.butane + year.lpg11kg + year.lpg50kg,
  0
);

// Gross sales divided by fuel consumption
const costPerCan = mockFuelConsumption > 0 
  ? grossIncome / mockFuelConsumption 
  : 0;

export const getDashboardMetrics = (users = allUsers, trucks = allHydratedTrucks) => {
  // Split the hydrated trucks into their respective lists
  const availableTrucksList = trucks.filter(
    (t) => t.status === "AVAILABLE",
  );
  const maintenanceTrucksList = trucks.filter(
    (t) => t.status === "UNDER_MAINTENANCE",
  );

  return {
    // Financials
    grossIncome,
    costPerCan,

    // Counts for Stat Cards
    totalUsers: users.length,
    totalTrucks: trucks.length,
    availableTrucksCount: availableTrucksList.length,
    trucksUnderMaintenanceCount: maintenanceTrucksList.length,

    availableTrucksList,
    maintenanceTrucksList,

    // Pass the full user list in case you need it for a "Manage Users" widget
    usersList: users,
  };
};

// src/data/dashboardMockData.js
import { allUsers } from "./userMockData";
import { allHydratedTrucks } from "./truckMockData";

// Constants for the dashboard financial numbers
const grossIncome = 676767.5;
const costPerCan = 0.1234;

export const getDashboardMetrics = () => {
  // Split the hydrated trucks into their respective lists
  const availableTrucksList = allHydratedTrucks.filter(
    (t) => t.status === "AVAILABLE",
  );
  const maintenanceTrucksList = allHydratedTrucks.filter(
    (t) => t.status === "UNDER_MAINTENANCE",
  );

  return {
    // Financials
    grossIncome,
    costPerCan,

    // Counts for Stat Cards
    totalUsers: allUsers.length,
    totalTrucks: allHydratedTrucks.length,
    availableTrucksCount: availableTrucksList.length,
    trucksUnderMaintenanceCount: maintenanceTrucksList.length,

    availableTrucksList,
    maintenanceTrucksList,

    // Pass the full user list in case you need it for a "Manage Users" widget
    usersList: allUsers,
  };
};

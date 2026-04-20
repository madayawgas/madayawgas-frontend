// src/context/DataContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";

// Import your initial static mock data
import { allUsers } from "../data/userMockData";
import { trucks as rawTrucks } from "../data/truckMockData";

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // ==========================================================================
  // 1. APPLICATION STATE
  // ==========================================================================
  const [users, setUsers] = useState(() => {
    const savedUsers = localStorage.getItem("mockApp_users");
    return savedUsers ? JSON.parse(savedUsers) : allUsers;
  });

  const [trucks, setTrucks] = useState(() => {
    const savedTrucks = localStorage.getItem("mockApp_trucks");
    return savedTrucks ? JSON.parse(savedTrucks) : rawTrucks;
  });

  // ==========================================================================
  // 2. LOCAL STORAGE SYNC
  // ==========================================================================
  useEffect(() => {
    localStorage.setItem("mockApp_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("mockApp_trucks", JSON.stringify(trucks));
  }, [trucks]);

  // ==========================================================================
  // 3. DYNAMIC HYDRATION
  // ==========================================================================
  const activeHydratedTrucks = trucks.map((truck) => {
    const driver = users.find((u) => u.userId === truck.assignedDriverId);
    return {
      ...truck,
      driverName: driver ? driver.name : "Unassigned",
      driverLicense: driver ? driver.licenseNo : "N/A",
    };
  });

  // ==========================================================================
  // 4 & 5. CRUD METHODS (Keeping your exact methods)
  // ==========================================================================
  const addUser = (userData) => {
    const newUser = { ...userData, userId: Date.now(), isActive: true };
    setUsers((prev) => [...prev, newUser]);
  };

  const updateUser = (userId, updatedData) => {
    setUsers((prev) =>
      prev.map((user) => (user.userId === userId ? { ...user, ...updatedData } : user))
    );
  };

  const deleteUser = (userId) => {
    setUsers((prev) => prev.filter((user) => user.userId !== userId));
  };

  const addTruck = (truckData) => {
    const newTruck = {
      ...truckData,
      truckId: Date.now(),
      status: truckData.status || "AVAILABLE",
      currentOdometer: truckData.currentOdometer || 0,
    };
    setTrucks((prev) => [...prev, newTruck]);
  };

  const updateTruck = (truckId, updatedData) => {
    setTrucks((prev) =>
      prev.map((truck) => (truck.truckId === truckId ? { ...truck, ...updatedData } : truck))
    );
  };

  const deleteTruck = (truckId) => {
    setTrucks((prev) => prev.filter((truck) => truck.truckId !== truckId));
  };

  const updateTruckStatus = (truckId, newStatus, activeRepair = "") => {
    setTrucks((prev) =>
      prev.map((truck) =>
        truck.truckId === truckId ? { ...truck, status: newStatus, activeRepair } : truck
      )
    );
  };

  // ==========================================================================
  // 6. HELPER METHODS
  // ==========================================================================
  const getDriverOptions = () => users.filter((user) => user.roleId === 3 && user.isActive);

  const resetData = () => {
    setUsers(allUsers);
    setTrucks(rawTrucks);
    localStorage.removeItem("mockApp_users");
    localStorage.removeItem("mockApp_trucks");
  };

  // ==========================================================================
  // 7. MOCK SALES DATA (New for Dashboard)
  // ==========================================================================
  const weeklySales = [
    { name: "Mon", butane: 1200, lpg11kg: 800, lpg50kg: 400 },
    { name: "Tue", butane: 1300, lpg11kg: 850, lpg50kg: 420 },
    { name: "Wed", butane: 1100, lpg11kg: 900, lpg50kg: 380 },
    { name: "Thu", butane: 1500, lpg11kg: 950, lpg50kg: 450 },
    { name: "Fri", butane: 1700, lpg11kg: 1100, lpg50kg: 500 },
    { name: "Sat", butane: 2000, lpg11kg: 1300, lpg50kg: 600 },
    { name: "Sun", butane: 1800, lpg11kg: 1200, lpg50kg: 550 },
  ];

  const monthlySales = [
    { name: "Jan", butane: 24000, lpg11kg: 18000, lpg50kg: 8000 },
    { name: "Feb", butane: 22000, lpg11kg: 16000, lpg50kg: 7500 },
    { name: "Mar", butane: 26000, lpg11kg: 19000, lpg50kg: 8500 },
    { name: "Apr", butane: 28000, lpg11kg: 21000, lpg50kg: 9000 },
    { name: "May", butane: 25000, lpg11kg: 18500, lpg50kg: 8200 },
    { name: "Jun", butane: 27000, lpg11kg: 20000, lpg50kg: 8800 },
    { name: "Jul", butane: 30000, lpg11kg: 22000, lpg50kg: 9500 },
  ];

  const annualSales = [
    { name: "2020", butane: 250000, lpg11kg: 180000, lpg50kg: 80000 },
    { name: "2021", butane: 270000, lpg11kg: 195000, lpg50kg: 85000 },
    { name: "2022", butane: 290000, lpg11kg: 210000, lpg50kg: 92000 },
    { name: "2023", butane: 320000, lpg11kg: 230000, lpg50kg: 100000 },
    { name: "2024", butane: 350000, lpg11kg: 250000, lpg50kg: 110000 },
  ];

  // ==========================================================================
  // 8. COMPUTED METRICS (Gross Sales & Cost Per Can)
  // ==========================================================================
  
  // Calculate total gross sales based on the annual array (as an example of lifetime/annual gross)
  const computedGrossSales = annualSales.reduce(
    (total, year) => total + year.butane + year.lpg11kg + year.lpg50kg,
    0
  );

  // Example fuel consumption value (you can make this a state later if users can input it)
  const mockFuelConsumption = 125000; 
  
  // Gross sales divided by fuel consumption
  const computedCostPerCan = mockFuelConsumption > 0 
    ? computedGrossSales / mockFuelConsumption 
    : 0;

  const dashboardMetrics = {
    grossIncome: computedGrossSales,
    costPerCan: computedCostPerCan,
    totalUsers: users.length,
    totalTrucks: activeHydratedTrucks.length,
    availableTrucksCount: activeHydratedTrucks.filter((t) => t.status === "AVAILABLE").length,
    trucksUnderMaintenanceCount: activeHydratedTrucks.filter((t) => t.status === "UNDER_MAINTENANCE").length,
    availableTrucksList: activeHydratedTrucks.filter((t) => t.status === "AVAILABLE"),
    maintenanceTrucksList: activeHydratedTrucks.filter((t) => t.status === "UNDER_MAINTENANCE"),
  };

  // ==========================================================================
  // 9. EXPORTING THE CONTEXT
  // ==========================================================================
  const value = {
    users,
    trucks: activeHydratedTrucks,
    dashboardMetrics,
    weeklySales,
    monthlySales,
    annualSales,

    addUser,
    updateUser,
    deleteUser,
    addTruck,
    updateTruck,
    deleteTruck,
    updateTruckStatus,
    getDriverOptions,
    resetData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
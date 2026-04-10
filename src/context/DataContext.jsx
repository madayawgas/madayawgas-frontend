// src/context/DataContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";

// Import your initial static mock data
import { allUsers } from "../data/userMockData";
import { trucks as rawTrucks } from "../data/truckMockData";

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // ==========================================================================
  // 1. APPLICATION STATE (WITH LOCAL STORAGE CAPABILITY)
  // ==========================================================================

  // We use a function inside useState so it only checks localStorage on the very first load
  const [users, setUsers] = useState(() => {
    const savedUsers = localStorage.getItem("mockApp_users");
    return savedUsers ? JSON.parse(savedUsers) : allUsers;
  });

  const [trucks, setTrucks] = useState(() => {
    const savedTrucks = localStorage.getItem("mockApp_trucks");
    return savedTrucks ? JSON.parse(savedTrucks) : rawTrucks;
  });

  // ==========================================================================
  // 2. LOCAL STORAGE SYNC (The Magic)
  // ==========================================================================

  // Every time 'users' changes, save the new list to localStorage
  useEffect(() => {
    localStorage.setItem("mockApp_users", JSON.stringify(users));
  }, [users]);

  // Every time 'trucks' changes, save the new list to localStorage
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
  // 4. USER CRUD METHODS
  // ==========================================================================

  const addUser = (userData) => {
    const newUser = { ...userData, userId: Date.now(), isActive: true };
    setUsers((prev) => [...prev, newUser]);
  };

  const updateUser = (userId, updatedData) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.userId === userId ? { ...user, ...updatedData } : user,
      ),
    );
  };

  const deleteUser = (userId) => {
    setUsers((prev) => prev.filter((user) => user.userId !== userId));
  };

  // ==========================================================================
  // 5. TRUCK CRUD METHODS
  // ==========================================================================

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
      prev.map((truck) =>
        truck.truckId === truckId ? { ...truck, ...updatedData } : truck,
      ),
    );
  };

  const deleteTruck = (truckId) => {
    setTrucks((prev) => prev.filter((truck) => truck.truckId !== truckId));
  };

  const updateTruckStatus = (truckId, newStatus, activeRepair = "") => {
    setTrucks((prev) =>
      prev.map((truck) =>
        truck.truckId === truckId
          ? { ...truck, status: newStatus, activeRepair }
          : truck,
      ),
    );
  };

  // ==========================================================================
  // 6. HELPER METHODS
  // ==========================================================================

  const getDriverOptions = () => {
    return users.filter((user) => user.roleId === 3 && user.isActive);
  };

  // Emergency reset switch! Deletes local storage and restores the default mock files.
  const resetData = () => {
    setUsers(allUsers);
    setTrucks(rawTrucks);
    localStorage.removeItem("mockApp_users");
    localStorage.removeItem("mockApp_trucks");
  };

  // ==========================================================================
  // 7. LIVE DASHBOARD METRICS
  // ==========================================================================

  const dashboardMetrics = {
    grossIncome: 676767.5,
    costPerCan: 0.1212,
    totalUsers: users.length,
    totalTrucks: activeHydratedTrucks.length,
    availableTrucksCount: activeHydratedTrucks.filter(
      (t) => t.status === "AVAILABLE",
    ).length,
    trucksUnderMaintenanceCount: activeHydratedTrucks.filter(
      (t) => t.status === "UNDER_MAINTENANCE",
    ).length,
    availableTrucksList: activeHydratedTrucks.filter(
      (t) => t.status === "AVAILABLE",
    ),
    maintenanceTrucksList: activeHydratedTrucks.filter(
      (t) => t.status === "UNDER_MAINTENANCE",
    ),
  };

  // ==========================================================================
  // 8. EXPORTING THE CONTEXT
  // ==========================================================================

  const value = {
    users,
    trucks: activeHydratedTrucks,
    dashboardMetrics,

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

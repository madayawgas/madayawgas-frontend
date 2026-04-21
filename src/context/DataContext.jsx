import React, { createContext, useState, useEffect, useContext } from "react";

// Import your initial static mock data
import { allUsers, PERMISSIONS as initialPermissions } from "../data/userMockData";
import { trucks as rawTrucks } from "../data/truckMockData";
import { allSalesRecords } from "../data/salesMockData";

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

  const [salesRecords] = useState(allSalesRecords);

  // --- NEW PERMISSIONS STATE FOR THE ASSIGNED TASK ---
  const [rolePermissions, setRolePermissions] = useState(() => {
    const saved = localStorage.getItem("mockApp_permissions");
    return saved ? JSON.parse(saved) : initialPermissions;
  });

  // ==========================================================================
  // 2. SALES DATA HELPERS
  // ==========================================================================
  const getSalesByPeriod = (period) => {
    const now = new Date("2026-04-13"); 
    let filtered = [...salesRecords];

    if (period === "weekly") {
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 14);
      filtered = salesRecords.filter((r) => new Date(r.date) >= lastWeek);
    } else if (period === "monthly") {
      const lastYear = new Date(now);
      lastYear.setFullYear(now.getFullYear() - 1);
      filtered = salesRecords.filter((r) => new Date(r.date) >= lastYear);
    }

    return filtered.map((record) => ({
      ...record,
      costPerCan: (record.totalGrossSales / record.fuelConsumption).toFixed(2),
      salesPerLiter: (record.totalGrossSales / record.fuelConsumption).toFixed(2),
    }));
  };

  // ==========================================================================
  // 3. LOCAL STORAGE SYNC
  // ==========================================================================
  useEffect(() => {
    localStorage.setItem("mockApp_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("mockApp_trucks", JSON.stringify(trucks));
  }, [trucks]);

  // --- NEW SYNC FOR PERMISSIONS ---
  useEffect(() => {
    localStorage.setItem("mockApp_permissions", JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  // ==========================================================================
  // 4. NEW METHOD FOR ASSIGNED TASK (BACKEND LOGIC)
  // ==========================================================================
  /**
   * Toggles a permission for a specific role and saves it
   */
  const updateRolePermissions = (roleName, permissionKey) => {
    setRolePermissions((prev) => {
      const currentRoleList = prev[roleName] || [];
      const isCurrentlyEnabled = currentRoleList.includes(permissionKey);

      const updatedList = isCurrentlyEnabled
        ? currentRoleList.filter((p) => p !== permissionKey) // Remove (Toggle OFF)
        : [...currentRoleList, permissionKey]; // Add (Toggle ON)

      return {
        ...prev,
        [roleName]: updatedList,
      };
    });
  };

  // ==========================================================================
  // 5. EXISTING DYNAMIC HYDRATION & CRUD (DO NOT MODIFY)
  // ==========================================================================
  const activeHydratedTrucks = trucks.map((truck) => {
    const driver = users.find((u) => u.userId === truck.assignedDriverId);
    return {
      ...truck,
      driverName: driver ? driver.name : "Unassigned",
      driverLicense: driver ? driver.licenseNo : "N/A",
    };
  });

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

  const getDriverOptions = () => {
    return users.filter((user) => user.roleId === 3 && user.isActive);
  };

  const resetData = () => {
    setUsers(allUsers);
    setTrucks(rawTrucks);
    setRolePermissions(initialPermissions);
    localStorage.removeItem("mockApp_users");
    localStorage.removeItem("mockApp_trucks");
    localStorage.removeItem("mockApp_permissions");
  };

  // ==========================================================================
  // 6. DASHBOARD METRICS
  // ==========================================================================
  const lastRecord = salesRecords[salesRecords.length - 1];
  const dashboardMetrics = {
    grossIncome: lastRecord?.totalGrossSales || 0,
    costPerCan: (lastRecord?.totalGrossSales / lastRecord?.fuelConsumption || 0).toFixed(2),
    totalUsers: users.length,
    totalTrucks: activeHydratedTrucks.length,
    availableTrucksCount: activeHydratedTrucks.filter((t) => t.status === "AVAILABLE").length,
    trucksUnderMaintenanceCount: activeHydratedTrucks.filter((t) => t.status === "UNDER_MAINTENANCE").length,
    availableTrucksList: activeHydratedTrucks.filter((t) => t.status === "AVAILABLE"),
    maintenanceTrucksList: activeHydratedTrucks.filter((t) => t.status === "UNDER_MAINTENANCE"),
  };

  // ==========================================================================
  // 7. EXPORTING THE CONTEXT
  // ==========================================================================
  const value = {
    users,
    trucks: activeHydratedTrucks,
    salesRecords,
    getSalesByPeriod,
    dashboardMetrics,
    rolePermissions,       // NEW
    updateRolePermissions, // NEW
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
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};
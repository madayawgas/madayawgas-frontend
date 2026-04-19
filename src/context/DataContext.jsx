// src/context/DataContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";

// Import your initial static mock data
import { allUsers, roles as initialRoles, PERMISSIONS as initialPermissions } from "../data/userMockData";
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

  const [roles, setRoles] = useState(() => {
    const savedRoles = localStorage.getItem("mockApp_roles");
    return savedRoles ? JSON.parse(savedRoles) : initialRoles;
  });

  const [permissions, setPermissions] = useState(() => {
    const savedPermissions = localStorage.getItem("mockApp_permissions");
    return savedPermissions ? JSON.parse(savedPermissions) : initialPermissions;
  });

  const [trucks, setTrucks] = useState(() => {
    const savedTrucks = localStorage.getItem("mockApp_trucks");
    return savedTrucks ? JSON.parse(savedTrucks) : rawTrucks;
  });

  const [salesRecords] = useState(allSalesRecords);

  // ==========================================================================
  // 2. SALES DATA HELPERS
  // ==========================================================================

  /**
   * Filter and aggregate sales data based on period
   * @param {string} period - "weekly", "monthly", "annual"
   */
  const getSalesByPeriod = (period) => {
    const now = new Date("2026-04-13"); // Context current date

    let filtered = [...salesRecords];

    if (period === "weekly") {
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 14); // 2 weeks back
      filtered = salesRecords.filter((r) => new Date(r.date) >= lastWeek);
    } else if (period === "monthly") {
      const lastYear = new Date(now);
      lastYear.setFullYear(now.getFullYear() - 1);
      filtered = salesRecords.filter((r) => new Date(r.date) >= lastYear);
    }

    return filtered.map((record) => ({
      ...record,
      // Cost per can: gross sales / fuel consumption (as requested)
      costPerCan: (record.totalGrossSales / record.fuelConsumption).toFixed(2),
      // Fuel efficiency
      salesPerLiter: (record.totalGrossSales / record.fuelConsumption).toFixed(
        2,
      ),
    }));
  };

  // ==========================================================================
  // 3. LOCAL STORAGE SYNC
  // ==========================================================================
  useEffect(() => {
    localStorage.setItem("mockApp_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("mockApp_roles", JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem("mockApp_permissions", JSON.stringify(permissions));
  }, [permissions]);

  useEffect(() => {
    localStorage.setItem("mockApp_trucks", JSON.stringify(trucks));
  }, [trucks]);

  // ==========================================================================
  // 4. DYNAMIC HYDRATION (Trucks)
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
  // 5. CRUD METHODS
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

  // ROLE & PERMISSION METHODS
  const updateRolePermissions = (roleName, newPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [roleName]: newPermissions,
    }));
  };

  const toggleRolePermission = (roleName, permission) => {
    setPermissions((prev) => {
      const current = prev[roleName] || [];
      const updated = current.includes(permission)
        ? current.filter((p) => p !== permission)
        : [...current, permission];
      return { ...prev, [roleName]: updated };
    });
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

  const getDriverOptions = () => {
    return users.filter((user) => user.roleId === 3 && user.isActive);
  };

  const resetData = () => {
    setUsers(allUsers);
    setTrucks(rawTrucks);
    setRoles(initialRoles);
    setPermissions(initialPermissions);
    localStorage.removeItem("mockApp_users");
    localStorage.removeItem("mockApp_trucks");
    localStorage.removeItem("mockApp_roles");
    localStorage.removeItem("mockApp_permissions");
  };

  // ==========================================================================
  // 6. LIVE DASHBOARD METRICS
  // ==========================================================================
  const lastRecord = salesRecords[salesRecords.length - 1];

  const dashboardMetrics = {
    grossIncome: lastRecord?.totalGrossSales || 0,
    costPerCan: (lastRecord?.totalGrossSales / lastRecord?.fuelConsumption || 0).toFixed(2),
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
  // 7. EXPORTING THE CONTEXT
  // ==========================================================================
  const value = {
    users,
    roles,
    permissions,
    trucks: activeHydratedTrucks,
    salesRecords,
    getSalesByPeriod,
    dashboardMetrics,

    addUser,
    updateUser,
    deleteUser,

    updateRolePermissions,
    toggleRolePermission,

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

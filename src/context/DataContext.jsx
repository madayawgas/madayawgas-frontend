import React, { createContext, useState, useEffect, useContext } from "react";

// ============================================================================
// MOCK DATA IMPORTS
// ============================================================================
import {
  allUsers,
  PERMISSIONS,
  roles as rolesData,
} from "../data/userMockData";
import { trucks as rawTrucks } from "../data/truckMockData";
import {
  allSalesRecords,
  weeklySales as mockWeeklySales,
  monthlySales as mockMonthlySales,
  annualSales as mockAnnualSales,
} from "../data/salesMockData";
import { getDashboardMetrics } from "../data/dashboardMockData";

// ============================================================================
// CONTEXT SETUP
// ============================================================================
const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // ==========================================================================
  // AUTH STATE
  // ==========================================================================
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("madayaw_active_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(!!currentUser);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("madayaw_active_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("madayaw_active_user");
    }
  }, [currentUser]);

  // ==========================================================================
  // AUTH METHODS
  // ==========================================================================
  const login = (username, password) => {
    const user = users.find(
      (u) => u.username === username && u.password === password,
    );

    if (!user) {
      return { success: false, message: "Invalid username or password" };
    }

    if (!user.isActive) {
      return { success: false, message: "Account disabled" };
    }

    const hydratedUser = {
      ...user,
      roleName: rolesReverseMap[user.roleId],
    };

    setCurrentUser(hydratedUser);
    setIsAuthenticated(true);

    localStorage.setItem("madayaw_active_user", JSON.stringify(hydratedUser));

    return { success: true, user: hydratedUser };
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("madayaw_active_user");
  };

  const hasPermission = (moduleName) => {
    if (!currentUser?.roleName) return false;
    const userPermissions = permissions[currentUser.roleName] || [];
    return userPermissions.includes(moduleName);
  };

  // ==========================================================================
  // ROLE MAPPING HELPERS
  // ==========================================================================
  const roleMap = {
    Admin: 1,
    Manager: 2,
    Driver: 3,
    ADMIN: 1,
    FLEET_MANAGER: 2,
    DRIVER: 3,
  };

  const rolesReverseMap = {
    1: "ADMIN",
    2: "FLEET_MANAGER",
    3: "DRIVER",
  };

  // ==========================================================================
  // APPLICATION STATE (USERS / ROLES / PERMISSIONS / TRUCKS)
  // ==========================================================================
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem("mockApp_users");
    const parsed = saved ? JSON.parse(saved) : allUsers;

    return parsed.map((u) => {
      const updated = { ...u };

      // Migration: name -> firstName/lastName
      if (u.name && !u.firstName) {
        const parts = u.name.split(" ");
        updated.firstName = parts[0];
        updated.lastName = parts.slice(1).join(" ");
        updated.name = undefined;
      }

      // Migration: role string -> roleId
      if (u.role && !u.roleId) {
        updated.roleId = roleMap[u.role] || 3;
      }

      return updated;
    });
  });

  const [roles, setRoles] = useState(() => {
    const saved = localStorage.getItem("mockApp_roles");
    return saved ? JSON.parse(saved) : rolesData;
  });

  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem("mockApp_permissions");
    return saved ? JSON.parse(saved) : PERMISSIONS;
  });

  const [trucks, setTrucks] = useState(() => {
    const saved = localStorage.getItem("mockApp_trucks");
    return saved ? JSON.parse(saved) : rawTrucks;
  });

  const [salesRecords] = useState(allSalesRecords);

  // ==========================================================================
  // SALES HELPERS
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
      salesPerLiter: (record.totalGrossSales / record.fuelConsumption).toFixed(
        2,
      ),
    }));
  };

  // ==========================================================================
  // LOCAL STORAGE SYNC
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
  // HYDRATED TRUCK DATA
  // ==========================================================================
  const activeHydratedTrucks = trucks.map((truck) => {
    const driver = users.find((u) => u.userId === truck.assignedDriverId);

    return {
      ...truck,
      driverName: driver
        ? `${driver.firstName || ""} ${driver.lastName || ""}`.trim() ||
          "Unknown Driver"
        : "Unassigned",
      driverLicense: driver ? driver.licenseNo : "N/A",
    };
  });

  // ==========================================================================
  // USER CRUD
  // ==========================================================================
  const addUser = (userData) => {
    const roleId = roleMap[userData.role] || 3;

    const generatedUsername = `${userData.firstName
      .charAt(0)
      .toLowerCase()}${userData.lastName.replace(/\s+/g, "").toLowerCase()}`;

    const newUser = {
      ...userData,
      roleId,
      username: userData.username || generatedUsername,
      userId: Date.now(),
      isActive: true,
      dateCreated: new Date().toISOString().split("T")[0],
    };

    setUsers((prev) => [...prev, newUser]);
  };

  const updateUser = (userId, updatedData) => {
    const mappedUpdate = { ...updatedData };

    if (updatedData.role) {
      mappedUpdate.roleId = roleMap[updatedData.role] || updatedData.roleId;
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.userId === userId ? { ...user, ...mappedUpdate } : user,
      ),
    );
  };

  const deleteUser = (userId) => {
    setUsers((prev) => prev.filter((user) => user.userId !== userId));
  };

  // ==========================================================================
  // ROLE & PERMISSION MANAGEMENT
  // ==========================================================================
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

  // ==========================================================================
  // TRUCK CRUD
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
  // DRIVER UTILITIES
  // ==========================================================================
  const getDriverOptions = (currentDriverId = null) => {
    const assignedDriverIds = trucks
      .map((t) => t.assignedDriverId)
      .filter((id) => id && id !== currentDriverId);

    return users.filter(
      (user) =>
        user.roleId === 3 &&
        user.isActive &&
        !assignedDriverIds.includes(user.userId),
    );
  };

  const resetData = () => {
    setUsers(allUsers);
    setTrucks(rawTrucks);
    setRoles(rolesData);
    setPermissions(PERMISSIONS);

    localStorage.removeItem("mockApp_users");
    localStorage.removeItem("mockApp_trucks");
    localStorage.removeItem("mockApp_roles");
    localStorage.removeItem("mockApp_permissions");
  };

  // ==========================================================================
  // DASHBOARD DATA
  // ==========================================================================
  const weeklySales = mockWeeklySales;
  const monthlySales = mockMonthlySales;
  const annualSales = mockAnnualSales;

  const dashboardMetrics = getDashboardMetrics(users, activeHydratedTrucks);

  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================
  const value = {
    currentUser,
    isAuthenticated,
    login,
    logout,
    hasPermission,

    users,
    roles,
    permissions,
    trucks: activeHydratedTrucks,
    salesRecords,
    dashboardMetrics,
    weeklySales,
    monthlySales,
    annualSales,

    getSalesByPeriod,

    addUser,
    updateUser,
    deleteUser,

    addTruck,
    updateTruck,
    deleteTruck,
    updateTruckStatus,

    getDriverOptions,

    updateRolePermissions,
    toggleRolePermission,

    resetData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};;

// ============================================================================
// CONTEXT HOOK
// ============================================================================
export const useData = () => {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }

  return context;
};

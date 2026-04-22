import React, { createContext, useState, useEffect, useContext } from "react";

// ============================================================================
// MOCK DATA IMPORTS
// ============================================================================
import {
  allUsers,
  PERMISSIONS,
  roles as rolesData,
} from "../data/userMockData";
import { allHydratedTrucks } from "../data/truckMockData";
import {
  weeklySales as mockWeeklySales,
  monthlySales as mockMonthlySales,
  annualSales as mockAnnualSales,
} from "../data/salesMockData";
import { getDashboardMetrics } from "../data/dashboardMetrics";

// ============================================================================
// CONTEXT SETUP
// ============================================================================
const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // ==========================================================================
  // HELPERS & MAPPINGS
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

  const formatName = (name) => {
    if (!name) return "";
    return name
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("madayaw_active_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(!!currentUser);

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem("mockApp_users");
    return saved ? JSON.parse(saved) : allUsers;
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
    return saved ? JSON.parse(saved) : allHydratedTrucks;
  });

  // ==========================================================================
  // SYNC & PERSISTENCE
  // ==========================================================================
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("madayaw_active_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("madayaw_active_user");
    }
  }, [currentUser]);

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
    return { success: true, user: hydratedUser };
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (moduleName) => {
    if (!currentUser?.roleName) return false;
    const userPermissions = permissions[currentUser.roleName] || [];
    return userPermissions.includes(moduleName);
  };

  // ==========================================================================
  // USER CRUD
  // ==========================================================================
  const addUser = (userData) => {
    const roleId = roleMap[userData.role] || 3;
    const firstName = formatName(userData.firstName);
    const lastName = formatName(userData.lastName);

    const generatedUsername = `${firstName.charAt(0).toLowerCase()}${lastName
      .replace(/\s+/g, "")
      .toLowerCase()}`;

    const newUser = {
      ...userData,
      firstName,
      lastName,
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

    if (updatedData.firstName) mappedUpdate.firstName = formatName(updatedData.firstName);
    if (updatedData.lastName) mappedUpdate.lastName = formatName(updatedData.lastName);

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

  // ==========================================================================
  // HYDRATION (Dynamic joins)
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

  const resetData = () => {
    setUsers(allUsers);
    setTrucks(allHydratedTrucks);
    setRoles(rolesData);
    setPermissions(PERMISSIONS);

    localStorage.removeItem("mockApp_users");
    localStorage.removeItem("mockApp_trucks");
    localStorage.removeItem("mockApp_roles");
    localStorage.removeItem("mockApp_permissions");
    localStorage.removeItem("madayaw_active_user");
  };

  // ==========================================================================
  // EXPORT VALUE
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
    dashboardMetrics: getDashboardMetrics(activeHydratedTrucks),
    weeklySales: mockWeeklySales,
    monthlySales: mockMonthlySales,
    annualSales: mockAnnualSales,

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
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

import React, { createContext, useState, useEffect, useContext } from "react";

// Import your initial static mock data
import { allUsers, PERMISSIONS, roles as rolesData } from "../data/userMockData"; 
import { trucks as rawTrucks } from "../data/truckMockData";
import { allSalesRecords } from "../data/salesMockData";

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // ==========================================================================
  // 1. AUTHENTICATION STATE
  // ==========================================================================
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("madayaw_active_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!currentUser);

  // ==========================================================================
  // 2. APPLICATION DATA STATE
  // ==========================================================================
  const [users, setUsers] = useState(() => {
    const savedUsers = localStorage.getItem("mockApp_users");
    return savedUsers ? JSON.parse(savedUsers) : allUsers;
  });

  const [roles, setRoles] = useState(() => {
    const savedRoles = localStorage.getItem("mockApp_roles");
    return savedRoles ? JSON.parse(savedRoles) : rolesData;
  });

  const [permissions, setPermissions] = useState(() => {
    const savedPermissions = localStorage.getItem("mockApp_permissions");
    return savedPermissions ? JSON.parse(savedPermissions) : PERMISSIONS;
  });

  const [trucks, setTrucks] = useState(() => {
    const savedTrucks = localStorage.getItem("mockApp_trucks");
    return savedTrucks ? JSON.parse(savedTrucks) : rawTrucks;
  });

  const [salesRecords] = useState(allSalesRecords);

  // ==========================================================================
  // 3. AUTHENTICATION METHODS
  // ==========================================================================
  const login = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      if (!user.isActive) return { success: false, message: "Account disabled" };
      
      // Attach the Role Name for easier RBAC later
      const rolesMap = { 1: "ADMIN", 2: "FLEET_MANAGER", 3: "DRIVER" };
      const hydratedUser = { ...user, roleName: rolesMap[user.roleId] };

      setCurrentUser(hydratedUser);
      setIsAuthenticated(true);
      localStorage.setItem("madayaw_active_user", JSON.stringify(hydratedUser));
      return { success: true, user: hydratedUser };
    }
    return { success: false, message: "Invalid username or password" };
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("madayaw_active_user");
  };

  const hasPermission = (moduleName) => {
    if (!currentUser || !currentUser.roleName) return false;
    const userPermissions = PERMISSIONS[currentUser.roleName] || [];
    return userPermissions.includes(moduleName);
  };

  // ==========================================================================
  // 4. SALES DATA HELPERS
  // ==========================================================================
  const getSalesByPeriod = (period) => {
    const now = new Date("2026-04-13"); // Remember to change to new Date() for production!

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
      costPerCan: (record.totalGrossSales / record.fuelConsumption).toFixed(2),
      salesPerLiter: (record.totalGrossSales / record.fuelConsumption).toFixed(2),
    }));
  };

  // ==========================================================================
  // 5. LOCAL STORAGE SYNC (For CRUD persistence)
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
  // 6. DYNAMIC HYDRATION (Trucks) & CRUD
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
    setRoles(rolesData);
    setPermissions(PERMISSIONS);
    localStorage.removeItem("mockApp_users");
    localStorage.removeItem("mockApp_trucks");
    localStorage.removeItem("mockApp_roles");
    localStorage.removeItem("mockApp_permissions");
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
    // Auth & Permissions
    currentUser,
    isAuthenticated,
    login,
    logout,
    hasPermission,

    // Data
    users,
    roles,
    permissions,
    trucks: activeHydratedTrucks,
    salesRecords,
    dashboardMetrics,
    weeklySales,
    monthlySales,
    annualSales,

    // Methods
    getSalesByPeriod,
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
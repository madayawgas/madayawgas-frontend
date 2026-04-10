// mockDatabase.js

// ============================================================================
// 1. RBAC (ROLE-BASED ACCESS CONTROL) DATA
// ============================================================================

export const pagePermissions = [
  { id: 1, code: "PAGE_DASHBOARD", title: "Dashboard" },
  { id: 2, code: "PAGE_FLEET", title: "Fleet and Maintenance" },
  { id: 3, code: "PAGE_DISPATCH", title: "Route Dispatch" },
  { id: 4, code: "PAGE_INVENTORY", title: "Inventory" },
  { id: 5, code: "PAGE_SALES", title: "Sales and Deliver" },
  { id: 6, code: "PAGE_USERS", title: "Manage Users" },
];

export const roles = [
  {
    roleId: 1,
    roleName: "ADMIN",
    // Admin gets everything
    permissionCodes: [
      "PAGE_DASHBOARD",
      "PAGE_FLEET",
      "PAGE_DISPATCH",
      "PAGE_INVENTORY",
      "PAGE_SALES",
      "PAGE_USERS",
    ],
  },
  {
    roleId: 2,
    roleName: "FLEET_MANAGER",
    // Fleet Manager gets Fleet, Dispatch, and Inventory
    permissionCodes: ["PAGE_FLEET", "PAGE_DISPATCH", "PAGE_INVENTORY"],
  },
  {
    roleId: 3,
    roleName: "DRIVER",
    // Driver gets Sales & Deliveries
    permissionCodes: ["PAGE_SALES"],
  },
];

export const users = [
  { userId: 101, name: "Juan (Admin)", roleId: 1, isActive: true },
  { userId: 102, name: "Maria (Fleet Mgr)", roleId: 2, isActive: true },
  { userId: 103, name: "Andres (Driver)", roleId: 3, isActive: true },
];

// ============================================================================
// 2. FLEET & MAINTENANCE DATA (For the Fleet Page)
// ============================================================================

export const trucks = [
  {
    truckId: 1,
    plateNumber: "ABC-1234",
    model: "Isuzu Elf",
    status: "AVAILABLE",
  },
  {
    truckId: 2,
    plateNumber: "XYZ-9876",
    model: "Mitsubishi Fuso",
    status: "UNDER_MAINTENANCE",
  },
  {
    truckId: 3,
    plateNumber: "DEF-4567",
    model: "Hino 300",
    status: "AVAILABLE",
  },
];

export const workOrders = [
  {
    workOrderId: 1001,
    truckId: 2,
    status: "IN_PROGRESS",
    description: "Replace radiator",
  },
  {
    workOrderId: 1002,
    truckId: 3,
    status: "SCHEDULED",
    description: "Standard 10k PMS",
  },
];

// ============================================================================
// 3. EXPOSED HELPERS FOR BEGINNERS
// ============================================================================

// --- USER & AUTHENTICATION HELPERS ---
export const getHydratedUsers = () => {
  return users.map((user) => {
    const role = roles.find((r) => r.roleId === user.roleId);
    return {
      ...user,
      roleName: role.roleName,
      permissions: role.permissionCodes,
    };
  });
};

export const allUsers = getHydratedUsers();

// Simulating the currently logged-in user (Change the index 0, 1, or 2 to test pages!)
export const currentUser = allUsers[0]; // 0 = Admin, 1 = Fleet Mgr, 2 = Driver

// The magic function to check if the current user can see a page
export const canAccessPage = (user, pageCode) => {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(pageCode);
};

// --- DATA HELPERS FOR THE PAGES ---

// 1. Dashboard Helper (Only Admin sees this)
export const getDashboardMetrics = () => {
  return {
    totalUsers: users.length,
    totalTrucks: trucks.length,
    trucksUnderMaintenance: trucks.filter(
      (t) => t.status === "UNDER_MAINTENANCE",
    ).length,
    activeWorkOrders: workOrders.filter((w) => w.status === "IN_PROGRESS")
      .length,
  };
};

// 2. Fleet Helper (Admin & Fleet Manager see this)
export const getTrucksWithMaintenance = () => {
  return trucks.map((truck) => {
    const schedules = workOrders.filter((w) => w.truckId === truck.truckId);
    return { ...truck, schedules };
  });
};

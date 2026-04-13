// src/data/userMockData.js

export const PERMISSIONS = {
  ADMIN: [
    "dashboard",
    "fleet",
    "route-dispatch",
    "inventory",
    "sales-delivery",
    "users",
  ],
  FLEET_MANAGER: ["dashboard", "fleet", "route-dispatch", "inventory"],
  DRIVER: ["sales-delivery"],
};

export const roles = [
  { roleId: 1, roleName: "ADMIN" },
  { roleId: 2, roleName: "FLEET_MANAGER" },
  { roleId: 3, roleName: "DRIVER" },
];

export const users = [
  // Management
  {
    userId: 1,
    name: "Juan Dela Cruz",
    roleId: 1,
    username: "admin_juan",
    password: "password123",
    isActive: true,
  },
  {
    userId: 2,
    name: "Maria Clara",
    roleId: 2,
    username: "manager_maria",
    password: "password123",
    isActive: true,
  },

  // Drivers
  {
    userId: 3,
    name: "Andres Bonifacio",
    roleId: 3,
    username: "driver_andres",
    password: "password123",
    isActive: true,
    licenseNo: "N01-12-345678",
  },
  {
    userId: 4,
    name: "Jose Rizal",
    roleId: 3,
    username: "driver_jose",
    password: "password123",
    isActive: true,
    licenseNo: "N02-34-567890",
  },
  {
    userId: 5,
    name: "Apolinario Mabini",
    roleId: 3,
    username: "driver_apol",
    password: "password123",
    isActive: true,
    licenseNo: "N03-56-789012",
  },
  {
    userId: 6,
    name: "Emilio Aguinaldo",
    roleId: 3,
    username: "driver_emilio",
    password: "password123",
    isActive: true,
    licenseNo: "N04-78-901234",
  },
  {
    userId: 7,
    name: "Antonio Luna",
    roleId: 3,
    username: "driver_antonio",
    password: "password123",
    isActive: true,
    licenseNo: "N05-90-123456",
  },
];

// Helper to get users with their role names attached
export const getHydratedUsers = () => {
  return users.map((user) => {
    const role = roles.find((r) => r.roleId === user.roleId);
    return { ...user, roleName: role ? role.roleName : "UNKNOWN" };
  });
};

export const allUsers = getHydratedUsers();

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
  FLEET_MANAGER: ["fleet", "route-dispatch", "inventory"],
  DRIVER: ["sales-delivery", "inventory"],
};

export const roles = [
  { roleId: 1, roleName: "ADMIN" },
  { roleId: 2, roleName: "FLEET_MANAGER" },
  { roleId: 3, roleName: "DRIVER" },
];

const rawUsers = [
  // Management
  {
    userId: 1,
    firstName: "Juan",
    lastName: "Dela Cruz",
    contactNumber: "09123456789",
    role: "Admin",
    dateCreated: "2024-01-15",
    roleId: 1,
    username: "admin_juan",
    password: "password123",
    isActive: true,
  },
  {
    userId: 2,
    firstName: "Maria",
    lastName: "Clara",
    contactNumber: "09234567890",
    role: "Manager",
    dateCreated: "2024-02-10",
    roleId: 2,
    username: "manager_maria",
    password: "password123",
    isActive: true,
  },

  // Drivers
  {
    userId: 3,
    firstName: "Andres",
    lastName: "Bonifacio",
    contactNumber: "09345678901",
    role: "Driver",
    dateCreated: "2024-03-05",
    roleId: 3,
    username: "driver_andres",
    password: "password123",
    isActive: true,
    licenseNo: "N01-12-345678",
  },
  {
    userId: 4,
    firstName: "Jose",
    lastName: "Rizal",
    contactNumber: "09456789012",
    role: "Driver",
    dateCreated: "2024-03-12",
    roleId: 3,
    username: "driver_jose",
    password: "password123",
    isActive: true,
    licenseNo: "N02-34-567890",
  },
  {
    userId: 5,
    firstName: "Apolinario",
    lastName: "Mabini",
    contactNumber: "09567890123",
    role: "Driver",
    dateCreated: "2024-03-20",
    roleId: 3,
    username: "driver_apol",
    password: "password123",
    isActive: true,
    licenseNo: "N03-56-789012",
  },
  {
    userId: 6,
    firstName: "Emilio",
    lastName: "Aguinaldo",
    contactNumber: "09678901234",
    role: "Driver",
    dateCreated: "2024-03-25",
    roleId: 3,
    username: "driver_emilio",
    password: "password123",
    isActive: true,
    licenseNo: "N04-78-901234",
  },
  {
    userId: 7,
    firstName: "Antonio",
    lastName: "Luna",
    contactNumber: "09789012345",
    role: "Driver",
    dateCreated: "2024-04-01",
    roleId: 3,
    username: "driver_antonio",
    password: "password123",
    isActive: true,
    licenseNo: "N05-90-123456",
  },
];

// Hydrate users with role names
export const allUsers = rawUsers.map((user) => {
  const role = roles.find((r) => r.roleId === user.roleId);
  return {
    ...user,
    roleName: role ? role.roleName : "UNKNOWN",
  };
});

// src/utils/permissions.js

/**
 * System Permissions constant dictionary matching backend permissions.
 */
export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  FLEET_VIEW: "fleet.view",
  FLEET_MANAGE: "fleet.manage",
  ROUTE_VIEW: "route.view",
  ROUTE_VIEW_OWN: "route.view_own",
  ROUTE_MANAGE: "route.manage",
  INVENTORY_VIEW: "inventory.view",
  INVENTORY_MANAGE: "inventory.manage",
  SALES_VIEW: "sales.view",
  SALES_VIEW_OWN: "sales.view_own",
  SALES_CREATE: "sales.create",
  SALES_UPDATE: "sales.update",
  SALES_DELETE: "sales.delete",
  DELIVERY_VIEW: "delivery.view",
  DELIVERY_VIEW_OWN: "delivery.view_own",
  DELIVERY_UPDATE: "delivery.update",
  DELIVERY_UPDATE_OWN: "delivery.update_own",
  USERS_VIEW: "users.view",
  USERS_MANAGE: "users.manage",
};

/**
 * Check if a user has a specific permission.
 *
 * @param {object|null} user - The user object containing a `permissions` array
 * @param {string} permission - The permission string to check
 * @returns {boolean} True if the user has the specified permission
 */
export function can(user, permission) {
  if (!user || !Array.isArray(user.permissions)) return false;
  return user.permissions.includes(permission);
}

/**
 * Check if a user has ALL permissions in a list.
 *
 * @param {object|null} user - The user object containing a `permissions` array
 * @param {string[]} permissionsList - Array of required permission strings
 * @returns {boolean} True if the user has ALL of the specified permissions
 */
export function canAll(user, permissionsList = []) {
  if (!user || !Array.isArray(user.permissions)) return false;
  return permissionsList.every((p) => user.permissions.includes(p));
}

/**
 * Check if a user has AT LEAST ONE permission in a list.
 *
 * @param {object|null} user - The user object containing a `permissions` array
 * @param {string[]} permissionsList - Array of permission strings to test
 * @returns {boolean} True if the user has AT LEAST ONE of the specified permissions
 */
export function canAny(user, permissionsList = []) {
  if (!user || !Array.isArray(user.permissions)) return false;
  return permissionsList.some((p) => user.permissions.includes(p));
}

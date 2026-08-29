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
  HISTORY_VIEW: "history.view",
  HISTORY_MANAGE: "history.manage",
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

/**
 * Determine the optimal landing page for a user based on their granted permissions.
 *
 * @param {object|null} user
 * @returns {string} Target path (e.g. '/dashboard', '/sales-delivery', '/fleet')
 */
export function getDefaultRoute(user) {
  if (!user || !Array.isArray(user.permissions)) return "/login";
  if (can(user, PERMISSIONS.DASHBOARD_VIEW)) return "/dashboard";
  if (can(user, PERMISSIONS.SALES_VIEW) || can(user, PERMISSIONS.SALES_VIEW_OWN)) return "/sales-delivery";
  if (can(user, PERMISSIONS.FLEET_VIEW)) return "/fleet";
  if (can(user, PERMISSIONS.ROUTE_VIEW) || can(user, PERMISSIONS.ROUTE_VIEW_OWN)) return "/route-dispatch";
  if (can(user, PERMISSIONS.INVENTORY_VIEW)) return "/inventory";
  if (can(user, PERMISSIONS.USERS_VIEW)) return "/users";
  if (can(user, PERMISSIONS.HISTORY_VIEW)) return "/history-log";
  return "/dashboard";
}

// src/utils/userRoles.js

/**
 * Normalizes a role entry to a trimmed string.
 *
 * @param {string|object} role
 * @returns {string}
 */
function normalizeRoleName(role) {
  if (!role) return "";
  if (typeof role === "string") return role.trim();
  if (typeof role === "object" && role.name) return String(role.name).trim();
  return "";
}

/**
 * Extracts an array of unique role names from a user object, supporting multi-role structures.
 * Prioritizes `user.roles` or `user.roleNames`, falling back to `user.role` if the array is absent or empty.
 *
 * @param {object|null} user - The user entity or form object
 * @param {string} [fallback="User"] - Default role if no roles are identified
 * @returns {string[]} Array of role names
 */
export function getUserRoleNames(user, fallback = "User") {
  if (!user) return fallback ? [fallback] : [];

  const foundRoles = [];

  // 1. Check user.roleNames (array of strings)
  if (Array.isArray(user.roleNames) && user.roleNames.length > 0) {
    user.roleNames.forEach((r) => {
      const name = normalizeRoleName(r);
      if (name && !foundRoles.includes(name)) {
        foundRoles.push(name);
      }
    });
  }

  // 2. Check user.roles (array of role objects or strings)
  if (foundRoles.length === 0 && Array.isArray(user.roles) && user.roles.length > 0) {
    user.roles.forEach((r) => {
      const name = normalizeRoleName(r);
      if (name && !foundRoles.includes(name)) {
        foundRoles.push(name);
      }
    });
  }

  // 3. Fallback to user.role (string or object)
  if (foundRoles.length === 0 && user.role) {
    const singleRole = normalizeRoleName(user.role);
    if (singleRole) {
      foundRoles.push(singleRole);
    }
  }

  if (foundRoles.length > 0) {
    return foundRoles;
  }

  return fallback ? [fallback] : [];
}

/**
 * Returns formatted comma-separated role names for plain text display.
 * (e.g. "Sales Supervisor, Logistics Supervisor")
 *
 * @param {object|null} user - The user entity or form object
 * @param {string} [fallback="User"] - Default role if no roles are identified
 * @returns {string}
 */
export function formatUserRoles(user, fallback = "User") {
  const roles = getUserRoleNames(user, fallback);
  return roles.join(", ");
}

/**
 * Checks whether a user possesses a specific role name (case-insensitive).
 *
 * @param {object|null} user
 * @param {string} roleName
 * @returns {boolean}
 */
export function hasUserRole(user, roleName) {
  if (!user || !roleName) return false;
  const target = roleName.trim().toLowerCase();
  const roles = getUserRoleNames(user, "");
  return roles.some((r) => r.toLowerCase() === target);
}

/**
 * Checks if a user possesses the Super Admin role.
 *
 * @param {object|null} user
 * @returns {boolean}
 */
export function isSuperAdminUser(user) {
  return hasUserRole(user, "Super Admin");
}

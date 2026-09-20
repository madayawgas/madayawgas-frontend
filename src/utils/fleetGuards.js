// src/utils/fleetGuards.js
import { PERMISSIONS } from "./permissions.js";

export const ACTIVE_RESTRICTED_TOOLTIP =
  "Cannot set to Active while Work Order is in progress";

export const ACTIVE_RESTRICTED_ERROR =
  "Cannot activate vehicle: This truck is currently linked to an ongoing work order. Complete or cancel the work order first.";

/**
 * Checks whether a user has executive administrative authority to approve/reject
 * high-cost work orders (₱5,000 threshold).
 * Allowed roles: Super Admin, Admin, or any user possessing `users.manage` permission.
 *
 * @param {object|null} user - Current user object
 * @param {Function} [canFn] - `can` permission checker function from useAuth()
 * @returns {boolean}
 */
export function canApproveWorkOrderCost(user, canFn) {
  if (!user) return false;
  const role = (user.role || "").toUpperCase();
  const isAdminRole = role.includes("ADMIN");
  const hasManagePermission = Boolean(
    canFn
      ? canFn(PERMISSIONS?.USERS_MANAGE || "users.manage")
      : user.permissions?.includes("users.manage")
  );
  return isAdminRole || hasManagePermission;
}

/**
 * Checks whether a truck is currently undergoing an active / unresolved work order.
 * Active work order statuses: PENDING, APPROVED, SCHEDULED, IN_PROGRESS.
 *
 * @param {object} truck - Truck object to inspect
 * @param {Array} [workOrders] - Optional collection of work orders
 * @returns {{ hasActiveWorkOrder: boolean, activeWorkOrder: object|null }}
 */
export function checkActiveWorkOrder(truck, workOrders = []) {
  if (!truck) return { hasActiveWorkOrder: false, activeWorkOrder: null };

  // 1. Direct explicit flags from backend / enriched truck object
  if (truck.hasActiveWorkOrder) {
    return {
      hasActiveWorkOrder: true,
      activeWorkOrder: truck.activeWorkOrder || null,
    };
  }

  if (
    truck.activeWorkOrder &&
    !["COMPLETED", "CANCELLED"].includes(truck.activeWorkOrder.status)
  ) {
    return {
      hasActiveWorkOrder: true,
      activeWorkOrder: truck.activeWorkOrder,
    };
  }

  // 2. Check workOrders collection if available
  const truckId = truck.id || truck.truckId;
  const plate = truck.plateNumber;

  if (Array.isArray(workOrders) && workOrders.length > 0) {
    const found = workOrders.find((wo) => {
      const matchesId =
        truckId && (wo.truckId === truckId || wo.truck?.id === truckId);
      const matchesPlate =
        plate && (wo.plateNumber === plate || wo.truck?.plateNumber === plate);
      const isOpen = !["COMPLETED", "CANCELLED"].includes(wo.status);
      return (matchesId || matchesPlate) && isOpen;
    });

    if (found) {
      return { hasActiveWorkOrder: true, activeWorkOrder: found };
    }
  }

  // 3. Fallback: inspect activeRepair string if it references an ongoing work order
  if (
    typeof truck.activeRepair === "string" &&
    truck.activeRepair.toLowerCase().includes("work order")
  ) {
    return {
      hasActiveWorkOrder: true,
      activeWorkOrder: {
        description: truck.activeRepair,
        status: "IN_PROGRESS",
      },
    };
  }

  return { hasActiveWorkOrder: false, activeWorkOrder: null };
}

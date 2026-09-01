import { useState, useMemo, useEffect } from "react";
import UsersHeader from "../../components/users/UsersHeader";
import UsersControls from "../../components/users/UsersControls";
import UsersTable from "../../components/users/UsersTable";
import DeactivateUserModal from "../../components/users/DeactivateUserModal";
import ReactivateUserModal from "../../components/users/ReactivateUserModal";
import ResetPasswordModal from "../../components/users/ResetPasswordModal";
import AdminPasswordModal from "../../components/users/AdminPasswordModal";
import CreatedCredentialsModal from "../../components/users/CreatedCredentialsModal";
import UserModal from "../../components/users/UserModal";
import PermissionsModal from "../../components/users/PermissionsModal";
import SavedChangesToast from "../../components/ui/SavedChangesToast";
import { useAuth } from "../../context/AuthContext.jsx";
import { usersApi } from "../../api/users.js";
import { PERMISSIONS } from "../../utils/permissions.js";

const LOCAL_STORAGE_KEY = "app_users_cache";

const INITIAL_PERMISSIONS_MAP = {
  "Super Admin": [
    PERMISSIONS?.FLEET_VIEW || "fleet.view",
    PERMISSIONS?.ROUTE_VIEW || "route.view",
    PERMISSIONS?.INVENTORY_VIEW || "inventory.view",
    PERMISSIONS?.SALES_VIEW || "sales.view",
    PERMISSIONS?.USERS_VIEW || "users.view",
  ],
  "Admin": [
    PERMISSIONS?.FLEET_VIEW || "fleet.view",
    PERMISSIONS?.ROUTE_VIEW || "route.view",
    PERMISSIONS?.INVENTORY_VIEW || "inventory.view",
    PERMISSIONS?.SALES_VIEW || "sales.view",
    PERMISSIONS?.USERS_VIEW || "users.view",
  ],
  "Fleet Manager": [PERMISSIONS?.FLEET_VIEW || "fleet.view"],
  "Driver": [PERMISSIONS?.ROUTE_VIEW || "route.view"],
  "Sales Manager": [
    PERMISSIONS?.SALES_VIEW || "sales.view",
    PERMISSIONS?.INVENTORY_VIEW || "inventory.view",
  ],
  "Sales Person": [PERMISSIONS?.SALES_VIEW || "sales.view"],
};

export default function Users() {
  const { can } = useAuth();

  // Users Cache & Data State
  const [users, setUsers] = useState(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error loading cached users", e);
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(users.length === 0);

  // System Roles & Dynamic Permissions State
  const [roles, setRoles] = useState([]);
  const [permissionsMap, setPermissionsMap] = useState(INITIAL_PERMISSIONS_MAP);

  // Table Filtering and Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ status: "", role: "All Roles" });
  const [sortConfig, setSortConfig] = useState({ key: "firstName", direction: "asc" });

  // Modal States
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Password Security Action States (Deactivate/Reactivate/ResetPassword)
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [userToReactivate, setUserToReactivate] = useState(null);
  const [userToResetPassword, setUserToResetPassword] = useState(null);
  const [resetCredentials, setResetCredentials] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // 'DEACTIVATE' | 'REACTIVATE' | 'RESET_PASSWORD'
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Initial API Load
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [usersData, rolesData] = await Promise.all([
          usersApi.getAllUsers(),
          usersApi.getRoles(),
        ]);

        if (rolesData) setRoles(rolesData);
        if (usersData) {
          setUsers(usersData);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(usersData));
        }
      } catch (err) {
        console.error("Failed to load initial user data", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Helper to sync local state changes to localStorage
  const updateUsersState = (updater) => {
    setUsers((prev) => {
      const updated = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Process Search, Filter, and Sort Rules
  const processedUsers = useMemo(() => {
    let result = [...users];

    if (filters.role && filters.role !== "All Roles") {
      result = result.filter(
        (u) =>
          (typeof u.role === "string" ? u.role : u.role?.name || "")
            .toLowerCase() === filters.role.toLowerCase()
      );
    }

    if (filters.status) {
      result = result.filter((u) => {
        const userStatus = (
          u.isBlocked
            ? "SUSPENDED"
            : u.isActive === false
            ? "DEACTIVATED"
            : (u.status || "ACTIVE")
        ).toUpperCase();
        return userStatus === filters.status.toUpperCase();
      });
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          (u.firstName || "").toLowerCase().includes(q) ||
          (u.lastName || "").toLowerCase().includes(q) ||
          (u.username || "").toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      // Only soft-deactivated accounts sort to the bottom; suspended accounts remain in place
      const aDeact = a.isActive === false || (a.status || "").toUpperCase() === "DEACTIVATED";
      const bDeact = b.isActive === false || (b.status || "").toUpperCase() === "DEACTIVATED";
      if (aDeact && !bDeact) return 1;
      if (!aDeact && bDeact) return -1;

      const aVal = a[sortConfig.key]?.toString().toLowerCase() || "";
      const bVal = b[sortConfig.key]?.toString().toLowerCase() || "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchTerm, filters, sortConfig]);

  // Create / Update User Handler
  const handleSaveUser = async (formData, userId) => {
    try {
      // Resolve roleId from roles list
      const matchedRole = roles.find(
        (r) =>
          (typeof r === "string" ? r : r.name).toLowerCase() ===
          (typeof formData.role === "string"
            ? formData.role
            : formData.role?.name || ""
          ).toLowerCase()
      );
      const roleId =
        matchedRole && typeof matchedRole === "object"
          ? matchedRole.id
          : formData.roleId || roles[0]?.id;

      if (userId) {
        const isBlocked = formData.status === "SUSPENDED";
        const payload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.contactNo || formData.phone,
          birthdate: formData.birthday || formData.birthdate || null,
          ...(roleId && { roleId }),
          isBlocked,
          status: isBlocked ? "SUSPENDED" : "ACTIVE",
        };

        const updated = await usersApi.updateUser(userId, payload);
        const roleName =
          matchedRole && typeof matchedRole === "object"
            ? matchedRole.name
            : typeof formData.role === "string"
            ? formData.role
            : "Sales Person";

        updateUsersState((prev) =>
          prev.map((u) =>
            (u.id || u.userId) === userId
              ? {
                  ...u,
                  ...formData,
                  ...payload,
                  ...updated,
                  isBlocked,
                  status: isBlocked
                    ? "SUSPENDED"
                    : u.isActive === false
                    ? "DEACTIVATED"
                    : "ACTIVE",
                  isActive: u.isActive !== undefined ? u.isActive : true,
                  role: roleName,
                }
              : u
          )
        );
        setShowToast(true);
        return updated;
      } else {
        const payload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.contactNo || formData.phone || undefined,
          birthdate: formData.birthday || formData.birthdate || undefined,
          roleId: roleId || formData.roleId,
        };

        const result = await usersApi.createUser(payload);
        const roleName =
          matchedRole && typeof matchedRole === "object"
            ? matchedRole.name
            : typeof formData.role === "string"
            ? formData.role
            : "Sales Person";

        const newUser = result?.user || {
          id: `user-${Date.now()}`,
          userId: Date.now(),
          ...payload,
          role: roleName,
          status: "ACTIVE",
          isActive: true,
          isBlocked: false,
          mustChangePassword: true,
        };

        updateUsersState((prev) => [newUser, ...prev]);
        setShowToast(true);
        return result;
      }
    } catch (err) {
      console.error("Failed to save user:", err);
      throw err;
    }
  };

  // Role Permissions Save Handler
  const handleSavePermissions = (roleName, updatedPerms) => {
    setPermissionsMap((prev) => ({
      ...prev,
      [roleName]: updatedPerms,
    }));
    setShowToast(true);
  };

  // Triggers warning confirmation modals first
  const handleInitiateDeactivate = (targetUser) => {
    if (!targetUser || targetUser.role === "Super Admin") return;
    setUserToDeactivate(targetUser);
    setPendingAction("DEACTIVATE");
    setShowPasswordModal(false);
  };

  const handleInitiateReactivate = (targetUser) => {
    if (!targetUser || targetUser.role === "Super Admin") return;
    setUserToReactivate(targetUser);
    setPendingAction("REACTIVATE");
    setShowPasswordModal(false);
  };

  const handleInitiateResetPassword = (targetUser) => {
    if (!targetUser || targetUser.role === "Super Admin") return;
    setUserToResetPassword(targetUser);
    setPendingAction("RESET_PASSWORD");
    setShowPasswordModal(false);
  };

  // Executes dangerous operation once admin password is confirmed in AdminPasswordModal
  const handleConfirmAdminPassword = async (adminPassword) => {
    if (pendingAction === "DEACTIVATE" && userToDeactivate) {
      const targetId = userToDeactivate.id || userToDeactivate.userId;
      await usersApi.updateUserStatus(targetId, {
        confirmPassword: adminPassword,
        adminPassword,
        isActive: false,
      });
      updateUsersState((prev) =>
        prev.map((u) =>
          (u.id || u.userId) === targetId
            ? { ...u, status: "DEACTIVATED", isActive: false }
            : u
        )
      );
      setShowToast(true);
      setShowPasswordModal(false);
      setUserToDeactivate(null);
    } else if (pendingAction === "REACTIVATE" && userToReactivate) {
      const targetId = userToReactivate.id || userToReactivate.userId;
      await usersApi.updateUserStatus(targetId, {
        confirmPassword: adminPassword,
        adminPassword,
        isActive: true,
        isBlocked: false,
      });
      updateUsersState((prev) =>
        prev.map((u) =>
          (u.id || u.userId) === targetId
            ? { ...u, status: "ACTIVE", isActive: true, isBlocked: false }
            : u
        )
      );
      setShowToast(true);
      setShowPasswordModal(false);
      setUserToReactivate(null);
    } else if (pendingAction === "RESET_PASSWORD" && userToResetPassword) {
      const targetId = userToResetPassword.id || userToResetPassword.userId;
      const result = await usersApi.resetUserCredentials(targetId, {
        resetPassword: true,
        confirmPassword: adminPassword,
        adminPassword,
      });
      updateUsersState((prev) =>
        prev.map((u) =>
          (u.id || u.userId) === targetId
            ? { ...u, mustChangePassword: true }
            : u
        )
      );
      setShowPasswordModal(false);
      setUserToResetPassword(null);
      setResetCredentials(result);
      setShowToast(true);
    }

    setPendingAction(null);
  };

  const canManage = can ? can(PERMISSIONS?.USERS_MANAGE || "users.manage") : true;

  return (
    <div className="p-8">
      <UsersHeader
        onOpenPermissions={() => setIsPermissionsModalOpen(true)}
        onAddUser={() => setIsAddingUser(true)}
      />

      <UsersControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeFilters={filters}
        onApplyFilters={setFilters}
        onClearRole={() => setFilters((prev) => ({ ...prev, role: "All Roles" }))}
        onClearStatus={() => setFilters((prev) => ({ ...prev, status: "" }))}
      />

      {isLoading && users.length === 0 ? (
        <div className="flex items-center justify-center p-12 text-gray-500 font-medium">
          Loading user records...
        </div>
      ) : (
        <UsersTable
          users={processedUsers}
          sortConfig={sortConfig}
          onSort={(key) =>
            setSortConfig((prev) => ({
              key,
              direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
            }))
          }
          canManage={canManage}
          onEdit={(user) => setEditingUser(user)}
          onDeactivate={(user) => handleInitiateDeactivate(user)}
          onReactivate={(user) => handleInitiateReactivate(user)}
          onResetPassword={(user) => handleInitiateResetPassword(user)}
        />
      )}

      {/* Add / Edit User Modal */}
      <UserModal
        isOpen={isAddingUser || !!editingUser}
        roles={roles}
        user={editingUser}
        onSave={handleSaveUser}
        onClose={() => {
          setIsAddingUser(false);
          setEditingUser(null);
        }}
        onResetPassword={(u) => {
          setEditingUser(null);
          handleInitiateResetPassword(u);
        }}
      />

      {/* Permissions Matrix Modal */}
      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        permissionsMap={permissionsMap}
        onSave={handleSavePermissions}
      />

      {/* Deactivate User Modal */}
      {userToDeactivate && !showPasswordModal && (
        <DeactivateUserModal
          user={userToDeactivate}
          onClose={() => setUserToDeactivate(null)}
          onConfirm={() => setShowPasswordModal(true)}
        />
      )}

      {/* Reactivate User Modal */}
      {userToReactivate && !showPasswordModal && (
        <ReactivateUserModal
          user={userToReactivate}
          onClose={() => setUserToReactivate(null)}
          onConfirm={() => setShowPasswordModal(true)}
        />
      )}

      {/* Reset Password Modal */}
      {userToResetPassword && !showPasswordModal && (
        <ResetPasswordModal
          user={userToResetPassword}
          onClose={() => setUserToResetPassword(null)}
          onConfirm={() => setShowPasswordModal(true)}
        />
      )}

      {/* Password Re-authentication Modal */}
      <AdminPasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setUserToDeactivate(null);
          setUserToReactivate(null);
          setUserToResetPassword(null);
          setPendingAction(null);
        }}
        onSubmit={handleConfirmAdminPassword}
      />

      {/* Created Credentials Modal (After Password Reset) */}
      {resetCredentials && (
        <CreatedCredentialsModal
          isOpen={!!resetCredentials}
          credentials={resetCredentials}
          title="Password Reset Successful"
          description="A new temporary password has been generated for this user. They will be required to change their password upon their next login."
          onClose={() => setResetCredentials(null)}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <SavedChangesToast onClose={() => setShowToast(false)} />
      )}
    </div>
  );
}
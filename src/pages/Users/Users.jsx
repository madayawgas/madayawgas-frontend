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
  const { can, user: currentUser } = useAuth();

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
        const [usersData, rolesData] = await Promise.all([
          usersApi.getAllUsers(),
          usersApi.getRoles(),
        ]);

        if (rolesData) setRoles(rolesData);
        if (usersData && users.length === 0) {
          setUsers(usersData);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(usersData));
        }
      } catch (err) {
        console.error("Failed to load initial user data", err);
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
        (u) => (u.role || "").toLowerCase() === filters.role.toLowerCase()
      );
    }

    if (filters.status) {
      result = result.filter(
        (u) => (u.status || "ACTIVE").toUpperCase() === filters.status.toUpperCase()
      );
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
      const aDeact = ["DEACTIVATED", "INACTIVE"].includes((a.status || "").toUpperCase());
      const bDeact = ["DEACTIVATED", "INACTIVE"].includes((b.status || "").toUpperCase());
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
      if (userId) {
        const updated = await usersApi.updateUser(userId, formData);
        updateUsersState((prev) =>
          prev.map((u) => ((u.id || u.userId) === userId ? { ...u, ...formData, ...updated } : u))
        );
        setShowToast(true);
        return updated;
      } else {
        const newUserData = { ...formData, status: "ACTIVE", isActive: true };
        const result = await usersApi.createUser(newUserData);
        const newUser = result?.user || {
          id: `user-${Date.now()}`,
          userId: Date.now(),
          ...newUserData,
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

  // Triggers password modal flow for deactivation/reactivation/reset password
  const handleInitiateDeactivate = (targetUser) => {
    if (!targetUser || targetUser.role === "Super Admin") return;
    setUserToDeactivate(targetUser);
    setPendingAction("DEACTIVATE");
    setShowPasswordModal(true);
  };

  const handleInitiateReactivate = (targetUser) => {
    if (!targetUser || targetUser.role === "Super Admin") return;
    setUserToReactivate(targetUser);
    setPendingAction("REACTIVATE");
    setShowPasswordModal(true);
  };

  const handleInitiateResetPassword = (targetUser) => {
    if (!targetUser || targetUser.role === "Super Admin") return;
    setUserToResetPassword(targetUser);
    setPendingAction("RESET_PASSWORD");
    setShowPasswordModal(true);
  };

  // Executes dangerous operation once admin password is confirmed
  const handleConfirmAdminPassword = async (adminPassword) => {
    try {
      await usersApi.verifyAdminPassword(adminPassword, currentUser?.username);

      if (pendingAction === "DEACTIVATE" && userToDeactivate) {
        const targetId = userToDeactivate.id || userToDeactivate.userId;
        await usersApi.updateUserStatus(targetId, {
          adminPassword,
          username: currentUser?.username,
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
          adminPassword,
          username: currentUser?.username,
          isActive: true,
        });
        updateUsersState((prev) =>
          prev.map((u) =>
            (u.id || u.userId) === targetId
              ? { ...u, status: "ACTIVE", isActive: true }
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
    } catch (err) {
      // Re-throw so AdminPasswordModal can capture and render inline
      throw err;
    }
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

      <UsersTable
        users={processedUsers}
        sortConfig={sortConfig}
        onSort={(key) =>
          setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
          }))
        }
        onEditUser={(user) => {
          if (user?.role === "Super Admin") return;
          setEditingUser(user);
        }}
        onDeleteUser={(user) => {
          if (user?.role === "Super Admin") return;
          setUserToDeactivate(user);
        }}
        onReactivateUser={(user) => {
          if (user?.role === "Super Admin") return;
          setUserToReactivate(user);
        }}
        onResetPassword={(user) => {
          if (user?.role === "Super Admin") return;
          setUserToResetPassword(user);
        }}
        canManage={canManage}
      />

      {/* Permissions Management Modal */}
      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        roles={roles}
        permissionsMap={permissionsMap}
        onClose={() => setIsPermissionsModalOpen(false)}
        onSavePermissions={handleSavePermissions}
      />

      {/* Add / Edit User Wizard Modal */}
      <UserModal
        isOpen={isAddingUser || !!editingUser}
        roles={roles}
        onSave={handleSaveUser}
        onResetPassword={setUserToResetPassword}
        onClose={() => {
          setIsAddingUser(false);
          setEditingUser(null);
        }}
        user={editingUser}
      />

      {/* Reset Password Confirmation Modal */}
      {userToResetPassword && !showPasswordModal && (
        <ResetPasswordModal
          user={userToResetPassword}
          onClose={() => setUserToResetPassword(null)}
          onConfirm={handleInitiateResetPassword}
        />
      )}

      {/* Deactivation Confirmation Modal */}
      {userToDeactivate && !showPasswordModal && (
        <DeactivateUserModal
          user={userToDeactivate}
          onClose={() => setUserToDeactivate(null)}
          onConfirm={handleInitiateDeactivate}
        />
      )}

      {/* Reactivation Confirmation Modal */}
      {userToReactivate && !showPasswordModal && (
        <ReactivateUserModal
          user={userToReactivate}
          onClose={() => setUserToReactivate(null)}
          onConfirm={handleInitiateReactivate}
        />
      )}

      {/* Security Admin Password Verification Modal */}
      <AdminPasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPendingAction(null);
        }}
        onSubmit={handleConfirmAdminPassword}
      />

      {/* Reset/Created Credentials Display Modal */}
      {resetCredentials && (
        <CreatedCredentialsModal
          credentials={resetCredentials}
          title="Password Reset Successfully"
          description={`Temporary credentials generated for ${resetCredentials.username || "the user"}. They will be prompted to set a new password upon next login.`}
          onClose={() => setResetCredentials(null)}
        />
      )}

      {/* Toast Notification */}
      {showToast && <SavedChangesToast onClose={() => setShowToast(false)} />}
    </div>
  );
}
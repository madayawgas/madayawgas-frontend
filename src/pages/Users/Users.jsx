import { useState, useMemo, useEffect } from "react";
import UsersHeader from "../../components/users/UsersHeader";
import UsersControls from "../../components/users/UsersControls";
import UsersTable from "../../components/users/UsersTable";
import DeactivateUserModal from "../../components/users/DeactivateUserModal";
import ReactivateUserModal from "../../components/users/ReactivateUserModal";
import AdminPasswordModal from "../../components/users/AdminPasswordModal";
import UserModal from "../../components/users/UserModal";
import PermissionsModal from "../../components/users/PermissionsModal";
import SavedChangesToast from "../../components/ui/SavedChangesToast";
import { useAuth } from "../../context/AuthContext.jsx";
import { usersApi } from "../../api/users.js";
import { PERMISSIONS } from "../../utils/permissions.js";

const LOCAL_STORAGE_KEY = "app_users_cache";

export default function Users() {
  const { can } = useAuth();

  const [users, setUsers] = useState(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading users from localStorage", e);
    }
    return [];
  });

  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    role: "All Roles",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "firstName",
    direction: "asc",
  });

  // Modal States
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToReactivate, setUserToReactivate] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  // Toast State
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [usersData, rolesData] = await Promise.all([
          usersApi.getAllUsers(),
          usersApi.getRoles(),
        ]);

        if (rolesData) setRoles(rolesData);

        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        const hasValidCache = cached && JSON.parse(cached).length > 0;

        if (usersData && (!hasValidCache || users.length === 0)) {
          setUsers(usersData);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(usersData));
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    }
    loadData();
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Sync state updates to LocalStorage safely
  const updateUsersState = (newUsersOrUpdater) => {
    setUsers((prevUsers) => {
      const updated =
        typeof newUsersOrUpdater === "function"
          ? newUsersOrUpdater(prevUsers)
          : newUsersOrUpdater;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const processedUsers = useMemo(() => {
    let result = [...users];

    // 1. Apply Role Filter
    if (filters.role && filters.role !== "All Roles") {
      result = result.filter(
        (user) => (user.role || "").toLowerCase() === filters.role.toLowerCase()
      );
    }

    // 2. Apply Status Filter
    if (filters.status) {
      result = result.filter((user) => {
        const userStatus = user.status || "ACTIVE";
        return userStatus.toUpperCase() === filters.status.toUpperCase();
      });
    }

    // 3. Apply Search Term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          (user.firstName || "").toLowerCase().includes(lowerSearch) ||
          (user.lastName || "").toLowerCase().includes(lowerSearch) ||
          (user.phone || user.contactNumber || "").includes(lowerSearch) ||
          (user.username || "").toLowerCase().includes(lowerSearch)
      );
    }

    // 4. Sort: Keep DEACTIVATED/INACTIVE users at the bottom, sort active users normally
    result.sort((a, b) => {
      const aIsDeactivated =
        (a.status || "").toUpperCase() === "DEACTIVATED" ||
        (a.status || "").toUpperCase() === "INACTIVE";
      const bIsDeactivated =
        (b.status || "").toUpperCase() === "DEACTIVATED" ||
        (b.status || "").toUpperCase() === "INACTIVE";

      // If one is deactivated and the other is not, move deactivated to bottom
      if (aIsDeactivated && !bIsDeactivated) return 1;
      if (!aIsDeactivated && bIsDeactivated) return -1;

      // Regular sorting by specified column key
      const aValue = a[sortConfig.key]?.toString().toLowerCase() || "";
      const bValue = b[sortConfig.key]?.toString().toLowerCase() || "";

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchTerm, filters, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSaveUser = async (formData, userId) => {
    try {
      if (userId) {
        // Edit User Flow
        const updated = await usersApi.updateUser(userId, formData);
        updateUsersState((prev) =>
          prev.map((u) => {
            const uId = u.id || u.userId;
            return uId === userId ? { ...u, ...formData, ...updated } : u;
          })
        );
      } else {
        // Create New User Flow
        const newUserData = {
          ...formData,
          status: "ACTIVE",
          isActive: true,
        };

        const result = await usersApi.createUser(newUserData);
        
        const newUser = result?.user || {
          id: `user-${Date.now()}`,
          userId: Date.now(),
          ...newUserData,
        };

        updateUsersState((prev) => [newUser, ...prev]);
      }

      setShowToast(true);
    } catch (err) {
      console.error("Failed to save user:", err);
    }
  };

  // UPDATE STATUS TO DEACTIVATED (INSTEAD OF REMOVING FROM TABLE)
  const handleDeactivateUser = async (user) => {
    const targetId = user.id || user.userId;

    if (targetId) {
      try {
        await usersApi.updateUser(targetId, { status: "DEACTIVATED" });
      } catch (err) {
        console.error("API deactivate error:", err);
      }
    }

    updateUsersState((prev) =>
      prev.map((u) => {
        const currentId = u.id || u.userId;
        if (currentId === targetId) {
          return { ...u, status: "DEACTIVATED" };
        }
        return u;
      })
    );

    setUserToDelete(null);
  };

  const handleReactivateUser = async (user) => {
    const targetId = user.id || user.userId;

    if (targetId) {
      try {
        await usersApi.updateUser(targetId, { status: "ACTIVE" });
      } catch (err) {
        console.error("API reactivate error:", err);
      }
    }

    updateUsersState((prev) =>
      prev.map((u) => {
        const currentId = u.id || u.userId;
        if (currentId === targetId) {
          return { ...u, status: "ACTIVE" };
        }
        return u;
      })
    );

    setUserToReactivate(null);
  };

  const canManage = can(PERMISSIONS.USERS_MANAGE) || can("users.manage");

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
        onSort={handleSort}
        onEditUser={setEditingUser}
        onDeleteUser={setUserToDelete}
        onReactivateUser={setUserToReactivate}
        canManage={canManage}
      />

      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        users={users}
        onClose={() => setIsPermissionsModalOpen(false)}
      />

      <UserModal
        isOpen={isAddingUser || !!editingUser}
        roles={roles}
        onSave={handleSaveUser}
        onClose={() => {
          setIsAddingUser(false);
          setEditingUser(null);
        }}
        user={editingUser}
      />

      <DeactivateUserModal
        user={userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeactivateUser}
      />

      <ReactivateUserModal
        user={userToReactivate}
        onClose={() => setUserToReactivate(null)}
        onConfirm={handleReactivateUser}
      />

      <AdminPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={() => setShowPasswordModal(false)}
      />

      {showToast && (
        <SavedChangesToast onClose={() => setShowToast(false)} />
      )}
    </div>
  );
}
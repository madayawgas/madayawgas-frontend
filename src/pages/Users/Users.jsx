import { useState, useMemo, useEffect, useRef } from "react";
import UsersHeader from "../../components/users/UsersHeader";
import UsersControls from "../../components/users/UsersControls";
import UsersTable from "../../components/users/UsersTable";
import UserDetailPanel from "../../components/users/UserDetailPanel";
import DeactivateUserModal from "../../components/users/DeactivateUserModal";
import ReactivateUserModal from "../../components/users/ReactivateUserModal";
import ResetPasswordModal from "../../components/users/ResetPasswordModal";
import AdminPasswordModal from "../../components/users/AdminPasswordModal";
import CreatedCredentialsModal from "../../components/users/CreatedCredentialsModal";
import UserModal from "../../components/users/UserModal";
import SavedChangesToast from "../../components/ui/SavedChangesToast";
import SideDrawer from "../../components/ui/SideDrawer";
import Badge from "../../components/ui/Badge";
import { UserRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { usersApi } from "../../api/users.js";
import { PERMISSIONS } from "../../utils/permissions.js";
import { getUserRoleNames, formatUserRoles, hasUserRole } from "../../utils/userRoles.js";
import { isPhilippineDateInRange } from "../../utils/date.js";

const LOCAL_STORAGE_KEY = "app_users_cache";

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
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeDetailUser, setActiveDetailUser] = useState(null);
  const [isClosingPanel, setIsClosingPanel] = useState(false);
  const closeTimerRef = useRef(null);

  // System Roles State
  const [roles, setRoles] = useState([]);

  // Table Filtering, Sorting and Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ status: "", role: "All Roles" });
  const [sortConfig, setSortConfig] = useState({ key: "firstName", direction: "asc" });

  // Modal States
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showToast, setShowToast] = useState(false);

  // Password Security Action States (Deactivate/Reactivate/ResetPassword)
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [userToReactivate, setUserToReactivate] = useState(null);
  const [userToResetPassword, setUserToResetPassword] = useState(null);
  const [resetCredentials, setResetCredentials] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // 'DEACTIVATE' | 'REACTIVATE' | 'RESET_PASSWORD'
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Permissions
  const canManage = can ? can(PERMISSIONS?.USERS_MANAGE || "users.manage") : true;

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

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
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
      const target = filters.role.toLowerCase();
      result = result.filter((u) => {
        const uRoles = getUserRoleNames(u, "");
        return uRoles.some((r) => r.toLowerCase() === target);
      });
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

    if (filters.dateFrom || filters.dateTo) {
      result = result.filter((u) =>
        isPhilippineDateInRange(u.createdAt || u.dateCreated, filters.dateFrom, filters.dateTo)
      );
    }

    result.sort((a, b) => {
      // Only soft-deactivated accounts sort to the bottom; suspended accounts remain in place
      const aDeact = a.isActive === false || (a.status || "").toUpperCase() === "DEACTIVATED";
      const bDeact = b.isActive === false || (b.status || "").toUpperCase() === "DEACTIVATED";
      if (aDeact && !bDeact) return 1;
      if (!aDeact && bDeact) return -1;

      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "firstName" || sortConfig.key === "name") {
        aVal = `${a.firstName || ""} ${a.lastName || ""}`.trim().toLowerCase();
        bVal = `${b.firstName || ""} ${b.lastName || ""}`.trim().toLowerCase();
      } else if (sortConfig.key === "role") {
        aVal = formatUserRoles(a, "").toLowerCase();
        bVal = formatUserRoles(b, "").toLowerCase();
      } else if (sortConfig.key === "createdAt") {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else {
        aVal = aVal ? aVal.toString().toLowerCase() : "";
        bVal = bVal ? bVal.toString().toLowerCase() : "";
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchTerm, filters, sortConfig]);

  const totalItems = processedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * limit;
    return processedUsers.slice(start, start + limit);
  }, [processedUsers, page, limit]);

  // Close panel with smooth exit animation (left-to-right off screen)
  const handleCloseDetail = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsClosingPanel(true);
    setSelectedUser(null);
    closeTimerRef.current = setTimeout(() => {
      setActiveDetailUser(null);
      setIsClosingPanel(false);
    }, 250);
  };

  // Select user row handler
  const handleSelectUser = (user) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    const isSameUser =
      (selectedUser?.id && (selectedUser.id === user.id || selectedUser.id === user.userId)) ||
      (selectedUser?.userId && (selectedUser.userId === user.userId || selectedUser.userId === user.id));

    if (isSameUser) {
      // Toggle off if already selected
      handleCloseDetail();
    } else {
      setIsClosingPanel(false);
      setSelectedUser(user);
      setActiveDetailUser(user);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Create / Update User Handler
  const handleSaveUser = async (formData, userId) => {
    try {
      // Resolve roleIds and primaryRoleId
      let roleIds = [];
      if (Array.isArray(formData.roleIds) && formData.roleIds.length > 0) {
        roleIds = formData.roleIds.map(String);
      } else if (formData.roleId) {
        roleIds = [String(formData.roleId)];
      } else {
        const matched = roles.find(
          (r) =>
            (typeof r === "string" ? r : r.name).toLowerCase() ===
            (typeof formData.role === "string"
              ? formData.role
              : formData.role?.name || ""
            ).toLowerCase()
        );
        roleIds = [matched && typeof matched === "object" ? String(matched.id) : String(roles[0]?.id || "driver")];
      }

      const primaryRoleId = formData.primaryRoleId
        ? String(formData.primaryRoleId)
        : roleIds[0] || (roles[0]?.id ? String(roles[0].id) : "driver");

      const selectedRoleObjects = roleIds.map((id) => {
        const match = roles.find((r) => String(typeof r === "object" ? r.id : r) === String(id));
        const name = match && typeof match === "object" ? match.name : match || "Staff";
        return {
          id,
          name,
          isPrimary: String(id) === String(primaryRoleId),
        };
      });

      const roleNames = selectedRoleObjects.map((r) => r.name);
      const primaryRoleObj = selectedRoleObjects.find((r) => r.isPrimary) || selectedRoleObjects[0];
      const primaryRoleName =
        primaryRoleObj?.name || (typeof formData.role === "string" ? formData.role : "Sales Person");

      if (userId) {
        const isBlocked = formData.status === "SUSPENDED";
        const payload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.contactNo || formData.phone,
          birthdate: formData.birthday || formData.birthdate || null,
          roleIds,
          primaryRoleId,
          roleId: primaryRoleId,
          isBlocked,
          status: isBlocked ? "SUSPENDED" : "ACTIVE",
        };

        const updated = await usersApi.updateUser(userId, payload);

        const updatedUserMerged = {
          ...formData,
          ...payload,
          ...updated,
          isBlocked,
          status: isBlocked
            ? "SUSPENDED"
            : "ACTIVE",
          role: updated?.role || primaryRoleName,
          roleId: updated?.roleId || primaryRoleId,
          roles: updated?.roles || selectedRoleObjects,
          roleNames: updated?.roleNames || roleNames,
        };

        updateUsersState((prev) =>
          prev.map((u) =>
            (u.id || u.userId) === userId
              ? {
                  ...u,
                  ...updatedUserMerged,
                  isActive: u.isActive !== undefined ? u.isActive : true,
                }
              : u
          )
        );

        if (activeDetailUser && ((activeDetailUser.id || activeDetailUser.userId) === userId)) {
          setActiveDetailUser((prev) => ({
            ...prev,
            ...updatedUserMerged,
            isActive: prev.isActive !== undefined ? prev.isActive : true,
          }));
          setSelectedUser((prev) => ({
            ...prev,
            ...updatedUserMerged,
            isActive: prev.isActive !== undefined ? prev.isActive : true,
          }));
        }

        setShowToast(true);
        return updated;
      } else {
        const payload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.contactNo || formData.phone || undefined,
          birthdate: formData.birthday || formData.birthdate || undefined,
          roleIds,
          primaryRoleId,
          roleId: primaryRoleId,
        };

        const result = await usersApi.createUser(payload);

        const newUser = result?.user || {
          id: `user-${Date.now()}`,
          userId: Date.now(),
          ...payload,
          role: primaryRoleName,
          roleId: primaryRoleId,
          roles: result?.user?.roles || selectedRoleObjects,
          roleNames: result?.user?.roleNames || roleNames,
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

  // Direct Deactivation with inline password authorization
  const handleConfirmDeactivateUser = async (targetUser, adminPassword) => {
    if (!targetUser) return;
    const targetId = targetUser.id || targetUser.userId;
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

    if (activeDetailUser && ((activeDetailUser.id || activeDetailUser.userId) === targetId)) {
      setActiveDetailUser((prev) => ({ ...prev, status: "DEACTIVATED", isActive: false }));
      setSelectedUser((prev) => ({ ...prev, status: "DEACTIVATED", isActive: false }));
    }

    setShowToast(true);
    setUserToDeactivate(null);
  };

  // Triggers warning confirmation modals first
  const handleInitiateDeactivate = (targetUser) => {
    if (!targetUser || hasUserRole(targetUser, "Super Admin")) return;
    setUserToDeactivate(targetUser);
  };

  const handleInitiateReactivate = (targetUser) => {
    if (!targetUser || hasUserRole(targetUser, "Super Admin")) return;
    setUserToReactivate(targetUser);
    setPendingAction("REACTIVATE");
    setShowPasswordModal(false);
  };

  const handleInitiateResetPassword = (targetUser) => {
    if (!targetUser || hasUserRole(targetUser, "Super Admin")) return;
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

      if (activeDetailUser && ((activeDetailUser.id || activeDetailUser.userId) === targetId)) {
        setActiveDetailUser((prev) => ({ ...prev, status: "DEACTIVATED", isActive: false }));
        setSelectedUser((prev) => ({ ...prev, status: "DEACTIVATED", isActive: false }));
      }

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

      if (activeDetailUser && ((activeDetailUser.id || activeDetailUser.userId) === targetId)) {
        setActiveDetailUser((prev) => ({ ...prev, status: "ACTIVE", isActive: true, isBlocked: false }));
        setSelectedUser((prev) => ({ ...prev, status: "ACTIVE", isActive: true, isBlocked: false }));
      }

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

      if (activeDetailUser && ((activeDetailUser.id || activeDetailUser.userId) === targetId)) {
        setActiveDetailUser((prev) => ({ ...prev, mustChangePassword: true }));
        setSelectedUser((prev) => ({ ...prev, mustChangePassword: true }));
      }

      setShowPasswordModal(false);
      setUserToResetPassword(null);
      setResetCredentials(result);
      setShowToast(true);
    }

    setPendingAction(null);
  };

  const userSummary = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive !== false && !u.isBlocked).length;
    return { total, active };
  }, [users]);

  return (
    <div className="h-full flex flex-col overflow-hidden min-w-0">
      {/* Header (Pinned at Top) */}
      <div className="shrink-0">
        <UsersHeader
          onAddUser={() => setIsAddingUser(true)}
          userSummary={userSummary}
        />
      </div>

      {/* Search and Filters Controls (Pinned at Top) */}
      <div className="shrink-0">
        <UsersControls
          searchTerm={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
          activeFilters={filters}
          onApplyFilters={(f) => {
            setFilters(f);
            setPage(1);
          }}
          onClearRole={() => {
            setFilters((prev) => ({ ...prev, role: "All Roles" }));
            setPage(1);
          }}
          onClearStatus={() => {
            setFilters((prev) => ({ ...prev, status: "" }));
            setPage(1);
          }}
          roles={roles}
        />
      </div>

      {/* Main Content Area: Full-Width Table with Independent SlideDrawer Inspection */}
      {isLoading && users.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-12 text-gray-500 font-medium">
          Loading user records...
        </div>
      ) : (
        <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden">
          <UsersTable
            users={paginatedUsers}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
            sortConfig={sortConfig}
            onSort={handleSort}
            pagination={{
              page,
              limit,
              totalItems,
              totalPages,
              onPageChange: setPage,
              onLimitChange: (newLimit) => {
                setLimit(newLimit);
                setPage(1);
              },
              isLoading,
            }}
          />

          {/* Slide-Over User Inspection Drawer */}
          <SideDrawer
            isOpen={Boolean(activeDetailUser)}
            onClose={handleCloseDetail}
            title={
              activeDetailUser
                ? `${activeDetailUser.firstName || ""} ${activeDetailUser.lastName || ""}`.trim() ||
                  activeDetailUser.username ||
                  "User Account"
                : "User Profile"
            }
            subtitle={activeDetailUser?.username ? `@${activeDetailUser.username}` : "Staff Account"}
            icon={UserRound}
            badge={
              activeDetailUser && (
                <Badge
                  variant={
                    activeDetailUser.isBlocked
                      ? "danger"
                      : activeDetailUser.isActive === false
                      ? "deactivated"
                      : "success"
                  }
                  className="px-2.5 py-0.5 text-[10px] font-bold"
                >
                  {activeDetailUser.isBlocked
                    ? "SUSPENDED"
                    : activeDetailUser.isActive === false
                    ? "DEACTIVATED"
                    : "ACTIVE"}
                </Badge>
              )
            }
            width="max-w-md sm:max-w-lg"
          >
            {activeDetailUser && (
              <UserDetailPanel
                user={activeDetailUser}
                onClose={handleCloseDetail}
                onEdit={(u) => {
                  handleCloseDetail();
                  setEditingUser(u);
                }}
                onResetPassword={(u) => handleInitiateResetPassword(u)}
                onDelete={(u) => handleInitiateDeactivate(u)}
                onReactivate={(u) => handleInitiateReactivate(u)}
                canManage={canManage}
              />
            )}
          </SideDrawer>
        </div>
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

      {/* Deactivate User Modal with Inline Password Authorization */}
      {userToDeactivate && (
        <DeactivateUserModal
          user={userToDeactivate}
          onClose={() => setUserToDeactivate(null)}
          onConfirm={handleConfirmDeactivateUser}
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
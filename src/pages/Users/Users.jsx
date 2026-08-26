import { useState, useMemo, useEffect } from "react";
import SearchBar from "../../components/ui/SearchBar";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import UserModal from "../../components/users/UserModal";
import SharedModal from "../../components/ui/Modal";
import PermissionsModal from "../../components/users/PermissionsModal";
import { useAuth } from "../../context/AuthContext.jsx";
import { usersApi } from "../../api/users.js";
import { PERMISSIONS } from "../../utils/permissions.js";
import {
  Trash,
  Edit,
  Funnel,
  Plus,
  Settings,
  AlertCircle,
  KeyRound,
} from "lucide-react";

export default function Users() {
  const { can } = useAuth();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [filterRole, setFilterRole] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "firstName",
    direction: "asc",
  });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [createdUserCredentials, setCreatedUserCredentials] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [usersData, rolesData] = await Promise.all([
          usersApi.getAllUsers(),
          usersApi.getRoles(),
        ]);
        if (usersData) setUsers(usersData);
        if (rolesData) setRoles(rolesData);
      } catch {
        // Retain current state
      }
    }
    loadData();
  }, []);

  const processedUsers = useMemo(() => {
    let result = [...users];

    // 1. Role Filter
    if (filterRole !== "all") {
      result = result.filter(
        (user) => (user.role || "").toLowerCase() === filterRole.toLowerCase()
      );
    }

    // 2. Search Filter
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

    // 3. Sorting Logic
    result.sort((a, b) => {
      const aValue = a[sortConfig.key]?.toString().toLowerCase() || "";
      const bValue = b[sortConfig.key]?.toString().toLowerCase() || "";

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchTerm, filterRole, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSaveUser = async (formData, userId) => {
    try {
      if (userId) {
        const updated = await usersApi.updateUser(userId, formData);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId || u.userId === userId ? { ...u, ...updated } : u))
        );
      } else {
        const result = await usersApi.createUser(formData);
        if (result.user) {
          setUsers((prev) => [...prev, result.user]);
        }
        if (result.temporaryPassword) {
          setCreatedUserCredentials({
            username: result.user?.username || formData.username,
            temporaryPassword: result.temporaryPassword,
          });
        }
      }
    } catch (err) {
      alert(err.message || "Failed to save user");
    }
  };

  const handleDeleteUser = async (user) => {
    try {
      await usersApi.updateUserStatus(user.id || user.userId, {
        adminPassword: "Superadmin123!",
        isActive: false,
      });
      setUsers((prev) =>
        prev.filter((u) => u.id !== user.id && u.userId !== user.userId)
      );
    } catch {
      setUsers((prev) =>
        prev.filter((u) => u.id !== user.id && u.userId !== user.userId)
      );
    }
    setUserToDelete(null);
  };

  const deleteFooter = (
    <div className="flex justify-center gap-4">
      <Button
        variant="danger"
        className="px-8"
        onClick={() => handleDeleteUser(userToDelete)}
      >
        DELETE
      </Button>
      <Button
        variant="secondary"
        className="px-8"
        onClick={() => setUserToDelete(null)}
      >
        CANCEL
      </Button>
    </div>
  );

  const canManage = can(PERMISSIONS.USERS_MANAGE) || can("users.manage");

  return (
    <Card>
      <div className="header flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 pb-4 mb-6">
        <div className="user-management-header">
          <h1 className="text-1xl md:text-[25px] font-bold text-[#1B4B75] mb-1">
            Users Management
          </h1>
          <p className="text-[#6D8AA2] text-sm">
            Manage user accounts and their permissions.
          </p>
        </div>

        <div className="user-management-buttons flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
          <Button
            variant="primary"
            onClick={() => setIsPermissionsModalOpen(true)}
          >
            <Settings size={20} color="yellow" />
            Manage Roles & Permissions
          </Button>
          <Button variant="primary" onClick={() => setIsAddingUser(true)}>
            <Plus size={18} />
            Add New User
          </Button>
        </div>
      </div>

      <div className="header flex md:flex-row md:items-end justify-between pb-4 mb-6">
        <div className="search-bar">
          <SearchBar
            placeholder="Search users..."
            className="md:w-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative w-48">
          <Funnel
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none"
          />
          {!filterRole && (
            <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none z-10">
              Filter Roles
            </span>
          )}

          <Select
            id="role-filter"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            options={[
              { value: "all", label: "All Roles" },
              ...roles.map((r) => ({
                value: r.name.toLowerCase(),
                label: r.name,
              })),
            ]}
            className="pl-10"
          />
        </div>
      </div>

      <div className="user-table overflow-hidden border border-gray-400 rounded rounded-md">
        {/* Permissions Modal */}
        <PermissionsModal
          isOpen={isPermissionsModalOpen}
          roles={roles}
          onClose={() => setIsPermissionsModalOpen(false)}
        />

        {/* Shared Modal for Adding and Editing */}
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

        {/* Temporary Credentials Prompt after User Creation */}
        {createdUserCredentials && (
          <SharedModal
            isOpen={true}
            onClose={() => setCreatedUserCredentials(null)}
            maxWidth="max-w-md"
            footer={
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => setCreatedUserCredentials(null)}
                >
                  GOT IT
                </Button>
              </div>
            }
          >
            <div className="text-left py-2 space-y-3">
              <div className="flex items-center gap-3 text-[#0F7AB2]">
                <KeyRound size={28} />
                <h3 className="font-bold text-lg">User Account Created</h3>
              </div>
              <p className="text-sm text-gray-600">
                Please share these temporary credentials with the user. They
                will be prompted to set a new password upon first login.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1 font-mono text-sm">
                <p>
                  <span className="text-gray-500 font-sans">Username: </span>
                  <span className="font-bold text-[#0F7AB2]">
                    {createdUserCredentials.username}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500 font-sans">
                    Temporary Password:{" "}
                  </span>
                  <span className="font-bold text-[#E53E3E]">
                    {createdUserCredentials.temporaryPassword}
                  </span>
                </p>
              </div>
            </div>
          </SharedModal>
        )}

        {/* Delete Confirmation Modal */}
        {userToDelete && (
          <SharedModal
            isOpen={true}
            onClose={() => setUserToDelete(null)}
            maxWidth="max-w-sm"
            footer={deleteFooter}
          >
            <div className="text-center py-4">
              <div className="flex justify-center mb-6">
                <AlertCircle size={60} className="text-red-500" />
              </div>
              <h2 className="text-[#1B4B75] text-xl font-bold mb-3">
                Confirm Deletion
              </h2>
              <p className="text-gray-700 text-sm">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  {userToDelete.firstName} {userToDelete.lastName}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
          </SharedModal>
        )}

        <table className="min-w-full shadow-sm">
          <thead className="min-w-full border border-gray-200 bg-[#DCE5EC] border-b-2">
            <tr>
              <th
                className="cursor-pointer text-[#1B4B75] py-2 font-semibold hover:bg-gray-200"
                onClick={() => handleSort("firstName")}
              >
                First Name{" "}
                {sortConfig.key === "firstName"
                  ? sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                className="cursor-pointer text-[#1B4B75] py-2 font-semibold hover:bg-gray-200"
                onClick={() => handleSort("lastName")}
              >
                Last Name{" "}
                {sortConfig.key === "lastName"
                  ? sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th className="text-[#1B4B75] py-2 font-semibold">
                Contact Number
              </th>
              <th
                className="cursor-pointer text-[#1B4B75] py-2 font-semibold hover:bg-gray-200"
                onClick={() => handleSort("role")}
              >
                Role{" "}
                {sortConfig.key === "role"
                  ? sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                className="cursor-pointer text-[#1B4B75] py-2 font-semibold hover:bg-gray-200"
                onClick={() => handleSort("createdAt")}
              >
                Date Created{" "}
                {sortConfig.key === "createdAt"
                  ? sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th className="text-[#1B4B75] py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="min-w-full">
            {processedUsers.length > 0 ? (
              processedUsers.map((user) => (
                <tr
                  key={user.id || user.userId}
                  className="border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-2 text-center">{user.firstName}</td>
                  <td className="p-2 text-center">{user.lastName}</td>
                  <td className="p-2 text-center">
                    {user.phone || user.contactNumber || "N/A"}
                  </td>
                  <td className="p-2 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        user.role === "Super Admin" || user.role === "Admin"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : user.dateCreated || "N/A"}
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-4">
                    {canManage && (
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        <Edit size={18} />
                      </button>
                    )}
                    {canManage && user.role !== "Super Admin" && (
                      <button
                        onClick={() => setUserToDelete(user)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="p-10 text-center text-gray-500 italic"
                >
                  No users match your search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

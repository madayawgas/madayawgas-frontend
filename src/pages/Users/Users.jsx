import { useState, useMemo } from "react";
import SearchBar from "../../components/ui/SearchBar";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import UserModal from "../../components/users/UserModal";
import SharedModal from "../../components/ui/Modal";
import PermissionsModal from "../../components/users/PermissionsModal";
import { useData } from "../../context/DataContext";
import { Trash, Edit, Funnel, Plus, Settings, AlertCircle } from "lucide-react";

export default function Users() {
  const { users, deleteUser, currentUser } = useData();

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

  const processedUsers = useMemo(() => {
    let result = [...users];

    // 1. Role Filter
    if (filterRole !== "all") {
      result = result.filter(
        (user) => user.role.toLowerCase() === filterRole.toLowerCase(),
      );
    }

    // 2. Search Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.firstName.toLowerCase().includes(lowerSearch) ||
          user.lastName.toLowerCase().includes(lowerSearch) ||
          user.contactNumber.includes(lowerSearch),
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

  const deleteFooter = (
    <div className="flex justify-center gap-4">
      <Button
        variant="danger"
        className="px-8"
        onClick={() => {
          deleteUser(userToDelete.userId);
          setUserToDelete(null);
        }}
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

  const canEdit = (targetUser) => {
    if (!currentUser) return false;

    const myRole = currentUser.role;
    const targetRole = targetUser.role;

    // Rule 1: Admins can edit Managers and Drivers (but not other Admins)
    if (myRole === "Admin") {
      return targetRole === "Manager" || targetRole === "Driver";
    }

    // Rule 2: Managers can edit only Drivers
    if (myRole === "Manager") {
      return targetRole === "Driver";
    }

    // Rule 3: Drivers cannot edit anyone (returns false by default)
    return false;
  };

  const canDelete = (targetUser) => {
    if (!currentUser) return false;

    const myRole = currentUser.role;
    const targetRole = targetUser.role;

    // Rule 1: Admins can delete Managers and Drivers (but not other Admins)
    if (myRole === "Admin") {
      return targetRole === "Manager" || targetRole === "Driver";
    }

    // Rule 2: Managers can delete only Drivers
    if (myRole === "Manager") {
      return targetRole === "Driver";
    }

    // Rule 3: Drivers cannot delete anyone (returns false by default)
    return false;
  };

  return (
    <Card>
      <div className="header  flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 pb-4 mb-6">
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

      <div className="header  flex md:flex-row md:items-end justify-between pb-4 mb-6">
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
              { value: "admin", label: "Admin" },
              { value: "driver", label: "Driver" },
              { value: "manager", label: "Manager" },
            ]}
            className="pl-10"
          />
        </div>
      </div>

      <div className="user-table overflow-hidden border border-gray-400 rounded rounded-md">
        {/* Permissions Modal */}
        <PermissionsModal
          isOpen={isPermissionsModalOpen}
          onClose={() => setIsPermissionsModalOpen(false)}
        />

        {/* Shared Modal for Adding and Editing */}
        <UserModal
          isOpen={isAddingUser || !!editingUser}
          onClose={() => {
            setIsAddingUser(false);
            setEditingUser(null);
          }}
          user={editingUser}
        />

        {/* Delete Confirmation Modal */}
        {userToDelete && (
          <SharedModal
            isOpen={true}
            onClose={() => setUserToDelete(null)}
            maxWidth="max-w-sm"
            footer={deleteFooter}
          >
            <div className="text-center py-4">
              {/* Warning Icon */}
              <div className="flex justify-center mb-6">
                <AlertCircle size={60} className="text-red-500" />
              </div>

              {/* Title */}
              <h2 className="text-[#1B4B75] text-xl font-bold mb-3">
                Confirm Deletion
              </h2>

              {/* Message */}
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

        <table className="min-w-full  shadow-sm">
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
                onClick={() => handleSort("dateCreated")}
              >
                Date Created{" "}
                {sortConfig.key === "dateCreated"
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
                  key={user.userId}
                  className="border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-2 text-center">{user.firstName}</td>
                  <td className="p-2 text-center">{user.lastName}</td>
                  <td className="p-2 text-center">{user.contactNumber}</td>
                  <td className="p-2 text-center">
                    {/* Optional: Add a badge style for the role */}
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        user.role === "Admin"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-2 text-center">{user.dateCreated}</td>
                  <td className="px-6 py-4 flex justify-center gap-4">
                    {canDelete(user) && (
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        <Edit size={18} />
                      </button>
                    )}
                    {canDelete(user) && (
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

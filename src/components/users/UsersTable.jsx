import { Pencil, Trash2, KeyRound } from "lucide-react";
import Badge from "../ui/Badge";

export default function UsersTable({
  users,
  sortConfig,
  onSort,
  onEditUser,
  onDeleteUser,
  onResetPassword,
  canManage,
}) {
  const getStatus = (user) => {
    if (user.isBlocked) return "SUSPENDED";
    if (user.isActive === false) return "DEACTIVATED";
    if (user.isActive === true) return "ACTIVE";
    return (user.status || "ACTIVE").toUpperCase();
  };

  const getBadgeVariant = (user) => {
    const status = getStatus(user);
    switch (status) {
      case "ACTIVE":
        return "success";
      case "SUSPENDED":
      case "BLOCKED":
        return "danger";
      case "DEACTIVATED":
      case "INACTIVE":
        return "deactivated";
      default:
        return "neutral";
    }
  };

  const getStatusText = (user) => {
    return getStatus(user);
  };

  return (
    <div className="w-full overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#0D4B6E] text-white text-sm">
          <tr>
            <th
              className="py-3.5 px-6 font-medium cursor-pointer hover:bg-[#0b3e5b] transition-colors"
              onClick={() => onSort("firstName")}
            >
              First Name{" "}
              {sortConfig.key === "firstName" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th
              className="py-3.5 px-6 font-medium cursor-pointer hover:bg-[#0b3e5b] transition-colors"
              onClick={() => onSort("lastName")}
            >
              Last Name{" "}
              {sortConfig.key === "lastName" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th
              className="py-3.5 px-6 font-medium cursor-pointer hover:bg-[#0b3e5b] transition-colors"
              onClick={() => onSort("role")}
            >
              Role{" "}
              {sortConfig.key === "role" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th className="py-3.5 px-6 font-medium text-center">Status</th>
            <th
              className="py-3.5 px-6 font-medium text-center cursor-pointer hover:bg-[#0b3e5b] transition-colors"
              onClick={() => onSort("createdAt")}
            >
              Date Created{" "}
              {sortConfig.key === "createdAt" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th className="py-3.5 px-6 font-medium text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm">
          {users.length > 0 ? (
            users.map((user) => (
              <tr
                key={user.id || user.userId}
                className="hover:bg-gray-50/80 transition-colors"
              >
                <td className="py-4 px-6 text-gray-800 font-medium">
                  {user.firstName}
                </td>
                <td className="py-4 px-6 text-gray-800 font-medium">
                  {user.lastName}
                </td>
                <td className="py-4 px-6">
                  <Badge variant="roles">{user.role}</Badge>
                </td>
                <td className="py-4 px-6 text-center">
                  <Badge variant={getBadgeVariant(user)}>
                    {getStatusText(user)}
                  </Badge>
                </td>
                <td className="py-4 px-6 text-center italic text-[#6D8AA2] text-xs">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : user.dateCreated || "01 - 01 - 2026"}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center gap-3">
                    {canManage && user.role !== "Super Admin" ? (
                      <>
                        <button
                          type="button"
                          title="Edit User"
                          onClick={() => onEditUser(user)}
                          className="text-gray-400 hover:text-[#0F7AB2] transition-colors cursor-pointer"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          type="button"
                          title="Reset Password"
                          onClick={() => onResetPassword && onResetPassword(user)}
                          className="text-gray-400 hover:text-[#0F7AB2] transition-colors cursor-pointer"
                        >
                          <KeyRound size={18} />
                        </button>
                        <button
                          type="button"
                          title="Deactivate User"
                          onClick={() => onDeleteUser(user)}
                          className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-300 select-none text-xs">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="6"
                className="py-12 text-center text-gray-400 italic"
              >
                No users match your search or filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
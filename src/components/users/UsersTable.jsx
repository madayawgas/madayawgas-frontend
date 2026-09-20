import { UserRound, Phone, Calendar } from "lucide-react";
import { formatPhilippinePhone } from "../../utils/phone.js";
import Badge from "../ui/Badge";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  } catch {
    return dateStr;
  }
}

export default function UsersTable({
  users = [],
  selectedUser,
  onSelectUser,
  sortConfig = { key: "firstName", direction: "asc" },
  onSort,
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
    <div className="w-full h-full flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-[#0D4B6E] text-white text-xs md:text-sm sticky top-0 z-10 shadow-xs">
            <tr>
              <th
                className="py-3 px-4 md:px-5 font-medium cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[32%]"
                onClick={() => onSort("firstName")}
              >
                User Account{" "}
                {sortConfig.key === "firstName" || sortConfig.key === "name" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th
                className="py-3 px-4 md:px-5 font-medium cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[18%]"
                onClick={() => onSort("role")}
              >
                Role{" "}
                {sortConfig.key === "role" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th className="py-3 px-4 md:px-5 font-medium whitespace-nowrap w-[20%]">
                Contact No.
              </th>
              <th className="py-3 px-4 md:px-5 font-medium text-center whitespace-nowrap w-[15%]">
                Status
              </th>
              <th
                className="py-3 px-4 md:px-5 font-medium text-center cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[15%]"
                onClick={() => onSort("createdAt")}
              >
                Date Created{" "}
                {sortConfig.key === "createdAt" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
            {users.length > 0 ? (
              users.map((user) => {
                const isSelected =
                  (selectedUser?.id &&
                    (selectedUser.id === user.id ||
                      selectedUser.id === user.userId)) ||
                  (selectedUser?.userId &&
                    (selectedUser.userId === user.userId ||
                      selectedUser.userId === user.id));

                const fullName =
                  `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                  user.username ||
                  "Unnamed User";

                const initials =
                  `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase() ||
                  user.username?.charAt(0).toUpperCase() ||
                  "";

                const roleName =
                  typeof user.role === "string"
                    ? user.role
                    : user.role?.name || "User";

                const phoneVal =
                  user.phone || user.contactNumber || user.contactNo || "";

                return (
                  <tr
                    key={user.id || user.userId}
                    onClick={() => onSelectUser && onSelectUser(user)}
                    className={`transition-colors duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-[#E2EDF3] text-[#0A4B6E] font-medium"
                        : "hover:bg-[#E8F3F8]/70 bg-white"
                    }`}
                  >
                    {/* User Account with Avatar, Full Name & Username handle */}
                    <td className="py-3.5 px-4 md:px-5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
                          {initials || <UserRound size={14} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#0A4B6E] truncate text-xs md:text-sm">
                            {fullName}
                          </div>
                          {user.username && (
                            <div className="text-[11px] text-[#6D8AA2] font-normal truncate">
                              @{user.username}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3.5 px-4 md:px-5">
                      <Badge
                        variant="roles"
                        className="text-[10px] px-2.5 py-0.5 truncate max-w-full inline-block"
                      >
                        {roleName}
                      </Badge>
                    </td>

                    {/* Contact Number */}
                    <td className="py-3.5 px-4 md:px-5">
                      <div className="flex items-center gap-1.5 text-gray-700 font-medium text-xs md:text-sm">
                        <Phone size={13} className="text-[#6D8AA2] shrink-0" />
                        <span className="truncate">
                          {phoneVal ? formatPhilippinePhone(phoneVal) : "-"}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 md:px-5 text-center whitespace-nowrap">
                      <Badge
                        variant={getBadgeVariant(user)}
                        className="text-[10px] px-2.5 py-0.5"
                      >
                        {getStatusText(user)}
                      </Badge>
                    </td>

                    {/* Date Created */}
                    <td className="py-3.5 px-4 md:px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-[#6D8AA2] italic">
                        <Calendar size={13} className="text-[#6D8AA2] shrink-0" />
                        <span>{formatDate(user.createdAt || user.dateCreated)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="py-12 text-center text-gray-400 italic"
                >
                  No users match your search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
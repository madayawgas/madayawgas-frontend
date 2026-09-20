import { Pencil, Trash2, RotateCcw, KeyRound, UserRound } from "lucide-react";
import Badge from "../ui/Badge";
import { formatPhilippinePhone } from "../../utils/phone.js";
import { getUserRoleNames, hasUserRole } from "../../utils/userRoles.js";

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

export default function UserDetailPanel({
  user,
  onClose,
  onEdit,
  onResetPassword,
  onDelete,
  onReactivate,
  canManage = true,
}) {
  if (!user) return null;

  const getStatus = (u) => {
    if (u.isBlocked) return "SUSPENDED";
    if (u.isActive === false) return "DEACTIVATED";
    if (u.isActive === true) return "ACTIVE";
    return (u.status || "ACTIVE").toUpperCase();
  };

  const status = getStatus(user);
  const isDeactivated = status === "DEACTIVATED" || status === "INACTIVE";

  const getBadgeVariant = () => {
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

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "User Profile";
  const userRoles = getUserRoleNames(user, "Driver");

  return (
    <div className="w-full h-full bg-white border border-[#0A4B6E]/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between overflow-hidden">
      {/* Scrollable Inner Body (Scrolls independently only if content overflows) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
        {/* Sub-Header Title */}
        <p className="text-center text-xs md:text-sm font-semibold text-[#6D8AA2] mb-4 tracking-wide">
          User Profile
        </p>

        {/* 1. Header Card: Avatar, Full Name & Action Icons */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-11 h-11 rounded-full bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-sm">
              <UserRound size={26} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base md:text-lg font-bold text-[#0A4B6E] truncate">
                {fullName}
              </h3>
              <p className="text-xs text-[#6D8AA2] truncate">
                @{user.username || "username"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canManage && !hasUserRole(user, "Super Admin") && (
              <>
                <button
                  type="button"
                  title="Edit User"
                  onClick={() => onEdit && onEdit(user)}
                  className="text-[#0A4B6E] hover:opacity-75 transition-opacity cursor-pointer p-1"
                >
                  <Pencil size={18} />
                </button>

                <button
                  type="button"
                  title="Reset Password"
                  onClick={() => onResetPassword && onResetPassword(user)}
                  className="text-[#0A4B6E] hover:opacity-75 transition-opacity cursor-pointer p-1"
                >
                  <KeyRound size={18} />
                </button>

                {isDeactivated ? (
                  <button
                    type="button"
                    title="Reactivate User"
                    onClick={() => onReactivate && onReactivate(user)}
                    className="text-[#0A4B6E] hover:text-green-600 transition-colors cursor-pointer p-1"
                  >
                    <RotateCcw size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    title="Deactivate User"
                    onClick={() => onDelete && onDelete(user)}
                    className="text-[#0A4B6E] hover:text-red-500 transition-colors cursor-pointer p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* 2. Role & Status Card */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4 space-y-2.5 mb-4 text-sm">
          <div className="flex items-start">
            <span className="text-[#6D8AA2] font-medium pt-0.5 mr-2 shrink-0">
              {userRoles.length > 1 ? "Roles:" : "Role:"}
            </span>
            <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
              {userRoles.map((role, idx) => (
                <Badge key={`detail-role-${idx}`} variant="roles">
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <span className="text-[#6D8AA2] font-medium mr-2">Status:</span>
            <Badge variant={getBadgeVariant()}>{status}</Badge>
          </div>

          {user.isBlocked && (
            <div className="text-xs text-red-600 font-semibold bg-red-50 p-2 rounded-lg border border-red-200/60">
              Account is currently suspended from login.
            </div>
          )}
        </div>

        {/* 3. Personal & Contact Details Card */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4 space-y-2.5 mb-2 text-sm">
          <div>
            <span className="text-[#6D8AA2] font-medium">Contact No.:</span>
            <span className="text-[#0A4B6E] font-bold ml-2">
              {formatPhilippinePhone(user.phone || user.contactNumber || user.contactNo) || "N/A"}
            </span>
          </div>

          <div>
            <span className="text-[#6D8AA2] font-medium">Birthdate:</span>
            <span className="text-[#0A4B6E] font-bold ml-2">
              {formatDate(user.birthdate || user.birthday)}
            </span>
          </div>

          <div>
            <span className="text-[#6D8AA2] font-medium">Date Registered:</span>
            <span className="text-[#0A4B6E] font-bold ml-2">
              {formatDate(user.createdAt || user.dateCreated)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Locked Bottom Action Button */}
      <div className="shrink-0 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-[#FFDF2C] hover:bg-[#ebd024] active:scale-[0.98] text-[#0A4B6E] font-bold py-3.5 px-6 rounded-full text-sm uppercase tracking-wider transition-all duration-150 shadow-sm cursor-pointer"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

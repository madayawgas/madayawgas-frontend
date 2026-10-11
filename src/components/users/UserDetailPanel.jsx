// src/components/users/UserDetailPanel.jsx
import {
  Pencil,
  Trash2,
  RotateCcw,
  KeyRound,
  UserRound,
  Phone,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  AtSign,
} from "lucide-react";
import Badge from "../ui/Badge";
import { formatPhilippinePhone } from "../../utils/phone.js";
import { getUserRoleNames, hasUserRole } from "../../utils/userRoles.js";
import { formatPhilippineDate } from "../../utils/date.js";

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

  const fullName =
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.username ||
    "User Account";
  const userRoles = getUserRoleNames(user, "Driver");

  return (
    <div className="w-full h-full bg-white border border-[#0A4B6E]/20 rounded-2xl shadow-sm p-4 flex flex-col overflow-hidden text-left font-sans">
      {/* 1. TOP HEADER BANNER */}
      <div className="shrink-0 rounded-xl p-3.5 bg-[#F4F8FA] border border-[#BCE1F1]/70 mb-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 shadow-sm font-bold">
              <UserRound size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#0A4B6E] truncate leading-tight">
                {fullName}
              </h2>
              <p className="text-xs text-[#6D8AA2] font-medium mt-0.5 truncate flex items-center gap-0.5">
                <AtSign size={11} className="shrink-0 text-slate-400" />
                <span>{user.username || "username"}</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          {canManage && !hasUserRole(user, "Super Admin") && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEdit && onEdit(user)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-[#0A4B6E] transition-colors cursor-pointer"
                title="Edit User"
              >
                <Pencil size={15} />
              </button>

              <button
                type="button"
                onClick={() => onResetPassword && onResetPassword(user)}
                className="p-1.5 rounded-full hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                title="Reset Password"
              >
                <KeyRound size={15} />
              </button>

              {isDeactivated ? (
                <button
                  type="button"
                  onClick={() => onReactivate && onReactivate(user)}
                  className="p-1.5 rounded-full hover:bg-emerald-100 text-emerald-600 transition-colors cursor-pointer"
                  title="Reactivate User"
                >
                  <RotateCcw size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onDelete && onDelete(user)}
                  className="p-1.5 rounded-full hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                  title="Deactivate User"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Status & Roles Row */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#BCE1F1]/50 flex-wrap">
          <Badge variant={getBadgeVariant()} className="px-3 py-0.5 text-xs font-bold">
            {status}
          </Badge>

          {userRoles.map((role, idx) => (
            <Badge key={`detail-role-${idx}`} variant="roles" className="text-[10.5px]">
              {role}
            </Badge>
          ))}
        </div>
      </div>

      {/* 2. SCROLLABLE CONTENT BODY */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 pr-0.5">
        {/* Suspended Warning Box */}
        {user.isBlocked && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#CD3E3E]">
              <AlertTriangle size={14} className="shrink-0" />
              <span>Account Suspended</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-700">
              This account is currently blocked from system login.
            </p>
          </div>
        )}

        {/* SECTION: ROLES & ACCESS CONTROL */}
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
            <ShieldCheck size={13} className="text-[#0A4B6E]" />
            <span>Role & Access Control</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5 shrink-0 pt-0.5">
                <ShieldCheck size={13} className="text-slate-400" />
                <span>Assigned {userRoles.length > 1 ? "Roles" : "Role"}</span>
              </span>
              <div className="flex flex-wrap items-center gap-1 justify-end">
                {userRoles.map((role, idx) => (
                  <Badge key={`body-role-${idx}`} variant="roles">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <UserRound size={13} className="text-slate-400" />
                <span>Account Status</span>
              </span>
              <Badge variant={getBadgeVariant()} className="px-2.5 py-0.5 text-[10.5px] font-bold">
                {status}
              </Badge>
            </div>
          </div>
        </div>

        {/* SECTION: PERSONAL & CONTACT INFO */}
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
            <UserRound size={13} className="text-[#0A4B6E]" />
            <span>Personal & Contact Info</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Phone size={13} className="text-slate-400" />
                <span>Contact Number</span>
              </span>
              <span className="font-mono font-bold text-[#0A4B6E]">
                {formatPhilippinePhone(user.phone || user.contactNumber || user.contactNo) ||
                  "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                <span>Birthdate</span>
              </span>
              <span className="font-medium text-slate-700">
                {formatPhilippineDate(user.birthdate || user.birthday)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                <span>Date Registered</span>
              </span>
              <span className="font-medium text-slate-700">
                {formatPhilippineDate(user.createdAt || user.dateCreated)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PINNED BOTTOM CLOSE BUTTON */}
      <div className="shrink-0 pt-3 border-t border-slate-200 mt-2">
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider py-2.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}


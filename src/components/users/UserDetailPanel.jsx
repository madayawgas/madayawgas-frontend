// src/components/users/UserDetailPanel.jsx
import React from "react";
import {
  Pencil,
  Trash2,
  RotateCcw,
  KeyRound,
  UserRound,
  Phone,
  Calendar,
  ShieldCheck,
  AtSign,
} from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { formatPhilippinePhone } from "../../utils/phone.js";
import { getUserRoleNames } from "../../utils/userRoles.js";
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

  const userRoles = getUserRoleNames(user, "Staff");

  return (
    <div className="flex flex-col gap-4 text-left font-sans">
      {/* SECTION 1: ACCOUNT & RBAC ROLE */}
      <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
          <ShieldCheck size={14} className="text-[#0A4B6E]" />
          <span>Account & Security Role</span>
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <AtSign size={13} className="text-slate-400" />
              <span>Username Handle</span>
            </span>
            <span className="font-mono font-bold text-[#0A4B6E]">
              @{user.username || "user"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <ShieldCheck size={13} className="text-slate-400" />
              <span>Assigned Roles</span>
            </span>
            <div className="flex flex-wrap gap-1 justify-end">
              {userRoles.map((role) => (
                <Badge key={role} variant="roles" className="px-2 py-0.5 text-[10px]">
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <ShieldCheck size={13} className="text-slate-400" />
              <span>Account Status</span>
            </span>
            <Badge variant={getBadgeVariant()} className="px-2.5 py-0.5 text-[10px] font-bold">
              {status}
            </Badge>
          </div>
        </div>
      </div>

      {/* SECTION 2: PERSONAL & CONTACT INFORMATION */}
      <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
          <UserRound size={14} className="text-[#0A4B6E]" />
          <span>Personal & Contact Info</span>
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Phone size={13} className="text-slate-400" />
              <span>Contact Number</span>
            </span>
            <span className="font-mono font-bold text-[#0A4B6E]">
              {formatPhilippinePhone(user.phone || user.contactNumber || user.contactNo) || "N/A"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Calendar size={13} className="text-slate-400" />
              <span>Birthdate</span>
            </span>
            <span className="font-medium text-slate-700">
              {formatPhilippineDate(user.birthdate || user.birthday)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Calendar size={13} className="text-slate-400" />
              <span>Date Registered</span>
            </span>
            <span className="font-medium text-slate-700">
              {formatPhilippineDate(user.createdAt || user.dateCreated)}
            </span>
          </div>
        </div>
      </div>

      {/* ACTIONS ROW */}
      {canManage && (
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-200">
          <div className="flex items-center gap-2">
            {!isDeactivated ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete && onDelete(user)}
                className="gap-1.5"
              >
                <Trash2 size={13} />
                <span>Deactivate</span>
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onReactivate && onReactivate(user)}
                className="gap-1.5 text-emerald-700 hover:text-emerald-800"
              >
                <RotateCcw size={13} />
                <span>Reactivate</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onResetPassword && onResetPassword(user)}
              className="gap-1.5"
            >
              <KeyRound size={13} />
              <span>Reset Password</span>
            </Button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onEdit && onEdit(user)}
            className="gap-1.5"
          >
            <Pencil size={13} />
            <span>Edit User</span>
          </Button>
        </div>
      )}
    </div>
  );
}

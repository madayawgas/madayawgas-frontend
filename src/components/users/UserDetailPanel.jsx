// src/components/users/UserDetailPanel.jsx
import React, { useState, useRef } from "react";
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
  Camera,
  Crop,
} from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import AvatarCropModal from "../ui/AvatarCropModal";
import ConfirmationModal from "../ui/ConfirmationModal";
import { usersApi } from "../../api/users.js";
import { resolveMediaUrl } from "../../utils/media.js";
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
  onAvatarUpdate,
  canManage = true,
}) {
  if (!user) return null;

  const [cropImageSource, setCropImageSource] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [showRemoveAvatarModal, setShowRemoveAvatarModal] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const fullName =
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.username ||
    "User Account";

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        e.target.value = "";
        return;
      }
      setCropImageSource(file);
      setIsCropModalOpen(true);
    }
    e.target.value = "";
  };

  const handleEditExistingAvatar = () => {
    const existing = user.avatarUrl || resolveMediaUrl(user.avatarMediaKey);
    if (existing) {
      setCropImageSource(existing);
      setIsCropModalOpen(true);
    }
  };

  const handleSaveCroppedAvatar = async (croppedFile) => {
    const result = await usersApi.uploadUserAvatar(user.id, croppedFile);
    if (onAvatarUpdate) {
      onAvatarUpdate(user.id, {
        avatarMediaKey: result.avatarMediaKey,
        avatarUrl: result.avatarUrl,
      });
    }
  };

  const handleConfirmRemoveAvatar = async () => {
    setIsRemovingAvatar(true);
    try {
      await usersApi.deleteUserAvatar(user.id);
      if (onAvatarUpdate) {
        onAvatarUpdate(user.id, {
          avatarMediaKey: null,
          avatarUrl: null,
        });
      }
      setShowRemoveAvatarModal(false);
    } finally {
      setIsRemovingAvatar(false);
    }
  };

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
      {/* IDENTITY & AVATAR BLOCK */}
      <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
        <div className="relative shrink-0">
          <Avatar
            src={user.avatarUrl}
            storageKey={user.avatarMediaKey}
            name={fullName}
            size="xl"
            className="border-2 border-white shadow-sm"
          />
          {canManage && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] p-1.5 rounded-full shadow-xs transition active:scale-95 cursor-pointer"
              title="Upload or change photo"
            >
              <Camera size={12} />
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm text-[#0A4B6E] truncate">{fullName}</h3>
          <p className="text-xs text-[#6D8AA2] truncate">@{user.username || "user"}</p>
          
          {canManage && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-semibold text-[#0A4B6E] hover:underline cursor-pointer"
              >
                {user.avatarUrl || user.avatarMediaKey ? "Change photo" : "Upload photo"}
              </button>

              {(user.avatarUrl || user.avatarMediaKey) && (
                <>
                  <span className="text-slate-300 text-xs">•</span>
                  <button
                    type="button"
                    onClick={handleEditExistingAvatar}
                    className="text-[11px] font-semibold text-[#0A4B6E] hover:underline cursor-pointer"
                  >
                    Adjust
                  </button>
                  <span className="text-slate-300 text-xs">•</span>
                  <button
                    type="button"
                    onClick={() => setShowRemoveAvatarModal(true)}
                    className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

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
              {userRoles.map((role) => {
                const isPrimary = user.role && role.toLowerCase() === user.role.toLowerCase();
                return (
                  <Badge
                    key={role}
                    variant={isPrimary && userRoles.length > 1 ? "info" : "roles"}
                    className="px-2 py-0.5 text-[10px]"
                  >
                    {role}{isPrimary && userRoles.length > 1 ? " (Primary)" : ""}
                  </Badge>
                );
              })}
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

      {/* AVATAR CROP MODAL */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        imageSource={cropImageSource}
        onClose={() => {
          setIsCropModalOpen(false);
          setCropImageSource(null);
        }}
        onSave={handleSaveCroppedAvatar}
      />

      {/* REMOVE AVATAR CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={showRemoveAvatarModal}
        onClose={() => setShowRemoveAvatarModal(false)}
        onConfirm={handleConfirmRemoveAvatar}
        title="Remove User Photo"
        message={`Are you sure you want to remove the profile photo for ${fullName}?`}
        confirmText="Remove Photo"
        variant="danger"
        isLoading={isRemovingAvatar}
      />
    </div>
  );
}

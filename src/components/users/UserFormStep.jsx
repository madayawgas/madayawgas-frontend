// src/components/users/UserFormStep.jsx
import { useMemo } from "react";
import { User, KeyRound, AlertCircle, Phone, Calendar, Shield, Sparkles, Check } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { toProperCase } from "../../utils/text.js";

export default function UserFormStep({
  formData,
  setFormData,
  roles,
  user,
  statuses,
  errors = {},
  setErrors,
  submitError = "",
  setSubmitError,
  isSubmitting = false,
  onResetPassword,
  onSubmit,
  onClose,
}) {
  const clearFieldError = (field) => {
    if (errors && errors[field] && setErrors) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (submitError && setSubmitError) {
      setSubmitError("");
    }
  };

  const handleNameChange = (field, value) => {
    const sanitized = value.replace(/[^\p{L}\s\-.']/gu, "");
    setFormData((prev) => ({ ...prev, [field]: sanitized }));
    clearFieldError(field);
  };

  // Normalize system roles list
  const normalizedRoles = useMemo(() => {
    if (roles && roles.length > 0) {
      return roles.map((r, idx) => ({
        id: typeof r === "object" && r.id ? String(r.id) : `role-${idx}`,
        name: typeof r === "object" && r.name ? r.name : String(r),
      }));
    }
    return [
      { id: "admin", name: "Admin" },
      { id: "driver", name: "Driver" },
      { id: "sales-person", name: "Sales Person" },
      { id: "sales-manager", name: "Sales Manager" },
      { id: "sales-supervisor", name: "Sales Supervisor" },
      { id: "logistics-supervisor", name: "Logistics Supervisor" },
      { id: "plant-supervisor", name: "Plant Supervisor" },
      { id: "fleet-manager", name: "Fleet Manager" },
    ];
  }, [roles]);

  // Resolve currently selected role IDs
  const selectedRoleIds = useMemo(() => {
    if (Array.isArray(formData.roleIds) && formData.roleIds.length > 0) {
      return formData.roleIds.map(String);
    }
    if (formData.roleId) {
      return [String(formData.roleId)];
    }
    if (formData.role) {
      const target = String(formData.role).toLowerCase();
      const match = normalizedRoles.find((r) => r.name.toLowerCase() === target);
      if (match) return [match.id];
    }
    return normalizedRoles[0] ? [normalizedRoles[0].id] : [];
  }, [formData.roleIds, formData.roleId, formData.role, normalizedRoles]);

  // Resolve effective primary role ID
  const effectivePrimaryId = useMemo(() => {
    if (formData.primaryRoleId && selectedRoleIds.includes(String(formData.primaryRoleId))) {
      return String(formData.primaryRoleId);
    }
    if (formData.roleId && selectedRoleIds.includes(String(formData.roleId))) {
      return String(formData.roleId);
    }
    return selectedRoleIds[0] || (normalizedRoles[0] ? normalizedRoles[0].id : "");
  }, [formData.primaryRoleId, formData.roleId, selectedRoleIds, normalizedRoles]);

  // Selected role objects
  const selectedRolesList = useMemo(() => {
    return selectedRoleIds.map((id) => {
      const match = normalizedRoles.find((r) => r.id === id);
      return {
        id,
        name: match ? match.name : id,
        isPrimary: id === effectivePrimaryId,
      };
    });
  }, [selectedRoleIds, effectivePrimaryId, normalizedRoles]);

  const handleToggleRole = (role) => {
    const isSelected = selectedRoleIds.includes(role.id);
    let nextRoleIds = [];
    let nextPrimaryId = effectivePrimaryId;

    if (isSelected) {
      if (selectedRoleIds.length === 1) {
        if (setErrors) {
          setErrors((prev) => ({ ...prev, role: "User must have at least one role assigned." }));
        }
        return;
      }
      nextRoleIds = selectedRoleIds.filter((id) => id !== role.id);
      if (nextPrimaryId === role.id) {
        nextPrimaryId = nextRoleIds[0];
      }
    } else {
      nextRoleIds = [...selectedRoleIds, role.id];
      if (!nextPrimaryId) {
        nextPrimaryId = role.id;
      }
    }

    const selectedObjs = nextRoleIds.map((id) => {
      const match = normalizedRoles.find((r) => r.id === id);
      return {
        id,
        name: match ? match.name : id,
        isPrimary: id === nextPrimaryId,
      };
    });
    const selectedNames = selectedObjs.map((r) => r.name);
    const primaryObj = selectedObjs.find((r) => r.id === nextPrimaryId) || selectedObjs[0];

    setFormData((prev) => ({
      ...prev,
      roleIds: nextRoleIds,
      primaryRoleId: nextPrimaryId,
      roleId: nextPrimaryId,
      role: primaryObj?.name || "Driver",
      roles: selectedObjs,
      roleNames: selectedNames,
    }));
    clearFieldError("role");
  };

  const handleSetPrimaryRole = (primaryId) => {
    const selectedObjs = selectedRoleIds.map((id) => {
      const match = normalizedRoles.find((r) => r.id === id);
      return {
        id,
        name: match ? match.name : id,
        isPrimary: id === primaryId,
      };
    });
    const selectedNames = selectedObjs.map((r) => r.name);
    const primaryObj = selectedObjs.find((r) => r.id === primaryId) || selectedObjs[0];

    setFormData((prev) => ({
      ...prev,
      primaryRoleId: primaryId,
      roleId: primaryId,
      role: primaryRoleObj?.name || prev.role,
      roles: selectedObjs,
      roleNames: selectedNames,
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium p-3.5 rounded-2xl flex items-center gap-2.5 animate-fade-in">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
          <span>{submitError}</span>
        </div>
      )}

      {/* CARD 1: Personal Information */}
      <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs space-y-3.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A4B6E] uppercase tracking-wider">
          <User size={14} />
          <span>Personal Information</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* First Name */}
          <div>
            <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
              First Name <span className="text-[#CD3E3E]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Juan"
              value={formData.firstName}
              onChange={(e) => handleNameChange("firstName", e.target.value)}
              onBlur={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  firstName: toProperCase(e.target.value),
                }))
              }
              className={`w-full bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border outline-none transition-all placeholder:text-slate-400 ${
                errors.firstName
                  ? "border-[#CD3E3E] focus:ring-2 focus:ring-red-200"
                  : "border-slate-200 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10"
              }`}
            />
            {errors.firstName && (
              <p className="text-[#CD3E3E] text-[11px] mt-1 font-medium flex items-center gap-1">
                <AlertCircle size={12} className="shrink-0" />
                <span>{errors.firstName}</span>
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
              Last Name <span className="text-[#CD3E3E]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dela Cruz"
              value={formData.lastName}
              onChange={(e) => handleNameChange("lastName", e.target.value)}
              onBlur={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  lastName: toProperCase(e.target.value),
                }))
              }
              className={`w-full bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border outline-none transition-all placeholder:text-slate-400 ${
                errors.lastName
                  ? "border-[#CD3E3E] focus:ring-2 focus:ring-red-200"
                  : "border-slate-200 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10"
              }`}
            />
            {errors.lastName && (
              <p className="text-[#CD3E3E] text-[11px] mt-1 font-medium flex items-center gap-1">
                <AlertCircle size={12} className="shrink-0" />
                <span>{errors.lastName}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Birthday */}
          <div>
            <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
              Birthday
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => {
                  setFormData({ ...formData, birthday: e.target.value });
                  clearFieldError("birthday");
                }}
                className={`w-full bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border outline-none transition-all cursor-pointer ${
                  errors.birthday
                    ? "border-[#CD3E3E] focus:ring-2 focus:ring-red-200"
                    : "border-slate-200 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10"
                }`}
              />
            </div>
            {errors.birthday && (
              <p className="text-[#CD3E3E] text-[11px] mt-1 font-medium flex items-center gap-1">
                <AlertCircle size={12} className="shrink-0" />
                <span>{errors.birthday}</span>
              </p>
            )}
          </div>

          {/* Contact No. */}
          <div>
            <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
              Contact Number <span className="text-[#CD3E3E]">*</span>
            </label>
            <div
              className={`w-full bg-white flex items-center px-3 py-1.5 rounded-xl border transition-all ${
                errors.contactNo
                  ? "border-[#CD3E3E] ring-2 ring-red-200"
                  : "border-slate-200 focus-within:border-[#0A4B6E] focus-within:ring-2 focus-within:ring-[#0A4B6E]/10"
              }`}
            >
              <span className="text-slate-500 text-xs font-semibold mr-2 pr-2 border-r border-slate-200 select-none">
                +63
              </span>
              <input
                type="text"
                required
                placeholder="9171234567"
                value={formData.contactNo}
                maxLength={10}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData({ ...formData, contactNo: digits });
                  clearFieldError("contactNo");
                }}
                className="bg-transparent text-slate-800 text-xs sm:text-sm w-full outline-none py-1"
              />
            </div>
            {errors.contactNo && (
              <p className="text-[#CD3E3E] text-[11px] mt-1 font-medium flex items-center gap-1">
                <AlertCircle size={12} className="shrink-0" />
                <span>{errors.contactNo}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* CARD 2: Role & System Privileges */}
      <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A4B6E] uppercase tracking-wider">
            <Shield size={14} />
            <span>Role & Access Privileges</span>
          </div>
          <span className="text-[11px] font-semibold text-[#6D8AA2]">
            {selectedRoleIds.length} {selectedRoleIds.length === 1 ? "role selected" : "roles selected"}
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider">
              System Role Access <span className="text-[#CD3E3E]">*</span>
            </label>
            <span className="text-[10px] text-slate-400 font-medium">Click to select / unselect</span>
          </div>

          {/* Interactive Role Chips */}
          <div className="flex flex-wrap gap-2">
            {normalizedRoles.map((role) => {
              const isSelected = selectedRoleIds.includes(role.id);
              const isPrimary = role.id === effectivePrimaryId;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleToggleRole(role)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    isSelected
                      ? "bg-[#0A4B6E] text-white border-[#0A4B6E] shadow-2xs font-semibold"
                      : "bg-[#F3F5F5] text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  {isSelected ? (
                    <Check size={13} className="text-[#FFDF2C] shrink-0" />
                  ) : null}
                  <span>{role.name}</span>
                  {isSelected && selectedRoleIds.length > 1 && isPrimary && (
                    <span className="text-[9px] font-bold bg-[#FFDF2C] text-[#0A4B6E] px-1.5 py-0.5 rounded-full uppercase tracking-wider ml-0.5 shadow-2xs">
                      Primary
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {errors.role && (
            <p className="text-[#CD3E3E] text-[11px] mt-2 font-medium flex items-center gap-1">
              <AlertCircle size={12} className="shrink-0" />
              <span>{errors.role}</span>
            </p>
          )}

          {/* Primary Role Designation Selector when multiple roles selected */}
          {selectedRoleIds.length > 1 && (
            <div className="mt-3.5 p-3 bg-[#E8F3F8]/70 rounded-xl border border-[#BCE1F1]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 shadow-2xs">
                  <Shield size={12} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0A4B6E]">Primary Role Designation</p>
                  <p className="text-[11px] text-[#6D8AA2]">Main role used for navigation & default permissions</p>
                </div>
              </div>

              <select
                value={effectivePrimaryId}
                onChange={(e) => handleSetPrimaryRole(e.target.value)}
                className="bg-white text-[#0A4B6E] font-semibold text-xs px-3 py-1.5 rounded-lg border border-[#BCE1F1] focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10 outline-none cursor-pointer shrink-0"
              >
                {selectedRolesList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Primary)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Editing mode specific options */}
        {user && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={formData.username}
                className="w-full bg-slate-100 text-slate-500 font-mono text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 cursor-not-allowed select-all"
              />
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl flex items-center justify-between gap-3 border border-slate-200/80">

              <div>
                <p className="text-xs font-bold text-[#0A4B6E]">Reset Credentials</p>
                <p className="text-[11px] text-[#6D8AA2]">Issue temporary credentials to user</p>
              </div>
              <button
                type="button"
                onClick={() => onResetPassword && onResetPassword(user)}
                className="bg-[#0A4B6E] hover:bg-[#083b57] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-full flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <KeyRound size={13} className="text-[#FFDF2C]" />
                <span>Reset Password</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1.5">
                Operational Status
              </label>
              <div className="flex items-center gap-2">
                {statuses.map((s) => {
                  const isSelected = formData.status === s.value;
                  return (
                    <label key={s.value} className="cursor-pointer relative flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value={s.value}
                        checked={isSelected}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value,
                            isBlocked: e.target.value === "SUSPENDED",
                          })
                        }
                        className="sr-only"
                      />
                      <Badge
                        variant={s.variant}
                        className={`px-4 py-1.5 text-xs transition-all duration-150 ${
                          isSelected
                            ? "ring-2 ring-offset-1 ring-[#0A4B6E] font-bold shadow-xs scale-102"
                            : "opacity-50 hover:opacity-80"
                        }`}
                      >
                        {s.label}
                      </Badge>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="pt-2 flex flex-col gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#FFDF2C] hover:bg-[#ebd024] active:scale-[0.98] text-[#0A4B6E] font-bold py-3.5 px-6 rounded-full text-xs md:text-sm uppercase tracking-wider transition-all duration-150 shadow-sm cursor-pointer disabled:opacity-50"
        >
          {isSubmitting
            ? user
              ? "SAVING CHANGES..."
              : "PROCESSING..."
            : user
            ? "SAVE CHANGES"
            : "CONTINUE TO CONFIRMATION"}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="w-full bg-transparent hover:bg-slate-50 text-slate-500 font-semibold py-2 rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}
import { UserRound, AlertCircle, Shield, Phone, Calendar, CheckCircle2 } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { getUserRoleNames } from "../../utils/userRoles.js";

export default function UserConfirmStep({
  formData,
  safeRole,
  onConfirm,
  isSubmitting = false,
  submitError = "",
}) {
  const userRoles = getUserRoleNames(formData, safeRole || "User");
  return (
    <div className="space-y-4">
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium p-3.5 rounded-2xl flex items-center gap-2.5 animate-fade-in">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
          <span>{submitError}</span>
        </div>
      )}

      {/* CONFIRMATION SUMMARY CARD */}
      <div className="bg-[#E8F3F8] rounded-2xl p-5 border border-[#BCE1F1]/60 space-y-4">
        {/* User Avatar + Name + Role Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#BCE1F1]/60">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-12 h-12 rounded-full bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-xs">
              <UserRound size={26} className="text-[#FFDF2C]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-[#0A4B6E] truncate">
                {formData.firstName} {formData.lastName}
              </h3>
              <p className="text-xs text-[#6D8AA2] font-medium">New User Account</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0 max-w-[50%]">
            {userRoles.map((role, idx) => (
              <Badge key={`confirm-role-${idx}`} variant="roles" className="shrink-0">
                {role}
              </Badge>
            ))}
          </div>
        </div>

        {/* Detailed User Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
          <div className="bg-white/80 p-3 rounded-xl border border-[#BCE1F1]/40 space-y-1">
            <span className="text-[#6D8AA2] font-semibold flex items-center gap-1.5">
              <Phone size={13} /> Mobile Contact
            </span>
            <p className="font-bold text-[#0A4B6E] text-sm">
              {formData.contactNo ? `+63 ${formData.contactNo}` : "N/A"}
            </p>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-[#BCE1F1]/40 space-y-1">
            <span className="text-[#6D8AA2] font-semibold flex items-center gap-1.5">
              <Calendar size={13} /> Birthdate
            </span>
            <p className="font-bold text-[#0A4B6E] text-sm">
              {formData.birthday || "Not Specified"}
            </p>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-[#BCE1F1]/40 space-y-1">
            <span className="text-[#6D8AA2] font-semibold flex items-center gap-1.5">
              <Shield size={13} /> {userRoles.length > 1 ? "Role Privileges" : "Role Privilege"}
            </span>
            <p className="font-bold text-[#0A4B6E] text-sm">{userRoles.join(", ")}</p>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-[#BCE1F1]/40 space-y-1">
            <span className="text-[#6D8AA2] font-semibold">Account Status</span>
            <div>
              <Badge variant="success" className="px-3 py-0.5 text-[10px] font-bold">
                ACTIVE
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Action Button */}
      <div className="pt-2 flex flex-col gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="w-full bg-[#FFDF2C] hover:bg-[#ebd024] active:scale-[0.98] text-[#0A4B6E] font-bold py-3.5 px-6 rounded-full text-xs md:text-sm uppercase tracking-wider transition-all duration-150 shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span>CREATING USER ACCOUNT...</span>
          ) : (
            <>
              <CheckCircle2 size={16} />
              <span>CONFIRM & CREATE ACCOUNT</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
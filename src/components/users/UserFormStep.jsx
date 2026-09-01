import { KeyRound, AlertCircle } from "lucide-react";
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

  return (
    <form onSubmit={onSubmit} className="px-8 pb-8 overflow-y-auto max-h-[85vh]">
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium p-3.5 rounded-2xl flex items-center gap-2.5 mb-5 animate-fade-in">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[15px] text-gray-900 mb-1.5">
              First Name<span className="text-[#CD3E3E]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => {
                setFormData({ ...formData, firstName: e.target.value });
                clearFieldError("firstName");
              }}
              onBlur={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  firstName: toProperCase(e.target.value),
                }))
              }
              className={`w-full bg-[#F3F5F5] text-gray-800 text-sm px-4 py-3 rounded-full outline-none focus:ring-2 ${
                errors.firstName
                  ? "border-2 border-[#CD3E3E] focus:ring-red-200"
                  : "focus:ring-[#0B4A6E]/20"
              }`}
            />
            {errors.firstName && (
              <p className="text-[#CD3E3E] text-xs mt-1.5 ml-3 font-medium flex items-center gap-1">
                <AlertCircle size={13} className="shrink-0" />
                <span>{errors.firstName}</span>
              </p>
            )}
          </div>
          <div>
            <label className="block text-[15px] text-gray-900 mb-1.5">
              Last Name<span className="text-[#CD3E3E]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => {
                setFormData({ ...formData, lastName: e.target.value });
                clearFieldError("lastName");
              }}
              onBlur={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  lastName: toProperCase(e.target.value),
                }))
              }
              className={`w-full bg-[#F3F5F5] text-gray-800 text-sm px-4 py-3 rounded-full outline-none focus:ring-2 ${
                errors.lastName
                  ? "border-2 border-[#CD3E3E] focus:ring-red-200"
                  : "focus:ring-[#0B4A6E]/20"
              }`}
            />
            {errors.lastName && (
              <p className="text-[#CD3E3E] text-xs mt-1.5 ml-3 font-medium flex items-center gap-1">
                <AlertCircle size={13} className="shrink-0" />
                <span>{errors.lastName}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[15px] text-gray-900 mb-1.5">Birthday</label>
            <input
              type="date"
              value={formData.birthday}
              onChange={(e) => {
                setFormData({ ...formData, birthday: e.target.value });
                clearFieldError("birthday");
              }}
              className={`w-full bg-[#F3F5F5] text-gray-800 text-sm px-4 py-3 rounded-full outline-none focus:ring-2 cursor-pointer ${
                errors.birthday
                  ? "border-2 border-[#CD3E3E] focus:ring-red-200"
                  : "focus:ring-[#0B4A6E]/20"
              }`}
            />
            {errors.birthday && (
              <p className="text-[#CD3E3E] text-xs mt-1.5 ml-3 font-medium flex items-center gap-1">
                <AlertCircle size={13} className="shrink-0" />
                <span>{errors.birthday}</span>
              </p>
            )}
          </div>
          <div>
            <label className="block text-[15px] text-gray-900 mb-1.5">
              Contact No.<span className="text-[#CD3E3E]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 09171234567 or +639171234567"
              value={formData.contactNo}
              onChange={(e) => {
                setFormData({ ...formData, contactNo: e.target.value });
                clearFieldError("contactNo");
              }}
              className={`w-full bg-[#F3F5F5] text-gray-800 text-sm px-4 py-3 rounded-full outline-none focus:ring-2 ${
                errors.contactNo
                  ? "border-2 border-[#CD3E3E] focus:ring-red-200"
                  : "focus:ring-[#0B4A6E]/20"
              }`}
            />
            {errors.contactNo && (
              <p className="text-[#CD3E3E] text-xs mt-1.5 ml-3 font-medium flex items-center gap-1">
                <AlertCircle size={13} className="shrink-0" />
                <span>{errors.contactNo}</span>
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[15px] text-gray-900 mb-1.5">
            Role Access<span className="text-[#CD3E3E]">*</span>
          </label>
          <select
            required
            value={formData.role}
            onChange={(e) => {
              setFormData({ ...formData, role: e.target.value });
              clearFieldError("role");
            }}
            className={`w-full bg-[#F3F5F5] text-gray-800 text-sm px-4 py-3 rounded-full outline-none focus:ring-2 cursor-pointer appearance-none ${
              errors.role
                ? "border-2 border-[#CD3E3E] focus:ring-red-200"
                : "focus:ring-[#0B4A6E]/20"
            }`}
          >
            {roles && roles.length > 0 ? (
              roles.map((r, idx) => (
                <option key={idx} value={typeof r === "string" ? r : r.name}>
                  {typeof r === "string" ? r : r.name}
                </option>
              ))
            ) : (
              <>
                <option value="" disabled>Select a role</option>
                <option value="Super Admin">Super Admin</option>
                <option value="System Admin">System Admin</option>
                <option value="Driver">Driver</option>
                <option value="Sales Person">Sales Person</option>
                <option value="Sales Manager">Sales Manager</option>
              </>
            )}
          </select>
          {errors.role && (
            <p className="text-[#CD3E3E] text-xs mt-1.5 ml-3 font-medium flex items-center gap-1">
              <AlertCircle size={13} className="shrink-0" />
              <span>{errors.role}</span>
            </p>
          )}
        </div>

        {user && (
          <>
            <div>
              <label className="block text-[15px] text-gray-900 mb-1.5">Username</label>
              <input
                type="text"
                readOnly
                disabled
                value={formData.username}
                className="w-full bg-[#F3F5F5] text-gray-500 text-sm px-4 py-3 rounded-full outline-none cursor-not-allowed select-all border border-gray-200/50"
              />
            </div>

            <div className="p-4 bg-[#F3F5F5] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-200/60">
              <div>
                <p className="text-sm font-semibold text-gray-900">Account Password</p>
                <p className="text-xs text-gray-500">Reset password and generate temporary credentials</p>
              </div>
              <button
                type="button"
                onClick={() => onResetPassword && onResetPassword(user)}
                className="px-4 py-2 bg-[#0F7AB2] hover:bg-[#0c628f] text-white text-xs font-bold rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider shrink-0"
              >
                <KeyRound size={14} />
                RESET PASSWORD
              </button>
            </div>

            <div>
              <label className="block text-[15px] text-gray-900 mb-2">Status</label>
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
                        className={`px-5 py-2 text-[11px] transition-all duration-200 ease-in-out ${
                          isSelected
                            ? "filter saturate-150 brightness-95 shadow-inner scale-[1.02] border-2 font-extrabold"
                            : "opacity-60 grayscale-[40%] hover:opacity-80"
                        }`}
                      >
                        {s.label}
                      </Badge>
                    </label>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-[#F6C445] hover:bg-[#e2b23b] disabled:opacity-50 disabled:cursor-not-allowed border-none !text-[#0B4A6E] rounded-full font-bold uppercase tracking-widest text-[11px] transition-colors"
        >
          {isSubmitting
            ? user
              ? "SAVING..."
              : "PROCESSING..."
            : user
            ? "SAVE CHANGES"
            : "CREATE ACCOUNT"}
        </Button>
        <Button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="w-full py-2.5 bg-transparent border-none !text-[#0B4A6E] font-bold uppercase tracking-widest text-[11px] hover:bg-gray-50 disabled:opacity-50 rounded-full transition-colors cursor-pointer"
        >
          CANCEL
        </Button>
      </div>
    </form>
  );
}
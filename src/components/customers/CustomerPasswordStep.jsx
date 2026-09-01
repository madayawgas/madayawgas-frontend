import Button from "../ui/Button";
import { Eye, EyeOff } from "lucide-react";

export default function CustomerPasswordStep({
  adminPassword,
  setAdminPassword,
  showPassword,
  setShowPassword,
  passwordError,
  setPasswordError,
  isVerifying,
  currentUser,
  onProceed,
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (adminPassword && !isVerifying) {
          onProceed();
        }
      }}
      className="px-8 pb-8 overflow-y-auto max-h-[85vh]"
    >
      <p className="text-gray-700 text-[15px] mb-6">
        For security, please enter your password to confirm this action.
      </p>

      <input
        type="text"
        name="username"
        value={currentUser?.username || ""}
        autoComplete="username"
        readOnly
        className="sr-only"
        tabIndex="-1"
      />

      <div className="relative mb-2">
        <input
          type={showPassword ? "text" : "password"}
          name="admin_confirm_password"
          id="admin_confirm_password"
          value={adminPassword}
          onChange={(e) => {
            setAdminPassword(e.target.value);
            if (passwordError) setPasswordError("");
          }}
          placeholder="****************"
          autoComplete="current-password"
          autoFocus
          className={`w-full bg-[#F3F5F5] text-gray-800 text-sm px-4 py-3.5 rounded-full outline-none focus:ring-2 ${
            passwordError
              ? "border-2 border-red-500 focus:ring-red-200"
              : "focus:ring-[#0B4A6E]/20"
          } pr-12`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {passwordError && (
        <p className="text-red-500 text-xs ml-4 mb-4 font-semibold">
          {passwordError}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <Button
          type="submit"
          disabled={!adminPassword || isVerifying}
          className="w-full py-3.5 bg-[#C93B32] hover:bg-[#a8322a] disabled:opacity-50 disabled:cursor-not-allowed border-none !text-white rounded-full font-bold uppercase tracking-widest text-[11px] transition-colors cursor-pointer"
        >
          {isVerifying ? "VERIFYING..." : "PROCEED"}
        </Button>
      </div>
    </form>
  );
}

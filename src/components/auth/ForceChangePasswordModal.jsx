import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { authApi } from "../../api/auth.js";
import { KeyRound, Eye, EyeOff, AlertTriangle, LogOut, CheckCircle2 } from "lucide-react";
import Button from "../ui/Button";

/**
 * Inescapable modal requiring the user to set a new password on first login
 * or whenever mustChangePassword is true.
 */
export default function ForceChangePasswordModal() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [userAccount] = useState(currentUser);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      // API Contract: first-login / mustChangePassword: true does not require currentPassword
      await authApi.changePassword({ newPassword });
      setIsSuccess(true);
    } catch (err) {
      setIsSubmitting(false);
      setError(err?.message || "Failed to change password. Please try again.");
    }
  };

  const handleGoToLogin = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", {
        replace: true,
        state: {
          successMessage: "Password changed successfully! Please log in with your new password.",
        },
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const activeAccount = userAccount || currentUser;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="force-change-password-title"
    >
      <div
        className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative text-left animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {isSuccess ? (
          <div className="py-2 space-y-6 animate-fade-in">
            {/* Header & Icon */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center border border-green-200">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h2
                  id="force-change-password-title"
                  className="text-2xl font-bold text-[#0A4B6E]"
                >
                  Password Changed
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Security Setup Complete
                </p>
              </div>
            </div>

            {/* Explanation */}
            <p className="text-gray-600 text-xs leading-relaxed text-center px-2">
              Your new password has been successfully updated. All active sessions have been terminated for security. Please log in with your new password.
            </p>

            {/* Account Details Card */}
            {activeAccount && (
              <div className="bg-[#F3F5F5] border border-gray-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Account:</span>
                  <span className="font-bold text-[#0A4B6E]">
                    {activeAccount.firstName && activeAccount.lastName
                      ? `${activeAccount.firstName} ${activeAccount.lastName}`
                      : activeAccount.username}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Username:</span>
                  <span className="font-mono font-bold text-gray-800">
                    {activeAccount.username}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Password Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-green-600">
                    <CheckCircle2 size={13} />
                    <span>Permanent Password Set</span>
                  </span>
                </div>
              </div>
            )}

            {/* Proceed to Login Button */}
            <div className="pt-2">
              <Button
                type="button"
                onClick={handleGoToLogin}
                className="w-full py-3.5 bg-[#FFDF2C] hover:bg-[#F5D020] border-none !text-[#0A4B6E] font-bold rounded-full text-xs uppercase tracking-wider shadow-sm transition cursor-pointer"
              >
                LOG IN AGAIN
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center shrink-0">
                <KeyRound size={26} />
              </div>
              <div>
                <h2
                  id="force-change-password-title"
                  className="text-2xl font-bold text-[#0A4B6E] leading-tight"
                >
                  Set New Password
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  First-Time Login Security Setup
                </p>
              </div>
            </div>

            {/* Subtitle / Notice */}
            <p className="text-gray-600 text-xs leading-relaxed mt-3 mb-4">
              For your account security, you must set a permanent password before accessing the system.
            </p>

            {/* Account Info Pill */}
            {activeAccount && (
              <div className="bg-[#F3F5F5] rounded-xl px-3.5 py-2 mb-4 flex items-center justify-between text-xs text-gray-600 border border-gray-100">
                <span className="font-medium">Account:</span>
                <span className="font-bold text-[#0A4B6E]">
                  {activeAccount.firstName && activeAccount.lastName
                    ? `${activeAccount.firstName} ${activeAccount.lastName} (${activeAccount.username})`
                    : activeAccount.username}
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Enter new password (min. 8 characters)"
                    disabled={isSubmitting}
                    required
                    minLength={8}
                    autoFocus
                    className="w-full bg-[#F3F5F5] rounded-full px-5 py-3 text-sm text-gray-800 pr-12 focus:ring-2 focus:ring-[#0A4B6E]/20 outline-none transition disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isSubmitting}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none p-1"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Re-enter new password"
                    disabled={isSubmitting}
                    required
                    className="w-full bg-[#F3F5F5] rounded-full px-5 py-3 text-sm text-gray-800 pr-12 focus:ring-2 focus:ring-[#0A4B6E]/20 outline-none transition disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none p-1"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 p-3 rounded-xl border border-red-200 animate-fade-in">
                  <AlertTriangle size={16} className="shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2.5">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#FFDF2C] hover:bg-[#F5D020] border-none !text-[#0A4B6E] font-bold rounded-full text-xs uppercase tracking-wider shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? "UPDATING PASSWORD..." : "SET NEW PASSWORD"}
                </Button>

                {/* Safe Exit / Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isSubmitting}
                  className="w-full py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 transition cursor-pointer bg-transparent border-none"
                >
                  <LogOut size={15} />
                  <span>Log Out Instead</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

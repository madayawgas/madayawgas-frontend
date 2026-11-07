import { useState, useEffect } from "react";
import { AlertTriangle, AlertCircle, Eye, EyeOff } from "lucide-react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "warning" | "primary"
  isLoading = false,
  icon: Icon = AlertTriangle,
  requiresPassword = false,
  passwordLabel = "Enter password to authorize this action:",
  passwordPlaceholder = "••••••••••••",
}) {
  const isDanger = variant === "danger";
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPassword("");
      setShowPassword(false);
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (requiresPassword && !password.trim()) {
      setError("Password is required to proceed.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (requiresPassword) {
        await onConfirm(password);
      } else {
        await onConfirm();
      }
    } catch (err) {
      setError(err?.message || "Authentication failed. Please verify your password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isLoading || isSubmitting;
  const isSubmitDisabled = isBusy || (requiresPassword && !password.trim());

  return (
    <Modal
      isOpen={isOpen}
      onClose={isBusy ? undefined : onClose}
      title={title}
      icon={Icon}
      maxWidth="max-w-md"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isBusy}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDanger ? "destructive" : "primary"}
            onClick={handleSubmit}
            isLoading={isBusy}
            disabled={isSubmitDisabled}
            className="w-full sm:w-auto font-bold uppercase tracking-wider text-xs"
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {/* Warning Message Box */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
            isDanger
              ? "bg-rose-50/70 border-rose-100 text-rose-950"
              : "bg-amber-50/70 border-amber-100 text-amber-950"
          }`}
        >
          <AlertCircle
            size={18}
            className={`shrink-0 mt-0.5 ${
              isDanger ? "text-[#C93B32]" : "text-amber-600"
            }`}
          />
          <div className="space-y-1">
            {typeof message === "string" ? <p>{message}</p> : message}
          </div>
        </div>

        {/* Inline Password Authorization Field */}
        {requiresPassword && (
          <div className="pt-1 space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-[#0A4B6E]">
              {passwordLabel}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder={passwordPlaceholder}
                disabled={isBusy}
                autoFocus
                className="w-full bg-[#F3F5F5] text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none pr-10 focus:ring-2 focus:ring-[#0A4B6E]/20 focus:border-[#0A4B6E] disabled:opacity-60 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isBusy}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6D8AA2] hover:text-[#0A4B6E] cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && (
              <p className="text-rose-600 text-[11px] font-medium flex items-center gap-1 mt-1">
                <AlertTriangle size={12} className="shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}

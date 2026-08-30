import { useState, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff, AlertTriangle } from "lucide-react";
import Button from "../ui/Button";

export default function AdminPasswordModal({ isOpen, onClose, onSubmit }) {
  const [adminPassword, setAdminPassword] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAdminPassword("");
      setError("");
      setShowPasswordText(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setError("Please enter your admin password.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(adminPassword);
    } catch (err) {
      setError(err?.message || "Incorrect password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-xl relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[#0B4A6E]">Input Password</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[#0B4A6E] hover:opacity-75 transition-opacity cursor-pointer bg-transparent border-none p-0 disabled:opacity-50"
          >
            <ArrowLeft size={24} />
          </button>
        </div>

        <p className="text-gray-800 mb-6 text-[15px] leading-relaxed">
          For security, please enter your password to confirm this action.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-2">
            <input
              type={showPasswordText ? "text" : "password"}
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="****************"
              disabled={isSubmitting}
              autoFocus
              className="w-full bg-[#F3F5F5] text-gray-800 px-5 py-3.5 rounded-full outline-none pr-12 focus:ring-2 focus:ring-[#0B4A6E]/20 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPasswordText(!showPasswordText)}
              disabled={isSubmitting}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#0B4A6E] hover:opacity-75 cursor-pointer bg-transparent border-none p-0"
            >
              {showPasswordText ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Inline error container with Lucide AlertTriangle */}
          <div className="min-h-[24px] mb-6">
            {error && (
              <p className="text-red-600 text-xs font-medium px-4 pt-1 flex items-center gap-1.5">
                <AlertTriangle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#CD3E3E] border-none text-white rounded-full font-semibold uppercase tracking-widest text-sm hover:bg-[#b83737] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "VERIFYING..." : "PROCEED"}
          </Button>
        </form>
      </div>
    </div>
  );
}
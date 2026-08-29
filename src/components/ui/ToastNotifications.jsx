import { Info, Check, AlertTriangle, X } from "lucide-react";

export default function ToastNotification({
  type = "info", // "info" | "success" | "warning" | "error"
  message,
  onClose,
  className = "",
}) {
  const configs = {
    info: {
      bg: "bg-[#4299E1]",
      icon: Info,
      defaultMessage: "Changes not Saved",
    },
    success: {
      bg: "bg-[#48BB78]",
      icon: Check,
      defaultMessage: "Saved Changes",
    },
    warning: {
      bg: "bg-[#ECC94B]",
      icon: AlertTriangle,
      defaultMessage: "Warning",
    },
    error: {
      bg: "bg-[#F56565]",
      icon: X,
      defaultMessage: "An error occurred",
    },
  };

  const currentConfig = configs[type] || configs.info;
  const Icon = currentConfig.icon;
  const displayMessage = message || currentConfig.defaultMessage;

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center gap-2.5
        px-4 py-2.5
        rounded-full
        text-white font-medium text-sm
        shadow-lg
        transition-all duration-300 ease-in-out
        ${currentConfig.bg}
        ${className}
      `}
    >
      <Icon size={18} className="shrink-0" />
      <span>{displayMessage}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-1 p-0.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer shrink-0"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
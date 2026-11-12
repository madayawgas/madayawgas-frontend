import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";

export default function ToastNotification({
  show = true,
  type = "info", // "info" | "success" | "warning" | "error"
  title,
  message,
  duration = 4000,
  onClose,
  className = "",
}) {
  useEffect(() => {
    if (!show || !onClose || duration <= 0) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [show, onClose, duration]);

  if (show === false) return null;

  const configs = {
    info: {
      bg: "bg-[#0A4B6E] text-white border-sky-700",
      icon: Info,
      iconColor: "text-sky-300",
      defaultTitle: "Information",
      defaultMessage: "Notification update",
    },
    success: {
      bg: "bg-[#1B4332] text-white border-emerald-700",
      icon: CheckCircle2,
      iconColor: "text-emerald-400",
      defaultTitle: "Success",
      defaultMessage: "Saved Changes",
    },
    warning: {
      bg: "bg-[#78350F] text-white border-amber-600",
      icon: AlertTriangle,
      iconColor: "text-amber-300",
      defaultTitle: "Warning",
      defaultMessage: "Please check your inputs",
    },
    error: {
      bg: "bg-[#7F1D1D] text-white border-rose-700",
      icon: XCircle,
      iconColor: "text-rose-300",
      defaultTitle: "Error",
      defaultMessage: "An error occurred",
    },
  };

  const currentConfig = configs[type] || configs.info;
  const Icon = currentConfig.icon;
  const displayTitle = title !== undefined ? title : null;
  const displayMessage = message || currentConfig.defaultMessage;

  const toastNode = (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed bottom-6 right-6 z-50
        flex items-start gap-3
        px-4 py-3
        rounded-xl
        border shadow-xl
        max-w-sm w-full
        animate-slide-fade-in
        ${currentConfig.bg}
        ${className}
      `}
    >
      <Icon size={20} className={`shrink-0 mt-0.5 ${currentConfig.iconColor}`} />
      <div className="flex-1 min-w-0">
        {displayTitle && (
          <h4 className="text-xs font-bold leading-tight uppercase tracking-wider mb-0.5">
            {displayTitle}
          </h4>
        )}
        <p className="text-xs leading-relaxed font-medium">
          {displayMessage}
        </p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer shrink-0 -mr-1 -mt-1 text-white/80 hover:text-white"
          aria-label="Close notification"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(toastNode, document.body)
    : toastNode;
}
// src/components/ui/SideDrawer.jsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * SideDrawer Component
 * Slides in from the right edge with smooth animations (animate-slide-fade-in / animate-slide-fade-out),
 * backdrop blur, sticky header, scrollable body, and pinned footer.
 */
export default function SideDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
  footer,
  width = "max-w-xl lg:max-w-2xl",
}) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isClosing) return;
    const timer = setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 220);
    return () => clearTimeout(timer);
  }, [isClosing, onClose]);

  const handleClose = () => {
    setIsClosing(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity ${
          isClosing ? "animate-fade-out" : "animate-fade-in"
        }`}
        onClick={handleClose}
      />

      {/* Drawer Container */}
      <div
        className={`relative z-10 w-full ${width} bg-white shadow-2xl h-full flex flex-col overflow-hidden text-left border-l border-gray-100 ${
          isClosing
            ? "animate-slide-fade-out pointer-events-none"
            : "animate-slide-fade-in"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-[#F8FBFC]">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {Icon && (
              <div className="w-10 h-10 rounded-2xl bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 shadow-xs">
                <Icon size={20} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-[#0A4B6E] truncate">{title}</h2>
                {badge}
              </div>
              {subtitle && <p className="text-xs text-[#6D8AA2] mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close drawer"
            className="p-1.5 hover:bg-gray-200/70 text-[#6D8AA2] hover:text-[#0A4B6E] rounded-full transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 custom-scrollbar space-y-4">
          {children}
        </div>

        {/* Pinned Sticky Footer */}
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-white">
            {typeof footer === "function" ? footer({ onClose: handleClose }) : footer}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  badge,
  onBack,
  children,
  footer,
  maxWidth = "max-w-md",
  closeOnBackdrop = true,
  showCloseButton = true,
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    let timer;
    if (isOpen) {
      const frame = requestAnimationFrame(() => {
        setShouldRender(true);
        setIsAnimatingOut(false);
      });
      return () => cancelAnimationFrame(frame);
    } else {
      const frame = requestAnimationFrame(() => {
        setIsAnimatingOut(true);
      });
      timer = setTimeout(() => {
        setShouldRender(false);
        setIsAnimatingOut(false);
      }, 150);
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender && !isOpen) return null;

  const modalNode = (
    <div
      onClick={() => {
        if (closeOnBackdrop && onClose) onClose();
      }}
      className={`fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 ${
        isAnimatingOut ? "animate-fade-out" : "animate-fade-in"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-2xl w-full shadow-2xl relative flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden ${maxWidth} ${
          isAnimatingOut ? "animate-scale-out" : "animate-scale-in"
        }`}
      >
        {/* Header - Fixed */}
        {title && (
          <div className="px-5 sm:px-6 pt-5 pb-4 shrink-0 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              {Icon && (
                <div className="w-9 h-9 rounded-xl bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 shadow-2xs">
                  <Icon size={18} />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[#0A4B6E] text-base sm:text-lg font-bold truncate">
                    {title}
                  </h2>
                  {badge}
                </div>
                {subtitle && (
                  <p className="text-xs text-[#6D8AA2] mt-0.5 truncate font-medium">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="text-[#0A4B6E] hover:bg-[#E8F3F8] p-1.5 rounded-lg transition cursor-pointer"
                  title="Go back"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              {showCloseButton && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition cursor-pointer"
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="overflow-y-auto px-5 sm:px-6 py-4 custom-scrollbar flex-1 min-h-0">
          {children}
        </div>

        {/* Footer - Fixed */}
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 shrink-0 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalNode, document.body)
    : modalNode;
}

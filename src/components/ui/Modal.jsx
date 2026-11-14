import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const titleId = useId();
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

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

  // Focus management: save & restore trigger focus, and move initial focus into dialog
  useEffect(() => {
    if (isOpen) {
      if (typeof document !== "undefined") {
        previousFocusRef.current = document.activeElement;
      }
      const frame = requestAnimationFrame(() => {
        const dialog = dialogRef.current;
        if (dialog && typeof document !== "undefined" && !dialog.contains(document.activeElement)) {
          dialog.focus();
        }
      });
      return () => cancelAnimationFrame(frame);
    } else if (previousFocusRef.current) {
      const prev = previousFocusRef.current;
      previousFocusRef.current = null;
      if (typeof prev.focus === "function" && prev.isConnected) {
        prev.focus();
      }
    }
  }, [isOpen]);

  // Escape key & Tab focus trap listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null);

        if (focusable.length === 0) {
          e.preventDefault();
          dialogRef.current.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last || !dialogRef.current.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-2xl w-full shadow-2xl relative flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden outline-none ${maxWidth} ${
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
                  <h2 id={titleId} className="text-[#0A4B6E] text-base sm:text-lg font-bold truncate">
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
                  className="text-[#0A4B6E] hover:bg-[#E8F3F8] p-1.5 rounded-lg transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4B6E]/40"
                  title="Go back"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              {showCloseButton && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4B6E]/40"
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

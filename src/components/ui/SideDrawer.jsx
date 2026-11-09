// src/components/ui/SideDrawer.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Standardized SideDrawer Component for MadayawGas
 * Slides in from the right edge with backdrop blur, sticky header, scrollable body,
 * and pinned action footer. Used for non-destructive inspection across all data tables.
 */
export default function SideDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  badge,
  headerActions,
  children,
  footer,
  width = "max-w-md sm:max-w-lg",
  backdrop = "mobile-only", // "mobile-only" (default) | "always" | "none" | boolean
}) {
  const [isClosing, setIsClosing] = useState(false);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handle closing animation delay
  useEffect(() => {
    if (!isClosing) return;
    const timer = setTimeout(() => {
      setIsClosing(false);
      if (onClose) onClose();
    }, 220);
    return () => clearTimeout(timer);
  }, [isClosing, onClose]);

  const handleClose = () => {
    setIsClosing(true);
  };

  if (!isOpen && !isClosing) return null;

  const isAlwaysBackdrop = backdrop === "always" || backdrop === true;
  const isNoBackdrop = backdrop === "none" || backdrop === false;
  const isMobileOnly = !isAlwaysBackdrop && !isNoBackdrop;

  const drawerNode = (
    <div
      className={`fixed inset-0 z-50 overflow-hidden flex justify-end ${
        isAlwaysBackdrop ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Backdrop: Visible on mobile, hidden on desktop unless backdrop="always" */}
      {!isNoBackdrop && (
        <div
          className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity pointer-events-auto ${
            isMobileOnly ? "lg:hidden" : ""
          } ${isClosing ? "animate-fade-out" : "animate-fade-in"}`}
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer Container */}
      <div
        className={`relative z-10 w-full ${width} bg-white shadow-2xl h-full flex flex-col overflow-hidden text-left border-l border-slate-200 pointer-events-auto ${
          isClosing
            ? "animate-slide-fade-out pointer-events-none"
            : "animate-slide-fade-in"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal={isAlwaysBackdrop ? "true" : "false"}
        aria-label={typeof title === "string" ? title : "Detail Panel"}
      >
        {/* Sticky Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-[#F8FAFC]">
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
            {Icon && (
              <div className="w-9 h-9 rounded-xl bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 shadow-2xs">
                <Icon size={18} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[#0A4B6E] truncate">{title}</h2>
                {badge}
              </div>
              {subtitle && (
                <p className="text-xs text-[#6D8AA2] mt-0.5 truncate font-medium">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {headerActions}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close drawer"
              className="p-1.5 hover:bg-slate-200 text-[#6D8AA2] hover:text-[#0A4B6E] rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 custom-scrollbar space-y-4">
          {children}
        </div>

        {/* Pinned Sticky Footer */}
        {footer && (
          <div className="shrink-0 px-5 py-3.5 border-t border-slate-200 bg-white">
            {typeof footer === "function" ? footer({ onClose: handleClose }) : footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(drawerNode, document.body)
    : drawerNode;
}

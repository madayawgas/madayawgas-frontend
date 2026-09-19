import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

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

  if (!shouldRender && !isOpen) return null;

  return (
    <div
      onClick={() => {
        if (closeOnBackdrop && onClose) onClose();
      }}
      className={`fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 ${
        isAnimatingOut ? "animate-fade-out" : "animate-fade-in"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-3xl w-full shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden ${maxWidth} ${
          isAnimatingOut ? "animate-scale-out" : "animate-scale-in"
        }`}
      >
        {/* Header - Fixed */}
        {title && (
          <div className="px-6 sm:px-8 pt-6 pb-4 shrink-0 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              {Icon && (
                <div className="w-10 h-10 rounded-2xl bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 shadow-2xs">
                  <Icon size={20} />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[#0A4B6E] text-lg sm:text-xl font-bold truncate">
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

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-[#0A4B6E] hover:bg-[#E8F3F8] p-2 rounded-full transition cursor-pointer shrink-0"
                title="Go back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="overflow-y-auto px-6 sm:px-8 py-4 custom-scrollbar flex-1">
          {children}
        </div>

        {/* Footer - Fixed */}
        {footer && (
          <div className="px-6 sm:px-8 py-4 border-t border-slate-100 shrink-0 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";

export default function Modal({
  isOpen,
  onClose,
  title,
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
      // Defer render flag without synchronous effect cascade
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
      className={`fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 ${
        isAnimatingOut ? "animate-fade-out" : "animate-fade-in"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-2xl w-full shadow-2xl relative flex flex-col max-h-[90vh] ${maxWidth} ${
          isAnimatingOut ? "animate-scale-out" : "animate-scale-in"
        }`}
      >
        {/* Header - Fixed */}
        {title && (
          <div className="px-8 pt-8 pb-4 shrink-0">
            <h2 className="text-[#1B4B75] text-2xl font-bold border-b pb-4">
              {title}
            </h2>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="overflow-y-auto px-8 py-2 custom-scrollbar flex-1">
          {children}
        </div>

        {/* Footer - Fixed */}
        {footer && (
          <div className="px-8 py-6 border-t border-gray-100 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  maxWidth = "max-w-md" 
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsAnimatingOut(false);
    } else if (shouldRender) {
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsAnimatingOut(false);
      }, 150); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 ${
        isAnimatingOut ? "animate-fade-out" : "animate-fade-in"
      }`}
    >
      <div 
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

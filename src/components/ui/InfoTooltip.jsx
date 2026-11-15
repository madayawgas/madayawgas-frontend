// src/components/ui/InfoTooltip.jsx
import { Info } from "lucide-react";

/**
 * Compact hover/focus info icon that reveals concise contextual help
 * without cluttering operational views with inline prose.
 */
export default function InfoTooltip({
  text,
  label = "More information",
  align = "center", // "left" | "center" | "right"
  position = "top", // "top" | "bottom"
  className = "",
}) {
  if (!text) return null;

  const alignClasses = {
    left: "left-0",
    center: "left-1/2 -translate-x-1/2",
    right: "right-0",
  };

  const posClasses =
    position === "bottom" ? "top-full mt-2" : "bottom-full mb-2";

  return (
    <span className={`relative inline-flex items-center group ${className}`}>
      <button
        type="button"
        aria-label={label}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[#6D8AA2] hover:text-[#0A4B6E] hover:bg-[#E8F3F8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4B6E] transition-colors cursor-help"
      >
        <Info size={13} />
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 absolute ${posClasses} ${alignClasses[align] || alignClasses.center} z-40 w-56 px-3 py-2 rounded-xl bg-[#0A4B6E] text-white text-xs font-normal leading-relaxed shadow-lg border border-[#BCE1F1]/30 text-left whitespace-normal`}
      >
        {text}
      </span>
    </span>
  );
}

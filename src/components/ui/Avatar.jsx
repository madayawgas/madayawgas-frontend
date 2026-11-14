// src/components/ui/Avatar.jsx
import { useState, useEffect, useMemo } from "react";
import { UserRound } from "lucide-react";
import { resolveMediaUrl } from "../../utils/media.js";

const SIZE_MAP = {
  xs: {
    container: "w-6 h-6 text-[10px]",
    icon: 12,
  },
  sm: {
    container: "w-8 h-8 text-xs",
    icon: 14,
  },
  md: {
    container: "w-10 h-10 text-sm",
    icon: 18,
  },
  lg: {
    container: "w-12 h-12 text-base",
    icon: 22,
  },
  xl: {
    container: "w-16 h-16 text-lg",
    icon: 28,
  },
  "2xl": {
    container: "w-24 h-24 text-2xl",
    icon: 42,
  },
  "3xl": {
    container: "w-32 h-32 text-3xl",
    icon: 56,
  },
};

/**
 * Reusable Avatar component conforming to MadayawGas UI standards.
 * Supports canonical relative media storage keys, direct URLs, graceful error fallbacks,
 * and standard responsive sizing.
 *
 * @param {Object} props
 * @param {string} [props.src] - Direct image URL or base64 data
 * @param {string} [props.storageKey] - Canonical relative storage key
 * @param {string} [props.name] - User name or handle used for initials extraction
 * @param {"xs"|"sm"|"md"|"lg"|"xl"|"2xl"|"3xl"} [props.size="md"] - Preset sizing
 * @param {"circle"|"rounded"} [props.shape="circle"] - Border radius shape
 * @param {string} [props.className=""] - Additional custom classes
 * @param {string} [props.alt] - Accessible image description
 */
export default function Avatar({
  src,
  storageKey,
  name = "",
  size = "md",
  shape = "circle",
  className = "",
  alt,
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Canonical or direct image resolution
  const resolvedUrl = useMemo(() => {
    const raw = src || storageKey;
    if (!raw) return null;
    return resolveMediaUrl(raw);
  }, [src, storageKey]);

  // Reset error state when source changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [resolvedUrl]);

  // Extract initials
  const initials = useMemo(() => {
    if (!name || typeof name !== "string") return "";
    const clean = name.trim();
    if (!clean) return "";

    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0].charAt(0).toUpperCase();
      const last = parts[parts.length - 1].charAt(0).toUpperCase();
      return `${first}${last}`;
    }
    return clean.slice(0, 2).toUpperCase();
  }, [name]);

  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-2xl";
  const accessibleAlt = alt || (name ? `${name}'s avatar` : "User profile avatar");

  const hasValidImage = Boolean(resolvedUrl && !imageError);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none overflow-hidden shrink-0 font-bold tracking-wider bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs ${shapeClass} ${sizeConfig.container} ${className}`}
      aria-label={accessibleAlt}
    >
      {/* Background Initials or Icon */}
      {(!hasValidImage || !imageLoaded) && (
        <span className="flex items-center justify-center w-full h-full font-bold select-none">
          {initials || <UserRound size={sizeConfig.icon} className="text-[#FFDF2C]" />}
        </span>
      )}

      {/* Actual Avatar Image */}
      {hasValidImage && (
        <img
          src={resolvedUrl}
          alt={accessibleAlt}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}

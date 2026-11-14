// src/components/ui/Avatar.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { UserRound } from "lucide-react";
import { resolveMediaUrl } from "../../utils/media.js";
import {
  getMemoryCachedAvatarUrl,
  getOrCacheAvatarUrl,
  evictAvatarCache,
} from "../../utils/avatarCache.js";

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
  const [errorForSrc, setErrorForSrc] = useState(null);
  const [loadedForSrc, setLoadedForSrc] = useState(null);
  const [cachedEntry, setCachedEntry] = useState({ forUrl: null, src: null });

  // Canonical or direct image resolution
  const resolvedUrl = useMemo(() => {
    const raw = src || storageKey;
    if (!raw) return null;
    return resolveMediaUrl(raw);
  }, [src, storageKey]);

  const memoryHit = getMemoryCachedAvatarUrl(resolvedUrl);
  const activeAsyncSrc = cachedEntry.forUrl === resolvedUrl ? cachedEntry.src : null;
  const displaySrc = memoryHit || activeAsyncSrc || resolvedUrl;

  const imageError = Boolean(displaySrc && errorForSrc === displaySrc);
  const imageLoaded = Boolean(displaySrc && loadedForSrc === displaySrc);

  // Populate CacheStorage / in-memory Object URL when resolvedUrl changes
  useEffect(() => {
    if (!resolvedUrl || memoryHit) return;

    let cancelled = false;
    getOrCacheAvatarUrl(resolvedUrl).then((cachedUrl) => {
      if (!cancelled && cachedUrl && cachedUrl !== resolvedUrl) {
        setCachedEntry({ forUrl: resolvedUrl, src: cachedUrl });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [resolvedUrl, memoryHit]);

  // Immediately reveal cached images whose browser `complete` flag is already true on mount
  const handleImgRef = useCallback(
    (img) => {
      if (img && img.complete && img.naturalWidth > 0 && displaySrc) {
        setLoadedForSrc((prev) => (prev === displaySrc ? prev : displaySrc));
      }
    },
    [displaySrc]
  );

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

  const hasValidImage = Boolean(displaySrc && !imageError);

  const handleImageError = () => {
    if (displaySrc && displaySrc !== resolvedUrl && displaySrc.startsWith("blob:")) {
      evictAvatarCache(resolvedUrl);
      setCachedEntry({ forUrl: resolvedUrl, src: resolvedUrl });
      return;
    }
    setErrorForSrc(displaySrc);
  };

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
          ref={handleImgRef}
          key={displaySrc}
          src={displaySrc}
          alt={accessibleAlt}
          onLoad={() => setLoadedForSrc(displaySrc)}
          onError={handleImageError}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}

// src/components/ui/DocumentViewerModal.jsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  AlertCircle,
  FileQuestion,
} from "lucide-react";
import Button from "./Button";
import { getReceiptFileUrl, resolveMediaUrl, isImageFile, isPdfFile } from "../../utils/media.js";

/**
 * DocumentViewerModal
 *
 * Standardized global image and document preview modal supporting:
 * 1. Centered dialog preview with file info, external tab opener, and expand trigger.
 * 2. Fullscreen immersive lightbox (isExpanded) with backdrop blur and ESC key navigation.
 * 3. Works seamlessly with string URLs, storageKeys, or document objects.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Visibility flag
 * @param {Function} props.onClose - Close callback
 * @param {string | Object | null} [props.item] - Target media (URL, storageKey, or object)
 * @param {string | null} [props.storageKey] - Direct relative or absolute storage key
 * @param {string | null} [props.fileUrl] - Direct media file URL
 * @param {string | null} [props.url] - Direct URL
 * @param {string} [props.title] - Optional display title override
 * @param {string} [props.fallbackName="Document Preview"] - Default title if none detected
 * @param {boolean} [props.defaultExpanded=false] - Start directly in fullscreen lightbox mode
 */
export default function DocumentViewerModal({
  isOpen = false,
  onClose,
  item = null,
  storageKey = null,
  fileUrl: propFileUrl = null,
  url = null,
  title,
  fallbackName = "Document Preview",
  defaultExpanded = false,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hasImageError, setHasImageError] = useState(false);

  const targetItem = item || storageKey || propFileUrl || url;

  // Sync expanded state and reset error state when opening or targetItem changes
  useEffect(() => {
    if (isOpen) {
      setIsExpanded(defaultExpanded);
      setHasImageError(false);
    }
  }, [isOpen, defaultExpanded, targetItem]);

  const handleClose = () => {
    setIsExpanded(false);
    setHasImageError(false);
    if (typeof onClose === "function") {
      onClose();
    }
  };

  // Keyboard navigation: Escape key exits fullscreen first, or closes modal if not expanded
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isExpanded) {
          setIsExpanded(false);
        } else {
          handleClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isExpanded]);

  if (!isOpen || !targetItem || typeof document === "undefined") {
    return null;
  }

  // Resolve media file URL
  const fileUrl = typeof targetItem === "string"
    ? resolveMediaUrl(targetItem)
    : getReceiptFileUrl(targetItem) || resolveMediaUrl(targetItem.fileUrl || targetItem.storageKey || targetItem.url);

  // Determine media format
  const isImage = isImageFile(targetItem) || (typeof targetItem === "string" && isImageFile(targetItem));
  const isPdf = isPdfFile(targetItem) || (typeof targetItem === "string" && isPdfFile(targetItem));

  // Determine display label
  const displayName =
    title ||
    (typeof targetItem === "object" && (targetItem.fileName || targetItem.citationTicketNo || targetItem.title)) ||
    (typeof targetItem === "string" ? targetItem.split("/").pop()?.split("?")[0] : null) ||
    fallbackName;

  return createPortal(
    isExpanded ? (
      /* ============================================================
       * 1. EXPANDED FULLSCREEN LIGHTBOX
       * ============================================================ */
      <div
        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col animate-fade-in p-4 md:p-6 text-white select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsExpanded(false);
        }}
      >
        {/* Top Toolbar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <FileText size={18} className="text-[#FFDF2C] shrink-0" />
            <span className="font-bold text-base md:text-lg text-white font-mono truncate">
              {displayName}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                title="Open original file in new tab"
              >
                <ExternalLink size={16} />
                <span className="hidden md:inline">Open New Tab</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Exit Full View (Esc)"
            >
              <Minimize2 size={16} />
              <span className="hidden md:inline">Exit Fullscreen</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-red-500/40 text-slate-200 hover:text-white transition cursor-pointer"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Immersive View Body */}
        <div
          className="flex-1 min-h-0 flex items-center justify-center overflow-auto p-2 md:p-4"
          onClick={() => setIsExpanded(false)}
        >
          {hasImageError ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="py-16 px-6 text-center flex flex-col items-center justify-center space-y-3 max-w-lg bg-white/5 rounded-2xl border border-white/10"
            >
              <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 mb-1">
                <AlertCircle size={32} />
              </div>
              <div className="font-bold text-base text-white">
                Image Preview Unavailable
              </div>
              <p className="text-xs text-slate-300">
                The media attachment could not be loaded from storage. It may still be synchronizing from a frontline mobile device or was uploaded with an unresolvable path.
              </p>
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-[11px] font-mono text-sky-300 hover:underline break-all bg-white/10 px-3 py-1.5 rounded-lg"
                >
                  {fileUrl}
                </a>
              )}
            </div>
          ) : isImage ? (
            <img
              src={fileUrl}
              alt={displayName}
              onError={() => setHasImageError(true)}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-[95vw] object-contain rounded-xl shadow-2xl transition-transform"
            />
          ) : isPdf || fileUrl ? (
            <iframe
              src={fileUrl}
              title={displayName}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-[85vh] max-w-5xl rounded-xl bg-white"
            />
          ) : (
            <div className="py-20 text-center text-slate-400 text-sm">
              No preview available for this document.
            </div>
          )}
        </div>

        {/* Bottom Info Strip */}
        <div className="pt-2 text-center text-xs text-slate-400 shrink-0 flex items-center justify-between">
          <span>
            Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[11px] text-white">ESC</kbd> to exit full view
          </span>
          {fileUrl && (
            <span className="text-[11px] font-mono text-slate-400 truncate max-w-sm">
              {fileUrl.split("/").pop()}
            </span>
          )}
        </div>
      </div>
    ) : (
      /* ============================================================
       * 2. STANDARD CENTERED MODAL DIALOG
       * ============================================================ */
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in text-left"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl max-w-xl md:max-w-2xl w-full p-5 space-y-3.5 border border-slate-200/90 shadow-2xl overflow-hidden relative animate-scale-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <FileText size={16} className="text-[#0A4B6E] shrink-0" />
              <span className="font-bold text-sm md:text-base text-[#0A4B6E] font-mono truncate">
                {displayName}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="p-1.5 rounded-full text-slate-500 hover:text-[#0A4B6E] hover:bg-[#E8F3F8] transition cursor-pointer"
                title="Expand to Full View"
              >
                <Maximize2 size={17} />
              </button>

              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-full text-slate-500 hover:text-[#0A4B6E] hover:bg-[#E8F3F8] transition cursor-pointer"
                  title="Open in new tab"
                >
                  <ExternalLink size={17} />
                </a>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Main Image / Document Box */}
          <div
            onClick={() => {
              if (!hasImageError && (isImage || fileUrl)) {
                setIsExpanded(true);
              }
            }}
            className={`max-h-[58vh] overflow-hidden flex items-center justify-center bg-slate-100/80 rounded-2xl p-2 relative group ${
              isImage && !hasImageError ? "cursor-pointer" : ""
            }`}
          >
            {hasImageError ? (
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 mb-1">
                  <FileQuestion size={26} />
                </div>
                <div className="font-semibold text-xs text-slate-800">
                  Image Attachment Unavailable
                </div>
                <p className="text-[11px] text-slate-500 max-w-sm">
                  The media file could not be loaded from storage.
                </p>
                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-[10.5px] font-mono text-blue-600 hover:underline break-all bg-white px-2.5 py-1 rounded border border-slate-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open direct link
                  </a>
                )}
              </div>
            ) : isImage ? (
              <>
                <img
                  src={fileUrl}
                  alt={displayName}
                  onError={() => setHasImageError(true)}
                  className="max-h-[54vh] max-w-full object-contain rounded-xl shadow-xs transition group-hover:opacity-95"
                />
                <div className="absolute bottom-3 right-3 bg-slate-900/75 text-white px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none">
                  <Maximize2 size={12} />
                  <span>Click to expand</span>
                </div>
              </>
            ) : isPdf || fileUrl ? (
              <iframe
                src={fileUrl}
                title={displayName}
                className="w-full h-[50vh] rounded-xl bg-white"
              />
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                No preview available for this document.
              </div>
            )}
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="blue"
              onClick={() => setIsExpanded(true)}
              className="w-1/2 text-xs flex items-center justify-center gap-1.5"
            >
              <Maximize2 size={13} />
              <span>FULL VIEW</span>
            </Button>
            <Button
              type="button"
              variant="cancel"
              onClick={handleClose}
              className="w-1/2 text-xs"
            >
              CLOSE
            </Button>
          </div>
        </div>
      </div>
    ),
    document.body
  );
}

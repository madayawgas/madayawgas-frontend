// src/components/fleet/work-orders/ReceiptAttachmentManager.jsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Eye,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
} from "lucide-react";
import Button from "../../ui/Button";
import { getReceiptFileUrl, isImageFile, isPdfFile } from "../../../utils/media.js";

/**
 * ReceiptAttachmentManager
 * Streamlined read-only Receipt Documentation Gallery.
 * OR files serve strictly as audit documentation (no tags or cost inputs).
 */
export default function ReceiptAttachmentManager({
  receipts = [],
  className = "",
}) {
  const [previewItem, setPreviewItem] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const handleClose = () => {
    setPreviewItem(null);
    setIsExpanded(false);
  };

  // Dismiss full-screen expand or modal on Escape key
  useEffect(() => {
    if (!previewItem) return;
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
  }, [previewItem, isExpanded]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-[#0A4B6E]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E]">
            Receipt Documentation
          </h4>
        </div>
        {receipts.length > 0 && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E]">
            {receipts.length} {receipts.length === 1 ? "File" : "Files"}
          </span>
        )}
      </div>

      {/* Receipts List */}
      {receipts.length > 0 ? (
        <div className="space-y-2">
          {receipts.map((rcpt, index) => {
            const hasFile = Boolean(rcpt.fileUrl || rcpt.previewUrl || rcpt.storageKey);
            const isImg = hasFile && isImageFile(rcpt);
            const isPdf = hasFile && isPdfFile(rcpt);
            const displayName =
              rcpt.fileName ||
              (rcpt.fileUrl ? rcpt.fileUrl.split("/").pop() : null) ||
              `Receipt Document ${index + 1}`;

            return (
              <div
                key={rcpt.id || `rcpt-${index}`}
                onClick={() => setPreviewItem(rcpt)}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-[#F8FAFC] hover:bg-[#E8F3F8]/50 hover:border-[#BCE1F1] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Thumbnail / File icon */}
                  {hasFile && isImg ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-white">
                      <img
                        src={getReceiptFileUrl(rcpt)}
                        alt={displayName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : hasFile && isPdf ? (
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0 text-xs font-bold">
                      PDF
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="font-mono font-medium text-xs text-[#0A4B6E] truncate">
                      {displayName}
                    </p>
                    <p className="text-[10.5px] text-[#6D8AA2] mt-0.5">
                      Click to view document
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewItem(rcpt);
                    }}
                    className="p-1.5 rounded-full hover:bg-white text-slate-500 hover:text-[#0A4B6E] transition-colors cursor-pointer"
                    title="Preview Receipt"
                  >
                    <Eye size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#F8FAFC] border border-dashed border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs text-[#6D8AA2]">
            No receipts attached yet.
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Receipt documentation is uploaded upon repair finalization.
          </p>
        </div>
      )}

      {/* FULL PREVIEW MODAL — PORTALED TO DOCUMENT.BODY */}
      {previewItem &&
        typeof document !== "undefined" &&
        createPortal(
          isExpanded ? (
            /* EXPANDED FULLSCREEN LIGHTBOX */
            <div
              className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col animate-fade-in p-4 md:p-6 text-white select-none"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsExpanded(false);
              }}
            >
              {/* Top Toolbar */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-bold text-base md:text-lg text-white font-mono truncate">
                    {previewItem.fileName || (previewItem.fileUrl ? previewItem.fileUrl.split("/").pop() : null) || "Receipt Documentation"}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {(previewItem.fileUrl || previewItem.storageKey) && (
                    <a
                      href={getReceiptFileUrl(previewItem)}
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
                    onClick={() => {
                      setPreviewItem(null);
                      setIsExpanded(false);
                    }}
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
                {isImageFile(previewItem) ? (
                  <img
                    src={getReceiptFileUrl(previewItem)}
                    alt={previewItem.fileName || "Receipt Document"}
                    onClick={(e) => e.stopPropagation()}
                    className="max-h-[85vh] max-w-[95vw] object-contain rounded-xl shadow-2xl transition-transform"
                  />
                ) : previewItem.fileUrl || previewItem.storageKey ? (
                  <iframe
                    src={getReceiptFileUrl(previewItem)}
                    title={previewItem.fileName || "Receipt Document"}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-[85vh] max-w-5xl rounded-xl bg-white"
                  />
                ) : (
                  <div className="py-20 text-center text-slate-400 text-sm">
                    No preview available for this document.
                  </div>
                )}
              </div>

              {/* Bottom info strip in expanded view */}
              <div className="pt-2 text-center text-xs text-slate-400 shrink-0 flex items-center justify-between">
                <span>
                  Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[11px] text-white">ESC</kbd> to exit full view
                </span>
              </div>
            </div>
          ) : (
            /* STANDARD CENTERED MODAL DIALOG */
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in text-left"
              onClick={(e) => {
                if (e.target === e.currentTarget) setPreviewItem(null);
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-xl md:max-w-2xl w-full p-5 space-y-3.5 border border-slate-200/90 shadow-2xl overflow-hidden relative animate-scale-in"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <span className="font-bold text-sm md:text-base text-[#0A4B6E] font-mono truncate">
                    {previewItem.fileName || (previewItem.fileUrl ? previewItem.fileUrl.split("/").pop() : null) || "Receipt Documentation"}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsExpanded(true)}
                      className="p-1.5 rounded-full text-slate-500 hover:text-[#0A4B6E] hover:bg-[#E8F3F8] transition cursor-pointer"
                      title="Expand to Full View"
                    >
                      <Maximize2 size={17} />
                    </button>

                    {(previewItem.fileUrl || previewItem.storageKey) && (
                      <a
                        href={getReceiptFileUrl(previewItem)}
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
                      onClick={() => setPreviewItem(null)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      title="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Main Image View Box */}
                <div
                  onClick={() => {
                    if (isImageFile(previewItem) || previewItem.fileUrl || previewItem.storageKey) {
                      setIsExpanded(true);
                    }
                  }}
                  className={`max-h-[58vh] overflow-hidden flex items-center justify-center bg-slate-100/80 rounded-2xl p-2 relative group ${
                    isImageFile(previewItem) ? "cursor-pointer" : ""
                  }`}
                >
                  {isImageFile(previewItem) ? (
                    <>
                      <img
                        src={getReceiptFileUrl(previewItem)}
                        alt={previewItem.fileName || "Receipt Document"}
                        className="max-h-[54vh] max-w-full object-contain rounded-xl shadow-xs transition group-hover:opacity-95"
                      />
                      <div className="absolute bottom-3 right-3 bg-slate-900/75 text-white px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none">
                        <Maximize2 size={12} />
                        <span>Click to expand</span>
                      </div>
                    </>
                  ) : previewItem.fileUrl || previewItem.storageKey ? (
                    <iframe
                      src={getReceiptFileUrl(previewItem)}
                      title={previewItem.fileName || "Receipt Document"}
                      className="w-full h-[50vh] rounded-xl bg-white"
                    />
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      No preview available for this document.
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
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
                    onClick={() => setPreviewItem(null)}
                    className="w-1/2 text-xs"
                  >
                    CLOSE
                  </Button>
                </div>
              </div>
            </div>
          ),
          document.body
        )}
    </div>
  );
}

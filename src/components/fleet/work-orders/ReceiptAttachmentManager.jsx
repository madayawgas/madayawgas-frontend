// src/components/fleet/work-orders/ReceiptAttachmentManager.jsx
import { useState } from "react";
import { FileText, Eye } from "lucide-react";
import DocumentViewerModal from "../../ui/DocumentViewerModal.jsx";
import { getReceiptFileUrl, isImageFile, isPdfFile } from "../../../utils/media.js";

/**
 * ReceiptAttachmentManager
 * Streamlined read-only Receipt Documentation Gallery.
 * OR files serve strictly as audit documentation (no tags or cost inputs).
 * Uses global DocumentViewerModal for consistent, unified preview & fullscreen lightbox.
 */
export default function ReceiptAttachmentManager({
  receipts = [],
  className = "",
}) {
  const [previewItem, setPreviewItem] = useState(null);

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

      {/* GLOBAL REUSABLE DOCUMENT & IMAGE VIEWER MODAL */}
      <DocumentViewerModal
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        item={previewItem}
        fallbackName="Receipt Documentation"
      />
    </div>
  );
}

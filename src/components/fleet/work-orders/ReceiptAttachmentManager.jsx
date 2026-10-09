// src/components/fleet/work-orders/ReceiptAttachmentManager.jsx
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Upload,
  Camera,
  FileText,
  Trash2,
  Eye,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Building2,
  DollarSign,
  Tag,
  AlertTriangle,
  Loader2,
  Maximize2,
  Minimize2,
  ExternalLink,
} from "lucide-react";
import Badge from "../../ui/Badge";
import Button from "../../ui/Button";
import { uploadMediaFile } from "../../../api/media.js";
import { resolveMediaUrl, isImageFile, isPdfFile } from "../../../utils/media.js";

const RECEIPT_TYPES = [
  { value: "PARTS", label: "Parts & Materials", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "LABOR", label: "Labor & Service", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "MISC", label: "Miscellaneous / Shop Fee", color: "bg-slate-50 text-slate-700 border-slate-200" },
];

/**
 * ReceiptAttachmentManager
 * Photo-driven receipt evidence uploader with fallback text-only entry.
 * Completely decoupled from accounting totals (financial math remains manual).
 */
export default function ReceiptAttachmentManager({
  receipts = [],
  onChange,
  onUpload,
  onDelete,
  readOnly = false,
  className = "",
}) {
  const [showManualForm, setShowManualForm] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [error, setError] = useState("");

  // Dismiss full-screen expand or modal on Escape key
  useEffect(() => {
    if (!previewItem) {
      setIsExpanded(false);
      return;
    }
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isExpanded) {
          setIsExpanded(false);
        } else {
          setPreviewItem(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewItem, isExpanded]);

  // Staged text/photo input state for adding a receipt
  const [stagedFile, setStagedFile] = useState(null); // { file, previewUrl, fileName, fileType }
  const [formReceiptNumber, setFormReceiptNumber] = useState("");
  const [formVendorName, setFormVendorName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState("PARTS");

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const resetForm = () => {
    setStagedFile(null);
    setFormReceiptNumber("");
    setFormVendorName("");
    setFormAmount("");
    setFormType("PARTS");
    setShowManualForm(false);
    setError("");
  };

  const processSelectedFile = async (file) => {
    if (!file) return;

    setError("");
    setIsProcessingFile(true);

    try {
      const uploadResult = await uploadMediaFile(file, "maintenance/receipts");

      setStagedFile({
        fileName: uploadResult.originalName || file.name,
        fileType: uploadResult.mimeType || file.type,
        previewUrl: uploadResult.url || resolveMediaUrl(uploadResult.storageKey),
        storageKey: uploadResult.storageKey,
        file,
      });

      // If receipt number is empty, prefill suggestion
      if (!formReceiptNumber) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "");
        setFormReceiptNumber(cleanName ? `OR-${cleanName.toUpperCase().slice(0, 10)}` : "");
      }

      setShowManualForm(true);
    } catch (err) {
      console.error("Failed to process and upload receipt:", err);
      setError(err?.message || "Failed to process receipt file.");
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
    // reset input value so re-selecting same file triggers change
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (readOnly) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSaveReceipt = async (e) => {
    e.preventDefault();
    if (!formReceiptNumber.trim()) {
      setError("Receipt number is required.");
      return;
    }

    const newReceipt = {
      id: `rcpt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      receiptNumber: formReceiptNumber.trim(),
      vendorName: formVendorName.trim() || undefined,
      amount: parseFloat(formAmount) || 0,
      receiptType: formType,
      receiptDate: new Date().toISOString(),
      fileName: stagedFile?.fileName || undefined,
      fileUrl: stagedFile?.storageKey || stagedFile?.previewUrl || undefined,
      storageKey: stagedFile?.storageKey || undefined,
      fileType: stagedFile?.fileType || undefined,
      isManual: !stagedFile,
      createdAt: new Date().toISOString(),
    };

    try {
      if (onUpload) {
        await onUpload(newReceipt);
      } else if (onChange) {
        onChange([...receipts, newReceipt]);
      }
      resetForm();
    } catch (err) {
      setError(err?.message || "Failed to save receipt record.");
    }
  };

  const handleDeleteReceipt = async (receiptToDelete) => {
    try {
      if (onDelete && receiptToDelete.id) {
        await onDelete(receiptToDelete.id);
      } else if (onChange) {
        onChange(receipts.filter((r) => r.id !== receiptToDelete.id));
      }
    } catch (err) {
      console.error("Failed to delete receipt:", err);
      setError(err?.message || "Failed to remove receipt.");
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-[#0A4B6E]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E]">
            Supporting Official Receipts ({receipts.length})
          </span>
        </div>
        {!readOnly && !showManualForm && (
          <button
            type="button"
            onClick={() => {
              setStagedFile(null);
              setShowManualForm(true);
            }}
            className="text-[11px] font-bold text-[#0A4B6E] hover:text-[#083b57] flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Add Manual Entry</span>
          </button>
        )}
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* PHOTO / DROPZONE TRIGGER (When not read-only and form not open) */}
      {!readOnly && !showManualForm && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-[#BCE1F1] hover:border-[#0A4B6E]/60 bg-[#F4F8FA] rounded-2xl p-4 text-center transition-all duration-200"
        >
          {/* Hidden Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {isProcessingFile ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <Loader2 size={24} className="text-[#0A4B6E] animate-spin" />
              <p className="text-xs font-semibold text-[#0A4B6E]">
                Compressing & Uploading Receipt...
              </p>
              <p className="text-[11px] text-[#6D8AA2]">
                Enforcing 5 MB ceiling & converting image format
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center">
                <Upload size={18} />
              </div>

              <div>
                <p className="text-xs font-semibold text-[#0A4B6E]">
                  Upload official receipt photo or document
                </p>
                <p className="text-[11px] text-[#6D8AA2] mt-0.5">
                  Drag and drop receipt image or PDF (JPEG, PNG, WebP, PDF up to 5MB)
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingFile}
                  className="py-1.5 px-3.5 rounded-full text-xs font-bold bg-[#0A4B6E] hover:bg-[#083b57] text-[#FFDF2C] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <Upload size={13} />
                  <span>Browse File</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessingFile}
                  className="py-1.5 px-3.5 rounded-full text-xs font-bold bg-white hover:bg-slate-50 text-[#0A4B6E] border border-[#0A4B6E]/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <Camera size={13} />
                  <span>Take Photo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGED RECEIPT DETAIL INPUT FORM */}
      {showManualForm && !readOnly && (
        <form
          onSubmit={handleSaveReceipt}
          className="bg-white border border-[#BCE1F1] rounded-2xl p-3.5 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center text-xs font-bold">
                {stagedFile ? <ImageIcon size={13} /> : <FileText size={13} />}
              </span>
              <span className="text-xs font-bold text-[#0A4B6E]">
                {stagedFile ? "Attach Scanned / Captured Receipt" : "Record Manual Receipt Reference"}
              </span>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Staged file banner (if photo attached) */}
          {stagedFile && (
            <div className="flex items-center gap-3 bg-[#F4F8FA] p-2.5 rounded-xl border border-slate-200">
              {isImageFile(stagedFile) ? (
                <img
                  src={resolveMediaUrl(stagedFile.previewUrl || stagedFile.storageKey)}
                  alt="Receipt Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                />
              ) : isPdfFile(stagedFile) ? (
                <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-200 font-bold text-xs">
                  PDF
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center border border-[#BCE1F1] font-bold text-xs">
                  DOC
                </div>
              )}
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-bold text-[#0A4B6E] truncate">{stagedFile.fileName}</p>
                <p className="text-[10px] text-[#6D8AA2]">Ready to attach as audit proof</p>
              </div>
              <button
                type="button"
                onClick={() => setStagedFile(null)}
                className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
              >
                Remove File
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {/* Receipt Number */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-[#0A4B6E] mb-1">
                Receipt Number (OR#) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formReceiptNumber}
                onChange={(e) => setFormReceiptNumber(e.target.value)}
                placeholder="e.g., OR-2026-90412"
                className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-mono font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
              />
            </div>

            {/* Vendor Name */}
            <div>
              <label className="block text-[11px] font-semibold text-[#0A4B6E] mb-1">
                Vendor / Service Facility
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formVendorName}
                  onChange={(e) => setFormVendorName(e.target.value)}
                  placeholder="e.g. Bunawan Heavy Repair"
                  className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
                />
                <Building2 size={13} className="absolute left-2.5 top-2.5 text-[#6D8AA2]" />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[11px] font-semibold text-[#0A4B6E] mb-1">
                Receipt Subtotal (PHP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1.5 text-xs font-bold text-gray-500">₱</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl pl-7 pr-3 py-1.5 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
                />
              </div>
            </div>

            {/* Receipt Classification */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-[#0A4B6E] mb-1">
                Cost Classification
              </label>
              <div className="grid grid-cols-3 gap-2">
                {RECEIPT_TYPES.map((t) => {
                  const isSelected = formType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setFormType(t.value)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all text-center cursor-pointer ${
                        isSelected
                          ? `${t.color} border-current ring-1 ring-[#0A4B6E]/30 font-bold shadow-2xs`
                          : "bg-[#F3F5F5] border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {t.label.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={resetForm}
              className="py-1.5 px-4 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="yellow"
              className="py-1.5 px-5 text-xs font-bold uppercase tracking-wider"
            >
              Attach Receipt
            </Button>
          </div>
        </form>
      )}

      {/* ATTACHED RECEIPTS LIST */}
      {receipts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
          {receipts.map((rcpt, index) => {
            const hasFile = Boolean(rcpt.fileUrl || rcpt.fileName);
            const isImage = isImageFile(rcpt);
            const isPdf = isPdfFile(rcpt);

            return (
              <div
                key={rcpt.id || index}
                className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center justify-between gap-2.5 transition-all hover:border-[#0A4B6E]/40"
              >
                {/* Left thumbnail / icon */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {hasFile && isImage ? (
                    <button
                      type="button"
                      onClick={() => setPreviewItem(rcpt)}
                      className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={resolveMediaUrl(rcpt.fileUrl)}
                        alt={rcpt.receiptNumber}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ) : hasFile && isPdf ? (
                    <button
                      type="button"
                      onClick={() => setPreviewItem(rcpt)}
                      className="w-10 h-10 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0 cursor-pointer text-xs font-bold"
                    >
                      PDF
                    </button>
                  ) : hasFile ? (
                    <button
                      type="button"
                      onClick={() => setPreviewItem(rcpt)}
                      className="w-10 h-10 rounded-lg bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] flex items-center justify-center shrink-0 cursor-pointer text-xs font-bold"
                    >
                      DOC
                    </button>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-xs text-[#0A4B6E] truncate">
                        {rcpt.receiptNumber}
                      </span>
                      <span className="text-[9.5px] uppercase font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {rcpt.receiptType || "PARTS"}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#6D8AA2] truncate mt-0.5">
                      {rcpt.vendorName || "External Facility"}
                      {rcpt.amount ? ` • ₱${Number(rcpt.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : ""}
                    </p>
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {hasFile && (
                    <button
                      type="button"
                      onClick={() => setPreviewItem(rcpt)}
                      className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                      title="Preview Receipt"
                    >
                      <Eye size={14} />
                    </button>
                  )}

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleDeleteReceipt(rcpt)}
                      className="p-1.5 rounded-full hover:bg-rose-50 text-rose-500 transition-colors cursor-pointer"
                      title="Remove Receipt"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#F4F8FA] border border-slate-200/60 rounded-xl p-3 text-center text-xs text-[#6D8AA2]">
          No receipts attached yet.
        </div>
      )}

      {/* FULL PREVIEW MODAL — PORTALED TO DOCUMENT.BODY TO BREAK OUT OF SIDEDRAWER TRANSFORM */}
      {previewItem && typeof document !== "undefined" && createPortal(
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
                  {previewItem.receiptNumber}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-[#FFDF2C] border border-white/20">
                  {previewItem.receiptType || "PARTS"}
                </span>
                {previewItem.vendorName && (
                  <span className="text-xs text-slate-300 hidden sm:inline truncate">
                    • {previewItem.vendorName}
                  </span>
                )}
                {previewItem.amount ? (
                  <span className="text-xs font-bold text-[#FFDF2C] hidden sm:inline">
                    • ₱{Number(previewItem.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {previewItem.fileUrl && (
                  <a
                    href={resolveMediaUrl(previewItem.fileUrl)}
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
                  src={resolveMediaUrl(previewItem.fileUrl)}
                  alt={previewItem.receiptNumber}
                  onClick={(e) => e.stopPropagation()}
                  className="max-h-[85vh] max-w-[95vw] object-contain rounded-xl shadow-2xl transition-transform"
                />
              ) : previewItem.fileUrl ? (
                <iframe
                  src={resolveMediaUrl(previewItem.fileUrl)}
                  title={previewItem.receiptNumber}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-[85vh] max-w-5xl rounded-xl bg-white"
                />
              ) : (
                <div className="py-20 text-center text-slate-400 text-sm">
                  No preview available for manual text-only receipt record.
                </div>
              )}
            </div>

            {/* Bottom info strip in expanded view */}
            <div className="pt-2 text-center text-xs text-slate-400 shrink-0 flex items-center justify-between">
              <span>Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[11px] text-white">ESC</kbd> to exit full view</span>
              {previewItem.amount ? (
                <span className="text-white font-bold sm:hidden">
                  Amount: ₱{Number(previewItem.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
              ) : null}
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
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-bold text-sm md:text-base text-[#0A4B6E] truncate">
                    Receipt Preview — {previewItem.receiptNumber}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {previewItem.receiptType || "PARTS"}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Expand to Full View Button */}
                  <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="p-1.5 rounded-full text-slate-500 hover:text-[#0A4B6E] hover:bg-[#E8F3F8] transition cursor-pointer"
                    title="Expand to Full View"
                  >
                    <Maximize2 size={17} />
                  </button>

                  {/* Open in New Tab Button */}
                  {previewItem.fileUrl && (
                    <a
                      href={resolveMediaUrl(previewItem.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-full text-slate-500 hover:text-[#0A4B6E] hover:bg-[#E8F3F8] transition cursor-pointer"
                      title="Open in new tab"
                    >
                      <ExternalLink size={17} />
                    </a>
                  )}

                  {/* Close Button */}
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

              {/* Main Image View Box (Clickable to Expand) */}
              <div
                onClick={() => {
                  if (isImageFile(previewItem) || previewItem.fileUrl) {
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
                      src={resolveMediaUrl(previewItem.fileUrl)}
                      alt={previewItem.receiptNumber}
                      className="max-h-[54vh] max-w-full object-contain rounded-xl shadow-xs transition group-hover:opacity-95"
                    />
                    {/* Hover hint */}
                    <div className="absolute bottom-3 right-3 bg-slate-900/75 text-white px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none">
                      <Maximize2 size={12} />
                      <span>Click to expand</span>
                    </div>
                  </>
                ) : previewItem.fileUrl ? (
                  <iframe
                    src={resolveMediaUrl(previewItem.fileUrl)}
                    title={previewItem.receiptNumber}
                    className="w-full h-[50vh] rounded-xl bg-white"
                  />
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No preview available for manual text-only receipt record.
                  </div>
                )}
              </div>

              {/* Metadata Details */}
              <div className="flex items-center justify-between text-xs text-[#6D8AA2] pt-1 border-t border-slate-100">
                <span>Vendor: <strong className="text-[#0A4B6E]">{previewItem.vendorName || "Not specified"}</strong></span>
                {previewItem.amount ? (
                  <span>Amount: <strong className="text-[#0A4B6E]">₱{Number(previewItem.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong></span>
                ) : null}
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

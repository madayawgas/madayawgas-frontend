// src/components/fleet/work-orders/ReceiptAttachmentManager.jsx
import { useState, useRef } from "react";
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
} from "lucide-react";
import Badge from "../../ui/Badge";
import Button from "../../ui/Button";

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
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [error, setError] = useState("");

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

  const processSelectedFile = (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size cannot exceed 10MB.");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      setError("Only images (PNG, JPG, WEBP) and PDF documents are supported.");
      return;
    }

    setError("");
    setIsProcessingFile(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target.result;
      setStagedFile({
        fileName: file.name,
        fileType: file.type,
        previewUrl,
        file,
      });

      // If receipt number is empty, prefill suggestion
      if (!formReceiptNumber) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "");
        setFormReceiptNumber(cleanName ? `OR-${cleanName.toUpperCase().slice(0, 10)}` : "");
      }

      setShowManualForm(true);
      setIsProcessingFile(false);
    };

    reader.onerror = () => {
      setError("Failed to read file.");
      setIsProcessingFile(false);
    };

    reader.readAsDataURL(file);
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
      fileUrl: stagedFile?.previewUrl || undefined,
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

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center">
              <Upload size={18} />
            </div>

            <div>
              <p className="text-xs font-semibold text-[#0A4B6E]">
                Upload official receipt photo or document
              </p>
              <p className="text-[11px] text-[#6D8AA2] mt-0.5">
                Drag and drop receipt image or PDF (PNG, JPG, PDF up to 10MB)
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
              {stagedFile.fileType.startsWith("image/") ? (
                <img
                  src={stagedFile.previewUrl}
                  alt="Receipt Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-200 font-bold text-xs">
                  PDF
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
            const isImage = rcpt.fileType?.startsWith("image/") || rcpt.fileUrl?.startsWith("data:image");

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
                        src={rcpt.fileUrl}
                        alt={rcpt.receiptNumber}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ) : hasFile ? (
                    <button
                      type="button"
                      onClick={() => setPreviewItem(rcpt)}
                      className="w-10 h-10 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0 cursor-pointer text-xs font-bold"
                    >
                      PDF
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

      {/* FULL PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 space-y-3 border border-slate-200 shadow-2xl overflow-hidden text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#0A4B6E]">
                  Receipt Preview — {previewItem.receiptNumber}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {previewItem.receiptType || "PARTS"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto flex items-center justify-center bg-slate-50 rounded-xl p-2">
              {previewItem.fileUrl?.startsWith("data:image") || previewItem.fileType?.startsWith("image/") ? (
                <img
                  src={previewItem.fileUrl}
                  alt={previewItem.receiptNumber}
                  className="max-h-[55vh] object-contain rounded-lg shadow-sm"
                />
              ) : previewItem.fileUrl ? (
                <iframe
                  src={previewItem.fileUrl}
                  title={previewItem.receiptNumber}
                  className="w-full h-[50vh] rounded-lg"
                />
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No preview available for manual text-only receipt record.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-[#6D8AA2] pt-1">
              <span>Vendor: <strong className="text-[#0A4B6E]">{previewItem.vendorName || "Not specified"}</strong></span>
              {previewItem.amount ? (
                <span>Amount: <strong className="text-[#0A4B6E]">₱{Number(previewItem.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong></span>
              ) : null}
            </div>

            <div className="pt-2 text-center">
              <Button
                type="button"
                variant="cancel"
                onClick={() => setPreviewItem(null)}
                className="w-full text-xs"
              >
                CLOSE PREVIEW
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

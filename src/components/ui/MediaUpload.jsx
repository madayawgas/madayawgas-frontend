// src/components/ui/MediaUpload.jsx
import { useState, useRef } from "react";
import {
  Upload,
  Camera,
  X,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { uploadMediaFile } from "../../api/media.js";
import { resolveMediaUrl } from "../../utils/media.js";
import CameraCaptureModal from "./CameraCaptureModal.jsx";

/**
 * Reusable standardized media upload component with in-memory image compression,
 * HEIC transcoding, drag-and-drop zone, mobile camera capture, and thumbnail preview.
 *
 * @param {Object} props
 * @param {string} props.domain - Canonical target domain (e.g., 'maintenance/receipts')
 * @param {string} [props.value] - Canonical storageKey or direct media URL
 * @param {Function} props.onChange - Callback (storageKey, fullData) => void
 * @param {Function} [props.onRemove] - Callback () => void
 * @param {string} [props.label] - Optional field label
 * @param {boolean} [props.disabled=false] - Disable user interaction
 * @param {string} [props.accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"] - Allowed MIME types
 * @param {string} [props.helperText] - Custom helper text
 * @param {string} [props.className=""] - Extra container styling
 */
export default function MediaUpload({
  domain,
  value,
  onChange,
  onRemove,
  label,
  disabled = false,
  accept = "image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf",
  helperText,
  className = "",
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const resolvedUrl = resolveMediaUrl(value);
  const isPdf =
    Boolean(value && typeof value === "string") &&
    (/\.pdf(\?.*)?$/i.test(value) || value.includes("application/pdf"));

  const handleFileProcess = async (file) => {
    if (!file || disabled) return;
    setErrorMessage("");
    setIsUploading(true);

    try {
      const result = await uploadMediaFile(file, domain);
      if (onChange) {
        onChange(result.storageKey, result);
      }
    } catch (err) {
      console.error("Media upload error:", err);
      setErrorMessage(
        err?.message || "Failed to process and upload media. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (disabled || isUploading) return;
    setErrorMessage("");
    if (onRemove) {
      onRemove();
    } else if (onChange) {
      onChange("", null);
    }
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 text-left ${className}`}>
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E]">
          {label}
        </label>
      )}

      {/* Hidden native file inputs */}
      <input
        ref={fileInputRef}
        id="media_upload_file_input"
        name="media_file"
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        id="media_upload_camera_input"
        name="camera_file"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* ERROR NOTICE */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle size={14} className="shrink-0 text-red-500" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer shrink-0"
            title="Dismiss error"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ACTIVE VALUE PREVIEW */}
      {value ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {isPdf ? (
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 border border-red-100 flex flex-col items-center justify-center shrink-0">
                <FileText size={20} />
                <span className="font-bold text-[9px] mt-0.5">PDF</span>
              </div>
            ) : resolvedUrl ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                <img
                  src={resolvedUrl}
                  alt="Uploaded media preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-800 truncate font-mono">
                {typeof value === "string" ? value.split("/").pop() : "Attached Document"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                  Uploaded & Saved
                </span>
                {resolvedUrl && (
                  <a
                    href={resolvedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#0A4B6E] hover:underline flex items-center gap-0.5 font-medium"
                  >
                    <span>View</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="px-2.5 py-1 text-[11px] font-bold text-[#0A4B6E] hover:bg-[#E8F3F8] rounded-full transition-all cursor-pointer disabled:opacity-50"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || isUploading}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all cursor-pointer disabled:opacity-50"
              title="Remove file"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ) : (
        /* UPLOAD DROPZONE */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all duration-200 ${
            isDragOver
              ? "border-[#0A4B6E] bg-[#E8F3F8]/50"
              : "border-[#BCE1F1] hover:border-[#0A4B6E]/60 bg-[#F4F8FA]"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-3 space-y-2">
              <Loader2 size={24} className="text-[#0A4B6E] animate-spin" />
              <p className="text-xs font-semibold text-[#0A4B6E]">
                Compressing & Uploading Media...
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
                  Choose a file or drag & drop here
                </p>
                <p className="text-[11px] text-[#6D8AA2] mt-0.5">
                  {helperText || "JPEG, PNG, WebP or PDF (Max 5 MB payload ceiling)"}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                  className="py-1.5 px-3.5 rounded-full text-xs font-bold bg-[#0A4B6E] hover:bg-[#083b57] text-[#FFDF2C] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <Upload size={13} />
                  <span>Browse File</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (disabled || isUploading) return;
                    if (
                      typeof navigator !== "undefined" &&
                      navigator?.mediaDevices &&
                      typeof navigator.mediaDevices.getUserMedia === "function"
                    ) {
                      setIsCameraModalOpen(true);
                    } else {
                      cameraInputRef.current?.click();
                    }
                  }}
                  disabled={disabled || isUploading}
                  className="py-1.5 px-3.5 rounded-full text-xs font-bold bg-white text-[#0A4B6E] border border-gray-300 hover:bg-slate-50 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <Camera size={13} />
                  <span>Take Photo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Production In-Browser WebRTC Camera Viewfinder */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(capturedFile) => {
          handleFileProcess(capturedFile);
        }}
      />
    </div>
  );
}

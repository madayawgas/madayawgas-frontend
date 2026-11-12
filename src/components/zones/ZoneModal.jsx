// src/components/zones/ZoneModal.jsx
import React, { useState, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { MapPin, X, AlertCircle } from "lucide-react";
import Button from "../ui/Button.jsx";

export default function ZoneModal({
  isOpen,
  onClose,
  onSave,
  zone = null,
}) {
  const codeId = useId();
  const nameId = useId();
  const descId = useId();
  const activeId = useId();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    isActive: true,
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form data when modal opens or zone prop changes
  useEffect(() => {
    if (isOpen) {
      if (zone) {
        setFormData({
          code: zone.code || "",
          name: zone.name || "",
          description: zone.description || "",
          isActive: zone.isActive !== false,
        });
      } else {
        setFormData({
          code: "",
          name: "",
          description: "",
          isActive: true,
        });
      }
      setFormError("");
      setIsSubmitting(false);
    }
  }, [isOpen, zone]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Zone name is required.");
      return;
    }
    if (!zone && !formData.code.trim()) {
      setFormError("Zone code is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");

      await onSave({
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        isActive: formData.isActive,
      });

      onClose();
    } catch (err) {
      setFormError(err?.message || "Failed to save service zone.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#CBD5E1] max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1]">
              <MapPin size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0A4B6E]">
                {zone ? `Edit Zone: ${zone.code}` : "Add Service Delivery Zone"}
              </h2>
              <p className="text-[11px] text-[#6D8AA2]">
                {zone
                  ? "Update territory details and coverage notes"
                  : "Register a new route delivery territory"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-[#C93B32] flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label
              htmlFor={codeId}
              className="block font-semibold text-[#0A4B6E] mb-1"
            >
              Zone Code <span className="text-[#C93B32]">*</span>
            </label>
            <input
              id={codeId}
              type="text"
              placeholder="e.g. TORIL or ZN-DVO-01"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              disabled={Boolean(zone)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#0A4B6E] font-mono focus:outline-hidden focus:border-[#0A4B6E] focus:bg-white disabled:opacity-60 transition-colors uppercase"
              required
            />
            {zone && (
              <p className="text-[10px] text-[#6D8AA2] mt-1">
                Zone code cannot be modified once registered to preserve routing integrity.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={nameId}
              className="block font-semibold text-[#0A4B6E] mb-1"
            >
              Zone Name <span className="text-[#C93B32]">*</span>
            </label>
            <input
              id={nameId}
              type="text"
              placeholder="e.g. Toril District Commercial"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#0A4B6E] focus:outline-hidden focus:border-[#0A4B6E] focus:bg-white transition-colors"
              required
            />
          </div>

          <div>
            <label
              htmlFor={descId}
              className="block font-semibold text-[#0A4B6E] mb-1"
            >
              Description / Territory Coverage
            </label>
            <textarea
              id={descId}
              rows={3}
              placeholder="e.g. Commercial restaurants, downtown supermarkets, and residential dealerships along MacArthur Highway"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#0A4B6E] focus:outline-hidden focus:border-[#0A4B6E] focus:bg-white transition-colors"
            />
          </div>

          <div className="pt-1 flex items-center gap-2">
            <input
              type="checkbox"
              id={activeId}
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="rounded text-[#0A4B6E] focus:ring-[#0A4B6E] cursor-pointer"
            />
            <label
              htmlFor={activeId}
              className="text-xs text-[#0A4B6E] font-medium cursor-pointer select-none"
            >
              Zone is active for trip dispatch and weekly route planning
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : zone
                ? "Save Changes"
                : "Create Zone"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

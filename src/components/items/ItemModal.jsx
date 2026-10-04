// src/components/items/ItemModal.jsx
import { useState } from "react";
import {
  Package,
  Flame,
  Pencil,
  PackagePlus,
  ShieldCheck,
  CheckCircle2,
  Weight,
  Layers,
} from "lucide-react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

/**
 * Interactive Status Pills selector for Edit / Add forms
 */
const StatusPills = ({ isActive, onSelect }) => {
  const statuses = [
    { label: "ACTIVE", value: true, variant: "success" },
    { label: "INACTIVE", value: false, variant: "deactivated" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => {
        const isSelected = isActive === s.value;
        return (
          <label key={s.label} className="cursor-pointer relative flex items-center">
            <input
              type="radio"
              name="itemStatus"
              value={String(s.value)}
              checked={isSelected}
              onChange={() => onSelect(s.value)}
              className="sr-only"
            />
            <Badge
              variant={s.variant}
              className={`px-4 py-1.5 text-xs transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "ring-2 ring-offset-1 ring-[#0A4B6E] font-bold shadow-xs scale-102"
                  : "opacity-50 hover:opacity-80"
              }`}
            >
              {s.label}
            </Badge>
          </label>
        );
      })}
    </div>
  );
};

export default function ItemModal({
  item,
  isOpen = true,
  onClose,
  onUpdate,
  onAdd,
  isAdding = false,
  items = [],
}) {
  const [step, setStep] = useState(1); // 1: Form, 2: Confirm, 3: Success
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [formData, setFormData] = useState({
    name: item?.name || item?.itemName || "",
    category: item?.category || (item?.containerType === "CANISTER" ? "Canister" : "LPG Cylinder"),
    containerType: item?.containerType || "CYLINDER",
    netWeightKg: item?.netWeightKg !== undefined ? item.netWeightKg : 11.0,
    isActive: item?.isActive !== undefined ? Boolean(item.isActive) : true,
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;

    if (name === "name") {
      // Disallow special characters
      parsedValue = value.replace(/[^a-zA-Z0-9\s.-]/g, "");
    }

    if (name === "netWeightKg") {
      if (value !== "" && (Number(value) < 0 || Number(value) > 9999)) return;
      parsedValue = value === "" ? "" : value;
    }

    if (name === "containerType") {
      const suggestedCategory = value === "CANISTER" ? "Canister" : "LPG Cylinder";
      setFormData((prev) => ({
        ...prev,
        containerType: value,
        category: prev.category === "Canister" || prev.category === "LPG Cylinder" ? suggestedCategory : prev.category,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    const trimmedName = formData.name?.toString().trim();
    if (!trimmedName) {
      newErrors.name = "Product name is required";
    } else if (!/^[a-zA-Z0-9\s.-]+$/.test(trimmedName)) {
      newErrors.name = "Special characters are not allowed in product name";
    } else {
      const nameExists = items.find(
        (i) =>
          (i.name || i.itemName)?.toString().toLowerCase().trim() ===
            trimmedName.toLowerCase() &&
          (!item || i.id !== item.id)
      );
      if (nameExists) {
        newErrors.name = "A product with this name already exists";
      }
    }

    if (!formData.category?.toString().trim()) {
      newErrors.category = "Category is required";
    }

    if (!formData.containerType) {
      newErrors.containerType = "Container type is required";
    }

    if (
      formData.netWeightKg === "" ||
      formData.netWeightKg === null ||
      isNaN(Number(formData.netWeightKg)) ||
      Number(formData.netWeightKg) <= 0
    ) {
      newErrors.netWeightKg = "Net weight must be greater than 0 kg";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToConfirm = (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setSubmitError("");
    setStep(2);
  };

  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        containerType: formData.containerType,
        netWeightKg: Number(formData.netWeightKg),
        isActive: formData.isActive,
      };

      if (isAdding) {
        await onAdd(payload);
      } else {
        await onUpdate(item.id, payload);
      }

      setIsSubmitting(false);
      setStep(3);
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err.message || "Failed to save product. Please try again.");
    }
  };

  const isCylinder = formData.containerType === "CYLINDER";

  const modalTitle = isAdding
    ? step === 3
      ? "Product Added"
      : step === 2
      ? "Confirm Product"
      : "Add New Product"
    : step === 3
    ? "Product Updated"
    : step === 2
    ? "Confirm Changes"
    : "Edit Product";

  const modalSubtitle = isAdding
    ? step === 3
      ? "Product has been successfully registered."
      : step === 2
      ? "Review the product specifications below."
      : "Enter the product specifications and details."
    : step === 3
    ? "Product details have been successfully updated."
    : step === 2
    ? "Review the updated product specifications."
    : "Modify product specifications and details.";

  const modalIcon = isAdding
    ? step === 3
      ? CheckCircle2
      : step === 2
      ? ShieldCheck
      : PackagePlus
    : step === 3
    ? CheckCircle2
    : step === 2
    ? ShieldCheck
    : Pencil;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={modalIcon}
      maxWidth="max-w-md"
    >
      <div className="text-left font-sans">
        {/* ================= STEP 1: FORM ================= */}
        {step === 1 && (
          <form onSubmit={handleProceedToConfirm} className="space-y-4">
            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {submitError}
              </div>
            )}

            {/* Product Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. 11kg Standard LPG Cylinder"
                error={errors.name}
                className="w-full text-xs"
              />
            </div>

            {/* Container Type & Net Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Container Type <span className="text-rose-500">*</span>
                </label>
                <Select
                  name="containerType"
                  value={formData.containerType}
                  onChange={handleInputChange}
                  options={[
                    { value: "CYLINDER", label: "CYLINDER" },
                    { value: "CANISTER", label: "CANISTER" },
                  ]}
                  error={errors.containerType}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Net Weight (kg) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  name="netWeightKg"
                  value={formData.netWeightKg}
                  onChange={handleInputChange}
                  placeholder="e.g. 11.0"
                  error={errors.netWeightKg}
                  className="w-full text-xs font-mono"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <Input
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g. LPG Cylinder, Canister, Industrial"
                error={errors.category}
                className="w-full text-xs"
              />
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Operational Status
              </label>
              <StatusPills
                isActive={formData.isActive}
                onSelect={(val) => setFormData((prev) => ({ ...prev, isActive: val }))}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-5">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="!px-4 !py-2 !text-xs font-bold uppercase tracking-wider !rounded-full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="!px-6 !py-2 !text-xs font-bold uppercase tracking-wider !rounded-full !bg-[#FFDF2C] !text-[#0A4B6E] hover:!bg-[#ebd024]"
              >
                Continue
              </Button>
            </div>
          </form>
        )}

        {/* ================= STEP 2: CONFIRMATION ================= */}
        {step === 2 && (
          <div className="space-y-4">
            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {submitError}
              </div>
            )}

            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                <div className="w-10 h-10 rounded-full bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0">
                  {isCylinder ? <Flame size={18} /> : <Package size={18} />}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-[#0A4B6E] text-sm truncate">
                    {formData.name}
                  </h4>
                  <p className="text-xs text-slate-500">{formData.category}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Container Type:</span>
                  <span className="font-bold text-[#0A4B6E] uppercase">
                    {formData.containerType}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Net Weight:</span>
                  <span className="font-bold font-mono text-[#0A4B6E]">
                    {Number(formData.netWeightKg).toFixed(3)} kg
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status:</span>
                  <Badge
                    variant={formData.isActive ? "success" : "deactivated"}
                    className="px-2.5 py-0.5 text-[10px] font-bold"
                  >
                    {formData.isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-slate-100 mt-5">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="!px-4 !py-2 !text-xs font-bold uppercase tracking-wider !rounded-full"
              >
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirmSave}
                disabled={isSubmitting}
                className="!px-6 !py-2 !text-xs font-bold uppercase tracking-wider !rounded-full !bg-[#FFDF2C] !text-[#0A4B6E] hover:!bg-[#ebd024]"
              >
                {isSubmitting ? "Saving..." : "Confirm"}
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: SUCCESS ================= */}
        {step === 3 && (
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto my-2">
              <CheckCircle2 size={32} />
            </div>

            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Product Name:</span>
                <span className="text-xs font-bold text-[#0A4B6E] truncate max-w-[180px]">
                  {formData.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Container / Weight:</span>
                <span className="text-xs font-semibold text-slate-700">
                  {formData.containerType} ({Number(formData.netWeightKg).toFixed(3)} kg)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Status:</span>
                <Badge
                  variant={formData.isActive ? "success" : "deactivated"}
                  className="px-2.5 py-0.5 text-[10px] font-bold"
                >
                  {formData.isActive ? "ACTIVE" : "INACTIVE"}
                </Badge>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                variant="primary"
                onClick={onClose}
                className="w-full !py-2.5 !text-xs font-bold uppercase tracking-wider !rounded-full !bg-[#FFDF2C] !text-[#0A4B6E] hover:!bg-[#ebd024]"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

import { useState } from "react";
import { Package, Flame, Pencil, Trash2, ShieldCheck, CheckCircle2, PackagePlus, Weight, Layers } from "lucide-react";
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
              className={`px-4 py-1.5 text-xs transition-all duration-150 ${
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
  onClose,
  onUpdate,
  onDeleteClick,
  onAdd,
  isAdding = false,
  items = [],
  canManage = true,
}) {
  const [isEditing, setIsEditing] = useState(isAdding);
  const [step, setStep] = useState(1); // 1: Form, 2: Confirm
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: item?.name || item?.itemName || "",
    category: item?.category || "LPG Cylinder",
    containerType: item?.containerType || "CYLINDER",
    netWeightKg: item?.netWeightKg !== undefined ? item.netWeightKg : 11.0,
    isActive: item?.isActive !== undefined ? item.isActive : true,
    ...(item || {}),
  });

  if (!item && !isAdding) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;

    if (name === "name") {
      // Disallow special characters (permit only alphanumeric, spaces, dots, and hyphens)
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
        category: prev.category || suggestedCategory,
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
          i.id !== item?.id
      );
      if (nameExists) {
        newErrors.name = "Product with this name already exists";
      }
    }

    if (!formData.category?.toString().trim()) {
      newErrors.category = "Category is required";
    }

    const weightNum = Number(formData.netWeightKg);
    if (
      formData.netWeightKg === "" ||
      formData.netWeightKg === undefined ||
      isNaN(weightNum) ||
      weightNum <= 0
    ) {
      newErrors.netWeightKg = "Net weight (kg) must be a positive number";
    } else if (weightNum > 9999) {
      newErrors.netWeightKg = "Net weight (kg) cannot exceed 9,999 kg";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e?.preventDefault();
    if (!validate()) return;
    if (isAdding) {
      setStep(2);
    } else {
      submitUpdate();
    }
  };

  const submitUpdate = () => {
    const finalData = {
      ...formData,
      netWeightKg: Number(formData.netWeightKg) || 0,
      updatedAt: new Date().toISOString(),
    };

    onUpdate(item.id, finalData);
    setIsEditing(false);
  };

  const handleConfirmAdd = () => {
    const finalData = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      containerType: formData.containerType,
      netWeightKg: Number(formData.netWeightKg) || 0,
      isActive: formData.isActive,
    };

    onAdd(finalData);
  };

  const containerOptions = [
    { value: "CYLINDER", label: "CYLINDER (LPG Tank)" },
    { value: "CANISTER", label: "CANISTER (Butane / Portable)" },
  ];

  const categoryOptions = [
    { value: "LPG Cylinder", label: "LPG Cylinder" },
    { value: "Canister", label: "Canister" },
  ];

  const displayItem = item || {};
  const isItemActive = displayItem.isActive !== undefined ? displayItem.isActive : true;

  const getItemIcon = (containerType, category) => {
    const type = (containerType || category || "").toUpperCase();
    if (type.includes("CYLINDER") || type.includes("TANK")) {
      return <Flame size={24} className="text-[#FFDF2C]" />;
    }
    return <Package size={24} className="text-[#FFDF2C]" />;
  };

  // ==========================================
  // VIEW MODE MODAL
  // ==========================================
  if (!isEditing && !isAdding) {
    const headerBadge = (
      <div className="flex items-center gap-2">
        <Badge variant={isItemActive ? "success" : "deactivated"}>
          {isItemActive ? "ACTIVE" : "INACTIVE"}
        </Badge>
        {canManage && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-[#0A4B6E] hover:bg-[#E8F3F8] rounded-full transition cursor-pointer"
              title="Edit Product"
            >
              <Pencil size={17} />
            </button>
            <button
              type="button"
              onClick={() => onDeleteClick(displayItem)}
              className="p-1.5 text-[#CD3E3E] hover:bg-red-50 rounded-full transition cursor-pointer"
              title="Deactivate Product"
            >
              <Trash2 size={17} />
            </button>
          </div>
        )}
      </div>
    );

    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title={displayItem.name || displayItem.itemName || "Product Details"}
        subtitle={`${displayItem.category || "LPG Cylinder"} • ${displayItem.containerType || "CYLINDER"}`}
        icon={displayItem.containerType === "CANISTER" ? Package : Flame}
        badge={headerBadge}
        maxWidth="max-w-md"
        footer={
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#FFDF2C] hover:bg-[#ebd024] active:scale-[0.98] text-[#0A4B6E] font-bold py-3.5 px-6 rounded-full text-xs md:text-sm uppercase tracking-wider transition-all duration-150 shadow-sm cursor-pointer"
          >
            CLOSE
          </button>
        }
      >
        <div className="space-y-4 py-1">
          {/* Main Info Card */}
          <div className="bg-[#E8F3F8] rounded-2xl p-5 border border-[#BCE1F1]/60 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#BCE1F1]/60">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0A4B6E] uppercase tracking-wider">
                <Package size={15} />
                <span>Product Specifications</span>
              </div>
              <Badge variant="roles">
                {displayItem.category || "LPG Cylinder"}
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="bg-white/80 p-3 rounded-xl border border-[#BCE1F1]/40 flex items-center justify-between">
                <span className="text-[#6D8AA2] font-semibold flex items-center gap-1.5">
                  <Layers size={13} /> Container Specification
                </span>
                <span className="font-bold text-[#0A4B6E] text-sm">
                  {displayItem.containerType || "CYLINDER"}
                </span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-[#BCE1F1]/40 flex items-center justify-between">
                <span className="text-[#6D8AA2] font-semibold flex items-center gap-1.5">
                  <Weight size={13} /> Net Weight
                </span>
                <span className="font-bold text-[#0A4B6E] text-sm font-mono">
                  {displayItem.netWeightKg !== undefined
                    ? `${Number(displayItem.netWeightKg).toFixed(3)} kg`
                    : "11.000 kg"}
                </span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-[#BCE1F1]/40 flex items-center justify-between">
                <span className="text-[#6D8AA2] font-semibold">Operational Status</span>
                <Badge variant={isItemActive ? "success" : "deactivated"}>
                  {isItemActive ? "ACTIVE" : "INACTIVE"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // ==========================================
  // STEP 2: CONFIRM INFORMATION (Add Flow)
  // ==========================================
  if (isAdding && step === 2) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Confirm Product Details"
        subtitle="Verify catalog details before adding to inventory"
        icon={ShieldCheck}
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1]">
            Step 2 of 2
          </span>
        }
        onBack={() => setStep(1)}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 py-1">
          <div className="bg-[#E8F3F8] rounded-2xl p-5 border border-[#BCE1F1]/60 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#BCE1F1]/60">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-12 h-12 rounded-full bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-xs">
                  {getItemIcon(formData.containerType, formData.category)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-[#0A4B6E] truncate">
                    {formData.name}
                  </h3>
                  <p className="text-xs text-[#6D8AA2] font-medium">New Catalog Entry</p>
                </div>
              </div>

              <Badge variant="roles">
                {formData.containerType}
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="bg-white/80 p-3 rounded-xl border border-[#BCE1F1]/40 flex items-center justify-between">
                <span className="text-[#6D8AA2] font-semibold flex items-center gap-1.5">
                  <Layers size={13} /> Category
                </span>
                <span className="font-bold text-[#0A4B6E] text-sm">
                  {formData.category}
                </span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-[#BCE1F1]/40 flex items-center justify-between">
                <span className="text-[#6D8AA2] font-semibold flex items-center gap-1.5">
                  <Weight size={13} /> Net Weight
                </span>
                <span className="font-bold text-[#0A4B6E] text-sm font-mono">
                  {Number(formData.netWeightKg || 0).toFixed(3)} kg
                </span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-[#BCE1F1]/40 flex items-center justify-between">
                <span className="text-[#6D8AA2] font-semibold">Initial Status</span>
                <Badge variant={formData.isActive ? "success" : "deactivated"}>
                  {formData.isActive ? "ACTIVE" : "INACTIVE"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleConfirmAdd}
              className="w-full bg-[#FFDF2C] hover:bg-[#ebd024] active:scale-[0.98] text-[#0A4B6E] font-bold py-3.5 px-6 rounded-full text-xs md:text-sm uppercase tracking-wider transition-all duration-150 shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>CONFIRM & REGISTER PRODUCT</span>
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // ==========================================
  // STEP 1: FORM VIEW (Add or Edit Flow)
  // ==========================================
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isAdding ? "Register Item" : "Edit Item Profile"}
      subtitle={isAdding ? "Add LPG cylinder or canister product to inventory catalog" : "Update product specifications and operational status"}
      icon={isAdding ? PackagePlus : (formData.containerType === "CANISTER" ? Package : Flame)}
      badge={
        isAdding ? (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1]">
            Step 1 of 2
          </span>
        ) : null
      }
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleFormSubmit} className="space-y-4 py-1">
        {/* CARD 1: Product Identification */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A4B6E] uppercase tracking-wider">
            <Package size={14} />
            <span>Product Identification</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
              Product Name <span className="text-[#CD3E3E]">*</span>
            </label>
            <input
              type="text"
              required
              name="name"
              placeholder="e.g. 11kg LPG Cylinder"
              value={formData.name || ""}
              onChange={handleInputChange}
              pattern="[a-zA-Z0-9\s.\-]+"
              title="Special characters are not allowed. Only letters, numbers, spaces, dots, and hyphens permitted."
              className={`w-full bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border outline-none transition-all placeholder:text-slate-400 ${
                errors.name
                  ? "border-[#CD3E3E] focus:ring-2 focus:ring-red-200"
                  : "border-slate-200 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10"
              }`}
            />
            {errors.name && (
              <p className="text-[#CD3E3E] text-[11px] mt-1 font-medium">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
                Container Type <span className="text-[#CD3E3E]">*</span>
              </label>
              <select
                name="containerType"
                value={formData.containerType || "CYLINDER"}
                onChange={handleInputChange}
                className="w-full bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10 transition-all cursor-pointer"
              >
                {containerOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
                Category <span className="text-[#CD3E3E]">*</span>
              </label>
              <select
                name="category"
                value={formData.category || "LPG Cylinder"}
                onChange={handleInputChange}
                className="w-full bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10 transition-all cursor-pointer"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CARD 2: Weight & Status */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A4B6E] uppercase tracking-wider">
            <Weight size={14} />
            <span>Weight & Status Specifications</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
              Net Weight (kg) <span className="text-[#CD3E3E]">*</span>
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              max="9999"
              required
              name="netWeightKg"
              placeholder="e.g. 11.000"
              value={formData.netWeightKg !== undefined ? formData.netWeightKg : ""}
              onChange={handleInputChange}
              className={`w-full bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border outline-none transition-all placeholder:text-slate-400 font-mono ${
                errors.netWeightKg
                  ? "border-[#CD3E3E] focus:ring-2 focus:ring-red-200"
                  : "border-slate-200 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10"
              }`}
            />
            {errors.netWeightKg && (
              <p className="text-[#CD3E3E] text-[11px] mt-1 font-medium">{errors.netWeightKg}</p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1.5">
              Operational Status
            </label>
            <StatusPills
              isActive={formData.isActive}
              onSelect={(active) => setFormData((prev) => ({ ...prev, isActive: active }))}
            />
          </div>
        </div>


        {/* FOOTER ACTIONS */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            type="submit"
            className="w-full bg-[#FFDF2C] hover:bg-[#ebd024] active:scale-[0.98] text-[#0A4B6E] font-bold py-3.5 px-6 rounded-full text-xs md:text-sm uppercase tracking-wider transition-all duration-150 shadow-sm cursor-pointer"
          >
            {isAdding ? "CONTINUE TO CONFIRMATION" : "SAVE CHANGES"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (isAdding) onClose();
              else setIsEditing(false);
            }}
            className="w-full bg-transparent hover:bg-slate-50 text-slate-500 font-semibold py-2 rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            CANCEL
          </button>
        </div>
      </form>
    </Modal>
  );
}

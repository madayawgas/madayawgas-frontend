import { useState } from "react";
import { Package, Flame, Pencil, Trash2, ArrowLeft, Eye, EyeOff, AlertTriangle } from "lucide-react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { usersApi } from "../../api/users.js";
import { useAuth } from "../../context/AuthContext.jsx";

// Status Badge Style Helper
const getBadgeStyle = (active) => {
  return active ? "bg-[#10B981] text-white" : "bg-[#64748B] text-white";
};

/**
 * Interactive Status Pills selector for Edit / Add forms
 */
const StatusPills = ({ isActive, onSelect }) => {
  const statuses = [
    { label: "ACTIVE", value: true, bg: "bg-[#10B981] text-white" },
    { label: "INACTIVE", value: false, bg: "bg-[#64748B] text-white" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => {
        const isSelected = isActive === s.value;
        return (
          <button
            key={s.label}
            type="button"
            onClick={() => onSelect(s.value)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider transition-all cursor-pointer shadow-xs ${s.bg} ${
              isSelected
                ? "ring-2 ring-offset-2 ring-[#0A4B6E] scale-105"
                : "opacity-40 hover:opacity-80"
            }`}
          >
            {s.label}
          </button>
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
}) {
  const { user: currentUser } = useAuth();

  const [isEditing, setIsEditing] = useState(isAdding);
  const [step, setStep] = useState(1); // 1: Form, 2: Confirm, 3: Password
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
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

    if (name === "netWeightKg") {
      if (value !== "" && Number(value) < 0) return;
      parsedValue = value === "" ? "" : Number(value);
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

    if (!formData.name?.toString().trim()) {
      newErrors.name = "Product name is required";
    } else {
      const nameExists = items.find(
        (i) =>
          (i.name || i.itemName)?.toString().toLowerCase() ===
            formData.name?.toString().toLowerCase() &&
          i.id !== item?.id
      );
      if (nameExists) {
        newErrors.name = "Product with this name already exists";
      }
    }

    if (!formData.category?.toString().trim()) {
      newErrors.category = "Category is required";
    }

    if (
      formData.netWeightKg === "" ||
      formData.netWeightKg === undefined ||
      Number(formData.netWeightKg) <= 0
    ) {
      newErrors.netWeightKg = "Net weight (kg) must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = () => {
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
      name: formData.name,
      category: formData.category,
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
      return <Flame size={26} className="stroke-[2.2]" />;
    }
    return <Package size={26} className="stroke-[2.2]" />;
  };


  // ==========================================
  // VIEW MODE MODAL (Screen 2: Item View)
  // ==========================================
  if (!isEditing && !isAdding) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        maxWidth="max-w-md"
        footer={
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#FFDF2C] hover:bg-[#F5D020] text-[#0A4B6E] font-bold text-sm py-3 rounded-full uppercase tracking-wider transition shadow-xs cursor-pointer"
          >
            CLOSE
          </button>
        }
      >
        <div className="pt-2 pb-2">
          {/* Header Row: Item Icon + Name & Status + Pencil + Trash */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2.5 text-[#0A4B6E]">
              {getItemIcon(displayItem.containerType, displayItem.category)}
              <h2 className="text-xl md:text-2xl font-bold truncate max-w-[220px]">
                {displayItem.name || displayItem.itemName || "Product"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-xs ${getBadgeStyle(
                  isItemActive
                )}`}
              >
                {isItemActive ? "ACTIVE" : "INACTIVE"}
              </span>

              {/* Edit Icon Button */}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-[#0A4B6E] hover:bg-gray-100 rounded-lg transition cursor-pointer"
                title="Edit Item"
              >
                <Pencil size={18} />
              </button>

              {/* Deactivate Icon Button - Restricted to Admin/Super Admin/Sales Manager */}
              {(currentUser?.role === "Super Admin" || currentUser?.role === "Admin" || currentUser?.role === "Sales Manager") && (
                <button
                  type="button"
                  onClick={() => onDeleteClick(displayItem)}
                  className="p-1.5 text-[#0A4B6E] hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  title="Deactivate Item"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>


          {/* Details Body */}
          <div className="bg-[#E1F3FE] rounded-2xl p-5 space-y-2.5 text-sm text-left">
            <p className="text-[#588094]">
              Product Name:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {displayItem.name || displayItem.itemName || "-"}
              </span>
            </p>

            <p className="text-[#588094]">
              Category:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {displayItem.category || "LPG Cylinder"}
              </span>
            </p>

            <p className="text-[#588094]">
              Container Type:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {displayItem.containerType || "CYLINDER"}
              </span>
            </p>

            <p className="text-[#588094]">
              Net Weight:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {displayItem.netWeightKg !== undefined
                  ? `${Number(displayItem.netWeightKg).toFixed(3)} kg`
                  : "11.000 kg"}
              </span>
            </p>

            <p className="text-[#588094]">
              Status:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {isItemActive ? "Operational / Active" : "Deactivated"}
              </span>
            </p>
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
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-[2rem] max-w-lg w-full p-8 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
            <h2 className="text-2xl font-bold text-[#0B4A6E]">
              Confirm Product Information
            </h2>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[#0B4A6E] hover:opacity-75 transition-opacity cursor-pointer p-1"
            >
              <ArrowLeft size={22} />
            </button>
          </div>

          <div className="bg-[#F3F5F5] rounded-2xl p-6 space-y-3 text-sm text-left mb-6">
            <p className="text-[#588094]">
              Product Name:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {formData.name || "-"}
              </span>
            </p>
            <p className="text-[#588094]">
              Category:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {formData.category || "LPG Cylinder"}
              </span>
            </p>
            <p className="text-[#588094]">
              Container Type:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {formData.containerType || "CYLINDER"}
              </span>
            </p>
            <p className="text-[#588094]">
              Net Weight (kg):{" "}
              <span className="font-bold text-[#0A4B6E]">
                {Number(formData.netWeightKg || 0).toFixed(3)} kg
              </span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[#588094]">Operational Status:</span>
              <span
                className={`px-3 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider text-white ${getBadgeStyle(
                  formData.isActive
                )}`}
              >
                {formData.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={handleConfirmAdd}
              className="w-full py-3.5 bg-[#F6C445] hover:bg-[#e2b23b] border-none !text-[#0B4A6E] rounded-full font-bold uppercase tracking-widest text-xs transition-colors cursor-pointer"
            >
              CONFIRM
            </Button>
            <Button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-2 bg-transparent border-none !text-[#0B4A6E] font-semibold text-xs hover:underline cursor-pointer"
            >
              CANCEL
            </Button>
          </div>
        </div>
      </div>
    );
  }


  // ==========================================
  // STEP 1: FORM VIEW (Edit or Add Flow)
  // ==========================================
  const formFooter = (
    <div className="w-full flex flex-col items-center">
      <button
        type="button"
        onClick={handleFormSubmit}
        className="w-full bg-[#FFDF2C] hover:bg-[#F5D020] text-[#0A4B6E] font-bold text-sm py-3 rounded-full uppercase tracking-wider transition shadow-sm cursor-pointer mb-2"
      >
        {isAdding ? "REGISTER PRODUCT" : "SAVE CHANGES"}
      </button>
      <button
        type="button"
        onClick={() => {
          if (isAdding) onClose();
          else setIsEditing(false);
        }}
        className="text-xs text-[#0A4B6E] font-semibold hover:underline cursor-pointer"
      >
        CANCEL
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isAdding ? "Register Item" : "Edit Item Profile"}
      maxWidth="max-w-xl"
      footer={formFooter}
    >
      <div className="space-y-4 text-left py-2">
        {/* ROW 1: Product Name */}
        <div>
          <Input
            label="Product Name"
            name="name"
            value={formData.name || ""}
            onChange={handleInputChange}
            placeholder="e.g. 11kg LPG Cylinder"
            error={errors.name}
          />
        </div>

        {/* ROW 2: Container Type & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Container Type"
            name="containerType"
            value={formData.containerType || "CYLINDER"}
            onChange={handleInputChange}
            options={containerOptions}
          />
          <Select
            label="Category"
            name="category"
            value={formData.category || "LPG Cylinder"}
            onChange={handleInputChange}
            options={categoryOptions}
            error={errors.category}
          />
        </div>

        {/* ROW 3: Net Weight (kg) */}
        <div>
          <Input
            label="Net Weight (kg)"
            type="number"
            step="0.001"
            name="netWeightKg"
            value={formData.netWeightKg !== undefined ? formData.netWeightKg : ""}
            onChange={handleInputChange}
            placeholder="e.g. 11.000"
            error={errors.netWeightKg}
          />
        </div>

        {/* ROW 4: Status Pills Selector */}
        <div className="w-full flex flex-col gap-2 pt-1">
          <label className="text-black font-medium text-sm">Operational Status</label>
          <StatusPills
            isActive={formData.isActive}
            onSelect={(active) => setFormData((prev) => ({ ...prev, isActive: active }))}
          />
        </div>
      </div>
    </Modal>
  );
}

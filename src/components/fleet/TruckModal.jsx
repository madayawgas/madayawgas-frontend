// src/components/fleet/TruckModal.jsx
import { useState } from "react";
import { Truck, Pencil, Trash2, ArrowLeft, Eye, EyeOff, AlertTriangle } from "lucide-react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { usersApi } from "../../api/users.js";
import { useAuth } from "../../context/AuthContext.jsx";

// Status Badge Style Helper
const getBadgeStyle = (status) => {
  const normalized = (status || "").toUpperCase().replace("_", " ");
  switch (normalized) {
    case "ACTIVE":
    case "IN USE":
      return "bg-[#10B981] text-white";
    case "AVAILABLE":
      return "bg-[#1D5EAF] text-white";
    case "STANDBY":
    case "IN SHOP":
      return "bg-[#B45309] text-white";
    case "UNDER REPAIR":
    case "UNDER MAINTENANCE":
      return "bg-[#DC2626] text-white";
    default:
      return "bg-[#64748B] text-white";
  }
};

/**
 * Interactive Status Pills selector for Edit / Add forms
 */
const StatusPills = ({ currentStatus, onSelect }) => {
  const statuses = ["ACTIVE", "AVAILABLE", "STANDBY", "UNDER REPAIR"];

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => {
        const isSelected =
          (currentStatus || "").toUpperCase().replace("_", " ") === status;
        const badgeBg = getBadgeStyle(status);

        return (
          <button
            key={status}
            type="button"
            onClick={() => onSelect(status)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider transition-all cursor-pointer shadow-xs ${badgeBg} ${
              isSelected
                ? "ring-2 ring-offset-2 ring-[#0A4B6E] scale-105"
                : "opacity-40 hover:opacity-80"
            }`}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
};

export default function TruckModal({
  truck,
  onClose,
  onUpdate,
  onDeleteClick,
  onAdd,
  isAdding = false,
  trucks = [],
  driverOptions = [],
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
    status: "ACTIVE",
    plateNumber: "",
    model: "Model 1",
    yearModel: "",
    tankNumber: "1234",
    designatedRoute: "Admin4",
    assignedDriverId: "",
    driverName: "",
    currentOdometer: 2,
    inputOdometer: "",
    lastPMOdometer: "",
    capacity: "",
    activeRepair: "",
    ...(truck || {}),
  });

  if (!truck && !isAdding) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;

    if (["currentOdometer", "inputOdometer", "lastPMOdometer", "yearModel", "capacity"].includes(name)) {
      if (value !== "" && Number(value) < 0) return;
      parsedValue = value === "" ? "" : Number(value);
    }

    if (name === "assignedDriverId") {
      parsedValue = value === "" ? "" : value;
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

    if (!formData.plateNumber) {
      newErrors.plateNumber = "Plate number is required";
    } else {
      const plateExists = trucks.find(
        (t) =>
          t.plateNumber?.toString().toLowerCase() ===
            formData.plateNumber?.toString().toLowerCase() &&
          t.truckId !== truck?.truckId &&
          t.id !== truck?.id
      );
      if (plateExists) {
        newErrors.plateNumber = "This plate number already exists";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = () => {
    if (!validate()) return;
    if (isAdding) {
      setStep(2); // Advance to Confirmation step for Add
    } else {
      submitUpdate(); // Direct save for Edit
    }
  };

  const submitUpdate = () => {
    const matchedDriver = driverOptions.find(
      (d) => d.value === formData.assignedDriverId
    );

    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(currentDate.getDate()).padStart(
      2,
      "0"
    )}-${currentDate.getFullYear()} ${String(
      currentDate.getHours()
    ).padStart(2, "0")}:${String(currentDate.getMinutes()).padStart(
      2,
      "0"
    )}:${String(currentDate.getSeconds()).padStart(2, "0")}`;

    const effectiveOdometer =
      formData.inputOdometer !== "" && formData.inputOdometer !== undefined
        ? Number(formData.inputOdometer)
        : formData.currentOdometer;

    const finalData = {
      ...formData,
      currentOdometer: effectiveOdometer,
      driverName: matchedDriver
        ? matchedDriver.label
        : formData.driverName || "No Assigned",
      designatedRoute: formData.designatedRoute || "No Route Assigned",
      assignedDriverId: formData.assignedDriverId || null,
      lastUpdated: formattedDate,
    };

    onUpdate(truck.id || truck.truckId, finalData);
    setIsEditing(false);
  };

  const handleConfirmAdd = () => {
    const matchedDriver = driverOptions.find(
      (d) => d.value === formData.assignedDriverId
    );

    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(currentDate.getDate()).padStart(
      2,
      "0"
    )}-${currentDate.getFullYear()} ${String(
      currentDate.getHours()
    ).padStart(2, "0")}:${String(currentDate.getMinutes()).padStart(
      2,
      "0"
    )}:${String(currentDate.getSeconds()).padStart(2, "0")}`;

    const effectiveOdometer =
      formData.inputOdometer !== "" && formData.inputOdometer !== undefined
        ? Number(formData.inputOdometer)
        : formData.currentOdometer;

    const finalData = {
      ...formData,
      currentOdometer: effectiveOdometer,
      driverName: matchedDriver
        ? matchedDriver.label
        : formData.driverName || "No Assigned",
      designatedRoute: formData.designatedRoute || "No Route Assigned",
      assignedDriverId: formData.assignedDriverId || null,
      lastUpdated: formattedDate,
    };

    onAdd(finalData);
  };


  const routeOptions = [
    { value: "No Route Assigned", label: "No Route Assigned" },
    { value: "Admin4", label: "Admin4" },
    { value: "Route 1 - North District", label: "Route 1 - North District" },
    { value: "Route 2 - South District", label: "Route 2 - South District" },
    { value: "Route 3 - Central City", label: "Route 3 - Central City" },
    { value: "Route 4 - East Coast", label: "Route 4 - East Coast" },
  ];

  const selectDriverOptions = [
    { value: "", label: "No Assigned (Unassigned)" },
    ...driverOptions,
  ];

  const displayTruck = truck || {};
  const matchedDriverObj = driverOptions.find(
    (d) => d.value === formData.assignedDriverId
  );
  const assignedDriverLabel = matchedDriverObj ? matchedDriverObj.label : "No Assigned";

  // ==========================================
  // VIEW MODE MODAL (Screen 2: Fleet View Info)
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
          {/* Header Row: Truck Icon + Plate Number & Status + Pencil + Trash */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2.5 text-[#0A4B6E]">
              <Truck size={26} className="stroke-[2.2]" />
              <h2 className="text-xl md:text-2xl font-bold">
                {displayTruck.plateNumber || `Truck #${displayTruck.truckId || ""}`}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-xs ${getBadgeStyle(
                  displayTruck.status
                )}`}
              >
                {displayTruck.status?.replace("_", " ") || "ACTIVE"}
              </span>

              {/* Edit Icon Button */}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-[#0A4B6E] hover:bg-gray-100 rounded-lg transition cursor-pointer"
                title="Edit Fleet"
              >
                <Pencil size={18} />
              </button>

              {/* Delete Icon Button */}
              <button
                type="button"
                onClick={() => onDeleteClick(displayTruck)}
                className="p-1.5 text-[#0A4B6E] hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                title="Delete Fleet"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Details Body */}
          <div className="bg-[#E1F3FE] rounded-2xl p-5 space-y-2 text-sm text-left">
            <p className="text-[#588094]">
              Driver:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {displayTruck.driverName && displayTruck.driverName !== "Unassigned"
                  ? displayTruck.driverName
                  : "No Assigned"}
              </span>
            </p>

            <p className="text-[#588094]">
              Designated Route:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {displayTruck.designatedRoute || "No Route Assigned"}
              </span>
            </p>

            <p className="text-[#588094]">
              Model:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {displayTruck.model || "Model 1"}
              </span>
            </p>

            <p className="text-[#588094]">
              Tank Number:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {displayTruck.tankNumber || displayTruck.capacity || "1234"}
              </span>
            </p>

            <p className="text-[#588094]">
              Current Odometer:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {displayTruck.currentOdometer !== undefined && displayTruck.currentOdometer !== null
                  ? `${displayTruck.currentOdometer.toLocaleString()}KM`
                  : "2KM"}
              </span>
            </p>

            {displayTruck.activeRepair && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-medium mt-3 border border-red-200">
                <span className="font-bold">Active Repair:</span>{" "}
                {displayTruck.activeRepair}
              </div>
            )}
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
              Confirm Truck Information
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
              Truck Plate No:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {formData.plateNumber || "-"}
              </span>
            </p>
            <p className="text-[#588094]">
              Truck Model:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {formData.model || "-"}
              </span>
            </p>
            <p className="text-[#588094]">
              Designated Route:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {formData.designatedRoute || "No Route Assigned"}
              </span>
            </p>
            <p className="text-[#588094]">
              Tank Model:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {formData.tankNumber || "-"}
              </span>
            </p>
            <p className="text-[#588094]">
              Assigned Driver:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {assignedDriverLabel}
              </span>
            </p>
            <p className="text-[#588094]">
              Current Odometer:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {formData.inputOdometer || formData.currentOdometer || 0} KM
              </span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[#588094]">Status:</span>
              <span
                className={`px-3 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider text-white ${getBadgeStyle(
                  formData.status
                )}`}
              >
                {formData.status}
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
        {isAdding ? "ADD TRUCK" : "SAVE CHANGES"}
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
      title={isAdding ? "Add Truck" : "Edit Truck"}
      maxWidth="max-w-xl"
      footer={formFooter}
    >
      <div className="space-y-4 text-left py-2">
        {/* ROW 1: Truck Plate No. & Truck Model */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Truck Plate No."
            name="plateNumber"
            value={formData.plateNumber || ""}
            onChange={handleInputChange}
            placeholder="e.g. ABC 123"
            error={errors.plateNumber}
          />
          <Input
            label="Truck Model"
            name="model"
            value={formData.model || ""}
            onChange={handleInputChange}
            placeholder="e.g. Model 1"
            error={errors.model}
          />
        </div>

        {/* ROW 2: Designated Route & Tank Number / Tank Model */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Designated Route"
            name="designatedRoute"
            value={formData.designatedRoute || "Admin4"}
            onChange={handleInputChange}
            options={routeOptions}
          />
          <Input
            label="Tank Model"
            name="tankNumber"
            value={formData.tankNumber || ""}
            onChange={handleInputChange}
            placeholder="e.g. 1234"
          />
        </div>

        {/* ROW 3: Assigned Driver (Full Width) */}
        <div>
          <Select
            label="Assigned Driver"
            name="assignedDriverId"
            value={formData.assignedDriverId || ""}
            onChange={handleInputChange}
            options={selectDriverOptions}
            error={errors.assignedDriverId}
          />
        </div>

        {/* ROW 4: Current Odometer & Input Odometer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Current Odometer"
            type="text"
            name="currentOdometer"
            value={
              formData.currentOdometer !== undefined && formData.currentOdometer !== null
                ? `${formData.currentOdometer.toLocaleString()}KM`
                : "2KM"
            }
            disabled
            className="opacity-75 cursor-not-allowed"
          />
          <Input
            label="Input Odometer"
            type="number"
            name="inputOdometer"
            value={formData.inputOdometer || ""}
            onChange={handleInputChange}
            placeholder="Input Odometer"
          />
        </div>

        {/* ROW 5: Status Pills Selector */}
        <div className="w-full flex flex-col gap-2 pt-1">
          <label className="text-black font-medium text-sm">Status</label>
          <StatusPills
            currentStatus={formData.status}
            onSelect={(status) => setFormData((prev) => ({ ...prev, status }))}
          />
        </div>
      </div>
    </Modal>
  );
}



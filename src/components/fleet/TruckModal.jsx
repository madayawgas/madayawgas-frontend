// src/components/fleet/TruckModal.jsx
import { useState, useEffect } from "react";
import { Truck, Pencil, Trash2, RotateCcw, ArrowLeft } from "lucide-react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

// Status Badge Style Helper
const getBadgeStyle = (status) => {
  const normalized = (status || "").toUpperCase().replace("_", " ");
  switch (normalized) {
    case "ACTIVE":
    case "IN USE":
    case "AVAILABLE":
      return "bg-[#10B981] text-white";
    case "UNDER REPAIR":
    case "UNDER MAINTENANCE":
    case "IN SHOP":
      return "bg-[#DC2626] text-white";
    case "INACTIVE":
      return "bg-[#64748B] text-white";
    case "RETIRED":
      return "bg-[#475569] text-white";
    default:
      return "bg-[#64748B] text-white";
  }
};

/**
 * Helper to produce clean initial form state from truck prop
 */
const getInitialFormData = (t) => {
  const driverId = t?.driverId || t?.driver?.id || t?.assignedDriverId || "";
  const driverName = t?.driver
    ? `${t.driver.firstName || ""} ${t.driver.lastName || ""}`.trim() || t.driver.username
    : t?.driverName || "";

  return {
    status: t?.status || t?.operationalStatus || "ACTIVE",
    plateNumber: t?.plateNumber || "",
    model: t?.model || "Isuzu Elf",
    yearModel: t?.yearModel !== undefined ? t.yearModel : new Date().getFullYear(),
    tankNumber: t?.tankNumber || "1234",
    designatedRoute: t?.designatedRoute || "Admin4",
    assignedDriverId: driverId,
    driverName: driverName,
    currentOdometer: t?.currentOdometer !== undefined ? t.currentOdometer : 0,
    inputOdometer: "",
    lastPmOdometer: t?.lastPmOdometer !== undefined ? t.lastPmOdometer : (t?.lastPMOdometer || 0),
    activeRepair: t?.activeRepair || "",
  };
};

/**
 * Interactive Status Pills selector for Edit / Add forms
 */
const StatusPills = ({ currentStatus, onSelect }) => {
  const statuses = ["ACTIVE", "UNDER MAINTENANCE", "INACTIVE", "RETIRED"];

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
            onClick={() => onSelect(status.replace(" ", "_"))}
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
  onReactivateClick,
  onAdd,
  isAdding = false,
  trucks = [],
  availableDrivers = [],
  allDrivers = [],
  canManage = true,
}) {
  const [isEditing, setIsEditing] = useState(isAdding);
  const [step, setStep] = useState(1); // 1: Form, 2: Confirm
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState(() => getInitialFormData(truck));

  // Synchronize formData whenever the underlying truck prop updates
  useEffect(() => {
    if (truck && !isEditing) {
      setFormData(getInitialFormData(truck));
      setSubmitError("");
    }
  }, [truck, isEditing]);

  if (!truck && !isAdding) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;

    if (
      ["currentOdometer", "inputOdometer", "lastPmOdometer", "lastPMOdometer", "yearModel"].includes(
        name
      )
    ) {
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
    if (submitError) setSubmitError("");
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.plateNumber || !formData.plateNumber.toString().trim()) {
      newErrors.plateNumber = "Plate number is required";
    } else {
      const plateExists = trucks.find(
        (t) =>
          t.plateNumber?.toString().toLowerCase() ===
            formData.plateNumber?.toString().toLowerCase() &&
          t.id !== truck?.id
      );
      if (plateExists) {
        newErrors.plateNumber = "This plate number already exists";
      }
    }

    if (!formData.model || !formData.model.toString().trim()) {
      newErrors.model = "Truck model is required";
    }

    if (
      formData.yearModel === "" ||
      formData.yearModel === undefined ||
      Number(formData.yearModel) < 1900 ||
      Number(formData.yearModel) > new Date().getFullYear() + 1
    ) {
      newErrors.yearModel = `Year model must be between 1900 and ${new Date().getFullYear() + 1}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validate()) return;
    if (isAdding) {
      setStep(2); // Advance to Confirmation step for Add
    } else {
      await submitUpdate(); // Direct save for Edit
    }
  };

  // Check if truck currently has an assigned driver
  const hasExistingDriver = !!(truck?.driverId || truck?.driver);
  const currentDriverId = truck?.driverId || truck?.driver?.id;
  const currentDriverName = truck?.driver
    ? `${truck.driver.firstName || ""} ${truck.driver.lastName || ""}`.trim() || truck.driver.username
    : truck?.driverName || "Current Driver";

  // Build the strict dropdown options based on assignment state:
  let selectDriverOptions = [];
  if (!isAdding && hasExistingDriver) {
    // Assigned vehicle: only show currently assigned driver & explicit "Unassign Driver" option
    selectDriverOptions = [
      { value: currentDriverId, label: `${currentDriverName} (Currently Assigned)` },
      { value: "", label: "Unassign Driver" },
    ];
  } else {
    // Unassigned vehicle (or Add New): list unassigned option + only truly available drivers
    selectDriverOptions = [
      { value: "", label: "No Assigned (Unassigned)" },
      ...availableDrivers.map((d) => ({
        value: d.id,
        label: `${d.firstName || ""} ${d.lastName || ""}`.trim() || d.username,
      })),
    ];
  }

  const submitUpdate = async () => {
    const isDeactivated = formData.status === "INACTIVE" || formData.status === "RETIRED";
    const finalDriverId = isDeactivated ? null : (formData.assignedDriverId || null);

    // Look up assigned driver profile
    const matchedDriver = [...availableDrivers, ...allDrivers].find(
      (d) => d.id === finalDriverId || d.value === finalDriverId
    );

    const finalDriverObj = isDeactivated || !finalDriverId
      ? null
      : matchedDriver
      ? {
          id: matchedDriver.id || matchedDriver.value,
          firstName: matchedDriver.firstName || "",
          lastName: matchedDriver.lastName || "",
          phone: matchedDriver.phone || "",
          username: matchedDriver.username || "",
          role: matchedDriver.role || "Driver",
        }
      : truck?.driver && (truck.driver.id === finalDriverId || truck.driverId === finalDriverId)
      ? truck.driver
      : null;

    const finalDriverName = isDeactivated || !finalDriverId
      ? "No Assigned"
      : finalDriverObj
      ? `${finalDriverObj.firstName || ""} ${finalDriverObj.lastName || ""}`.trim() || finalDriverObj.username
      : "No Assigned";

    const effectiveOdometer =
      formData.inputOdometer !== "" && formData.inputOdometer !== undefined
        ? Number(formData.inputOdometer)
        : Number(formData.currentOdometer) || 0;

    const finalData = {
      ...(truck || {}),
      plateNumber: formData.plateNumber.trim(),
      model: formData.model.trim(),
      yearModel: Number(formData.yearModel) || new Date().getFullYear(),
      currentOdometer: effectiveOdometer,
      lastPmOdometer: Number(formData.lastPmOdometer) || 0,
      driverId: finalDriverId,
      driver: finalDriverObj,
      driverName: finalDriverName,
      designatedRoute: formData.designatedRoute || "No Route Assigned",
      status: formData.status || "ACTIVE",
      operationalStatus: formData.status || "ACTIVE",
      isAvailable: formData.status === "ACTIVE",
      updatedAt: new Date().toISOString(),
    };

    try {
      setIsSubmitting(true);
      setSubmitError("");
      if (onUpdate) {
        await onUpdate(truck.id, finalData);
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Error submitting truck update:", err);
      setSubmitError(err.message || "Failed to update vehicle. Please check inputs and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAdd = () => {
    const matchedDriver = availableDrivers.find(
      (d) => d.id === formData.assignedDriverId
    );

    const effectiveOdometer =
      formData.inputOdometer !== "" && formData.inputOdometer !== undefined
        ? Number(formData.inputOdometer)
        : Number(formData.currentOdometer) || 0;

    const isDeactivated = formData.status === "INACTIVE" || formData.status === "RETIRED";
    const finalDriverId = isDeactivated ? null : (formData.assignedDriverId || null);

    const finalDriverObj = isDeactivated || !finalDriverId
      ? null
      : matchedDriver
      ? {
          id: matchedDriver.id,
          firstName: matchedDriver.firstName || "",
          lastName: matchedDriver.lastName || "",
          phone: matchedDriver.phone || "",
          username: matchedDriver.username || "",
          role: matchedDriver.role || "Driver",
        }
      : null;

    const finalDriverName = isDeactivated || !finalDriverId
      ? "No Assigned"
      : finalDriverObj
      ? `${finalDriverObj.firstName || ""} ${finalDriverObj.lastName || ""}`.trim() || finalDriverObj.username
      : "No Assigned";

    const finalData = {
      plateNumber: formData.plateNumber.trim(),
      model: formData.model.trim(),
      yearModel: Number(formData.yearModel) || new Date().getFullYear(),
      currentOdometer: effectiveOdometer,
      lastPmOdometer: Number(formData.lastPmOdometer) || 0,
      status: formData.status || "ACTIVE",
      operationalStatus: formData.status || "ACTIVE",
      isAvailable: formData.status === "ACTIVE",
      driverId: finalDriverId,
      driver: finalDriverObj,
      driverName: finalDriverName,
      designatedRoute: formData.designatedRoute || "No Route Assigned",
      tankNumber: formData.tankNumber || "1234",
    };

    onAdd(finalData);
  };

  const handleCancel = () => {
    if (isAdding) {
      onClose();
    } else {
      // Reset form state cleanly to original truck props
      setFormData(getInitialFormData(truck));
      setErrors({});
      setSubmitError("");
      setIsEditing(false);
    }
  };

  const handleStartEditing = () => {
    setFormData(getInitialFormData(truck));
    setErrors({});
    setSubmitError("");
    setIsEditing(true);
  };

  const displayTruck = truck || {};

  // Resolved driver display for View mode (purely computed from truck prop)
  const viewDriverDisplay = displayTruck.driver
    ? `${displayTruck.driver.firstName || ""} ${displayTruck.driver.lastName || ""}`.trim() || displayTruck.driver.username
    : displayTruck.driverName && displayTruck.driverName !== "Unassigned"
    ? displayTruck.driverName
    : "No Assigned";

  // Resolved driver display for Add / Confirm screen (computed from form selection)
  const formDriverObj = [...availableDrivers, ...allDrivers].find(
    (d) => (d.id || d.value) === formData.assignedDriverId
  );
  const formDriverLabel = formData.assignedDriverId
    ? formDriverObj
      ? `${formDriverObj.firstName || ""} ${formDriverObj.lastName || ""}`.trim() || formDriverObj.username || formDriverObj.label
      : "No Assigned"
    : "No Assigned";

  // ==========================================
  // VIEW MODE MODAL (Screen: Truck View Info)
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
                {displayTruck.plateNumber || "Truck"}
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
              {canManage && (
                <button
                  type="button"
                  onClick={handleStartEditing}
                  className="p-1.5 text-[#0A4B6E] hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  title="Edit Fleet"
                >
                  <Pencil size={18} />
                </button>
              )}

              {/* Delete / Deactivate or Reactivate Icon Button */}
              {canManage &&
                (((displayTruck.status || "").toUpperCase() === "INACTIVE" ||
                  (displayTruck.status || "").toUpperCase() === "RETIRED") ? (
                  <button
                    type="button"
                    onClick={() =>
                      onReactivateClick && onReactivateClick(displayTruck)
                    }
                    className="p-1.5 text-[#0A4B6E] hover:text-green-600 hover:bg-green-50 rounded-lg transition cursor-pointer"
                    title="Reactivate Fleet"
                  >
                    <RotateCcw size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onDeleteClick && onDeleteClick(displayTruck)}
                    className="p-1.5 text-[#0A4B6E] hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Deactivate Fleet"
                  >
                    <Trash2 size={18} />
                  </button>
                ))}
            </div>
          </div>

          {/* Details Body: Purely rendered from displayTruck */}
          <div className="bg-[#E1F3FE] rounded-2xl p-5 space-y-2.5 text-sm text-left">
            <p className="text-[#588094]">
              Driver:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {viewDriverDisplay}
              </span>
            </p>

            <p className="text-[#588094]">
              Model & Year:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {displayTruck.model || "Isuzu Elf"}{" "}
                {displayTruck.yearModel ? `(${displayTruck.yearModel})` : ""}
              </span>
            </p>

            <p className="text-[#588094]">
              Current Odometer:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {displayTruck.currentOdometer !== undefined &&
                displayTruck.currentOdometer !== null
                  ? `${Number(displayTruck.currentOdometer).toLocaleString()} KM`
                  : "0 KM"}
              </span>
            </p>

            <p className="text-[#588094]">
              Last PM Odometer:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {displayTruck.lastPmOdometer !== undefined &&
                displayTruck.lastPmOdometer !== null
                  ? `${Number(displayTruck.lastPmOdometer).toLocaleString()} KM`
                  : `${Number(displayTruck.lastPMOdometer || 0).toLocaleString()} KM`}
              </span>
            </p>

            <p className="text-[#588094]">
              Operational Status:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {displayTruck.status?.replace("_", " ") || "ACTIVE"}
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
                {formData.model || "-"} ({formData.yearModel || "-"})
              </span>
            </p>
            <p className="text-[#588094]">
              Assigned Driver:{" "}
              <span className="font-bold text-[#0A4B6E]">
                {formDriverLabel}
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
                {formData.status?.replace("_", " ") || "ACTIVE"}
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
      {submitError && (
        <div className="w-full bg-red-50 text-red-700 p-3 rounded-xl text-xs font-medium border border-red-200 mb-3 text-left">
          {submitError}
        </div>
      )}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={handleFormSubmit}
        className="w-full bg-[#FFDF2C] hover:bg-[#F5D020] disabled:opacity-50 text-[#0A4B6E] font-bold text-sm py-3 rounded-full uppercase tracking-wider transition shadow-sm cursor-pointer mb-2"
      >
        {isSubmitting ? "SAVING..." : isAdding ? "ADD TRUCK" : "SAVE CHANGES"}
      </button>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={handleCancel}
        className="text-xs text-[#0A4B6E] font-semibold hover:underline cursor-pointer disabled:opacity-50"
      >
        CANCEL
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={handleCancel}
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
            placeholder="e.g. Isuzu Elf"
            error={errors.model}
          />
        </div>

        {/* ROW 2: Year Model & Assigned Driver */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Year Model"
            type="number"
            name="yearModel"
            value={formData.yearModel !== undefined ? formData.yearModel : ""}
            onChange={handleInputChange}
            placeholder="e.g. 2023"
            error={errors.yearModel}
          />
          <div className="flex flex-col">
            <Select
              label="Assigned Driver"
              name="assignedDriverId"
              value={formData.assignedDriverId || ""}
              onChange={handleInputChange}
              options={selectDriverOptions}
              error={errors.assignedDriverId}
            />
            {!isAdding && hasExistingDriver && (
              <span className="text-[11px] text-[#588094] italic mt-1">
                To assign a different driver, unassign the current driver first.
              </span>
            )}
          </div>
        </div>

        {/* ROW 3: Current Odometer & Input / New Odometer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Current Odometer"
            type="text"
            name="currentOdometer"
            value={
              formData.currentOdometer !== undefined &&
              formData.currentOdometer !== null
                ? `${Number(formData.currentOdometer).toLocaleString()} KM`
                : "0 KM"
            }
            disabled
            className="opacity-75 cursor-not-allowed"
          />
          <Input
            label={isAdding ? "Initial Odometer (KM)" : "Update Odometer (KM)"}
            type="number"
            name="inputOdometer"
            value={formData.inputOdometer || ""}
            onChange={handleInputChange}
            placeholder="Enter KM"
          />
        </div>

        {/* ROW 4: Last PM Odometer */}
        <div>
          <Input
            label="Last Preventive Maintenance (PM) Odometer (KM)"
            type="number"
            name="lastPmOdometer"
            value={formData.lastPmOdometer !== undefined ? formData.lastPmOdometer : ""}
            onChange={handleInputChange}
            placeholder="e.g. 40000"
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

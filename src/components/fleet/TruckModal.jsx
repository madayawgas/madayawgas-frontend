import { useState, useEffect } from "react";
import {
  Truck,
  Pencil,
  Trash2,
  RotateCcw,
  Gauge,
  History,
  SlidersHorizontal,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ClipboardList,
  Wrench,
} from "lucide-react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

const getStatusVariant = (status) => {
  const normalized = (status || "").toUpperCase().replace("_", " ");
  switch (normalized) {
    case "ACTIVE":
      return "success";
    case "UNDER MAINTENANCE":
      return "danger";
    case "INACTIVE":
      return "neutral";
    case "RETIRED":
      return "deactivated";
    default:
      return "neutral";
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
 * Interactive Status Pills selector for Edit / Add forms utilizing the unified Badge component
 */
const StatusPills = ({ currentStatus, onSelect }) => {
  const statuses = ["ACTIVE", "UNDER MAINTENANCE", "INACTIVE", "RETIRED"];

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => {
        const isSelected =
          (currentStatus || "").toUpperCase().replace("_", " ") === status;

        return (
          <label key={status} className="cursor-pointer relative flex items-center">
            <input
              type="radio"
              name="truckStatus"
              value={status.replace(" ", "_")}
              checked={isSelected}
              onChange={(e) => onSelect(e.target.value)}
              className="sr-only"
            />
            <Badge
              variant={getStatusVariant(status)}
              className={`px-4 py-1.5 transition-all duration-200 ease-in-out ${
                isSelected
                  ? "filter saturate-150 brightness-95 shadow-inner scale-[1.05] border-2 ring-1 ring-offset-1 ring-[#0A4B6E]/20"
                  : "opacity-60 grayscale-[40%] hover:opacity-100"
              }`}
            >
              {status}
            </Badge>
          </label>
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
  onOpenCheckIn,
  onOpenHistory,
  onOpenAvailability,
  onOpenInspect,
  onOpenIncident,
  onOpenInspectionHistory,
  onOpenIncidentHistory,
  onCreateWorkOrder,
}) {
  const [isEditing, setIsEditing] = useState(isAdding);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState(() => getInitialFormData(truck));

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

    if (name === "model") {
      // Added parentheses to the regex to allow valid inputs like "Isuzu Elf (2024)"
      parsedValue = value.replace(/[^a-zA-Z0-9\s\-./()]/g, "");
    }

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

  const handlePlateNumberChange = (e) => {
    const val = e.target.value.toUpperCase();
    const raw = val.replace(/[^A-Z0-9]/g, "");

    const letters = raw.slice(0, 3).replace(/[^A-Z]/g, "");
    const numbers = raw.slice(3, 6).replace(/[^0-9]/g, "");

    let formatted = letters;
    if (raw.length > 3 || (letters.length === 3 && val.length > 3)) {
      formatted = `${letters}-${numbers}`;
    }

    handleInputChange({
      target: {
        name: "plateNumber",
        value: formatted.slice(0, 7), // 3 letters + 1 hyphen + 3 numbers
      },
    });
  };

  const validate = () => {
    const newErrors = {};

    const plateRegex = /^[A-Z]{3}-\d{3}$/;
    if (!formData.plateNumber || !formData.plateNumber.toString().trim()) {
      newErrors.plateNumber = "Plate number is required";
    } else if (!plateRegex.test(formData.plateNumber)) {
      newErrors.plateNumber = "Plate number must be in ABC-123 format (3 letters, hyphen, 3 digits)";
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

    if (formData.inputOdometer !== "" && formData.inputOdometer !== undefined) {
      const newOdo = Number(formData.inputOdometer);
      const curOdo = Number(formData.currentOdometer) || 0;
      if (newOdo < curOdo) {
        newErrors.inputOdometer = `New odometer (${newOdo.toLocaleString()} km) cannot be less than current odometer (${curOdo.toLocaleString()} km)`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validate()) return;
    if (isAdding) {
      setStep(2);
    } else {
      await submitUpdate();
    }
  };

  const hasExistingDriver = !!(truck?.driverId || truck?.driver);
  const currentDriverId = truck?.driverId || truck?.driver?.id;
  const currentDriverName = truck?.driver
    ? `${truck.driver.firstName || ""} ${truck.driver.lastName || ""}`.trim() || truck.driver.username
    : truck?.driverName || "Current Driver";

  let selectDriverOptions = [];
  if (!isAdding && hasExistingDriver) {
    selectDriverOptions = [
      { value: currentDriverId, label: `${currentDriverName} (Currently Assigned)` },
      { value: "", label: "Unassign Driver" },
    ];
  } else {
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

  const viewDriverDisplay = displayTruck.driver
    ? `${displayTruck.driver.firstName || ""} ${displayTruck.driver.lastName || ""}`.trim() || displayTruck.driver.username
    : displayTruck.driverName && displayTruck.driverName !== "Unassigned"
    ? displayTruck.driverName
    : "No Assigned";

  const formDriverObj = [...availableDrivers, ...allDrivers].find(
    (d) => (d.id || d.value) === formData.assignedDriverId
  );
  const formDriverLabel = formData.assignedDriverId
    ? formDriverObj
      ? `${formDriverObj.firstName || ""} ${formDriverObj.lastName || ""}`.trim() || formDriverObj.username || formDriverObj.label
      : "No Assigned"
    : "No Assigned";

  // ==========================================
  // VIEW MODE MODAL
  // ==========================================
  if (!isEditing && !isAdding) {
    const currentOdo = Number(displayTruck.currentOdometer) || 0;
    const lastPmOdo = Number(
      displayTruck.lastPmOdometer !== undefined
        ? displayTruck.lastPmOdometer
        : displayTruck.lastPMOdometer || 0
    );
    const distanceSinceLastPm = Math.max(0, currentOdo - lastPmOdo);
    const isPmDue =
      displayTruck.isPmDue !== undefined
        ? Boolean(displayTruck.isPmDue)
        : distanceSinceLastPm >= 5000;
    const pmPercent = Math.min(100, Math.round((distanceSinceLastPm / 5000) * 100));

    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        maxWidth="max-w-md"
        footer={
          <Button
            type="button"
            variant="yellow"
            onClick={onClose}
            className="w-full font-bold text-sm uppercase tracking-wider"
          >
            CLOSE
          </Button>
        }
      >
        <div className="pt-2 pb-2">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2.5 text-[#0A4B6E]">
              <Truck size={26} className="stroke-[2.2]" />
              <h2 className="text-xl md:text-2xl font-bold">
                {displayTruck.plateNumber || "Truck"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(displayTruck.status)} className="px-3.5 py-1">
                {displayTruck.status?.replace("_", " ") || "ACTIVE"}
              </Badge>

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

          {/* GROUNDING WARNING BANNER (When Under Maintenance) */}
          {((displayTruck.status || "").toUpperCase() === "UNDER_MAINTENANCE" ||
            (displayTruck.operationalStatus || "").toUpperCase() === "UNDER_MAINTENANCE") && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-3 flex items-start justify-between gap-2.5 text-xs text-red-800">
              <div className="flex items-start gap-2.5">
                <AlertOctagon size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-left">
                  <p className="font-bold">⚠️ Vehicle Grounded — Under Maintenance</p>
                  <p className="text-[11.5px] text-red-700 leading-relaxed">
                    This vehicle is currently grounded from dispatch. Soft-bound driver ({viewDriverDisplay}) is retained.
                  </p>
                </div>
              </div>
              {onCreateWorkOrder && canManage && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateWorkOrder(displayTruck);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg shrink-0 transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Wrench size={13} />
                  <span>Work Order</span>
                </button>
              )}
            </div>
          )}

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

            {/* 5,000-KM PREVENTIVE MAINTENANCE HEALTH PROGRESS */}
            <div className="pt-2.5 border-t border-[#0A4B6E]/15 mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#588094]">5,000-KM PM Status:</span>
                <span className={`font-bold ${isPmDue ? "text-red-600" : "text-[#0A4B6E]"}`}>
                  {distanceSinceLastPm.toLocaleString()} / 5,000 KM ({pmPercent}%)
                </span>
              </div>
              <div className="w-full h-2 bg-[#BAE6FD] rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isPmDue
                      ? "bg-[#D93025]"
                      : distanceSinceLastPm >= 4000
                      ? "bg-[#F6C445]"
                      : "bg-[#0A4B6E]"
                  }`}
                  style={{ width: `${pmPercent}%` }}
                />
              </div>
              {isPmDue ? (
                <div className="bg-red-50 text-red-700 p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 mt-2 border border-red-200">
                  <span>⚠️ Preventive maintenance threshold reached. Servicing required!</span>
                </div>
              ) : (
                <span className="text-[11px] text-[#588094]">
                  {Math.max(0, 5000 - distanceSinceLastPm).toLocaleString()} KM remaining before next service
                </span>
              )}
            </div>

            {displayTruck.activeRepair && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-medium mt-3 border border-red-200">
                <span className="font-bold">Active Repair:</span>{" "}
                {displayTruck.activeRepair}
              </div>
            )}
          </div>

          {/* QUICK ACTION BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {/* Safety Inspection */}
            {onOpenInspect && canManage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInspect(displayTruck);
                }}
                className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-[#0A4B6E] border border-[#0A4B6E] rounded-xl py-2 px-3 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <ShieldCheck size={15} />
                <span>Safety Inspection</span>
              </button>
            )}

            {/* Report Incident */}
            {onOpenIncident && canManage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenIncident(displayTruck);
                }}
                className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-[#0A4B6E] border border-[#0A4B6E] rounded-xl py-2 px-3 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <AlertTriangle size={15} />
                <span>Report Incident</span>
              </button>
            )}

            {/* Inspection History */}
            {onOpenInspectionHistory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInspectionHistory(displayTruck);
                }}
                className="flex items-center justify-center gap-2 bg-[#F3F5F5] hover:bg-gray-200/80 text-[#0A4B6E] border border-gray-200 rounded-xl py-2 px-3 text-xs font-semibold transition cursor-pointer"
              >
                <ClipboardList size={14} />
                <span>Inspection History</span>
              </button>
            )}

            {/* Incident History */}
            {onOpenIncidentHistory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenIncidentHistory(displayTruck);
                }}
                className="flex items-center justify-center gap-2 bg-[#F3F5F5] hover:bg-gray-200/80 text-[#0A4B6E] border border-gray-200 rounded-xl py-2 px-3 text-xs font-semibold transition cursor-pointer"
              >
                <AlertOctagon size={14} />
                <span>Incident Logs</span>
              </button>
            )}

            {/* Record Odometer */}
            {onOpenCheckIn && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCheckIn(displayTruck);
                }}
                className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-[#0A4B6E] border border-[#0A4B6E] rounded-xl py-2 px-3 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Gauge size={15} />
                <span>Record Odometer</span>
              </button>
            )}

            {/* Mileage History */}
            {onOpenHistory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHistory(displayTruck);
                }}
                className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-[#0A4B6E] border border-[#0A4B6E] rounded-xl py-2 px-3 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <History size={15} />
                <span>Mileage History</span>
              </button>
            )}

            {/* Create Work Order */}
            {onCreateWorkOrder && canManage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCreateWorkOrder(displayTruck);
                }}
                className="col-span-1 sm:col-span-2 flex items-center justify-center gap-2 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0B4A6E] rounded-xl py-2 px-3 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Wrench size={14} />
                <span>Create Work Order</span>
              </button>
            )}

            {/* Set Operational Condition */}
            {onOpenAvailability && canManage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAvailability(displayTruck);
                }}
                className="col-span-1 sm:col-span-2 flex items-center justify-center gap-2 bg-[#EBF5FB] hover:bg-[#DDF4FF] text-[#0A4B6E] border border-[#BAE6FD] rounded-xl py-2 px-3 text-xs font-semibold transition cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                <span>Set Operational Condition</span>
              </button>
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
      <Modal
        isOpen={true}
        onClose={() => setStep(1)}
        title="Confirm Truck Information"
        maxWidth="max-w-lg"
      >
        <div className="py-2">
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
              <Badge variant={getStatusVariant(formData.status)}>
                {formData.status?.replace("_", " ") || "ACTIVE"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="yellow"
              onClick={handleConfirmAdd}
              className="w-full font-bold uppercase tracking-widest text-xs"
            >
              CONFIRM
            </Button>
            <Button
              type="button"
              variant="cancel"
              onClick={() => setStep(1)}
              className="w-full font-semibold text-xs"
            >
              CANCEL
            </Button>
          </div>
        </div>
      </Modal>
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
      <Button
        type="button"
        variant="yellow"
        disabled={isSubmitting}
        onClick={handleFormSubmit}
        className="w-full font-bold text-sm uppercase tracking-wider mb-2"
      >
        {isSubmitting ? "SAVING..." : isAdding ? "ADD TRUCK" : "SAVE CHANGES"}
      </Button>
      <Button
        type="button"
        variant="cancel"
        disabled={isSubmitting}
        onClick={handleCancel}
        className="text-xs"
      >
        CANCEL
      </Button>
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
            onChange={handlePlateNumberChange}
            placeholder="ABC-123"
            maxLength={7}
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
// src/components/fleet/TruckModal.jsx
import { useState, useEffect, useMemo } from "react";
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
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import {
  checkActiveWorkOrder,
  ACTIVE_RESTRICTED_TOOLTIP,
  ACTIVE_RESTRICTED_ERROR,
} from "../../utils/fleetGuards.js";

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
    ? `${t.driver.firstName || ""} ${t.driver.lastName || ""}`.trim() ||
      t.driver.username
    : t?.driverName || "";

  return {
    status: t?.status || t?.operationalStatus || "ACTIVE",
    plateNumber: t?.plateNumber || "",
    model: t?.model || "Isuzu Elf",
    yearModel:
      t?.yearModel !== undefined ? t.yearModel : new Date().getFullYear(),
    tankNumber: t?.tankNumber || "1234",
    designatedRoute: t?.designatedRoute || "Admin4",
    assignedDriverId: driverId,
    driverName: driverName,
    currentOdometer: t?.currentOdometer !== undefined ? t.currentOdometer : 0,
    inputOdometer: "",
    lastPmOdometer:
      t?.lastPmOdometer !== undefined
        ? t.lastPmOdometer
        : t?.lastPMOdometer || 0,
    activeRepair: t?.activeRepair || "",
  };
};

/**
 * Interactive Status Pills selector for Edit / Add forms utilizing the unified Badge component
 */
const StatusPills = ({ currentStatus, onSelect, hasActiveWorkOrder = false }) => {
  const statuses = ["ACTIVE", "UNDER MAINTENANCE", "INACTIVE", "RETIRED"];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => {
          const isSelected =
            (currentStatus || "").toUpperCase().replace("_", " ") === status;
          const isRestrictedActive = status === "ACTIVE" && hasActiveWorkOrder;

          return (
            <label
              key={status}
              title={isRestrictedActive ? ACTIVE_RESTRICTED_TOOLTIP : ""}
              className={`relative flex items-center ${
                isRestrictedActive ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name="truckStatus"
                value={status.replace(" ", "_")}
                checked={isSelected}
                disabled={isRestrictedActive}
                onChange={(e) => {
                  if (!isRestrictedActive) {
                    onSelect(e.target.value);
                  }
                }}
                className="sr-only"
              />
              <Badge
                variant={getStatusVariant(status)}
                className={`px-4 py-1.5 transition-all duration-200 ease-in-out ${
                  isRestrictedActive
                    ? "opacity-35 grayscale-[70%] cursor-not-allowed"
                    : isSelected
                    ? "filter saturate-150 brightness-95 shadow-inner scale-[1.05] border-2 ring-1 ring-offset-1 ring-[#0A4B6E]/20"
                    : "opacity-60 grayscale-[40%] hover:opacity-100 cursor-pointer"
                }`}
              >
                {status}
              </Badge>
            </label>
          );
        })}
      </div>
      {hasActiveWorkOrder && (
        <p className="text-[#CD3E3E] text-[11px] mt-1.5 flex items-center gap-1.5 font-medium">
          <AlertTriangle size={13} className="shrink-0 text-[#CD3E3E]" />
          <span>{ACTIVE_RESTRICTED_TOOLTIP}</span>
        </p>
      )}
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
  workOrders = [],
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
  onOpenWorkOrderDetail,
}) {
  const [isEditing, setIsEditing] = useState(isAdding);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState(() => getInitialFormData(truck));

  // Check active work order and guard status for this truck
  const { hasActiveWorkOrder, activeWorkOrder } = useMemo(() => {
    return checkActiveWorkOrder(truck, workOrders);
  }, [truck, workOrders]);

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
      parsedValue = value.replace(/[^a-zA-Z0-9\s\-./()]/g, "");
    }

    if (
      [
        "currentOdometer",
        "inputOdometer",
        "lastPmOdometer",
        "lastPMOdometer",
        "yearModel",
      ].includes(name)
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
        value: formatted.slice(0, 7),
      },
    });
  };

  const validate = () => {
    const newErrors = {};

    const plateRegex = /^[A-Z]{3}-\d{3}$/;
    if (!formData.plateNumber || !formData.plateNumber.toString().trim()) {
      newErrors.plateNumber = "Plate number is required";
    } else if (!plateRegex.test(formData.plateNumber)) {
      newErrors.plateNumber =
        "Plate number must be in ABC-123 format (3 letters, hyphen, 3 digits)";
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
      newErrors.yearModel = `Year model must be between 1900 and ${
        new Date().getFullYear() + 1
      }`;
    }

    if (formData.inputOdometer !== "" && formData.inputOdometer !== undefined) {
      const newOdo = Number(formData.inputOdometer);
      const curOdo = Number(formData.currentOdometer) || 0;
      if (isNaN(newOdo) || newOdo < 0) {
        newErrors.inputOdometer = "Odometer reading must be a valid non-negative number";
      } else if (newOdo > 999999) {
        newErrors.inputOdometer = "Odometer reading cannot exceed 999,999 km";
      } else if (newOdo < curOdo) {
        newErrors.inputOdometer = `New odometer (${newOdo.toLocaleString()} km) cannot be less than current odometer (${curOdo.toLocaleString()} km)`;
      }
    }

    if (formData.lastPmOdometer !== "" && formData.lastPmOdometer !== undefined) {
      const lastPm = Number(formData.lastPmOdometer);
      if (!isNaN(lastPm) && lastPm > 999999) {
        newErrors.lastPmOdometer = "Last PM odometer cannot exceed 999,999 km";
      }
    }

    if (
      formData.status === "ACTIVE" &&
      truck?.status !== "ACTIVE" &&
      hasActiveWorkOrder
    ) {
      newErrors.status = ACTIVE_RESTRICTED_TOOLTIP;
      setSubmitError(ACTIVE_RESTRICTED_ERROR);
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
    ? `${truck.driver.firstName || ""} ${truck.driver.lastName || ""}`.trim() ||
      truck.driver.username
    : truck?.driverName || "Current Driver";

  let selectDriverOptions = [];
  if (!isAdding && hasExistingDriver) {
    selectDriverOptions = [
      {
        value: currentDriverId,
        label: `${currentDriverName} (Currently Assigned)`,
      },
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
    if (
      formData.status === "ACTIVE" &&
      truck?.status !== "ACTIVE" &&
      hasActiveWorkOrder
    ) {
      setSubmitError(ACTIVE_RESTRICTED_ERROR);
      return;
    }

    const isDeactivated =
      formData.status === "INACTIVE" || formData.status === "RETIRED";
    const finalDriverId = isDeactivated
      ? null
      : formData.assignedDriverId || null;

    const matchedDriver = [...availableDrivers, ...allDrivers].find(
      (d) => d.id === finalDriverId || d.value === finalDriverId
    );

    const finalDriverObj =
      isDeactivated || !finalDriverId
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
        : truck?.driver &&
          (truck.driver.id === finalDriverId ||
            truck.driverId === finalDriverId)
        ? truck.driver
        : null;

    const finalDriverName =
      isDeactivated || !finalDriverId
        ? "No Assigned"
        : finalDriverObj
        ? `${finalDriverObj.firstName || ""} ${
            finalDriverObj.lastName || ""
          }`.trim() || finalDriverObj.username
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
      setSubmitError(
        err.message ||
          "Failed to update vehicle. Please check inputs and try again."
      );
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

    const isDeactivated =
      formData.status === "INACTIVE" || formData.status === "RETIRED";
    const finalDriverId = isDeactivated
      ? null
      : formData.assignedDriverId || null;

    const finalDriverObj =
      isDeactivated || !finalDriverId
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

    const finalDriverName =
      isDeactivated || !finalDriverId
        ? "No Assigned"
        : finalDriverObj
        ? `${finalDriverObj.firstName || ""} ${
            finalDriverObj.lastName || ""
          }`.trim() || finalDriverObj.username
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
    ? `${displayTruck.driver.firstName || ""} ${
        displayTruck.driver.lastName || ""
      }`.trim() || displayTruck.driver.username
    : displayTruck.driverName && displayTruck.driverName !== "Unassigned"
    ? displayTruck.driverName
    : "No Assigned";

  const formDriverObj = [...availableDrivers, ...allDrivers].find(
    (d) => (d.id || d.value) === formData.assignedDriverId
  );
  const formDriverLabel = formData.assignedDriverId
    ? formDriverObj
      ? `${formDriverObj.firstName || ""} ${
          formDriverObj.lastName || ""
        }`.trim() ||
        formDriverObj.username ||
        formDriverObj.label
      : "No Assigned"
    : "No Assigned";

  // ==========================================
  // VIEW MODE MODAL (2-COLUMN BALANCED LAYOUT)
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
    const pmPercent = Math.min(
      100,
      Math.round((distanceSinceLastPm / 5000) * 100)
    );

    const isDeactivated =
      (displayTruck.status || "").toUpperCase() === "INACTIVE" ||
      (displayTruck.status || "").toUpperCase() === "RETIRED";

    const latestInspection = displayTruck.latestInspection || null;
    const inspectionResult = (
      displayTruck.lastInspectionResult ||
      displayTruck.latestInspectionResult ||
      latestInspection?.result ||
      (displayTruck.hasPendingIssues ? "NEEDS_ATTENTION" : "") ||
      ""
    ).toUpperCase();
    const hasNeedsAttention = inspectionResult === "NEEDS_ATTENTION";
    const isDispatchRestricted =
      hasNeedsAttention &&
      (latestInspection?.allowDispatch === false || displayTruck.allowDispatch === false);

    const advisoryTooltip = isDispatchRestricted
      ? `Safety inspection flagged items requiring attention — Dispatch restricted${
          latestInspection?.findings ? `: "${latestInspection.findings}"` : ""
        }`
      : `Safety inspection flagged items requiring attention${
          latestInspection?.findings ? `: "${latestInspection.findings}"` : ""
        }`;

    const headerBadge = (
      <div className="flex items-center gap-2">
        <Badge
          variant={getStatusVariant(displayTruck.status)}
          className="px-3 py-0.5 text-xs"
        >
          {displayTruck.status?.replace("_", " ") || "ACTIVE"}
        </Badge>

        {hasNeedsAttention && (
          <Badge
            variant="warning"
            className="px-2.5 py-0.5 text-xs flex items-center gap-1 cursor-help"
            title={advisoryTooltip}
          >
            <AlertTriangle size={12} className="shrink-0 text-[#B06000]" />
            <span>
              {isDispatchRestricted ? "NEEDS ATTN (RESTRICTED)" : "NEEDS ATTENTION"}
            </span>
          </Badge>
        )}

        {canManage && (
          <button
            type="button"
            onClick={handleStartEditing}
            className="p-1.5 text-[#0A4B6E] hover:bg-[#E8F3F8] rounded-full transition cursor-pointer"
            title="Edit Vehicle"
          >
            <Pencil size={17} />
          </button>
        )}

        {canManage &&
          (isDeactivated ? (
            <button
              type="button"
              onClick={() =>
                onReactivateClick && onReactivateClick(displayTruck)
              }
              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-full transition cursor-pointer"
              title="Reactivate Vehicle"
            >
              <RotateCcw size={17} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onDeleteClick && onDeleteClick(displayTruck)}
              className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-full transition cursor-pointer"
              title="Deactivate Vehicle"
            >
              <Trash2 size={17} />
            </button>
          ))}
      </div>
    );

    return (
      <Modal
        key={`truck-view-${displayTruck.id || displayTruck.truckId || "view"}`}
        isOpen={true}
        onClose={onClose}
        title={displayTruck.plateNumber || "Vehicle Details"}
        subtitle={`${displayTruck.model || "Isuzu Elf"} ${
          displayTruck.yearModel ? `(${displayTruck.yearModel})` : ""
        }`}
        icon={Truck}
        badge={headerBadge}
        maxWidth="max-w-4xl"
        footer={
          <Button
            type="button"
            variant="yellow"
            onClick={onClose}
            className="w-full font-bold text-sm uppercase tracking-wider py-3.5 rounded-full"
          >
            CLOSE
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left py-1 text-xs">
          {/* ==================================================== */}
          {/* COLUMN 1: VEHICLE SPECIFICATIONS & PM HEALTH         */}
          {/* ==================================================== */}
          <div className="space-y-3.5">
            {/* Vehicle Specifications Card */}
            <div className="bg-[#E8F3F8] rounded-2xl p-4 md:p-5 border border-[#BCE1F1]/60 space-y-2.5 text-xs shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
                <Truck size={14} />
                <span>Vehicle Specifications</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-[#BCE1F1]/40">
                <span className="text-[#6D8AA2] font-semibold">Assigned Driver:</span>
                <span className="font-bold text-[#0A4B6E] truncate max-w-[180px]" title={viewDriverDisplay}>
                  {viewDriverDisplay}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-[#BCE1F1]/40">
                <span className="text-[#6D8AA2] font-semibold">Model & Year:</span>
                <span className="font-bold text-[#0A4B6E]">
                  {displayTruck.model || "Isuzu Elf"}{" "}
                  {displayTruck.yearModel ? `(${displayTruck.yearModel})` : ""}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-[#BCE1F1]/40">
                <span className="text-[#6D8AA2] font-semibold">Current Odometer:</span>
                <span className="font-mono font-bold text-[#0A4B6E]">
                  {Number(displayTruck.currentOdometer || 0).toLocaleString()} KM
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-[#BCE1F1]/40">
                <span className="text-[#6D8AA2] font-semibold">Last PM Odometer:</span>
                <span className="font-mono font-bold text-[#0A4B6E]">
                  {Number(
                    displayTruck.lastPmOdometer !== undefined
                      ? displayTruck.lastPmOdometer
                      : displayTruck.lastPMOdometer || 0
                  ).toLocaleString()}{" "}
                  KM
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-[#6D8AA2] font-semibold">Designated Route:</span>
                <span className="font-bold text-[#0A4B6E]">
                  {displayTruck.designatedRoute || "Admin4"}
                </span>
              </div>
            </div>

            {/* PM Health Card */}
            <div className="bg-[#E8F3F8] rounded-2xl p-4 md:p-5 border border-[#BCE1F1]/60 space-y-2.5 text-xs shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
                <Wrench size={14} />
                <span>PM Health (5,000-KM)</span>
              </div>

              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#6D8AA2] font-semibold">Interval Status:</span>
                <span
                  className={`font-bold ${
                    isPmDue ? "text-[#C93B32]" : "text-[#0A4B6E]"
                  }`}
                >
                  {distanceSinceLastPm.toLocaleString()} / 5,000 KM ({pmPercent}%)
                </span>
              </div>

              <div className="w-full h-2 bg-slate-100 border border-slate-200/60 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isPmDue
                      ? "bg-[#CD3E3E]"
                      : distanceSinceLastPm >= 4000
                      ? "bg-[#F6C445]"
                      : "bg-[#0A4B6E]"
                  }`}
                  style={{ width: `${pmPercent}%` }}
                />
              </div>

              {isPmDue ? (
                <div className="bg-rose-50 text-[#C93B32] p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-rose-200">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>PM threshold reached! Overhaul required.</span>
                </div>
              ) : (
                <p className="text-[11.5px] text-[#6D8AA2] leading-relaxed">
                  <strong className="text-[#0A4B6E]">
                    {Math.max(0, 5000 - distanceSinceLastPm).toLocaleString()} KM
                  </strong>{" "}
                  remaining before next PM service.
                </p>
              )}
            </div>

            {/* Single Unified Grounded / Active Repair Callout Banner */}
            {((displayTruck.status || "").toUpperCase() === "UNDER_MAINTENANCE" ||
              (displayTruck.operationalStatus || "").toUpperCase() ===
                "UNDER_MAINTENANCE" ||
              activeWorkOrder ||
              displayTruck.activeRepair) && (
              <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-rose-900 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertOctagon size={18} className="text-rose-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-rose-900 leading-tight">
                      Vehicle Grounded
                    </p>
                    <p className="text-[11px] text-rose-700 truncate">
                      {activeWorkOrder
                        ? `Under repair (${activeWorkOrder.status.replace("_", " ")})`
                        : displayTruck.activeRepair
                        ? `Active repair: ${displayTruck.activeRepair}`
                        : "Under maintenance. Driver retained."}
                    </p>
                  </div>
                </div>

                {canManage && (
                  activeWorkOrder && onOpenWorkOrderDetail ? (
                    <button
                      type="button"
                      onClick={() => onOpenWorkOrderDetail(activeWorkOrder)}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-full shrink-0 transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 uppercase tracking-wider"
                      title="View Current Work Order"
                    >
                      <Wrench size={12} />
                      <span>Work Order</span>
                    </button>
                  ) : onCreateWorkOrder ? (
                    <button
                      type="button"
                      onClick={() => onCreateWorkOrder(displayTruck)}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-full shrink-0 transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 uppercase tracking-wider"
                      title="Create Work Order"
                    >
                      <Wrench size={12} />
                      <span>Work Order</span>
                    </button>
                  ) : null
                )}
              </div>
            )}

            {/* Safety Inspection Advisory Banner for Active Trucks */}
            {hasNeedsAttention &&
              !activeWorkOrder &&
              !displayTruck.activeRepair &&
              (displayTruck.status || "").toUpperCase() === "ACTIVE" && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-amber-900 leading-tight">
                        Safety Inspection Advisory
                      </p>
                      <p className="text-[11px] text-amber-800 truncate" title={latestInspection?.findings}>
                        {latestInspection?.findings || "Safety inspection flagged items requiring attention."}
                      </p>
                    </div>
                  </div>
                  {onOpenInspectionHistory && (
                    <button
                      type="button"
                      onClick={() => onOpenInspectionHistory(displayTruck)}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-full shrink-0 transition cursor-pointer shadow-2xs active:scale-95 uppercase tracking-wider"
                    >
                      View Log
                    </button>
                  )}
                </div>
              )}
          </div>

          {/* ==================================================== */}
          {/* COLUMN 2: FLEET OPERATIONS & ACTIONS                 */}
          {/* ==================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <p className="text-xs font-bold text-[#0A4B6E] uppercase tracking-wider">
                Fleet Operations & Actions
              </p>
              <span className="text-[11px] text-[#6D8AA2] font-medium">
                Quick Triggers
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Category 1: Safety & Inspections */}
              <div className="bg-white hover:bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 transition-colors shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <span className="font-bold text-[#0A4B6E] text-xs truncate">Safety Inspection</span>
                </div>
                <div className="grid grid-cols-2 gap-2 w-[192px] shrink-0">
                  {onOpenInspect && canManage && (
                    <button
                      type="button"
                      onClick={() => onOpenInspect(displayTruck)}
                      className="w-full h-8 flex items-center justify-center bg-[#0A4B6E] hover:bg-[#083b57] text-white text-xs font-semibold rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer text-center"
                      title="Inspect Vehicle"
                    >
                      Inspect
                    </button>
                  )}
                  {onOpenInspectionHistory && (
                    <button
                      type="button"
                      onClick={() => onOpenInspectionHistory(displayTruck)}
                      className={`w-full h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-full transition-all active:scale-95 cursor-pointer text-center ${
                        !onOpenInspect || !canManage ? "col-span-2" : ""
                      }`}
                      title="Inspection History Logs"
                    >
                      History
                    </button>
                  )}
                </div>
              </div>

              {/* Category 2: Roadside Incidents */}
              <div className="bg-white hover:bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 transition-colors shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertTriangle size={16} />
                  </div>
                  <span className="font-bold text-[#0A4B6E] text-xs truncate">Roadside Incident</span>
                </div>
                <div className="grid grid-cols-2 gap-2 w-[192px] shrink-0">
                  {onOpenIncident && canManage && (
                    <button
                      type="button"
                      onClick={() => onOpenIncident(displayTruck)}
                      className="w-full h-8 flex items-center justify-center bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold rounded-full transition-all active:scale-95 cursor-pointer text-center"
                      title="Report Incident"
                    >
                      Report
                    </button>
                  )}
                  {onOpenIncidentHistory && (
                    <button
                      type="button"
                      onClick={() => onOpenIncidentHistory(displayTruck)}
                      className={`w-full h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-full transition-all active:scale-95 cursor-pointer text-center ${
                        !onOpenIncident || !canManage ? "col-span-2" : ""
                      }`}
                      title="Incident Logs"
                    >
                      Logs
                    </button>
                  )}
                </div>
              </div>

              {/* Category 3: Mileage & Odometer */}
              <div className="bg-white hover:bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 transition-colors shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center shrink-0">
                    <Gauge size={16} />
                  </div>
                  <span className="font-bold text-[#0A4B6E] text-xs truncate">Mileage & Odometer</span>
                </div>
                <div className="grid grid-cols-2 gap-2 w-[192px] shrink-0">
                  {onOpenCheckIn && (
                    <button
                      type="button"
                      onClick={() => onOpenCheckIn(displayTruck)}
                      className="w-full h-8 flex items-center justify-center bg-[#0A4B6E] hover:bg-[#083b57] text-white text-xs font-semibold rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer text-center"
                      title="Record Return Odometer"
                    >
                      Check-In
                    </button>
                  )}
                  {onOpenHistory && (
                    <button
                      type="button"
                      onClick={() => onOpenHistory(displayTruck)}
                      className={`w-full h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-full transition-all active:scale-95 cursor-pointer text-center ${
                        !onOpenCheckIn ? "col-span-2" : ""
                      }`}
                      title="Mileage History"
                    >
                      History
                    </button>
                  )}
                </div>
              </div>

              {/* Category 4: Maintenance & Operational Condition */}
              <div className="bg-white hover:bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 transition-colors shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center shrink-0">
                    <Wrench size={16} />
                  </div>
                  <span className="font-bold text-[#0A4B6E] text-xs truncate">Maintenance & Service</span>
                </div>
                <div className="grid grid-cols-2 gap-2 w-[192px] shrink-0">
                  {canManage && (
                    activeWorkOrder && onOpenWorkOrderDetail ? (
                      <button
                        type="button"
                        onClick={() => onOpenWorkOrderDetail(activeWorkOrder)}
                        className="w-full h-8 flex items-center justify-center bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] text-xs font-bold rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer text-center"
                        title={`View Active Work Order: ${activeWorkOrder.workOrderNumber || activeWorkOrder.id}`}
                      >
                        Work Order
                      </button>
                    ) : onCreateWorkOrder ? (
                      <button
                        type="button"
                        onClick={() => onCreateWorkOrder(displayTruck)}
                        className="w-full h-8 flex items-center justify-center bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] text-xs font-bold rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer text-center"
                        title="Create Work Order"
                      >
                        Work Order
                      </button>
                    ) : null
                  )}
                  {onOpenAvailability && canManage && (
                    <button
                      type="button"
                      onClick={() => onOpenAvailability(displayTruck)}
                      className={`w-full h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-full transition-all active:scale-95 cursor-pointer text-center ${
                        !onCreateWorkOrder || !canManage ? "col-span-2" : ""
                      }`}
                      title="Set Vehicle Availability"
                    >
                      Availability
                    </button>
                  )}
                </div>
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
        key="truck-confirm-modal"
        isOpen={true}
        onClose={handleCancel}
        title="Confirm Vehicle Details"
        subtitle="Verify fleet specifications before registering to directory"
        icon={ShieldCheck}
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1]">
            Step 2 of 2
          </span>
        }
        onBack={() => setStep(1)}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 py-1 text-left">
          <div className="bg-[#E8F3F8] rounded-2xl p-5 border border-[#BCE1F1]/60 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#BCE1F1]/60">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-12 h-12 rounded-full bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Truck size={24} className="text-[#FFDF2C]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-[#0A4B6E] truncate">
                    {formData.plateNumber || "-"}
                  </h3>
                  <p className="text-xs text-[#6D8AA2] font-medium">
                    {formData.model || "Isuzu Elf"}{" "}
                    {formData.yearModel ? `(${formData.yearModel})` : ""}
                  </p>
                </div>
              </div>

              <Badge variant={getStatusVariant(formData.status)}>
                {formData.status?.replace("_", " ") || "ACTIVE"}
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="bg-white/80 p-3 rounded-xl border border-[#BCE1F1]/40 flex items-center justify-between">
                <span className="text-[#6D8AA2] font-semibold">Assigned Driver:</span>
                <span className="font-bold text-[#0A4B6E] text-sm">
                  {formDriverLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-white/80 p-3 rounded-xl border border-[#BCE1F1]/40 space-y-1">
                  <span className="text-[#6D8AA2] font-semibold flex items-center gap-1">
                    <Gauge size={13} /> Initial Odometer
                  </span>
                  <p className="font-bold text-[#0A4B6E] text-sm font-mono">
                    {Number(
                      formData.inputOdometer || formData.currentOdometer || 0
                    ).toLocaleString()}{" "}
                    KM
                  </p>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-[#BCE1F1]/40 space-y-1">
                  <span className="text-[#6D8AA2] font-semibold flex items-center gap-1">
                    <Wrench size={13} /> Last PM Baseline
                  </span>
                  <p className="font-bold text-[#0A4B6E] text-sm font-mono">
                    {Number(formData.lastPmOdometer || 0).toLocaleString()} KM
                  </p>
                </div>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-[#BCE1F1]/40 flex items-center justify-between">
                <span className="text-[#6D8AA2] font-semibold">Operational Status</span>
                <Badge variant={getStatusVariant(formData.status)}>
                  {formData.status?.replace("_", " ") || "ACTIVE"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="yellow"
              onClick={handleConfirmAdd}
              className="w-full font-bold text-sm uppercase tracking-wider py-3.5 rounded-full flex items-center justify-center gap-2"
            >
              <ShieldCheck size={16} />
              <span>CONFIRM & REGISTER VEHICLE</span>
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // ==========================================
  // STEP 1: FORM VIEW (Edit or Add Flow)
  // ==========================================
  return (
    <Modal
      key={
        isAdding
          ? "truck-add-modal"
          : `truck-edit-${displayTruck.id || displayTruck.truckId || "edit"}`
      }
      isOpen={true}
      onClose={handleCancel}
      title={isAdding ? "Add New Vehicle" : "Edit Vehicle Details"}
      subtitle={
        isAdding
          ? "Register delivery vehicle, soft-bound driver & odometer"
          : "Update vehicle asset specifications and status"
      }
      icon={Truck}
      badge={
        isAdding ? (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1]">
            Step 1 of 2
          </span>
        ) : null
      }
      maxWidth="max-w-xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleFormSubmit();
        }}
        className="space-y-4 py-1 text-left"
      >
        {submitError && (
          <div className="w-full bg-red-50 text-red-700 p-3 rounded-xl text-xs font-medium border border-red-200">
            {submitError}
          </div>
        )}

        {/* CARD 1: Vehicle Identification */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A4B6E] uppercase tracking-wider">
            <Truck size={14} />
            <span>Vehicle Identification</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
                Plate Number <span className="text-[#CD3E3E]">*</span>
              </label>
              <input
                type="text"
                required
                name="plateNumber"
                placeholder="ABC-123"
                maxLength={7}
                value={formData.plateNumber || ""}
                onChange={handlePlateNumberChange}
                className={`w-full bg-white text-slate-800 font-mono font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border outline-none transition-all placeholder:text-slate-400 ${
                  errors.plateNumber
                    ? "border-[#CD3E3E] focus:ring-2 focus:ring-red-200"
                    : "border-slate-200 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10"
                }`}
              />
              {errors.plateNumber && (
                <p className="text-[#CD3E3E] text-[11px] mt-1 font-medium">
                  {errors.plateNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
                Truck Model <span className="text-[#CD3E3E]">*</span>
              </label>
              <input
                type="text"
                required
                name="model"
                placeholder="e.g. Isuzu Elf"
                value={formData.model || ""}
                onChange={handleInputChange}
                className={`w-full bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border outline-none transition-all placeholder:text-slate-400 ${
                  errors.model
                    ? "border-[#CD3E3E] focus:ring-2 focus:ring-red-200"
                    : "border-slate-200 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10"
                }`}
              />
              {errors.model && (
                <p className="text-[#CD3E3E] text-[11px] mt-1 font-medium">
                  {errors.model}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
                Year Model <span className="text-[#CD3E3E]">*</span>
              </label>
              <input
                type="number"
                required
                name="yearModel"
                placeholder="e.g. 2023"
                value={
                  formData.yearModel !== undefined ? formData.yearModel : ""
                }
                onChange={handleInputChange}
                className={`w-full bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border outline-none transition-all placeholder:text-slate-400 ${
                  errors.yearModel
                    ? "border-[#CD3E3E] focus:ring-2 focus:ring-red-200"
                    : "border-slate-200 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10"
                }`}
              />
              {errors.yearModel && (
                <p className="text-[#CD3E3E] text-[11px] mt-1 font-medium">
                  {errors.yearModel}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
                Assigned Driver
              </label>
              <select
                name="assignedDriverId"
                value={formData.assignedDriverId || ""}
                onChange={handleInputChange}
                className="w-full bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10 transition-all cursor-pointer"
              >
                {selectDriverOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {!isAdding && hasExistingDriver && (
                <span className="text-[11px] text-[#6D8AA2] italic mt-1 block">
                  To assign a different driver, unassign current driver first.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: Odometer & PM Baseline */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A4B6E] uppercase tracking-wider">
            <Gauge size={14} />
            <span>Odometer & Maintenance Baseline</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!isAdding && (
              <div>
                <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
                  Current Odometer (KM)
                </label>
                <input
                  type="text"
                  disabled
                  value={
                    formData.currentOdometer !== undefined &&
                    formData.currentOdometer !== null
                      ? `${Number(
                          formData.currentOdometer
                        ).toLocaleString()} KM`
                      : "0 KM"
                  }
                  className="w-full bg-slate-100 text-slate-500 font-mono text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 cursor-not-allowed"
                />
              </div>
            )}

            <div className={isAdding ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
                {isAdding
                  ? "Initial Odometer Reading (KM)"
                  : "Update Odometer Reading (KM)"}
              </label>
              <input
                type="number"
                min="0"
                max="999999"
                name="inputOdometer"
                placeholder="Enter KM reading (max 999,999)"
                value={formData.inputOdometer || ""}
                onChange={handleInputChange}
                className={`w-full bg-white text-slate-800 font-mono text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border outline-none transition-all placeholder:text-slate-400 ${
                  errors.inputOdometer
                    ? "border-[#CD3E3E] focus:ring-2 focus:ring-red-200"
                    : "border-slate-200 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10"
                }`}
              />
              {errors.inputOdometer && (
                <p className="text-[#CD3E3E] text-[11px] mt-1 font-medium">
                  {errors.inputOdometer}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
                Last PM Odometer Baseline (KM)
              </label>
              <input
                type="number"
                min="0"
                max="999999"
                name="lastPmOdometer"
                placeholder="e.g. 40000 (max 999,999)"
                value={
                  formData.lastPmOdometer !== undefined
                    ? formData.lastPmOdometer
                    : ""
                }
                onChange={handleInputChange}
                className={`w-full bg-white text-slate-800 font-mono text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border outline-none transition-all placeholder:text-slate-400 ${
                  errors.lastPmOdometer
                    ? "border-[#CD3E3E] focus:ring-2 focus:ring-red-200"
                    : "border-slate-200 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10"
                }`}
              />
              {errors.lastPmOdometer && (
                <p className="text-[#CD3E3E] text-[11px] mt-1 font-medium">
                  {errors.lastPmOdometer}
                </p>
              )}
            </div>
          </div>

          {/* Status Pills */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1.5">
              Operational Status
            </label>
            <StatusPills
              currentStatus={formData.status}
              hasActiveWorkOrder={hasActiveWorkOrder}
              onSelect={(status) =>
                setFormData((prev) => ({ ...prev, status }))
              }
            />
          </div>
        </div>


        {/* FOOTER ACTIONS */}
        <div className="pt-2 flex flex-col gap-2">
          <Button
            type="submit"
            variant="yellow"
            disabled={
              isSubmitting ||
              (formData.status === "ACTIVE" &&
                truck?.status !== "ACTIVE" &&
                hasActiveWorkOrder)
            }
            className="w-full font-bold text-sm uppercase tracking-wider py-3.5 rounded-full"
          >
            {isSubmitting
              ? "SAVING VEHICLE..."
              : isAdding
              ? "CONTINUE TO CONFIRMATION"
              : "SAVE CHANGES"}
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
      </form>
    </Modal>
  );
}
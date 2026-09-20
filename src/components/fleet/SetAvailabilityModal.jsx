// src/components/fleet/SetAvailabilityModal.jsx
import { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  Truck,
  CheckCircle2,
  Wrench,
  PowerOff,
  Info,
} from "lucide-react";
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

export default function SetAvailabilityModal({
  isOpen,
  truck,
  onClose,
  onSubmit,
}) {
  const [status, setStatus] = useState("UNDER_MAINTENANCE");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (truck) {
      if (truck.status === "ACTIVE") {
        setStatus("UNDER_MAINTENANCE");
      } else {
        setStatus("ACTIVE");
      }
      setReason("");
      setErrorMsg("");
    }
  }, [truck]);

  if (!isOpen || !truck) return null;

  const currentStatus = truck.status || "ACTIVE";
  const driverDisplay = truck.driver
    ? `${truck.driver.firstName || ""} ${truck.driver.lastName || ""}`.trim() ||
      truck.driver.username
    : truck.driverName && truck.driverName !== "Unassigned"
    ? truck.driverName
    : "No Assigned";

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg("");
      await onSubmit({
        status,
        reason: reason.trim(),
      });
      onClose();
    } catch (err) {
      console.error("Failed to update availability status:", err);
      setErrorMsg(
        err.message || "Failed to update availability status. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerContent = (
    <div className="w-full flex flex-col items-center">
      {errorMsg && (
        <div className="w-full bg-red-50 text-red-700 p-3 rounded-xl text-xs font-medium border border-red-200 mb-3 text-left">
          {errorMsg}
        </div>
      )}
      <Button
        type="button"
        variant="yellow"
        disabled={isSubmitting || status === currentStatus}
        onClick={handleSubmit}
        className="w-full font-bold text-sm uppercase tracking-wider mb-2"
      >
        {isSubmitting ? "UPDATING..." : "UPDATE AVAILABILITY"}
      </Button>
      <Button
        type="button"
        variant="cancel"
        disabled={isSubmitting}
        onClick={onClose}
        className="text-xs"
      >
        CANCEL
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Vehicle Availability"
      subtitle="Update operational dispatch condition & driver binding"
      icon={SlidersHorizontal}
      badge={
        <Badge
          variant={getStatusVariant(currentStatus)}
          className="px-2.5 py-0.5 text-xs"
        >
          {currentStatus.replace("_", " ")}
        </Badge>
      }
      maxWidth="max-w-lg"
      footer={footerContent}
    >
      <div className="space-y-4 text-left py-1 text-xs">
        {/* VEHICLE CONTEXT BANNER */}
        <div className="bg-[#E8F3F8] rounded-xl p-3.5 flex items-center justify-between border border-[#BCE1F1]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A4B6E] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Truck size={20} className="text-[#FFDF2C]" />
            </div>
            <div>
              <h3 className="font-bold text-[#0A4B6E] text-base leading-tight">
                {truck.plateNumber || "Truck"}
              </h3>
              <p className="text-xs text-[#588094]">
                {truck.model || "Isuzu Elf"}{" "}
                {truck.yearModel ? `(${truck.yearModel})` : ""}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[#588094] block font-medium">
              Assigned Driver
            </span>
            <span className="font-bold text-xs text-[#0A4B6E]">
              {driverDisplay}
            </span>
          </div>
        </div>

        {/* CURRENT REGISTERED METRICS */}
        <div className="grid grid-cols-2 gap-3 bg-[#E8F3F8] border border-[#BCE1F1]/60 rounded-2xl p-3.5 text-xs shadow-2xs">
          <div>
            <span className="text-[#6D8AA2] block text-[11px] font-semibold">Current Status</span>
            <span className="font-bold text-sm text-[#0A4B6E]">
              {currentStatus.replace("_", " ")}
            </span>
          </div>
          <div>
            <span className="text-[#6D8AA2] block text-[11px] font-semibold">Current Odometer</span>
            <span className="font-bold text-sm text-[#0A4B6E] font-mono">
              {Number(truck.currentOdometer || 0).toLocaleString()} KM
            </span>
          </div>
        </div>

        {/* TARGET CONDITION SELECTOR (Pill Buttons matching InspectionModal) */}
        <div>
          <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-2">
            Target Operational Condition <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-3 gap-2.5">
            {/* ACTIVE */}
            <button
              type="button"
              onClick={() => setStatus("ACTIVE")}
              className={`w-full h-9 flex items-center justify-center gap-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                status === "ACTIVE"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-white text-emerald-800 border-[#BCE1F1]/80 hover:bg-emerald-50"
              }`}
            >
              <CheckCircle2 size={15} className="shrink-0" />
              <span>ACTIVE</span>
            </button>

            {/* UNDER MAINTENANCE */}
            <button
              type="button"
              onClick={() => setStatus("UNDER_MAINTENANCE")}
              className={`w-full h-9 flex items-center justify-center gap-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                status === "UNDER_MAINTENANCE"
                  ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                  : "bg-white text-amber-800 border-[#BCE1F1]/80 hover:bg-amber-50"
              }`}
            >
              <Wrench size={15} className="shrink-0" />
              <span>MAINTENANCE</span>
            </button>

            {/* INACTIVE */}
            <button
              type="button"
              onClick={() => setStatus("INACTIVE")}
              className={`w-full h-9 flex items-center justify-center gap-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                status === "INACTIVE"
                  ? "bg-slate-700 text-white border-slate-700 shadow-xs"
                  : "bg-white text-slate-700 border-[#BCE1F1]/80 hover:bg-slate-100"
              }`}
            >
              <PowerOff size={15} className="shrink-0" />
              <span>INACTIVE</span>
            </button>
          </div>
        </div>

        {/* CONDITION IMPACT & SOFT-BINDING HELPER CARD */}
        <div className="bg-[#E8F3F8] border border-[#BCE1F1]/60 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-[#0A4B6E]">
          <Info size={16} className="shrink-0 mt-0.5 text-[#0F7AB2]" />
          <div className="leading-relaxed">
            {status === "ACTIVE" ? (
              <span>
                <strong>Operational Restoration:</strong> Vehicle will be marked{" "}
                <strong>ACTIVE</strong> and cleared for daily route dispatch.
              </span>
            ) : status === "UNDER_MAINTENANCE" ? (
              <span>
                <strong>Maintenance Soft-Binding:</strong> Grounds vehicle for repair while{" "}
                <strong>preserving driver ({driverDisplay})</strong> for when maintenance concludes.
              </span>
            ) : (
              <span>
                <strong>Deactivation Release:</strong> Setting vehicle to <strong>INACTIVE</strong> will unbind driver{" "}
                <strong>({driverDisplay})</strong> back to the unassigned driver pool.
              </span>
            )}
          </div>
        </div>

        {/* REASON / REMARKS */}
        <div>
          <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1.5">
            Reason / Remarks (Optional)
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Scheduled oil change, brake caliper check, yard inspection"
            className="w-full bg-[#E8F3F8]/50 border border-[#BCE1F1]/80 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0A4B6E] focus:bg-white transition resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}

// src/components/fleet/SetAvailabilityModal.jsx
import { useState, useEffect } from "react";
import { AlertCircle, Truck, Info } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

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
      // Default to UNDER_MAINTENANCE if currently ACTIVE, otherwise ACTIVE
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
    ? `${truck.driver.firstName || ""} ${truck.driver.lastName || ""}`.trim() || truck.driver.username
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
      setErrorMsg(err.message || "Failed to update availability status. Please try again.");
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
      title="Set Vehicle Availability Status"
      maxWidth="max-w-md"
      footer={footerContent}
    >
      <div className="py-2 text-left space-y-4 text-xs">
        {/* VEHICLE INFO */}
        <div className="bg-[#BAE6FD]/40 rounded-xl p-3.5 flex items-center justify-between border border-[#0A4B6E]/15">
          <div className="flex items-center gap-2.5">
            <Truck size={20} className="text-[#0A4B6E]" />
            <div>
              <span className="font-bold text-[#0A4B6E] text-sm block">
                {truck.plateNumber || "Truck"}
              </span>
              <span className="text-[11px] text-[#588094]">
                {truck.model || "Isuzu Elf"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#588094] block">Current Status</span>
            <Badge variant={currentStatus === "ACTIVE" ? "success" : "danger"}>
              {currentStatus.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* STATUS SELECTION */}
        <div>
          <label className="block text-xs font-semibold text-[#0A4B6E] mb-2">
            Target Operational Condition
          </label>
          <div className="space-y-2">
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                status === "ACTIVE"
                  ? "bg-[#E8F5E9]/50 border-green-500 ring-1 ring-green-500"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="availabilityStatus"
                value="ACTIVE"
                checked={status === "ACTIVE"}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-0.5 text-[#0A4B6E]"
              />
              <div>
                <span className="font-bold text-gray-800 block">ACTIVE (Available)</span>
                <span className="text-[11px] text-gray-500">
                  Ready for route dispatch.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                status === "UNDER_MAINTENANCE"
                  ? "bg-red-50/50 border-red-500 ring-1 ring-red-500"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="availabilityStatus"
                value="UNDER_MAINTENANCE"
                checked={status === "UNDER_MAINTENANCE"}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-0.5 text-[#0A4B6E]"
              />
              <div>
                <span className="font-bold text-gray-800 block">UNDER MAINTENANCE</span>
                <span className="text-[11px] text-gray-500">
                  Grounds truck for servicing while <strong>preserving assigned driver</strong>.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                status === "INACTIVE"
                  ? "bg-gray-100 border-gray-400 ring-1 ring-gray-400"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="availabilityStatus"
                value="INACTIVE"
                checked={status === "INACTIVE"}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-0.5 text-[#0A4B6E]"
              />
              <div>
                <span className="font-bold text-gray-800 block">INACTIVE (Standby / Shop)</span>
                <span className="text-[11px] text-gray-500">
                  Decommissions truck and <strong>releases driver</strong> to unassigned pool.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* DOMAIN INVARIANT HELPER BANNER */}
        <div className="bg-[#EBF5FB] border border-[#BAE6FD] rounded-xl p-3 flex items-start gap-2.5 text-[11.5px] text-[#0A4B6E]">
          <Info size={16} className="shrink-0 mt-0.5 text-[#0F7AB2]" />
          <div>
            {status === "UNDER_MAINTENANCE" ? (
              <span>
                <strong>Maintenance Preservation:</strong> Driver <strong>{driverDisplay}</strong> will remain designated to this vehicle when maintenance concludes.
              </span>
            ) : status === "INACTIVE" ? (
              <span>
                <strong>Deactivation Release:</strong> Setting this vehicle inactive will automatically unbind driver <strong>{driverDisplay}</strong> back to the available driver pool.
              </span>
            ) : (
              <span>
                <strong>Operational Restoration:</strong> Vehicle will be marked available for logistics dispatch.
              </span>
            )}
          </div>
        </div>

        {/* REASON / REMARKS */}
        <div>
          <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
            Reason / Remarks (Optional)
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Scheduled oil change, brake caliper check, yard inspection"
            className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}

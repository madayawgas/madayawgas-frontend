// src/components/fleet/InspectionModal.jsx
import { useState } from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2 } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

/**
 * InspectionModal
 * Findings-Only vehicle safety inspection modal matching the exact design and feel
 * of Vehicle Return Odometer Check-In (OdometerCheckInModal).
 */
export default function InspectionModal({
  isOpen,
  truck,
  onClose,
  onSubmit,
}) {
  const [result, setResult] = useState("PASSED");
  const [findings, setFindings] = useState("");
  const [allowDispatch, setAllowDispatch] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !truck) return null;

  const driverDisplay = truck.driver
    ? `${truck.driver.firstName || ""} ${truck.driver.lastName || ""}`.trim() || truck.driver.username
    : truck.driverName && truck.driverName !== "Unassigned"
    ? truck.driverName
    : "No Assigned";

  const isFailed = result === "FAILED";
  const isNeedsAttentionGrounded = result === "NEEDS_ATTENTION" && !allowDispatch;
  const willGroundTruck = isFailed || isNeedsAttentionGrounded;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!findings.trim()) {
      setErrorMsg("Inspection findings and observations are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");

      const payload = {
        truckId: truck.id,
        result,
        findings: findings.trim(),
        allowDispatch: result === "FAILED" ? false : allowDispatch,
        issueDetected: result !== "PASSED",
        inspectionDate: new Date().toISOString(),
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error("Failed to record inspection:", err);
      setErrorMsg(err?.message || "Failed to submit inspection record. Please try again.");
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
        disabled={isSubmitting || !findings.trim()}
        onClick={handleSubmit}
        className="w-full font-bold text-sm uppercase tracking-wider mb-2"
      >
        {isSubmitting ? "RECORDING..." : "CONFIRM INSPECTION"}
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
      title="Daily Safety Inspection"
      maxWidth="max-w-lg"
      footer={footerContent}
    >
      <div className="space-y-4 text-left py-2">
        {/* VEHICLE CONTEXT BANNER */}
        <div className="bg-[#BAE6FD]/40 rounded-xl p-3.5 flex items-center justify-between border border-[#0A4B6E]/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A4B6E] text-white flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#0A4B6E] text-base leading-tight">
                {truck.plateNumber || "Truck"}
              </h3>
              <p className="text-xs text-[#588094]">
                {truck.model || "Isuzu Elf"} {truck.yearModel ? `(${truck.yearModel})` : ""}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[#588094] block">Assigned Driver</span>
            <span className="font-semibold text-xs text-[#0A4B6E]">{driverDisplay}</span>
          </div>
        </div>

        {/* CURRENT REGISTERED METRICS */}
        <div className="grid grid-cols-2 gap-3 bg-[#F3F5F5] rounded-xl p-3.5 text-xs">
          <div>
            <span className="text-[#588094] block text-[11px]">Operational Status</span>
            <span className="font-bold text-sm text-[#0A4B6E]">
              {(truck.status || truck.operationalStatus || "ACTIVE").replace("_", " ")}
            </span>
          </div>
          <div>
            <span className="text-[#588094] block text-[11px]">Current Odometer</span>
            <span className="font-bold text-sm text-[#0A4B6E]">
              {Number(truck.currentOdometer || 0).toLocaleString()} KM
            </span>
          </div>
        </div>

        {/* OUTCOME / RESULT SELECTOR PILLS */}
        <div>
          <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
            Inspection Result <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {/* PASSED */}
            <button
              type="button"
              onClick={() => {
                setResult("PASSED");
                setAllowDispatch(true);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                result === "PASSED"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-[#F3F5F5] text-emerald-800 border-gray-200 hover:bg-emerald-50"
              }`}
            >
              <CheckCircle2 size={16} />
              <span>PASSED</span>
            </button>

            {/* NEEDS ATTENTION */}
            <button
              type="button"
              onClick={() => setResult("NEEDS_ATTENTION")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                result === "NEEDS_ATTENTION"
                  ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                  : "bg-[#F3F5F5] text-amber-800 border-gray-200 hover:bg-amber-50"
              }`}
            >
              <AlertTriangle size={16} />
              <span>NEEDS ATTN</span>
            </button>

            {/* FAILED */}
            <button
              type="button"
              onClick={() => {
                setResult("FAILED");
                setAllowDispatch(false);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                result === "FAILED"
                  ? "bg-[#D93025] text-white border-[#D93025] shadow-xs"
                  : "bg-[#F3F5F5] text-rose-800 border-gray-200 hover:bg-rose-50"
              }`}
            >
              <AlertOctagon size={16} />
              <span>FAILED</span>
            </button>
          </div>
        </div>

        {/* DISPATCH DECISION TOGGLE (SHOWN ONLY ON NEEDS_ATTENTION) */}
        {result === "NEEDS_ATTENTION" && (
          <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-xl p-3.5 space-y-1 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={allowDispatch}
                onChange={(e) => setAllowDispatch(e.target.checked)}
                className="w-4 h-4 rounded text-[#0A4B6E] focus:ring-[#0A4B6E] border-gray-300 cursor-pointer"
              />
              <span>Allow vehicle to dispatch?</span>
            </label>
            <p className="text-[11px] text-amber-800 pl-6.5">
              {allowDispatch
                ? "Cleared for route dispatch with advisory notes. Vehicle remains ACTIVE."
                : "NOT cleared for dispatch. Submitting will ground the vehicle to UNDER_MAINTENANCE."}
            </p>
          </div>
        )}

        {/* GROUNDING WARNING ALERT */}
        {willGroundTruck && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-xs flex items-start gap-2.5">
            <AlertOctagon size={18} className="shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold">Vehicle Grounding Action</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-red-700">
                This vehicle will be automatically moved to <strong>UNDER_MAINTENANCE</strong>. Assigned driver ({driverDisplay}) will be retained.
              </p>
            </div>
          </div>
        )}

        {/* FINDINGS / OBSERVATIONS TEXT AREA */}
        <div>
          <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
            Inspection Findings & Observations <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={findings}
            onChange={(e) => {
              setFindings(e.target.value);
              setErrorMsg("");
            }}
            placeholder="Document physical observations, brake performance, fluid leaks, tire conditions, lights..."
            className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] resize-none"
          />
          <span className="text-[11px] text-[#588094] mt-1 block">
            Logged upon plant safety inspection by Fleet Supervisor.
          </span>
        </div>
      </div>
    </Modal>
  );
}

// src/components/fleet/InspectionModal.jsx
import { useState } from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, Truck, User } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

/**
 * InspectionModal
 * Findings-Only vehicle safety inspection modal without checklist schemas.
 * In accordance with docs/api-contracts/fleet/maintenance.api.md:
 * - Collects: result ('PASSED' | 'NEEDS_ATTENTION' | 'FAILED'), findings (text), and allowDispatch (boolean)
 * - FAILED or NEEDS_ATTENTION with allowDispatch:false grounds the truck to UNDER_MAINTENANCE
 * - Retains 1:1 driver soft-binding during maintenance grounding
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
  const [error, setError] = useState("");
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
    e?.preventDefault();
    if (!findings.trim()) {
      setError("Inspection findings and observations are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

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
      setError(err?.message || "Failed to submit inspection record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Safety Inspection"
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="neutral"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs uppercase tracking-wider font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="yellow"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="text-xs uppercase tracking-wider font-bold px-6 shadow-xs"
          >
            {isSubmitting ? "Recording..." : "Submit Inspection"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-left pt-1">
        {/* VEHICLE INFO STRIP */}
        <div className="bg-[#DDF4FF] border border-[#BAE6FD] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#0A4B6E]">
            <Truck size={18} className="stroke-[2.2]" />
            <span className="font-bold text-sm tracking-wide">
              {truck.plateNumber || "Truck"}
            </span>
            <span className="text-[#5B8399]">
              ({truck.model || "Isuzu Elf"})
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[#5B8399]">
            <User size={14} />
            <span>Driver:</span>
            <span className="font-semibold text-[#0A4B6E]">
              {driverDisplay}
            </span>
          </div>
        </div>

        {/* OUTCOME / RESULT SELECTOR PILLS */}
        <div>
          <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-2">
            Inspection Result <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* PASSED */}
            <button
              type="button"
              onClick={() => {
                setResult("PASSED");
                setAllowDispatch(true);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                result === "PASSED"
                  ? "bg-green-500 text-white border-green-600 shadow-xs scale-[1.02]"
                  : "bg-white text-green-700 border-green-200 hover:bg-green-50"
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
                  ? "bg-[#F6C445] text-[#854D0E] border-[#E0AC2B] shadow-xs scale-[1.02]"
                  : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
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
                  ? "bg-[#D93025] text-white border-red-700 shadow-xs scale-[1.02]"
                  : "bg-white text-red-700 border-red-200 hover:bg-red-50"
              }`}
            >
              <AlertOctagon size={16} />
              <span>FAILED</span>
            </button>
          </div>
        </div>

        {/* DISPATCH DECISION TOGGLE (SHOWN ONLY ON NEEDS_ATTENTION) */}
        {result === "NEEDS_ATTENTION" && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1.5 transition-all">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowDispatch}
                onChange={(e) => setAllowDispatch(e.target.checked)}
                className="w-4 h-4 rounded text-[#0A4B6E] focus:ring-[#0A4B6E] border-gray-300 cursor-pointer"
              />
              <span className="text-xs font-bold text-amber-900">
                Allow vehicle to dispatch?
              </span>
            </label>
            <p className="text-[11.5px] text-amber-800 leading-relaxed pl-6.5">
              {allowDispatch
                ? "The vehicle is cleared for operations with advisory notes. Status remains ACTIVE."
                : "The vehicle is NOT cleared for dispatch. Submitting will immediately ground the truck to UNDER_MAINTENANCE."}
            </p>
          </div>
        )}

        {/* GROUNDING WARNING ALERT */}
        {willGroundTruck && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-red-800 text-xs">
            <AlertOctagon size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">
                Vehicle Grounding Action
              </p>
              <p className="text-[11.5px] text-red-700 leading-relaxed">
                This vehicle will be immediately moved to <strong className="font-bold">UNDER_MAINTENANCE</strong> and restricted from new route assignments. The assigned driver ({driverDisplay}) will be retained.
              </p>
            </div>
          </div>
        )}

        {/* FINDINGS / OBSERVATIONS TEXT AREA */}
        <div>
          <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1.5">
            Inspection Findings & Observations <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={findings}
            onChange={(e) => {
              setFindings(e.target.value);
              if (error) setError("");
            }}
            placeholder="Document physical observations, brake performance, fluid leaks, tire conditions, lights, and any required actions..."
            className="w-full text-xs sm:text-sm bg-[#F3F5F5] border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] focus:border-transparent transition-all placeholder:text-gray-400 resize-none"
          />
          <p className="text-[11px] text-[#5B8399] mt-1">
            Inspections are findings-only records for operational auditing without checklists.
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

// src/components/fleet/work-orders/CostApprovalModal.jsx
import { useState } from "react";
import { DollarSign, CheckCircle2, XCircle, AlertTriangle, Building2, Truck, FileText, UserCheck } from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../../utils/permissions.js";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";

/**
 * CostApprovalModal
 * Managerial review dialog for high-cost repairs exceeding ₱5,000.00 threshold.
 * Restricts authorization decisions to Super Admin / Admin roles.
 */
export default function CostApprovalModal({
  isOpen,
  workOrder,
  onClose,
  onDecide,
}) {
  const { currentUser, can } = useAuth();
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !workOrder) return null;

  // Executive managerial permission check (Super Admin, Admin, or users.manage)
  const canApprove =
    currentUser?.role === "Super Admin" ||
    currentUser?.role === "Admin" ||
    (can && can(PERMISSIONS?.USERS_MANAGE || "users.manage"));

  const estimatedCost = Number(workOrder.estimatedCost) || 0;

  const handleDecision = async (isApproved) => {
    if (!canApprove) {
      setError("You do not have executive authorization privileges to decide cost approvals.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onDecide(workOrder.id, {
        isApproved,
        remarks: remarks.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error("Failed to submit approval decision:", err);
      setError(err?.message || "Failed to record approval decision. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Managerial Cost Approval Review"
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            type="button"
            variant="neutral"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs uppercase tracking-wider font-semibold"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting || !canApprove}
              onClick={() => handleDecision(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <XCircle size={15} />
              <span>Reject Cost</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || !canApprove}
              onClick={() => handleDecision(true)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <CheckCircle2 size={15} />
              <span>Approve & Authorize</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-left pt-1">
        {/* ESTIMATED COST CALLOUT */}
        <div className="bg-[#FEF6D1] border border-[#F6C445] rounded-2xl p-4 text-center">
          <span className="text-xs font-bold text-[#854D0E] uppercase tracking-wider block mb-1">
            Estimated Repair Expenditure
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0A4B6E]">
            ₱{estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[#854D0E] font-medium block mt-1">
            Exceeds ₱5,000.00 managerial threshold • Awaiting Executive Decision
          </span>
        </div>

        {/* WORK ORDER & TRUCK SUMMARY */}
        <div className="bg-[#F8FBFC] border border-gray-100 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2 text-[#0A4B6E]">
              <Truck size={16} />
              <span className="font-bold">{workOrder.plateNumber || "Truck"}</span>
              <span className="text-[#5B8399]">({workOrder.truckModel || "Isuzu Elf"})</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-gray-100 font-semibold text-[10px] text-gray-700">
              {workOrder.maintenanceTypeName || "MAINTENANCE"}
            </span>
          </div>

          <div className="text-gray-700 flex items-center gap-1.5">
            <Building2 size={14} className="text-[#5B8399]" />
            <span>Service Center: <strong className="text-gray-800">{workOrder.shopName || "Bunawan Heavy Repair Center"}</strong></span>
          </div>

          <div className="text-gray-700 leading-relaxed pt-1">
            <span className="font-bold text-[#0A4B6E] block mb-0.5">Repair Diagnosis:</span>
            <div className="bg-white p-2.5 rounded-lg border border-gray-100 text-gray-800">
              {workOrder.description}
            </div>
          </div>
        </div>

        {/* REMARKS INPUT */}
        <div>
          <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1.5">
            Approval / Rejection Remarks
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add executive justification, shop instructions, or reason for rejection..."
            className="w-full text-xs sm:text-sm bg-[#F3F5F5] border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] focus:border-transparent transition placeholder:text-gray-400 resize-none"
          />
        </div>

        {/* PERMISSION WARNING IF NOT AUTHORIZED */}
        {!canApprove && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
            <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Managerial Authorization Required:</strong> Only executive users (Super Admin / Admin) possess privileges to decide cost approvals. Decision buttons are disabled.
            </p>
          </div>
        )}

        {/* ERROR NOTIFICATION */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

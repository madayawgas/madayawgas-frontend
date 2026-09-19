// src/components/fleet/work-orders/WorkOrderDetailModal.jsx
import { Wrench, Truck, Calendar, MapPin, DollarSign, CheckCircle2, XCircle, Clock, AlertCircle, FileText, UserCheck, ShieldCheck } from "lucide-react";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";

const STATUS_CONFIG = {
  PENDING: { label: "Pending Approval", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  APPROVED: { label: "Approved", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  SCHEDULED: { label: "Scheduled", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  IN_PROGRESS: { label: "In Progress", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  COMPLETED: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  CANCELLED: { label: "Cancelled", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

const LIFECYCLE_STEPS = ["PENDING", "APPROVED", "SCHEDULED", "IN_PROGRESS", "COMPLETED"];

/**
 * WorkOrderDetailModal
 * Comprehensive read-only inspector for a Work Order, showing lifecycle progress,
 * linked vehicle details, cost approvals, and finalized maintenance logs.
 */
export default function WorkOrderDetailModal({
  isOpen,
  workOrder,
  onClose,
}) {
  if (!isOpen || !workOrder) return null;

  const statusStyle = STATUS_CONFIG[workOrder.status] || {
    label: workOrder.status,
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  };

  const estimatedCost = Number(workOrder.estimatedCost) || 0;
  const requiresApproval = estimatedCost >= 5000.0;
  const truckPlate = workOrder.truck?.plateNumber || "N/A";
  const truckModel = workOrder.truck?.model || "";
  const driverName = workOrder.truck?.driver?.name || "Unassigned";

  // Determine current lifecycle step index
  const currentStepIdx = LIFECYCLE_STEPS.indexOf(workOrder.status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Work Order ${workOrder.workOrderNumber || ""}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 pt-1">
        {/* Status Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="text-xs text-slate-500 font-medium">Work Order ID</div>
            <div className="font-mono text-xs text-slate-700 font-semibold">{workOrder.id}</div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
            >
              {statusStyle.label}
            </span>
          </div>
        </div>

        {/* Visual Lifecycle Progress Bar */}
        {workOrder.status !== "CANCELLED" && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6D8AA2] mb-2.5">
              Lifecycle Progress
            </div>
            <div className="flex items-center justify-between relative">
              <div className="absolute left-4 right-4 top-3 h-0.5 bg-slate-200 -z-0" />
              {LIFECYCLE_STEPS.map((step, idx) => {
                const isPassed = currentStepIdx >= idx;
                const isCurrent = workOrder.status === step;
                return (
                  <div key={step} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isCurrent
                          ? "bg-[#0B4A6E] text-[#FFDF2C] ring-4 ring-[#E8F3F8]"
                          : isPassed
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      {isPassed && !isCurrent ? "✓" : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] mt-1 font-medium capitalize ${
                        isCurrent
                          ? "text-[#0B4A6E] font-bold"
                          : isPassed
                          ? "text-slate-700"
                          : "text-slate-400"
                      }`}
                    >
                      {step.replace("_", " ").toLowerCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Two-Column Grid: Vehicle & Service Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Vehicle Information */}
          <div className="bg-[#F3F5F5] rounded-xl p-3.5 border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1B4B75]">
              <Truck className="w-3.5 h-3.5" />
              <span>Assigned Vehicle</span>
            </div>
            <div className="text-sm font-bold text-slate-800">
              {truckPlate} {truckModel && <span className="text-slate-500 font-normal">({truckModel})</span>}
            </div>
            <div className="text-xs text-slate-600 space-y-0.5">
              <div>
                <span className="text-slate-400">Assigned Driver: </span>
                <span className="font-medium text-slate-700">{driverName}</span>
              </div>
              <div>
                <span className="text-slate-400">Current Odometer: </span>
                <span className="font-mono text-slate-700">
                  {workOrder.truck?.currentOdometer
                    ? `${Number(workOrder.truck.currentOdometer).toLocaleString()} km`
                    : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Truck Status: </span>
                <span className="font-semibold text-slate-700">{workOrder.truck?.status || "ACTIVE"}</span>
              </div>
            </div>
          </div>

          {/* Service Specifications */}
          <div className="bg-[#F3F5F5] rounded-xl p-3.5 border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1B4B75]">
              <Wrench className="w-3.5 h-3.5" />
              <span>Service Specification</span>
            </div>
            <div className="text-sm font-bold text-slate-800">
              {workOrder.maintenanceType?.name || workOrder.maintenanceTypeName || "General Repair"}
            </div>
            <div className="text-xs text-slate-600 space-y-0.5">
              <div>
                <span className="text-slate-400">Repair Facility: </span>
                <span className="font-medium text-slate-700">{workOrder.shopName || "External Facility"}</span>
              </div>
              <div>
                <span className="text-slate-400">Scheduled Date: </span>
                <span className="font-medium text-slate-700">
                  {workOrder.scheduledDate ? new Date(workOrder.scheduledDate).toLocaleDateString() : "Pending"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Created Date: </span>
                <span className="text-slate-700">
                  {workOrder.createdAt ? new Date(workOrder.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Work Order Description */}
        {workOrder.description && (
          <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs text-slate-700">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6D8AA2] mb-1">
              Description / Scope of Work
            </div>
            <p className="leading-relaxed text-slate-600">{workOrder.description}</p>
          </div>
        )}

        {/* Cost & Approval Audit Box */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6D8AA2] flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cost & Approval Summary</span>
            </div>
            <div className="text-sm font-bold text-[#0B4A6E]">
              ₱{estimatedCost.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="text-xs space-y-1 text-slate-600">
            <div className="flex items-center justify-between">
              <span>Threshold Policy:</span>
              <span className="font-medium">
                {requiresApproval ? (
                  <span className="text-amber-700 font-semibold">Exceeds ₱5,000 threshold (Gatekeeper Required)</span>
                ) : (
                  <span className="text-emerald-700 font-semibold">Below ₱5,000 (Auto-Approved)</span>
                )}
              </span>
            </div>

            {requiresApproval && (
              <>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span>Managerial Decision:</span>
                  <span className="font-bold">
                    {workOrder.approvedAt ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                      </span>
                    ) : workOrder.status === "CANCELLED" ? (
                      <span className="text-rose-700 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                      </span>
                    ) : (
                      <span className="text-amber-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Pending Authorization
                      </span>
                    )}
                  </span>
                </div>

                {workOrder.decisionRemarks && (
                  <div className="pt-1 text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200">
                    "{workOrder.decisionRemarks}"
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Finalized Maintenance Log (if COMPLETED) */}
        {workOrder.maintenanceLog && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Finalized Maintenance Receipt</span>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                {workOrder.maintenanceLog.officialReceiptNumber}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 text-emerald-950">
              <div className="bg-white p-2 rounded-lg border border-emerald-100">
                <div className="text-[10px] text-slate-500 uppercase">Parts Cost</div>
                <div className="font-semibold text-slate-800">
                  ₱{(Number(workOrder.maintenanceLog.partsCost) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100">
                <div className="text-[10px] text-slate-500 uppercase">Labor Cost</div>
                <div className="font-semibold text-slate-800">
                  ₱{(Number(workOrder.maintenanceLog.laborCost) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100">
                <div className="text-[10px] text-slate-500 uppercase">Total Settled</div>
                <div className="font-bold text-[#0B4A6E]">
                  ₱{(Number(workOrder.maintenanceLog.totalCost) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100">
                <div className="text-[10px] text-slate-500 uppercase">Downtime</div>
                <div className="font-semibold text-slate-800">
                  {workOrder.maintenanceLog.downtimeDays || 1} day(s)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <Button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0B4A6E] font-bold px-6 shadow-sm"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

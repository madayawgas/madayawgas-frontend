// src/components/fleet/work-orders/WorkOrderDetailModal.jsx
import {
  Wrench,
  Truck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  User,
  ShieldCheck,
  Building2,
  Gauge,
  Tag,
  Receipt,
  Play,
  CheckCheck,
} from "lucide-react";
import SideDrawer from "../../ui/SideDrawer";
import Badge from "../../ui/Badge";
import { useAuth } from "../../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../../utils/permissions.js";

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending Approval",
    badgeVariant: "pending",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
  },
  APPROVED: {
    label: "Approved",
    badgeVariant: "roles",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
  },
  SCHEDULED: {
    label: "Scheduled",
    badgeVariant: "roles",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badgeVariant: "warning",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-300",
  },
  COMPLETED: {
    label: "Completed",
    badgeVariant: "success",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  CANCELLED: {
    label: "Cancelled",
    badgeVariant: "danger",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
  },
};

const LIFECYCLE_STEPS = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
];

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(val) {
  const num = Number(val) || 0;
  return `₱${num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * WorkOrderDetailModal (Slide-in Drawer)
 * Handcrafted Madayaw Gas style Work Order Detail Inspector.
 * Slides smoothly from the right with lifecycle pipeline, vehicle info,
 * repair specification, cost approval status, and finalized receipts.
 */
export default function WorkOrderDetailModal({
  isOpen,
  workOrder,
  onClose,
  onOpenApproval,
  onOpenFinalize,
  onAdvanceStatus,
}) {
  const { currentUser, can } = useAuth();

  if (!isOpen || !workOrder) return null;

  const canManageFleet = can && can(PERMISSIONS?.FLEET_MANAGE || "fleet.manage");
  const isManager =
    currentUser?.role === "Super Admin" ||
    currentUser?.role === "Admin" ||
    (can && can(PERMISSIONS?.USERS_MANAGE || "users.manage"));

  const statusStyle = STATUS_CONFIG[workOrder.status] || {
    label: workOrder.status,
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  };

  const estimatedCost = Number(workOrder.estimatedCost) || 0;
  const requiresApproval = estimatedCost >= 5000.0;
  const truckPlate = workOrder.truck?.plateNumber || workOrder.plateNumber || "N/A";
  const truckModel = workOrder.truck?.model || workOrder.truckModel || "";
  const driverName =
    workOrder.truck?.driver?.name ||
    workOrder.truck?.driverName ||
    (workOrder.truck?.driver
      ? `${workOrder.truck.driver.firstName || ""} ${workOrder.truck.driver.lastName || ""}`.trim()
      : null) ||
    "Unassigned";

  const typeName =
    workOrder.maintenanceType?.name ||
    workOrder.maintenanceTypeName ||
    "Preventive Maintenance";

  const shop = workOrder.shopName || "Bunawan Heavy Repair Center";

  // Determine current lifecycle step index
  const stepKeys = LIFECYCLE_STEPS.map((s) => s.key);
  const currentStepIdx = stepKeys.indexOf(workOrder.status);
  const progressPercent =
    currentStepIdx >= 0
      ? Math.round(((currentStepIdx + 1) / LIFECYCLE_STEPS.length) * 100)
      : workOrder.status === "CANCELLED"
      ? 100
      : 0;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={workOrder.workOrderNumber || `Work Order ${workOrder.id?.slice(0, 8)}`}
      subtitle={`${typeName} • ${shop}`}
      icon={Wrench}
      badge={
        <span
          className={`px-3 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${statusStyle.badgeClass}`}
        >
          {statusStyle.label}
        </span>
      }
      width="max-w-xl lg:max-w-2xl"
      footer={({ onClose: closeDrawer }) => (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          {/* Action trigger based on current lifecycle status */}
          {workOrder.status === "PENDING" && onOpenApproval && (
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                onOpenApproval(workOrder);
              }}
              className="flex-1 py-3.5 px-5 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Clock size={16} />
              <span>{isManager ? "Review Approval" : "View Approval"}</span>
            </button>
          )}

          {workOrder.status === "SCHEDULED" && canManageFleet && onAdvanceStatus && (
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                onAdvanceStatus(workOrder.id, "IN_PROGRESS");
              }}
              className="flex-1 py-3.5 px-5 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Play size={15} className="fill-current" />
              <span>Start Repair</span>
            </button>
          )}

          {workOrder.status === "IN_PROGRESS" && canManageFleet && onOpenFinalize && (
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                onOpenFinalize(workOrder);
              }}
              className="flex-1 py-3.5 px-5 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <CheckCheck size={16} />
              <span>Finalize Maintenance</span>
            </button>
          )}

          <button
            type="button"
            onClick={closeDrawer}
            className={`py-3.5 px-6 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] transition-all shadow-sm cursor-pointer active:scale-95 text-center ${
              (workOrder.status === "PENDING" && onOpenApproval) ||
              (workOrder.status === "SCHEDULED" && canManageFleet && onAdvanceStatus) ||
              (workOrder.status === "IN_PROGRESS" && canManageFleet && onOpenFinalize)
                ? "flex-1"
                : "w-full"
            }`}
          >
            CLOSE
          </button>
        </div>
      )}
    >
      <div className="space-y-4">
        {/* Sub-Header Label */}
        <p className="text-center text-xs md:text-sm font-semibold text-[#6D8AA2] mb-1 tracking-wide">
          Work Order Lifecycle & Details
        </p>

        {/* 1. BRANDED LIFECYCLE PIPELINE TRACK */}
        {workOrder.status !== "CANCELLED" ? (
          <div className="bg-[#E8F3F8] rounded-2xl p-4 border border-[#BCE1F1]/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0A4B6E] uppercase tracking-wider text-[11px]">
                Lifecycle Progress
              </span>
              <span className="font-bold text-[#0A4B6E] bg-white px-2.5 py-0.5 rounded-full border border-[#BCE1F1] text-[10px]">
                {progressPercent}% Complete
              </span>
            </div>

            {/* Pipeline Stage Badges */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {LIFECYCLE_STEPS.map((step, idx) => {
                const isPassed = currentStepIdx > idx;
                const isCurrent = currentStepIdx === idx;

                let badgeStyles = "bg-white/70 text-slate-400 border-slate-200";
                if (isCurrent) {
                  badgeStyles =
                    "bg-[#0A4B6E] text-[#FFDF2C] border-[#0A4B6E] font-bold shadow-xs ring-2 ring-[#0A4B6E]/20";
                } else if (isPassed) {
                  badgeStyles =
                    "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold";
                }

                return (
                  <div
                    key={step.key}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${badgeStyles}`}
                  >
                    <div className="flex items-center gap-1 text-[11px]">
                      {isPassed && <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />}
                      <span className="truncate">{step.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-rose-900">
            <XCircle size={20} className="text-rose-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Work Order Cancelled</p>
              <p className="text-rose-700 mt-0.5">
                This maintenance order was terminated and will not be dispatched for repair.
              </p>
            </div>
          </div>
        )}

        {/* 2. ASSIGNED VEHICLE CARD */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4 border border-[#BCE1F1]/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-xs">
                <Truck size={22} className="text-[#FFDF2C]" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-[#0A4B6E] leading-tight">
                  {truckPlate}
                </h3>
                {truckModel && (
                  <p className="text-xs text-[#6D8AA2] font-medium">{truckModel}</p>
                )}
              </div>
            </div>

            <Badge
              variant={
                workOrder.truck?.status === "UNDER_MAINTENANCE"
                  ? "warning"
                  : workOrder.truck?.status === "INACTIVE"
                  ? "deactivated"
                  : "success"
              }
            >
              {workOrder.truck?.status || "ACTIVE"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-[#BCE1F1]/40">
            <div className="flex items-center gap-2">
              <User size={14} className="text-[#6D8AA2] shrink-0" />
              <span className="text-[#6D8AA2]">Driver:</span>
              <span className="font-bold text-[#0A4B6E] truncate">{driverName}</span>
            </div>

            <div className="flex items-center gap-2">
              <Gauge size={14} className="text-[#6D8AA2] shrink-0" />
              <span className="text-[#6D8AA2]">Odometer:</span>
              <span className="font-bold text-[#0A4B6E]">
                {workOrder.truck?.currentOdometer
                  ? `${Number(workOrder.truck.currentOdometer).toLocaleString()} KM`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. SERVICE SPECIFICATION CARD */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4 border border-[#BCE1F1]/60 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#0A4B6E] font-bold uppercase tracking-wider text-[11px]">
              <Wrench size={15} />
              <span>Service Specification</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white text-[#0A4B6E] border border-[#BCE1F1]">
              {typeName}
            </span>
          </div>

          <div className="space-y-2 text-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-[#6D8AA2] font-medium flex items-center gap-1.5">
                <Building2 size={14} /> Repair Facility:
              </span>
              <span className="font-bold text-[#0A4B6E]">{shop}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#6D8AA2] font-medium flex items-center gap-1.5">
                <Calendar size={14} /> Scheduled Date:
              </span>
              <span className="font-bold text-[#0A4B6E]">
                {formatDate(workOrder.scheduledDate)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#6D8AA2] font-medium flex items-center gap-1.5">
                <Calendar size={14} /> Date Created:
              </span>
              <span className="font-bold text-[#0A4B6E]">
                {formatDate(workOrder.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* 4. SCOPE OF WORK & DESCRIPTION */}
        {workOrder.description && (
          <div className="bg-[#E8F3F8] rounded-2xl p-4 border border-[#BCE1F1]/60 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6D8AA2] flex items-center gap-1.5">
              <FileText size={14} />
              <span>Scope of Work & Repair Scope</span>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-[#BCE1F1]/40 text-xs md:text-sm text-slate-800 leading-relaxed font-normal shadow-2xs">
              {workOrder.description}
            </div>
          </div>
        )}

        {/* 5. FINANCIAL & EXECUTIVE APPROVAL SUMMARY */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4 border border-[#BCE1F1]/60 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6D8AA2] flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] leading-none shrink-0">
                ₱
              </span>
              <span>Cost & Approval Summary</span>
            </div>
            <div className="text-xl font-bold text-[#0A4B6E]">
              {formatCurrency(estimatedCost)}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#BCE1F1]/40">
            {/* Gatekeeper Policy Badge */}
            <div className="flex items-center justify-between">
              <span className="text-[#6D8AA2] font-medium">Policy Threshold:</span>
              {requiresApproval ? (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  <span>Requires ₱5,000+ Authorization</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>Auto-Approved (&lt; ₱5,000)</span>
                </span>
              )}
            </div>

            {/* Managerial Decision */}
            {requiresApproval && (
              <div className="flex items-center justify-between">
                <span className="text-[#6D8AA2] font-medium">Managerial Decision:</span>
                <div>
                  {workOrder.approvedAt ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Authorized on {formatDate(workOrder.approvedAt)}
                    </span>
                  ) : workOrder.status === "CANCELLED" ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                      <XCircle size={12} /> Rejected by Manager
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                      <Clock size={12} /> Pending Authorization
                    </span>
                  )}
                </div>
              </div>
            )}

            {workOrder.decisionRemarks && (
              <div className="bg-white p-2.5 rounded-xl border border-[#BCE1F1]/40 text-slate-700 italic text-[11px] mt-1">
                "{workOrder.decisionRemarks}"
              </div>
            )}
          </div>
        </div>

        {/* 6. FINALIZED MAINTENANCE RECEIPT (if available) */}
        {workOrder.maintenanceLog && (
          <div className="bg-emerald-50/90 rounded-2xl p-4 border border-emerald-200/80 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Finalized Maintenance Receipt</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-900 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                <Receipt size={12} />
                <span>{workOrder.maintenanceLog.officialReceiptNumber}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Parts Cost</p>
                <p className="font-bold text-slate-800 mt-0.5">
                  {formatCurrency(workOrder.maintenanceLog.partsCost)}
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Labor Cost</p>
                <p className="font-bold text-slate-800 mt-0.5">
                  {formatCurrency(workOrder.maintenanceLog.laborCost)}
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Settled</p>
                <p className="font-bold text-[#0A4B6E] mt-0.5">
                  {formatCurrency(workOrder.maintenanceLog.totalCost)}
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Downtime</p>
                <p className="font-bold text-amber-700 mt-0.5">
                  {workOrder.maintenanceLog.downtimeDays || 1} Day(s)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}

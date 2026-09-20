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
  UserRound,
  ShieldCheck,
  Building2,
  Gauge,
  Receipt,
  Play,
  CheckCheck,
  DollarSign,
  Info,
} from "lucide-react";
import SideDrawer from "../../ui/SideDrawer";
import Badge from "../../ui/Badge";
import { useAuth } from "../../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../../utils/permissions.js";
import { canApproveWorkOrderCost } from "../../../utils/fleetGuards.js";

const STATUS_CONFIG = {
  PENDING: {
    label: "PENDING APPROVAL",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
  },
  APPROVED: {
    label: "APPROVED",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
  },
  SCHEDULED: {
    label: "SCHEDULED",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
  },
  IN_PROGRESS: {
    label: "IN PROGRESS",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-300",
  },
  COMPLETED: {
    label: "COMPLETED",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  CANCELLED: {
    label: "CANCELLED",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
  },
};

const LIFECYCLE_STEPS = [
  { key: "PENDING", label: "Pending", number: "1" },
  { key: "APPROVED", label: "Approved", number: "2" },
  { key: "SCHEDULED", label: "Scheduled", number: "3" },
  { key: "IN_PROGRESS", label: "In Progress", number: "4" },
  { key: "COMPLETED", label: "Completed", number: "5" },
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
  truck,
  trucks = [],
  onClose,
  onOpenApproval,
  onOpenFinalize,
  onAdvanceStatus,
}) {
  const { currentUser, can } = useAuth();

  if (!isOpen || !workOrder) return null;

  const canManageFleet = can && can(PERMISSIONS?.FLEET_MANAGE || "fleet.manage");
  const canApprove = canApproveWorkOrderCost(currentUser, can);

  const statusStyle = STATUS_CONFIG[workOrder.status] || {
    label: workOrder.status,
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  };

  const matchedTruck =
    truck ||
    (trucks &&
      trucks.find(
        (t) =>
          t.id === workOrder.truckId ||
          t.id === workOrder.truck?.id ||
          t.plateNumber === (workOrder.plateNumber || workOrder.truck?.plateNumber)
      )) ||
    workOrder.truck;

  const isWorkOrderActive =
    workOrder.status !== "COMPLETED" && workOrder.status !== "CANCELLED";

  const resolvedTruckStatus =
    matchedTruck?.status ||
    workOrder.truckStatus ||
    workOrder.truck?.status ||
    (isWorkOrderActive ? "UNDER_MAINTENANCE" : "ACTIVE");

  const getTruckBadgeVariant = (status) => {
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
        return "danger";
    }
  };

  const estimatedCost = Number(workOrder.estimatedCost) || 0;
  const requiresApproval = estimatedCost >= 5000.0;
  const truckPlate = matchedTruck?.plateNumber || workOrder.truck?.plateNumber || workOrder.plateNumber || "N/A";
  const truckModel = matchedTruck?.model || workOrder.truck?.model || workOrder.truckModel || "";
  const driverName =
    matchedTruck?.driverName ||
    (matchedTruck?.driver
      ? `${matchedTruck.driver.firstName || ""} ${matchedTruck.driver.lastName || ""}`.trim() || matchedTruck.driver.username
      : null) ||
    workOrder.truck?.driver?.name ||
    workOrder.truck?.driverName ||
    (workOrder.truck?.driver
      ? `${workOrder.truck.driver.firstName || ""} ${workOrder.truck.driver.lastName || ""}`.trim()
      : null) ||
    "No Assigned";

  const odometerDisplay =
    matchedTruck?.currentOdometer !== undefined
      ? `${Number(matchedTruck.currentOdometer).toLocaleString()} KM`
      : workOrder.truck?.currentOdometer !== undefined
      ? `${Number(workOrder.truck.currentOdometer).toLocaleString()} KM`
      : "N/A";

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

  const formattedWONumber =
    workOrder.workOrderNumber ||
    (workOrder.id?.startsWith("wo-")
      ? workOrder.id.toUpperCase()
      : `WO #${workOrder.id?.slice(0, 8)?.toUpperCase() || "N/A"}`);

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={formattedWONumber}
      subtitle={`${typeName} • ${shop}`}
      icon={Wrench}
      badge={
        <span
          className={`px-3 py-0.5 rounded-full text-[10.5px] font-bold border uppercase tracking-wider ${statusStyle.badgeClass}`}
        >
          {statusStyle.label}
        </span>
      }
      width="max-w-xl lg:max-w-2xl"
      footer={({ onClose: closeDrawer }) => (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          {/* Action trigger based on current lifecycle status */}
          {workOrder.status === "PENDING" && canApprove && onOpenApproval && (
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                onOpenApproval(workOrder);
              }}
              className="flex-1 py-3 px-5 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider bg-[#0A4B6E] hover:bg-[#083b57] text-[#FFDF2C] border border-[#0A4B6E] flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Clock size={16} />
              <span>Review Approval</span>
            </button>
          )}

          {workOrder.status === "SCHEDULED" && canManageFleet && onAdvanceStatus && (
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                onAdvanceStatus(workOrder.id, "IN_PROGRESS");
              }}
              className="flex-1 py-3 px-5 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider bg-[#0A4B6E] hover:bg-[#083b57] text-[#FFDF2C] flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Play size={15} className="fill-current text-[#FFDF2C]" />
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
              className="flex-1 py-3 px-5 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <CheckCheck size={16} />
              <span>Finalize Maintenance</span>
            </button>
          )}

          <button
            type="button"
            onClick={closeDrawer}
            className={`py-3 px-6 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] transition-all shadow-xs cursor-pointer active:scale-95 text-center ${
              (workOrder.status === "PENDING" && canApprove && onOpenApproval) ||
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
        {/* 1. BRANDED LIFECYCLE PIPELINE TRACKER */}
        {workOrder.status !== "CANCELLED" ? (
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0A4B6E] uppercase tracking-wider text-[11px]">
                  Lifecycle Progress
                </span>
              </div>
              <span className="font-bold text-[#0A4B6E] bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 text-[10.5px]">
                {progressPercent}% Complete
              </span>
            </div>

            {/* Stepper Pipeline */}
            <div className="w-full px-4 sm:px-6 pt-1 pb-1">
              {/* Circles & Connecting Line Segments */}
              <div className="flex items-center justify-between w-full">
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const isCompletedOrder = workOrder.status === "COMPLETED";
                  const isPassed = isCompletedOrder || currentStepIdx > idx;
                  const isCurrent = !isCompletedOrder && currentStepIdx === idx;
                  const isLast = idx === LIFECYCLE_STEPS.length - 1;

                  let circleStyle = "bg-white text-slate-400 border-2 border-slate-300";
                  if (isPassed) {
                    circleStyle = "bg-emerald-600 text-white border-2 border-emerald-600 font-bold";
                  } else if (isCurrent) {
                    circleStyle =
                      "bg-[#0A4B6E] text-[#FFDF2C] border-2 border-[#0A4B6E] ring-4 ring-[#0A4B6E]/15 font-bold shadow-xs";
                  }

                  const lineIsFilled = isCompletedOrder || currentStepIdx > idx;

                  return (
                    <div
                      key={step.key}
                      className={`flex items-center ${isLast ? "flex-none" : "flex-1"}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 transition-all ${circleStyle}`}
                      >
                        {isPassed ? (
                          <CheckCircle2 size={15} />
                        ) : (
                          <span>{step.number}</span>
                        )}
                      </div>

                      {!isLast && (
                        <div className="flex-1 h-[2px] mx-1.5 sm:mx-2 bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              lineIsFilled ? "bg-emerald-600 w-full" : "bg-transparent w-0"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Step Labels Row */}
              <div className="flex items-center justify-between w-full mt-2">
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const isCompletedOrder = workOrder.status === "COMPLETED";
                  const isPassed = isCompletedOrder || currentStepIdx > idx;
                  const isCurrent = !isCompletedOrder && currentStepIdx === idx;

                  let labelStyle = "text-slate-400 font-normal";
                  if (isPassed) {
                    labelStyle = "text-emerald-800 font-semibold";
                  } else if (isCurrent) {
                    labelStyle = "text-[#0A4B6E] font-bold";
                  }

                  return (
                    <div
                      key={step.key}
                      className="text-center w-7 flex justify-center"
                    >
                      <span
                        className={`text-[9.5px] sm:text-[10px] uppercase tracking-wide whitespace-nowrap ${labelStyle}`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-rose-900">
            <XCircle size={20} className="text-rose-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Work Order Cancelled</p>
              <p className="text-rose-700 mt-0.5">
                This maintenance order was terminated and will not proceed with repair.
              </p>
            </div>
          </div>
        )}

        {/* 2. ASSIGNED VEHICLE CARD (Highlighted Key Asset) */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4.5 border border-[#BCE1F1]/70 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#0A4B6E] flex items-center justify-center text-[#FFDF2C] shrink-0 shadow-xs">
                <Truck size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base md:text-lg font-bold text-[#0A4B6E] leading-tight truncate">
                  {truckPlate}
                </h3>
                {truckModel && (
                  <p className="text-xs text-[#6D8AA2] font-medium truncate">{truckModel}</p>
                )}
              </div>
            </div>

            <Badge
              variant={getTruckBadgeVariant(resolvedTruckStatus)}
            >
              {resolvedTruckStatus.replace("_", " ")}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#BCE1F1]/50 text-xs">
            <div className="bg-white/90 p-2.5 rounded-xl border border-[#BCE1F1]/40 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center shrink-0">
                <UserRound size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[#6D8AA2] uppercase font-semibold">Assigned Driver</p>
                <p className="font-bold text-[#0A4B6E] truncate">{driverName}</p>
              </div>
            </div>

            <div className="bg-white/90 p-2.5 rounded-xl border border-[#BCE1F1]/40 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center shrink-0">
                <Gauge size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[#6D8AA2] uppercase font-semibold">Current Odometer</p>
                <p className="font-bold text-[#0A4B6E] truncate">
                  {odometerDisplay}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SERVICE SPECIFICATION CARD */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#0A4B6E] font-bold uppercase tracking-wider text-[11px]">
              <Wrench size={15} />
              <span>Service Specification</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-[#0A4B6E] border border-slate-200">
              {typeName}
            </span>
          </div>

          <div className="space-y-2 text-slate-700 pt-1">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-[#6D8AA2] font-medium flex items-center gap-1.5">
                <Building2 size={14} /> Repair Facility:
              </span>
              <span className="font-bold text-[#0A4B6E] text-right truncate max-w-[200px]" title={shop}>
                {shop}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-[#6D8AA2] font-medium flex items-center gap-1.5">
                <Calendar size={14} /> Scheduled Date:
              </span>
              <span className="font-bold text-[#0A4B6E]">
                {formatDate(workOrder.scheduledDate)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-[#6D8AA2] font-medium flex items-center gap-1.5">
                <Clock size={14} /> Date Created:
              </span>
              <span className="font-bold text-[#0A4B6E]">
                {formatDate(workOrder.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* 4. SCOPE OF WORK & DESCRIPTION */}
        {workOrder.description && (
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5">
              <FileText size={14} />
              <span>Scope of Work & Repair Details</span>
            </div>
            <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/70 text-xs md:text-sm text-slate-800 leading-relaxed font-normal">
              {workOrder.description}
            </div>
          </div>
        )}

        {/* 5. FINANCIAL & EXECUTIVE APPROVAL SUMMARY */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5">
              <DollarSign size={15} className="text-emerald-700" />
              <span>Cost & Authorization Summary</span>
            </div>
            <div className="text-xl font-bold text-[#0A4B6E]">
              {formatCurrency(estimatedCost)}
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            {/* Gatekeeper Policy Badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#6D8AA2] font-medium">Policy Threshold:</span>
              {requiresApproval ? (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  <span>Requires ₱5,000+ Sign-off</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>Auto-Authorized (&lt; ₱5,000)</span>
                </span>
              )}
            </div>

            {/* Managerial Decision */}
            {requiresApproval && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6D8AA2] font-medium">Manager Decision:</span>
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
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 italic text-[11px] mt-1 flex items-start gap-2">
                <Info size={14} className="text-[#0F7AB2] shrink-0 mt-0.5" />
                <span>"{workOrder.decisionRemarks}"</span>
              </div>
            )}
          </div>
        </div>

        {/* 6. FINALIZED MAINTENANCE RECEIPT (if available) */}
        {workOrder.maintenanceLog && (
          <div className="bg-emerald-50/90 rounded-2xl p-4.5 border border-emerald-200/80 shadow-2xs space-y-3 text-xs">
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

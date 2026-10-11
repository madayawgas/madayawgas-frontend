// src/components/fleet/work-orders/WorkOrderDetailModal.jsx
import { useState, useEffect, useCallback } from "react";
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
  Play,
  CheckCheck,
  DollarSign,
  Info,
  RotateCcw,
} from "lucide-react";
import SideDrawer from "../../ui/SideDrawer";
import Badge from "../../ui/Badge";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import ReceiptAttachmentManager from "./ReceiptAttachmentManager.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../../utils/permissions.js";
import { canApproveWorkOrderCost } from "../../../utils/fleetGuards.js";
import { fleetApi } from "../../../api/fleet.js";
import { formatPhilippineDate } from "../../../utils/date.js";

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

const formatDate = (dateStr) => formatPhilippineDate(dateStr, { fallback: "N/A" });

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
  maintenanceLogs = [],
  onClose,
  onOpenApproval,
  onOpenFinalize,
  onAdvanceStatus,
}) {
  const { currentUser, can } = useAuth();
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Sequential multi-approvals states
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [showReapprovalModal, setShowReapprovalModal] = useState(false);
  const [reapprovalAmount, setReapprovalAmount] = useState("");
  const [reapprovalRemarks, setReapprovalRemarks] = useState("");
  const [isSubmittingReapproval, setIsSubmittingReapproval] = useState(false);
  const [reapprovalError, setReapprovalError] = useState("");

  // Attached receipts states
  const [attachedReceipts, setAttachedReceipts] = useState([]);
  const [localLog, setLocalLog] = useState(null);

  useEffect(() => {
    setLocalLog(null);
  }, [workOrder?.id]);

  const loadApprovalRequests = useCallback(async () => {
    if (!workOrder?.id) return;
    try {
      const res = await fleetApi.getWorkOrderApprovalRequests(workOrder.id);
      setApprovalRequests(res?.data?.requests || res?.requests || []);
    } catch (err) {
      console.error("Failed to load approval requests:", err);
    }
  }, [workOrder?.id]);

  const loadReceipts = useCallback(async () => {
    if (!workOrder?.id) return;
    try {
      const res = await fleetApi.getWorkOrderReceipts(workOrder.id);
      const list = Array.isArray(res?.data)
        ? res.data
        : res?.data?.receipts || res?.receipts || workOrder?.receipts || [];
      setAttachedReceipts(list);
    } catch (err) {
      console.error("Failed to load receipts:", err);
      setAttachedReceipts(workOrder?.receipts || []);
    }
  }, [workOrder?.id, workOrder?.receipts]);

  useEffect(() => {
    if (isOpen && workOrder?.id) {
      loadApprovalRequests();
      loadReceipts();

      // If work order is completed or finalized, ensure we load its maintenance log
      if (
        (workOrder.status === "COMPLETED" || workOrder.approvalStatus === "APPROVED") &&
        (!workOrder.partsCost || !workOrder.maintenanceLog)
      ) {
        fleetApi
          .getMaintenanceLogs()
          .then((res) => {
            const logs = res?.data?.logs || [];
            const found = logs.find(
              (l) => l.workOrderId === workOrder.id || l.workOrderId === workOrder.workOrderId
            );
            if (found) {
              setLocalLog(found);
            }
          })
          .catch((err) => console.error("Failed to load maintenance logs:", err));
      }
    }
  }, [isOpen, workOrder?.id, workOrder?.status, workOrder?.approvalStatus, workOrder?.partsCost, workOrder?.maintenanceLog, workOrder?.workOrderId, loadApprovalRequests, loadReceipts]);

  const hasPendingApprovalRequest = approvalRequests.some(
    (req) => req.isApproved === null || req.status === "PENDING"
  );

  const handleRequestReapproval = async (e) => {
    if (e) e.preventDefault();
    const amount = parseFloat(reapprovalAmount);
    if (isNaN(amount) || amount <= 0) {
      setReapprovalError("Enter a valid amount requested.");
      return;
    }
    if (!reapprovalRemarks.trim()) {
      setReapprovalError("Please provide justification remarks for re-approval.");
      return;
    }

    try {
      setIsSubmittingReapproval(true);
      setReapprovalError("");
      await fleetApi.submitWorkOrderApprovalRequest(workOrder.id, {
        amountRequested: amount,
        remarks: reapprovalRemarks.trim(),
      });
      setShowReapprovalModal(false);
      setReapprovalAmount("");
      setReapprovalRemarks("");
      await loadApprovalRequests();
    } catch (err) {
      console.error("Failed to submit re-approval request:", err);
      setReapprovalError(err?.message || "Failed to submit request.");
    } finally {
      setIsSubmittingReapproval(false);
    }
  };

  const [localStatus, setLocalStatus] = useState(null);

  useEffect(() => {
    setLocalStatus(null);
  }, [workOrder?.id, workOrder?.status]);

  if (!isOpen || !workOrder) return null;

  const effectiveStatus = localStatus || workOrder.status || "PENDING";
  const canManageFleet = can && can(PERMISSIONS?.FLEET_MANAGE || "fleet.manage");
  const canApprove = canApproveWorkOrderCost(currentUser, can);

  const statusStyle = STATUS_CONFIG[effectiveStatus] || {
    label: effectiveStatus,
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  };

  const matchedTruck =
    truck ||
    (trucks &&
      trucks.find((t) => {
        if (workOrder.plateNumber && t.plateNumber && t.plateNumber.toUpperCase() === workOrder.plateNumber.toUpperCase()) {
          return true;
        }
        if (workOrder.truckId && (t.id === workOrder.truckId || t.truckId === workOrder.truckId)) {
          return true;
        }
        if (workOrder.vehicleId && (t.id === workOrder.vehicleId || t.vehicleId === workOrder.vehicleId)) {
          return true;
        }
        return false;
      })) ||
    workOrder.truck;

  const isWorkOrderActive =
    effectiveStatus !== "COMPLETED" && effectiveStatus !== "CANCELLED";

  const resolvedTruckStatus =
    matchedTruck?.status ||
    workOrder.truckStatus ||
    workOrder.truck?.status ||
    (isWorkOrderActive ? "UNDER_MAINTENANCE" : "ACTIVE");

  const vehicleType =
    workOrder.vehicleType ||
    workOrder.truck?.vehicleType ||
    matchedTruck?.vehicleType ||
    "DELIVERY_TRUCK";

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

  const matchedLog =
    workOrder.maintenanceLog ||
    localLog ||
    (Array.isArray(maintenanceLogs) &&
      maintenanceLogs.find(
        (l) => l.workOrderId === workOrder.id || l.workOrderId === workOrder.workOrderId
      )) ||
    null;

  const estimatedCost = Number(workOrder.estimatedCost) || 0;
  const isFinalized = effectiveStatus === "COMPLETED";

  const rawParts =
    workOrder.partsCost !== undefined && workOrder.partsCost !== null
      ? workOrder.partsCost
      : matchedLog?.partsCost;
  const settledPartsCost = rawParts !== undefined && rawParts !== null ? Number(rawParts) : 0;

  const rawLabor =
    workOrder.laborCost !== undefined && workOrder.laborCost !== null
      ? workOrder.laborCost
      : matchedLog?.laborCost;
  const settledLaborCost = rawLabor !== undefined && rawLabor !== null ? Number(rawLabor) : 0;

  const rawTotal =
    workOrder.totalCost !== undefined && workOrder.totalCost !== null
      ? workOrder.totalCost
      : matchedLog?.totalCost;
  const settledTotalCost =
    rawTotal !== undefined && rawTotal !== null
      ? Number(rawTotal)
      : (settledPartsCost + settledLaborCost > 0
          ? settledPartsCost + settledLaborCost
          : estimatedCost);

  const displayCost = isFinalized ? settledTotalCost : estimatedCost;
  const requiresApproval = estimatedCost >= 5000.0;

  const downtimeDays =
    workOrder.downtimeDays ||
    workOrder.maintenanceLog?.downtimeDays ||
    matchedLog?.downtimeDays ||
    1;

  const isAuthorized =
    Boolean(workOrder.approvedAt) ||
    workOrder.approvalStatus === "APPROVED" ||
    isFinalized ||
    ["APPROVED", "SCHEDULED", "IN_PROGRESS", "COMPLETED"].includes(effectiveStatus);
  const truckPlate = workOrder.plateNumber || workOrder.truck?.plateNumber || matchedTruck?.plateNumber || "N/A";
  const truckModel = workOrder.truckModel || workOrder.model || matchedTruck?.model || workOrder.truck?.model || "";
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
    matchedTruck?.currentOdometer !== undefined && matchedTruck?.currentOdometer !== null
      ? `${Number(matchedTruck.currentOdometer).toLocaleString()} KM`
      : workOrder.currentOdometer !== undefined && workOrder.currentOdometer !== null
      ? `${Number(workOrder.currentOdometer).toLocaleString()} KM`
      : workOrder.truck?.currentOdometer !== undefined && workOrder.truck?.currentOdometer !== null
      ? `${Number(workOrder.truck.currentOdometer).toLocaleString()} KM`
      : "N/A";

  const typeName =
    workOrder.maintenanceType?.name ||
    workOrder.maintenanceTypeName ||
    "Preventive Maintenance";

  const shop = workOrder.shopName || "Bunawan Heavy Repair Center";

  // Determine current lifecycle step index
  const stepKeys = LIFECYCLE_STEPS.map((s) => s.key);
  const currentStepIdx = stepKeys.indexOf(effectiveStatus);
  const progressPercent =
    currentStepIdx >= 0
      ? Math.round(((currentStepIdx + 1) / LIFECYCLE_STEPS.length) * 100)
      : effectiveStatus === "CANCELLED"
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
          {effectiveStatus === "PENDING" && canApprove && onOpenApproval && (
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

          {effectiveStatus === "SCHEDULED" && canManageFleet && onAdvanceStatus && (
            <button
              type="button"
              disabled={isAdvancing}
              onClick={async () => {
                try {
                  setIsAdvancing(true);
                  await onAdvanceStatus(workOrder.id, "IN_PROGRESS");
                  setLocalStatus("IN_PROGRESS");
                } catch (err) {
                  console.error("Failed to advance work order:", err);
                } finally {
                  setIsAdvancing(false);
                }
              }}
              className="flex-1 py-3 px-5 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider bg-[#0A4B6E] hover:bg-[#083b57] text-[#FFDF2C] flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Play size={15} className="fill-current text-[#FFDF2C]" />
              <span>{isAdvancing ? "Starting..." : "Start Repair"}</span>
            </button>
          )}

          {effectiveStatus === "IN_PROGRESS" && canManageFleet && onOpenFinalize && (
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                onOpenFinalize({
                  ...workOrder,
                  status: effectiveStatus,
                });
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
              (effectiveStatus === "PENDING" && canApprove && onOpenApproval) ||
              (effectiveStatus === "SCHEDULED" && canManageFleet && onAdvanceStatus) ||
              (effectiveStatus === "IN_PROGRESS" && canManageFleet && onOpenFinalize)
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
                  const isCompletedOrder = effectiveStatus === "COMPLETED";
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
                  const isCompletedOrder = effectiveStatus === "COMPLETED";
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
                <div className="flex items-center gap-2">
                  <h3 className="text-base md:text-lg font-bold text-[#0A4B6E] leading-tight truncate">
                    {truckPlate}
                  </h3>
                  {vehicleType && (
                    <Badge variant="info" className="text-[9.5px] px-2 py-0">
                      {vehicleType.replace("_", " ")}
                    </Badge>
                  )}
                </div>
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

        {/* 5. FINANCIAL & SETTLEMENT SUMMARY */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5">
              {isFinalized ? (
                <>
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Settled Maintenance Cost</span>
                </>
              ) : (
                <>
                  <DollarSign size={15} className="text-emerald-700" />
                  <span>Cost & Authorization Summary</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xl font-bold text-[#0A4B6E]">
                  {formatCurrency(displayCost)}
                </div>
                <div className="text-[10px] text-slate-400 font-medium tracking-wide">
                  {isFinalized ? "Total Settled Cost" : "Estimated Cost"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            {/* If finalized, show itemized breakdown tiles */}
            {isFinalized && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Initial Estimate</p>
                  <p className="font-bold text-slate-700 mt-0.5">{formatCurrency(estimatedCost)}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Parts Cost</p>
                  <p className="font-bold text-slate-800 mt-0.5">{formatCurrency(settledPartsCost)}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Labor Cost</p>
                  <p className="font-bold text-slate-800 mt-0.5">{formatCurrency(settledLaborCost)}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Downtime</p>
                  <p className="font-bold text-amber-700 mt-0.5">{downtimeDays} Day(s)</p>
                </div>
              </div>
            )}

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
            {(requiresApproval || isFinalized) && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6D8AA2] font-medium">Manager Decision:</span>
                <div>
                  {isAuthorized ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>
                        {workOrder.approvedAt
                          ? `Authorized on ${formatDate(workOrder.approvedAt)}`
                          : "Authorized by Administrator"}
                      </span>
                    </span>
                  ) : workOrder.status === "CANCELLED" || workOrder.approvalStatus === "REJECTED" ? (
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

            {/* Sequential Re-approval Action */}
            {isWorkOrderActive && canManageFleet && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={hasPendingApprovalRequest}
                  onClick={() => {
                    setReapprovalAmount(String(workOrder.estimatedCost || ""));
                    setReapprovalRemarks("");
                    setReapprovalError("");
                    setShowReapprovalModal(true);
                  }}
                  title={
                    hasPendingApprovalRequest
                      ? "A re-approval request is already pending reviewer sign-off"
                      : "Request managerial approval for revised quotation"
                  }
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                    hasPendingApprovalRequest
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-[#E8F3F8] hover:bg-[#d6ebf5] text-[#0A4B6E] border-[#BCE1F1]"
                  }`}
                >
                  <RotateCcw size={14} />
                  <span>
                    {hasPendingApprovalRequest
                      ? "Re-approval Request Pending Review"
                      : "Request Re-approval (Revised Quote)"}
                  </span>
                </button>
              </div>
            )}

            {/* Approval Request Sequential History */}
            {approvalRequests.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A4B6E] block">
                  Approval History ({approvalRequests.length})
                </span>
                <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                  {approvalRequests.map((req, idx) => (
                    <div
                      key={req.id || idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0A4B6E]">
                          {formatCurrency(req.amountRequested)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            req.isApproved === true || req.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : req.isApproved === false || req.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {req.isApproved === true || req.status === "APPROVED"
                            ? "APPROVED"
                            : req.isApproved === false || req.status === "REJECTED"
                            ? "REJECTED"
                            : "PENDING"}
                        </span>
                      </div>
                      {req.remarks && (
                        <p className="text-slate-600 text-[11px] italic">"{req.remarks}"</p>
                      )}
                      {req.decisionRemarks && (
                        <p className="text-[#0A4B6E] text-[10.5px]">Decision: "{req.decisionRemarks}"</p>
                      )}
                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                        <span>Requested: {formatDate(req.createdAt)}</span>
                        {req.decidedAt && <span>Decided: {formatDate(req.decidedAt)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 6. SUPPORTING AUDIT RECEIPTS & DOCUMENTATION */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs space-y-3">
          <ReceiptAttachmentManager
            receipts={attachedReceipts?.length > 0 ? attachedReceipts : (matchedLog?.receipts || workOrder.receipts || [])}
          />
        </div>
      </div>

      {/* RE-APPROVAL REQUEST MODAL */}
      <Modal
        isOpen={showReapprovalModal}
        onClose={() => setShowReapprovalModal(false)}
        title="Submit Re-approval Request"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRequestReapproval} className="space-y-3.5 text-left py-1">
          <p className="text-xs text-slate-600">
            Submit a revised quotation request for WO #{workOrder.workOrderNumber || workOrder.id?.slice(0, 8)}.
            Once submitted, managerial review will be required before work continues.
          </p>

          {reapprovalError && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-2.5 rounded-xl text-xs">
              {reapprovalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1">
              Revised Amount (PHP) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-gray-500">₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={reapprovalAmount}
                onChange={(e) => setReapprovalAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl pl-7 pr-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1">
              Justification & Scope Change Remarks <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reapprovalRemarks}
              onChange={(e) => setReapprovalRemarks(e.target.value)}
              placeholder="Explain why cost estimate changed (e.g. additional damaged parts discovered during tear-down)..."
              className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] resize-none"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              variant="yellow"
              disabled={isSubmittingReapproval}
              className="w-full text-xs font-bold uppercase tracking-wider"
            >
              {isSubmittingReapproval ? "SUBMITTING..." : "CONFIRM RE-APPROVAL REQUEST"}
            </Button>
            <Button
              type="button"
              variant="cancel"
              disabled={isSubmittingReapproval}
              onClick={() => setShowReapprovalModal(false)}
              className="w-full text-xs"
            >
              CANCEL
            </Button>
          </div>
        </form>
      </Modal>
    </SideDrawer>
  );
}

// src/components/fleet/TruckDetailPanel.jsx
import {
  Pencil,
  Trash2,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Gauge,
  Wrench,
  UserPlus,
  History,
  Route,
  UserRound,
} from "lucide-react";
import Badge from "../ui/Badge";
import { checkActiveWorkOrder } from "../../utils/fleetGuards.js";

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

export default function TruckDetailPanel({
  truck,
  onClose,
  onEdit,
  onDelete,
  onReactivate,
  onAssignDriver,
  onInspect,
  onInspectionHistory,
  onReportIncident,
  onIncidentHistory,
  onRecordOdometer,
  onOdometerHistory,
  onWorkOrder,
  workOrders = [],
  canManage = true,
}) {
  if (!truck) return null;

  const currentOdo = Number(truck.currentOdometer) || 0;
  const lastPmOdo = Number(
    truck.lastPmOdometer !== undefined
      ? truck.lastPmOdometer
      : truck.lastPMOdometer || 0
  );
  const distanceSinceLastPm = Math.max(0, currentOdo - lastPmOdo);
  const isPmDue =
    truck.pmDueFlag !== undefined
      ? Boolean(truck.pmDueFlag)
      : truck.isPmDue !== undefined
      ? Boolean(truck.isPmDue)
      : distanceSinceLastPm >= 5000;
  const pmPercent = Math.min(
    100,
    Math.round((distanceSinceLastPm / 5000) * 100)
  );

  const isDeactivated =
    (truck.status || "").toUpperCase() === "INACTIVE" ||
    (truck.status || "").toUpperCase() === "RETIRED";

  const driverDisplay = truck.driver
    ? `${truck.driver.firstName || ""} ${truck.driver.lastName || ""}`.trim() ||
      truck.driver.username
    : truck.driverName && truck.driverName !== "Unassigned" && truck.driverName !== "No Assigned"
    ? truck.driverName
    : "No Assigned";

  const { hasActiveWorkOrder } = checkActiveWorkOrder(
    truck,
    workOrders
  );

  const latestInspection = truck.latestInspection || null;
  const inspectionResult = (
    truck.lastInspectionResult ||
    truck.latestInspectionResult ||
    latestInspection?.result ||
    (truck.hasPendingIssues ? "NEEDS_ATTENTION" : "") ||
    ""
  ).toUpperCase();

  const hasNeedsAttention = inspectionResult === "NEEDS_ATTENTION";
  const isDispatchRestricted =
    hasNeedsAttention &&
    (latestInspection?.allowDispatch === false || truck.allowDispatch === false);

  const advisoryTooltip = isDispatchRestricted
    ? `Safety inspection flagged items requiring attention — Dispatch restricted${
        latestInspection?.findings ? `: "${latestInspection.findings}"` : ""
      }`
    : `Safety inspection flagged items requiring attention${
        latestInspection?.findings ? `: "${latestInspection.findings}"` : ""
      }`;

  return (
    <div className="flex flex-col gap-3.5 text-left font-sans">
      {/* 1. TOP METADATA & MANAGEMENT ACTION BAR */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-600">
            {(truck.vehicleType || "DELIVERY_TRUCK").replace("_", " ")}
          </span>
          {truck.tankNumber && (
            <span className="text-xs font-mono font-bold text-[#0A4B6E] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Tank #{truck.tankNumber}
            </span>
          )}
          {isPmDue && (
            <Badge variant="danger" className="px-2 py-0.5 text-[10px] font-bold">
              PM DUE
            </Badge>
          )}
          {hasNeedsAttention && (
            <Badge
              variant="warning"
              className="px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 cursor-help"
              title={advisoryTooltip}
            >
              <AlertTriangle size={11} className="shrink-0 text-[#B06000]" />
              <span>{isDispatchRestricted ? "RESTRICTED" : "NEEDS ATTN"}</span>
            </Badge>
          )}
        </div>

        {canManage && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEdit && onEdit(truck)}
              aria-label="Edit Vehicle Profile"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-[#0A4B6E] border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
              title="Edit Vehicle Profile"
            >
              <Pencil size={15} />
            </button>

            {isDeactivated ? (
              <button
                type="button"
                onClick={() => onReactivate && onReactivate(truck)}
                aria-label="Reactivate Vehicle"
                className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
                title="Reactivate Vehicle"
              >
                <RotateCcw size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onDelete && onDelete(truck)}
                aria-label="Deactivate Vehicle"
                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                title="Deactivate Vehicle"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. PRIMARY OPERATIONAL ACTIONS */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onInspect && onInspect(truck)}
          disabled={!canManage}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-white hover:bg-[#0A4B6E] text-[#0A4B6E] hover:text-white border border-[#BCE1F1] hover:border-[#0A4B6E] shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 h-[36px]"
          title="Record Safety Inspection"
        >
          <ShieldCheck size={14} className="shrink-0" />
          <span>Safety Inspection</span>
        </button>

        <button
          type="button"
          onClick={() => onWorkOrder && onWorkOrder(truck)}
          disabled={!canManage}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 h-[36px] ${
            hasActiveWorkOrder
              ? "bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border-rose-200 hover:border-rose-600"
              : "bg-white hover:bg-[#FFDF2C] text-[#0A4B6E] border-[#BCE1F1] hover:border-[#FFDF2C]"
          }`}
          title={hasActiveWorkOrder ? "View Active Work Order" : "Create Work Order"}
        >
          <Wrench size={14} className="shrink-0" />
          <span>{hasActiveWorkOrder ? "Active Work Order" : "Create Work Order"}</span>
        </button>

        <button
          type="button"
          onClick={() => onRecordOdometer && onRecordOdometer(truck)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-white hover:bg-[#0A4B6E] text-[#0A4B6E] hover:text-white border border-slate-200 hover:border-[#0A4B6E] shadow-2xs transition-all active:scale-95 cursor-pointer h-[36px]"
          title="Record Return Odometer Reading"
        >
          <Gauge size={14} className="shrink-0" />
          <span>Record Odometer</span>
        </button>

        <button
          type="button"
          onClick={() => onReportIncident && onReportIncident(truck)}
          disabled={!canManage}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-white hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-200 hover:border-amber-600 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 h-[36px]"
          title="Report Roadside Incident"
        >
          <AlertTriangle size={14} className="shrink-0" />
          <span>Report Incident</span>
        </button>
      </div>

      {/* 3. SECTION: OPERATIONAL & DRIVER PROFILE */}
      <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
          <Route size={13} className="text-[#0A4B6E]" />
          <span>Operational & Driver Profile</span>
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-slate-500 flex items-center gap-1.5 text-xs">
                <UserRound size={13} className="text-slate-400" />
                <span>Assigned Driver:</span>
              </span>
              <span className="font-bold text-[#0A4B6E] truncate block text-xs mt-0.5" title={driverDisplay}>
                {driverDisplay}
              </span>
            </div>
            {canManage && onAssignDriver && (
              <button
                type="button"
                onClick={() => onAssignDriver(truck)}
                aria-label="Assign or Change Driver"
                className="h-[28px] px-2.5 flex items-center justify-center gap-1 rounded-lg text-xs font-semibold bg-white hover:bg-[#0A4B6E] text-[#0A4B6E] hover:text-white border border-slate-200 hover:border-[#0A4B6E] shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                title="Assign or Change Driver"
              >
                <UserPlus size={12} />
                <span>{truck.driverId || truck.driver ? "Change" : "Assign"}</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Route size={13} className="text-slate-400" />
              <span>Designated Route</span>
            </span>
            <span className="font-bold text-[#0A4B6E]">
              {truck.designatedRoute || "Standard Fleet Route"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Vehicle Classification</span>
            <span className="font-semibold text-slate-700">
              {(truck.vehicleType || "DELIVERY_TRUCK").replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Active Grounding or Dispatch Alert */}
        {(truck.activeRepair ||
          truck.status === "UNDER_MAINTENANCE" ||
          truck.isGrounded) && (
          <div className="mt-2 bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-xs text-rose-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#CD3E3E]">
              <AlertTriangle size={13} className="shrink-0" />
              <span>Vehicle Grounded Under Maintenance</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-700">
              {truck.activeRepair ||
                "Vehicle is barred from dispatch until repairs are completed and cleared."}
            </p>
          </div>
        )}

        {hasNeedsAttention && !truck.activeRepair && truck.status !== "UNDER_MAINTENANCE" && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertTriangle size={13} className="shrink-0" />
              <span>Safety Inspection Advisory</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-700">
              {advisoryTooltip}
            </p>
          </div>
        )}
      </div>

      {/* 4. SECTION: ODOMETER & PREVENTIVE MAINTENANCE */}
      <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
          <Gauge size={13} className="text-[#0A4B6E]" />
          <span>Odometer & PM Progress</span>
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Current Odometer</span>
            <span className="font-mono font-bold text-[#0A4B6E] text-xs md:text-sm">
              {currentOdo.toLocaleString()} KM
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Last PM Baseline</span>
            <span className="font-mono font-medium text-slate-700">
              {lastPmOdo.toLocaleString()} KM
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Next PM Target</span>
            <span className="font-mono font-medium text-slate-700">
              {(lastPmOdo + 5000).toLocaleString()} KM
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">5,000-KM Interval:</span>
              <span className={`font-bold text-xs ${isPmDue ? "text-[#C93B32]" : "text-[#0A4B6E]"}`}>
                {distanceSinceLastPm.toLocaleString()} / 5,000 KM ({pmPercent}%)
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
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
              <p className="text-[#CD3E3E] font-bold text-[11px] flex items-center gap-1 mt-1">
                <AlertTriangle size={11} className="shrink-0" />
                <span>PM overdue by {(distanceSinceLastPm - 5000).toLocaleString()} KM. Service required.</span>
              </p>
            ) : distanceSinceLastPm >= 4000 ? (
              <p className="text-amber-800 font-medium text-[11px] flex items-center gap-1 mt-1">
                <AlertTriangle size={11} className="shrink-0" />
                <span>PM approaching: {(5000 - distanceSinceLastPm).toLocaleString()} KM remaining.</span>
              </p>
            ) : (
              <p className="text-emerald-700 font-medium text-[11px] mt-1">
                PM healthy: {(5000 - distanceSinceLastPm).toLocaleString()} KM remaining before scheduled service.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 5. SECTION: AUDIT & HISTORY LOGS ARCHIVES */}
      <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
          <History size={13} className="text-[#0A4B6E]" />
          <span>Audit & Historical Records</span>
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {onOdometerHistory && (
            <button
              type="button"
              onClick={() => onOdometerHistory(truck)}
              className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-[#0A4B6E] text-[#0A4B6E] hover:text-white border border-slate-200 hover:border-[#0A4B6E] shadow-2xs transition-all active:scale-95 cursor-pointer h-[32px]"
              title="View Odometer Return Logs"
            >
              <Gauge size={13} className="shrink-0" />
              <span className="truncate">Odometer</span>
            </button>
          )}

          {onInspectionHistory && (
            <button
              type="button"
              onClick={() => onInspectionHistory(truck)}
              className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-[#0A4B6E] text-[#0A4B6E] hover:text-white border border-slate-200 hover:border-[#0A4B6E] shadow-2xs transition-all active:scale-95 cursor-pointer h-[32px]"
              title="View Inspection Logs"
            >
              <ShieldCheck size={13} className="shrink-0" />
              <span className="truncate">Inspection</span>
            </button>
          )}

          {onIncidentHistory && (
            <button
              type="button"
              onClick={() => onIncidentHistory(truck)}
              className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-amber-600 text-amber-800 hover:text-white border border-slate-200 hover:border-amber-600 shadow-2xs transition-all active:scale-95 cursor-pointer h-[32px]"
              title="View Incident Logs"
            >
              <AlertTriangle size={13} className="shrink-0" />
              <span className="truncate">Incidents</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// src/components/fleet/TruckDetailPanel.jsx
import {
  Truck,
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
    <div className="w-full h-full bg-white border border-[#0A4B6E]/20 rounded-2xl shadow-sm p-4 flex flex-col overflow-hidden text-left font-sans">
      {/* 1. TOP HEADER BANNER */}
      <div className="shrink-0 rounded-xl p-3.5 bg-[#F4F8FA] border border-[#BCE1F1]/70 mb-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 shadow-sm font-bold">
              <Truck size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#0A4B6E] truncate leading-tight">
                {truck.plateNumber || `Truck #${truck.truckId || truck.id}`}
              </h2>
              <p className="text-xs text-[#6D8AA2] font-medium mt-0.5 truncate">
                {truck.model || "Isuzu Elf"} {truck.yearModel ? `(${truck.yearModel})` : ""}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          {canManage && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEdit && onEdit(truck)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-[#0A4B6E] transition-colors cursor-pointer"
                title="Edit Vehicle"
              >
                <Pencil size={15} />
              </button>

              {isDeactivated ? (
                <button
                  type="button"
                  onClick={() => onReactivate && onReactivate(truck)}
                  className="p-1.5 rounded-full hover:bg-emerald-100 text-emerald-600 transition-colors cursor-pointer"
                  title="Reactivate Vehicle"
                >
                  <RotateCcw size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onDelete && onDelete(truck)}
                  className="p-1.5 rounded-full hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                  title="Deactivate Vehicle"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Status & Badges Row */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#BCE1F1]/50 flex-wrap">
          <Badge
            variant={getStatusVariant(truck.status)}
            className="px-3 py-0.5 text-xs font-bold"
          >
            {truck.status?.replace("_", " ") || "ACTIVE"}
          </Badge>

          {truck.vehicleType && (
            <Badge
              variant="info"
              className="px-2.5 py-0.5 text-xs font-bold"
            >
              {truck.vehicleType.replace("_", " ")}
            </Badge>
          )}

          {isPmDue ? (
            <Badge variant="danger" className="px-2.5 py-0.5 text-[10px] font-extrabold">
              PM DUE
            </Badge>
          ) : distanceSinceLastPm >= 4000 ? (
            <Badge variant="warning" className="px-2.5 py-0.5 text-[10px] font-bold">
              PM NEAR
            </Badge>
          ) : null}

          {hasNeedsAttention && (
            <Badge
              variant="warning"
              className="px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1 cursor-help"
              title={advisoryTooltip}
            >
              <AlertTriangle size={11} className="shrink-0 text-[#B06000]" />
              <span>{isDispatchRestricted ? "RESTRICTED" : "NEEDS ATTN"}</span>
            </Badge>
          )}

          {truck.tankNumber && (
            <span className="text-[11px] font-semibold text-[#0A4B6E] bg-white px-2.5 py-0.5 rounded-full border border-slate-200 font-mono">
              Tank #{truck.tankNumber}
            </span>
          )}
        </div>

        {/* Quick Operations Toolbar */}
        <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-[#BCE1F1]/60">
          <button
            type="button"
            onClick={() => onInspect && onInspect(truck)}
            disabled={!canManage}
            className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-semibold bg-white hover:bg-[#0A4B6E] text-[#0A4B6E] hover:text-white border border-[#BCE1F1] hover:border-[#0A4B6E] shadow-2xs transition-all active:scale-95 cursor-pointer h-[30px] disabled:opacity-50"
            title="Record Safety Inspection"
          >
            <ShieldCheck size={12} className="shrink-0" />
            <span className="truncate">Inspect</span>
          </button>

          <button
            type="button"
            onClick={() => onReportIncident && onReportIncident(truck)}
            disabled={!canManage}
            className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-semibold bg-white hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 hover:border-amber-600 shadow-2xs transition-all active:scale-95 cursor-pointer h-[30px] disabled:opacity-50"
            title="Report Roadside Incident"
          >
            <AlertTriangle size={12} className="shrink-0" />
            <span className="truncate">Report</span>
          </button>

          <button
            type="button"
            onClick={() => onRecordOdometer && onRecordOdometer(truck)}
            className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-semibold bg-white hover:bg-[#0A4B6E] text-[#0A4B6E] hover:text-white border border-[#BCE1F1] hover:border-[#0A4B6E] shadow-2xs transition-all active:scale-95 cursor-pointer h-[30px]"
            title="Record Return Odometer Reading"
          >
            <Gauge size={12} className="shrink-0" />
            <span className="truncate">Record</span>
          </button>

          <button
            type="button"
            onClick={() => onWorkOrder && onWorkOrder(truck)}
            disabled={!canManage}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-semibold border shadow-2xs transition-all active:scale-95 cursor-pointer h-[30px] disabled:opacity-50 ${
              hasActiveWorkOrder
                ? "bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border-rose-200 hover:border-rose-600"
                : "bg-white hover:bg-[#FFDF2C] text-[#0A4B6E] border-[#BCE1F1] hover:border-[#FFDF2C]"
            }`}
            title={hasActiveWorkOrder ? "View Active Work Order" : "Create Work Order"}
          >
            <Wrench size={12} className="shrink-0" />
            <span className="truncate">Order</span>
          </button>
        </div>
      </div>

      {/* 2. SCROLLABLE CONTENT BODY */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 pr-0.5">
        {/* SECTION: OPERATIONAL & DRIVER PROFILE */}
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
            <Route size={13} className="text-[#0A4B6E]" />
            <span>Operational & Driver Profile</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Vehicle Classification</span>
              <span className="font-bold text-[#0A4B6E]">
                {(truck.vehicleType || "DELIVERY_TRUCK").replace("_", " ")}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Route size={13} className="text-slate-400" />
                <span>Designated Route</span>
              </span>
              <span className="font-bold text-[#0A4B6E]">
                {truck.designatedRoute || "Admin4"}
              </span>
            </div>

            {truck.tankNumber && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Gauge size={13} className="text-slate-400" />
                  <span>Tank Number</span>
                </span>
                <span className="font-bold font-mono text-[#0A4B6E]">
                  {truck.tankNumber}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
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
                  className="h-[28px] px-2.5 flex items-center justify-center gap-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-[#0A4B6E] text-[#0A4B6E] hover:text-white border border-slate-200 hover:border-[#0A4B6E] shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                  title="Assign or Change Driver"
                >
                  <UserPlus size={12} />
                  <span>{truck.driverId || truck.driver ? "Change" : "Assign"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Repair or Grounding Alert */}
          {(truck.activeRepair ||
            truck.status === "UNDER_MAINTENANCE" ||
            truck.isGrounded) && (
            <div className="mt-2 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#CD3E3E]">
                <AlertTriangle size={13} className="shrink-0" />
                <span>Grounding Alert / Service Required</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-700">
                {truck.activeRepair ||
                  "Vehicle grounded under maintenance. Driver soft-binding retained."}
              </p>
            </div>
          )}

          {/* Dispatch Restriction Alert */}
          {hasNeedsAttention && !truck.activeRepair && truck.status !== "UNDER_MAINTENANCE" && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 space-y-1">
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

        {/* SECTION: ODOMETER & PM PROGRESS */}
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
            <Gauge size={13} className="text-[#0A4B6E]" />
            <span>Odometer & PM Progress</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Current Odometer</span>
              <span className="font-mono font-bold text-[#0A4B6E]">
                {currentOdo.toLocaleString()} KM
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Last PM Baseline</span>
              <span className="font-mono font-bold text-[#0A4B6E]">
                {lastPmOdo.toLocaleString()} KM
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Next PM Target</span>
              <span className="font-mono font-bold text-[#0A4B6E]">
                {(lastPmOdo + 5000).toLocaleString()} KM
              </span>
            </div>

            {/* PM Health Progress Bar */}
            <div className="pt-1.5 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-500 font-medium">5,000-KM Interval</span>
                <span className={`font-bold ${isPmDue ? "text-[#C93B32]" : "text-[#0A4B6E]"}`}>
                  {distanceSinceLastPm.toLocaleString()} / 5,000 KM ({pmPercent}%)
                </span>
              </div>

              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-1.5">
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
                <p className="text-[#CD3E3E] font-bold text-[10.5px] flex items-center gap-1">
                  <AlertTriangle size={11} className="shrink-0" />
                  <span>PM overdue by {(distanceSinceLastPm - 5000).toLocaleString()} KM.</span>
                </p>
              ) : distanceSinceLastPm >= 4000 ? (
                <p className="text-amber-700 font-medium text-[10.5px] flex items-center gap-1">
                  <AlertTriangle size={11} className="shrink-0" />
                  <span>PM approaching: {(5000 - distanceSinceLastPm).toLocaleString()} KM remaining.</span>
                </p>
              ) : (
                <p className="text-emerald-700 font-medium text-[10.5px]">
                  PM healthy: {(5000 - distanceSinceLastPm).toLocaleString()} KM remaining.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION: AUDIT & HISTORY LOGS ARCHIVES */}
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
            <History size={13} className="text-[#0A4B6E]" />
            <span>Audit & History Logs</span>
          </h3>

          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            {onOdometerHistory && (
              <button
                type="button"
                onClick={() => onOdometerHistory(truck)}
                className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-semibold bg-white hover:bg-[#0A4B6E] text-[#0A4B6E] hover:text-white border border-slate-200 hover:border-[#0A4B6E] shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="View Odometer Return Logs"
              >
                <Gauge size={12} className="shrink-0" />
                <span className="truncate">Odometer</span>
              </button>
            )}

            {onInspectionHistory && (
              <button
                type="button"
                onClick={() => onInspectionHistory(truck)}
                className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-semibold bg-white hover:bg-[#0A4B6E] text-[#0A4B6E] hover:text-white border border-slate-200 hover:border-[#0A4B6E] shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="View Inspection Logs"
              >
                <ShieldCheck size={12} className="shrink-0" />
                <span className="truncate">Inspection</span>
              </button>
            )}

            {onIncidentHistory && (
              <button
                type="button"
                onClick={() => onIncidentHistory(truck)}
                className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-semibold bg-white hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 hover:border-amber-600 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="View Incident Logs"
              >
                <AlertTriangle size={12} className="shrink-0" />
                <span className="truncate">Incidents</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. PINNED BOTTOM CLOSE BUTTON */}
      <div className="shrink-0 pt-3 border-t border-slate-200 mt-2">
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider py-2.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}


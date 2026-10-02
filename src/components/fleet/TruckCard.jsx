// src/components/fleet/TruckCard.jsx
import { Truck, List, AlertTriangle } from "lucide-react";
import Badge from "../ui/Badge";

export default function TruckCard({
  truck,
  isSelected = false,
  onClick,
}) {
  const normalizedStatus = (truck.status || truck.operationalStatus || "").toUpperCase().replace("_", " ");

  const getStatusVariant = (status) => {
    switch (status) {
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

  const driverDisplay = truck.driver
    ? `${truck.driver.firstName || ""} ${truck.driver.lastName || ""}`.trim() || truck.driver.username
    : truck.driverName && truck.driverName !== "Unassigned" && truck.driverName !== "No Assigned"
    ? truck.driverName
    : "No Assigned";

  const currentOdo = Number(truck.currentOdometer) || 0;
  const lastPmOdo = Number(
    truck.lastPmOdometer !== undefined
      ? truck.lastPmOdometer
      : truck.lastPMOdometer || 0
  );
  const distanceSinceLastPm = Math.max(0, currentOdo - lastPmOdo);
  const isPmDue = truck.isPmDue !== undefined ? Boolean(truck.isPmDue) : distanceSinceLastPm >= 5000;
  const pmPercent = Math.min(100, Math.round((distanceSinceLastPm / 5000) * 100));

  const odometerDisplay = `${currentOdo.toLocaleString()} KM`;

  // Safety Inspection Advisory Derivation
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
    <div
      onClick={() => onClick && onClick(truck)}
      className={`relative transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between rounded-2xl p-4 sm:p-5 border text-left ${
        isSelected
          ? "bg-slate-100/90 border-slate-300 shadow-sm"
          : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
      }`}
    >
      <div>
        {/* CARD HEADER */}
        <div
          className={`rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 mb-3.5 transition-all duration-200 border ${
            isSelected
              ? "bg-white text-[#0A4B6E] border-slate-200/80 shadow-2xs"
              : "bg-[#F4F8FA] text-[#0A4B6E] border-slate-200/80"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold shadow-xs bg-[#0A4B6E] text-[#FFDF2C]">
              <Truck size={16} />
            </div>
            <h3 className="font-bold text-base sm:text-lg tracking-wide truncate">
              {truck.plateNumber || `Truck #${truck.truckId || truck.id}`}
            </h3>
          </div>

          {/* PM DUE / NEAR BADGE */}
          {isPmDue ? (
            <Badge variant="danger" className="px-2.5 py-0.5 text-[10px] font-extrabold shrink-0">
              PM DUE
            </Badge>
          ) : distanceSinceLastPm >= 4000 ? (
            <Badge variant="warning" className="px-2 py-0.5 text-[10px] font-bold shrink-0">
              PM NEAR
            </Badge>
          ) : null}
        </div>

        {/* CARD BODY */}
        <div className="space-y-2 text-xs md:text-[13px] leading-relaxed mb-3 px-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#6D8AA2] font-medium">
              Driver:
            </span>
            <span className="font-bold text-[#0A4B6E] truncate max-w-[60%] text-right">
              {driverDisplay}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[#6D8AA2] font-medium">
              Model:
            </span>
            <span className="font-bold text-[#0A4B6E] truncate max-w-[60%] text-right">
              {truck.model || "Isuzu Elf"} {truck.yearModel ? `(${truck.yearModel})` : ""}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[#6D8AA2] font-medium">
              Current Odometer:
            </span>
            <span className="font-bold font-mono text-[#0A4B6E]">
              {odometerDisplay}
            </span>
          </div>

          {/* 5,000-KM PREVENTIVE MAINTENANCE HEALTH PROGRESS */}
          <div
            className={`pt-2 border-t ${
              isSelected ? "border-slate-200/80" : "border-slate-100"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] mb-1.5 gap-1.5">
              <span className="text-[#6D8AA2] font-medium shrink-0">
                PM Progress:
              </span>
              <span
                className={`font-bold truncate text-right ${
                  isPmDue
                    ? "text-[#C93B32]"
                    : distanceSinceLastPm >= 4000
                    ? "text-amber-700"
                    : "text-[#0A4B6E]"
                }`}
              >
                {distanceSinceLastPm.toLocaleString()} / 5,000 KM ({pmPercent}%)
              </span>
            </div>

            <div className="w-full h-2 rounded-full overflow-hidden bg-slate-100 border border-slate-200/60">
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
          </div>
        </div>
      </div>

      {/* CARD FOOTER */}
      <div
        className={`flex items-center justify-between mt-auto pt-2.5 border-t px-0.5 ${
          isSelected ? "border-slate-200/80" : "border-slate-100"
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <Badge variant={getStatusVariant(normalizedStatus)} className="px-3 py-0.5 text-[10.5px] shrink-0">
            {normalizedStatus || "ACTIVE"}
          </Badge>

          {hasNeedsAttention && (
            <Badge
              variant="warning"
              className="px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1 cursor-help shrink-0"
              title={advisoryTooltip}
            >
              <AlertTriangle size={11} className="shrink-0 text-[#B06000]" />
              <span>
                {isDispatchRestricted ? "NEEDS ATTN (RESTRICTED)" : "NEEDS ATTENTION"}
              </span>
            </Badge>
          )}
        </div>

        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 border shadow-2xs shrink-0 ml-2 ${
            isSelected
              ? "bg-[#0A4B6E] text-[#FFDF2C] border-slate-300"
              : "bg-[#F4F8FA] text-[#0A4B6E] border-slate-200"
          }`}
          title="View Full Vehicle Details"
        >
          <List size={14} className="stroke-[2.2]" />
        </div>
      </div>
    </div>
  );
}
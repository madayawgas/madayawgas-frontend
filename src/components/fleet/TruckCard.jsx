// src/components/fleet/TruckCard.jsx
import { Truck, List, AlertTriangle } from "lucide-react";
import Badge from "../ui/Badge";

export default function TruckCard({ truck, onClick }) {
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
    : truck.driverName && truck.driverName !== "Unassigned"
    ? truck.driverName
    : "No Assigned";

  const currentOdo = Number(truck.currentOdometer) || 0;
  const lastPmOdo = Number(truck.lastPmOdometer) || 0;
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
      className="group bg-[#E8F3F8] hover:bg-[#FEF6D1] transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between rounded-2xl p-5 border border-[#BCE1F1] hover:border-[#F6C445]/60 shadow-xs"
    >
      {/* CARD HEADER PILL */}
      <div className="bg-[#BAE6FD]/60 group-hover:bg-[#FEECA5] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 mb-3.5 text-[#0A4B6E] group-hover:text-[#854D0E] transition-all duration-200 border border-[#BCE1F1]/50 group-hover:border-[#F6C445]/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#0A4B6E] group-hover:bg-[#854D0E] text-[#FFDF2C] flex items-center justify-center shrink-0 font-bold shadow-xs transition-colors">
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
      <div className="space-y-2 text-xs md:text-[13px] leading-relaxed mb-4 px-0.5 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[#5B8399] group-hover:text-[#A88B3D] transition-colors font-medium">Driver:</span>
          <span className="font-bold text-[#0A4B6E] group-hover:text-[#854D0E] transition-colors truncate max-w-[60%] text-right">
            {driverDisplay}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[#5B8399] group-hover:text-[#A88B3D] transition-colors font-medium">Model:</span>
          <span className="font-bold text-[#0A4B6E] group-hover:text-[#854D0E] transition-colors truncate max-w-[60%] text-right">
            {truck.model || "Isuzu Elf"} {truck.yearModel ? `(${truck.yearModel})` : ""}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[#5B8399] group-hover:text-[#A88B3D] transition-colors font-medium">Current Odometer:</span>
          <span className="font-bold text-[#0A4B6E] group-hover:text-[#854D0E] transition-colors">
            {odometerDisplay}
          </span>
        </div>

        {/* 5,000-KM PREVENTIVE MAINTENANCE HEALTH PROGRESS */}
        <div className="pt-2 border-t border-[#BCE1F1]/40 group-hover:border-[#F6C445]/30 transition-colors">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-[#5B8399] group-hover:text-[#A88B3D] transition-colors font-medium">
              PM Progress:
            </span>
            <span
              className={`font-bold transition-colors ${
                isPmDue
                  ? "text-[#C93B32]"
                  : distanceSinceLastPm >= 4000
                  ? "text-amber-700 group-hover:text-amber-800"
                  : "text-[#0A4B6E] group-hover:text-[#854D0E]"
              }`}
            >
              {distanceSinceLastPm.toLocaleString()} / 5,000 KM ({pmPercent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-[#BAE6FD]/70 group-hover:bg-[#FEECA5]/90 rounded-full overflow-hidden transition-colors">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isPmDue
                  ? "bg-[#CD3E3E]"
                  : distanceSinceLastPm >= 4000
                  ? "bg-[#F6C445]"
                  : "bg-[#0A4B6E] group-hover:bg-[#854D0E]"
              }`}
              style={{ width: `${pmPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* CARD FOOTER */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#BCE1F1]/40 group-hover:border-[#F6C445]/30 transition-colors px-0.5">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <Badge variant={getStatusVariant(normalizedStatus)} className="px-3.5 py-0.5 text-[10.5px] shrink-0">
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

        <div className="w-8 h-8 rounded-full bg-[#BAE6FD]/70 group-hover:bg-[#FFDF2C] text-[#0A4B6E] group-hover:text-[#0A4B6E] flex items-center justify-center transition-all duration-200 border border-[#BCE1F1]/60 group-hover:border-[#F6C445] shadow-2xs shrink-0 ml-2">
          <List size={15} className="stroke-[2.2]" />
        </div>
      </div>
    </div>
  );
}
// src/components/fleet/TruckCard.jsx
import { AlertTriangle, ChevronRight, Truck, UserRound } from "lucide-react";
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
  const isPmDue =
    truck.pmDueFlag !== undefined
      ? Boolean(truck.pmDueFlag)
      : truck.isPmDue !== undefined
      ? Boolean(truck.isPmDue)
      : distanceSinceLastPm >= 5000;
  const pmPercent = Math.min(100, Math.round((distanceSinceLastPm / 5000) * 100));

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
      className={`rounded-xl p-4 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between border shadow-2xs hover:shadow-xs ${
        isSelected
          ? "bg-[#F4F9FC] border-[#0A4B6E]/40 ring-1 ring-[#0A4B6E]/30"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      <div>
        {/* CARD TOP LINE: Plate & Operational Status */}
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold shadow-2xs bg-[#0A4B6E] text-[#FFDF2C]">
              <Truck size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-[#0A4B6E] tracking-wide truncate">
                {truck.plateNumber || `Truck #${truck.truckId || truck.id}`}
              </h3>
              <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
                {[
                  truck.model || "Isuzu Elf",
                  truck.yearModel ? `(${truck.yearModel})` : null,
                  truck.vehicleType ? truck.vehicleType.replace("_", " ") : null,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <Badge
              variant={getStatusVariant(normalizedStatus)}
              className="px-2.5 py-0.5 text-xs font-semibold"
            >
              {normalizedStatus || "ACTIVE"}
            </Badge>

            {isPmDue ? (
              <Badge variant="danger" className="px-2 py-0.5 text-[10px] font-bold shrink-0">
                PM DUE
              </Badge>
            ) : distanceSinceLastPm >= 4000 ? (
              <Badge variant="warning" className="px-2 py-0.5 text-[10px] font-bold shrink-0">
                NEAR
              </Badge>
            ) : null}
          </div>
        </div>

        {/* CARD BODY METRICS */}
        <div className="space-y-2 py-3 text-xs leading-relaxed">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <UserRound size={13} className="text-slate-400 shrink-0" />
              <span>Assigned Driver:</span>
            </span>
            <span
              className={`truncate max-w-[65%] text-right ${
                driverDisplay !== "No Assigned" && driverDisplay !== "Unassigned"
                  ? "font-semibold text-[#0A4B6E]"
                  : "text-slate-400 italic"
              }`}
            >
              {driverDisplay}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Current Odometer:</span>
            <span className="font-bold font-mono text-[#0A4B6E] text-xs">
              {currentOdo.toLocaleString()} KM
            </span>
          </div>

          {/* PM Progress */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <div className="flex items-center justify-between text-xs gap-1.5">
              <span className="text-slate-500 font-medium">PM Interval:</span>
              <span
                className={`font-semibold text-[11px] truncate text-right ${
                  isPmDue
                    ? "text-[#C93B32]"
                    : distanceSinceLastPm >= 4000
                    ? "text-amber-800"
                    : "text-[#0A4B6E]"
                }`}
              >
                {distanceSinceLastPm.toLocaleString()} / 5,000 KM ({pmPercent}%)
              </span>
            </div>

            <div className="w-full h-1 rounded-full overflow-hidden bg-slate-100 border border-slate-200/50">
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
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
        <div className="min-w-0">
          {hasNeedsAttention ? (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 truncate cursor-help"
              title={advisoryTooltip}
            >
              <AlertTriangle size={11} className="shrink-0 text-amber-600" />
              <span>{isDispatchRestricted ? "Needs Attention (Restricted)" : "Needs Attention"}</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 font-medium">
              {truck.designatedRoute ? `Route: ${truck.designatedRoute}` : "Standard Route"}
            </span>
          )}
        </div>

        <span className="text-xs font-semibold text-[#0A4B6E] flex items-center gap-0.5 hover:underline ml-2 shrink-0">
          <span>Details</span>
          <ChevronRight size={13} />
        </span>
      </div>
    </div>
  );
}

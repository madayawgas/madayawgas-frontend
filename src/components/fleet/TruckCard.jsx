// src/components/fleet/TruckCard.jsx
import { Truck, List, Gauge, History, ShieldCheck, AlertTriangle, AlertOctagon, Wrench } from "lucide-react";
import Badge from "../ui/Badge";

export default function TruckCard({
  truck,
  onClick,
  onCheckIn,
  onHistory,
  onInspect,
  onReportIncident,
  onCreateWorkOrder,
}) {
  const normalizedStatus = (truck.status || truck.operationalStatus || "").toUpperCase().replace("_", " ");
  const isGrounded = normalizedStatus === "UNDER MAINTENANCE";

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

  const hasDriver = Boolean(truck.driverId || (truck.driver && truck.driver.id) || (driverDisplay && driverDisplay !== "No Assigned"));

  const currentOdo = Number(truck.currentOdometer) || 0;
  const lastPmOdo = Number(truck.lastPmOdometer) || 0;
  const distanceSinceLastPm = Math.max(0, currentOdo - lastPmOdo);
  const isPmDue = truck.isPmDue !== undefined ? Boolean(truck.isPmDue) : distanceSinceLastPm >= 5000;
  const pmPercent = Math.min(100, Math.round((distanceSinceLastPm / 5000) * 100));

  const odometerDisplay = `${currentOdo.toLocaleString()} KM`;

  return (
    <div
      onClick={() => onClick && onClick(truck)}
      className="group bg-[#DDF4FF] hover:bg-[#FEF6D1] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between rounded-2xl p-4 sm:p-5 border border-transparent hover:border-[#F6C445]/40"
    >
      {/* CARD HEADER PILL */}
      <div className="bg-[#BAE6FD]/70 group-hover:bg-[#FEECA5] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 mb-2 text-[#0A4B6E] group-hover:text-[#854D0E] transition-all duration-200">
        <div className="flex items-center gap-2 truncate">
          <Truck size={22} className="fill-[#0A4B6E] group-hover:fill-[#854D0E] stroke-[1.2] transition-colors shrink-0" />
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

      {/* GROUNDING WARNING BANNER (When Under Maintenance) */}
      {isGrounded && (
        <div className="bg-red-50/90 border border-red-200 rounded-xl px-3 py-1.5 mb-2.5 text-[11px] text-red-800 flex items-center justify-between gap-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold truncate">
            <AlertOctagon size={13} className="text-red-600 shrink-0" />
            <span className="truncate">Grounded — Under Maintenance</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onCreateWorkOrder && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateWorkOrder(truck);
                }}
                className="text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-0.5 cursor-pointer"
                title="Create Work Order for this vehicle"
              >
                <Wrench size={10} />
                <span>Work Order</span>
              </button>
            )}
            {hasDriver && (
              <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-semibold">
                Driver Retained
              </span>
            )}
          </div>
        </div>
      )}

      {/* CARD BODY */}
      <div className="space-y-1.5 text-[12.5px] leading-relaxed mb-4 px-0.5 text-left">
        <p className="text-[#5B8399] group-hover:text-[#A88B3D] transition-colors truncate">
          Driver:{" "}
          <span className="font-bold text-[#0A4B6E] group-hover:text-[#854D0E] transition-colors">
            {driverDisplay}
          </span>
        </p>

        <p className="text-[#5B8399] group-hover:text-[#A88B3D] transition-colors truncate">
          Model:{" "}
          <span className="font-bold text-[#0A4B6E] group-hover:text-[#854D0E] transition-colors">
            {truck.model || "Isuzu Elf"} {truck.yearModel ? `(${truck.yearModel})` : ""}
          </span>
        </p>

        <p className="text-[#5B8399] group-hover:text-[#A88B3D] transition-colors">
          Current Odometer:{" "}
          <span className="font-bold text-[#0A4B6E] group-hover:text-[#854D0E] transition-colors">
            {odometerDisplay}
          </span>
        </p>

        {/* 5,000-KM PREVENTIVE MAINTENANCE HEALTH PROGRESS */}
        <div className="pt-1.5">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-[#5B8399] group-hover:text-[#A88B3D] transition-colors">
              PM Progress:
            </span>
            <span
              className={`font-bold transition-colors ${
                isPmDue
                  ? "text-red-600"
                  : distanceSinceLastPm >= 4000
                  ? "text-amber-700"
                  : "text-[#0A4B6E] group-hover:text-[#854D0E]"
              }`}
            >
              {distanceSinceLastPm.toLocaleString()} / 5,000 KM ({pmPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#BAE6FD]/80 group-hover:bg-[#FEECA5]/90 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isPmDue
                  ? "bg-[#D93025]"
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
      <div className="flex items-center justify-between mt-auto pt-1 px-0.5">
        <Badge variant={getStatusVariant(normalizedStatus)} className="px-3 py-1 text-[10.5px]">
          {normalizedStatus || "ACTIVE"}
        </Badge>

        {/* QUICK ACTION BUTTONS */}
        <div className="flex items-center gap-1.5">
          {/* Safety Inspection Quick Trigger */}
          {onInspect && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInspect(truck);
              }}
              title="Conduct Safety Inspection"
              className="w-8 h-8 rounded-lg bg-[#BAE6FD]/70 group-hover:bg-[#FEECA5] flex items-center justify-center text-[#0A4B6E] group-hover:text-[#854D0E] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <ShieldCheck size={16} className="stroke-[2.2]" />
            </button>
          )}

          {/* Roadside Breakdown / Incident Report Quick Trigger */}
          {onReportIncident && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReportIncident(truck);
              }}
              title="Report Incident / Breakdown"
              className="w-8 h-8 rounded-lg bg-[#BAE6FD]/70 group-hover:bg-[#FEECA5] flex items-center justify-center text-[#0A4B6E] group-hover:text-[#854D0E] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <AlertTriangle size={15} className="stroke-[2.2]" />
            </button>
          )}

          {/* Odometer Quick Check-In */}
          {onCheckIn && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCheckIn(truck);
              }}
              title="Record Return Odometer"
              className="w-8 h-8 rounded-lg bg-[#BAE6FD]/70 group-hover:bg-[#FEECA5] flex items-center justify-center text-[#0A4B6E] group-hover:text-[#854D0E] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Gauge size={16} className="stroke-[2.2]" />
            </button>
          )}

          {/* Mileage History */}
          {onHistory && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onHistory(truck);
              }}
              title="View Mileage History"
              className="w-8 h-8 rounded-lg bg-[#BAE6FD]/70 group-hover:bg-[#FEECA5] flex items-center justify-center text-[#0A4B6E] group-hover:text-[#854D0E] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <History size={16} className="stroke-[2.2]" />
            </button>
          )}

          {/* Create Work Order Quick Trigger */}
          {onCreateWorkOrder && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCreateWorkOrder(truck);
              }}
              title="Create Work Order"
              className="w-8 h-8 rounded-lg bg-[#BAE6FD]/70 group-hover:bg-[#FEECA5] flex items-center justify-center text-[#0A4B6E] group-hover:text-[#854D0E] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Wrench size={15} className="stroke-[2.2]" />
            </button>
          )}

          {/* Full Details Modal Trigger */}
          <div className="w-8 h-8 rounded-lg bg-[#BAE6FD]/70 group-hover:bg-[#FEECA5] flex items-center justify-center text-[#0A4B6E] group-hover:text-[#854D0E] transition-all duration-200">
            <List size={16} className="stroke-[2.2]" />
          </div>
        </div>
      </div>
    </div>
  );
}
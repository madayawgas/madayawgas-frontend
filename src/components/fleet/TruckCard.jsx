// src/components/fleet/TruckCard.jsx
import { Truck, List } from "lucide-react";
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

  const odometerDisplay =
    truck.currentOdometer !== undefined && truck.currentOdometer !== null
      ? `${Number(truck.currentOdometer).toLocaleString()} KM`
      : "0 KM";

  return (
    <div
      onClick={() => onClick && onClick(truck)}
      className="group bg-[#DDF4FF] hover:bg-[#FEF6D1] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between rounded-2xl p-4 sm:p-5 border border-transparent hover:border-[#F6C445]/40"
    >
      {/* CARD HEADER PILL */}
      <div className="bg-[#BAE6FD]/70 group-hover:bg-[#FEECA5] rounded-xl px-4 py-2.5 flex items-center gap-2.5 mb-3 text-[#0A4B6E] group-hover:text-[#854D0E] transition-all duration-200">
        <Truck size={22} className="fill-[#0A4B6E] group-hover:fill-[#854D0E] stroke-[1.2] transition-colors flex-shrink-0" />
        <h3 className="font-bold text-base sm:text-lg tracking-wide truncate">
          {truck.plateNumber || `Truck #${truck.truckId || truck.id}`}
        </h3>
      </div>

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
      </div>

      {/* CARD FOOTER */}
      <div className="flex items-center justify-between mt-auto pt-1 px-0.5">
        <Badge variant={getStatusVariant(normalizedStatus)} className="px-4 py-1 text-[11px]">
          {normalizedStatus || "ACTIVE"}
        </Badge>

        <div className="w-8 h-8 rounded-lg bg-[#BAE6FD]/70 group-hover:bg-[#FEECA5] flex items-center justify-center text-[#0A4B6E] group-hover:text-[#854D0E] transition-all duration-200">
          <List size={16} className="stroke-[2.2]" />
        </div>
      </div>
    </div>
  );
}
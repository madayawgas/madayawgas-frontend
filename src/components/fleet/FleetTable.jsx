// src/components/fleet/FleetTable.jsx
import { AlertTriangle, Truck, UserRound } from "lucide-react";
import Badge from "../ui/Badge";
import Pagination from "../ui/Pagination";

export default function FleetTable({
  trucks = [],
  selectedTruck,
  onSelectTruck,
  sortConfig = { key: "plateNumber", direction: "asc" },
  onSort,
  pagination,
}) {
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

  return (
    <div className="w-full h-full flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead className="bg-[#0D4B6E] text-white text-xs sticky top-0 z-10 shadow-xs select-none">
            <tr>
              <th
                className="py-3 px-3.5 md:px-4 font-semibold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[30%] min-w-[180px]"
                onClick={() => onSort && onSort("plateNumber")}
              >
                Vehicle Asset{" "}
                {sortConfig.key === "plateNumber" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th
                className="py-3 px-3.5 md:px-4 font-semibold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[25%] min-w-[150px]"
                onClick={() => onSort && onSort("driver")}
              >
                Assigned Driver{" "}
                {sortConfig.key === "driver" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th
                className="py-3 px-3.5 md:px-4 font-semibold uppercase tracking-wider text-[11px] text-right cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[18%] min-w-[120px]"
                onClick={() => onSort && onSort("currentOdometer")}
              >
                Odometer{" "}
                {sortConfig.key === "currentOdometer" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th
                className="py-3 px-3.5 md:px-4 font-semibold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[17%] min-w-[140px]"
                onClick={() => onSort && onSort("pmProgress")}
              >
                PM Health{" "}
                {sortConfig.key === "pmProgress" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th
                className="py-3 px-3.5 md:px-4 font-semibold uppercase tracking-wider text-[11px] text-center cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[10%] min-w-[100px]"
                onClick={() => onSort && onSort("status")}
              >
                Status{" "}
                {sortConfig.key === "status" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
            {trucks.length > 0 ? (
              trucks.map((truck) => {
                const isSelected =
                  selectedTruck?.id === truck.id ||
                  selectedTruck?.truckId === truck.id;

                const normalizedStatus = (
                  truck.status ||
                  truck.operationalStatus ||
                  ""
                )
                  .toUpperCase()
                  .replace("_", " ");

                const driverDisplay = truck.driver
                  ? `${truck.driver.firstName || ""} ${truck.driver.lastName || ""}`.trim() ||
                    truck.driver.username
                  : truck.driverName &&
                    truck.driverName !== "Unassigned" &&
                    truck.driverName !== "No Assigned"
                  ? truck.driverName
                  : "No Assigned";

                const isDriverAssigned =
                  driverDisplay !== "No Assigned" && driverDisplay !== "Unassigned";

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

                // Inspection Alert
                const latestInspection = truck.latestInspection || null;
                const inspectionResult = (
                  truck.lastInspectionResult ||
                  truck.latestInspectionResult ||
                  latestInspection?.result ||
                  (truck.hasPendingIssues ? "NEEDS_ATTENTION" : "") ||
                  ""
                ).toUpperCase();
                const hasNeedsAttention = inspectionResult === "NEEDS_ATTENTION";

                return (
                  <tr
                    key={truck.id}
                    onClick={() => onSelectTruck && onSelectTruck(truck)}
                    className={`transition-colors duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-[#D2EAF7] text-[#0A4B6E] font-medium"
                        : "bg-white hover:bg-[#F4F9FC]"
                    }`}
                  >
                    {/* Vehicle Asset: 2-line layout with brand navy truck icon */}
                    <td className="py-2.5 px-3.5 md:px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold shadow-2xs bg-[#0A4B6E] text-[#FFDF2C]">
                          <Truck size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#0A4B6E] text-xs md:text-sm tracking-wide truncate">
                            {truck.plateNumber || `Truck #${truck.truckId || truck.id}`}
                          </div>
                          <div className="text-xs text-slate-500 font-normal truncate mt-0.5">
                            {[
                              truck.model || "Isuzu Elf",
                              truck.yearModel ? `(${truck.yearModel})` : null,
                              truck.vehicleType ? truck.vehicleType.replace("_", " ") : null,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Driver: 2-line layout with driver avatar */}
                    <td className="py-2.5 px-3.5 md:px-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            isDriverAssigned
                              ? "bg-[#E8F3F8] text-[#0A4B6E]"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <UserRound size={12} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`truncate text-xs md:text-[13px] ${
                              isDriverAssigned
                                ? "font-semibold text-[#0A4B6E]"
                                : "text-slate-400 italic"
                            }`}
                          >
                            {driverDisplay}
                          </div>
                          {truck.designatedRoute && (
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              Route: {truck.designatedRoute}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Current Odometer: Monospace, right-aligned */}
                    <td className="py-2.5 px-3.5 md:px-4 text-right whitespace-nowrap">
                      <span className="font-mono font-bold text-[#0A4B6E] text-xs md:text-sm">
                        {currentOdo.toLocaleString()} KM
                      </span>
                    </td>

                    {/* PM Health: Compact ratio + slim progress bar */}
                    <td className="py-2.5 px-3.5 md:px-4">
                      <div className="space-y-1 min-w-[130px]">
                        <div className="flex items-center justify-between text-xs gap-1.5">
                          <span
                            className={`font-semibold text-[11px] truncate ${
                              isPmDue
                                ? "text-[#C93B32]"
                                : distanceSinceLastPm >= 4000
                                ? "text-amber-800"
                                : "text-[#0A4B6E]"
                            }`}
                          >
                            {distanceSinceLastPm.toLocaleString()} / 5,000 KM
                          </span>
                          {isPmDue ? (
                            <Badge variant="danger" className="px-1.5 py-0 text-[10px] font-bold shrink-0">
                              DUE
                            </Badge>
                          ) : distanceSinceLastPm >= 4000 ? (
                            <Badge variant="warning" className="px-1.5 py-0 text-[10px] font-bold shrink-0">
                              NEAR
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-medium shrink-0">
                              {pmPercent}%
                            </span>
                          )}
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
                    </td>

                    {/* Operational Status */}
                    <td className="py-2.5 px-3.5 md:px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <Badge
                          variant={getStatusVariant(normalizedStatus)}
                          className="px-2.5 py-0.5 text-xs font-semibold inline-flex items-center"
                        >
                          {normalizedStatus || "ACTIVE"}
                        </Badge>
                        {hasNeedsAttention && (
                          <Badge
                            variant="warning"
                            className="px-1.5 py-0.5 text-[10px] font-bold inline-flex items-center gap-1"
                            title="Safety inspection flagged items requiring attention"
                          >
                            <AlertTriangle size={10} className="shrink-0 text-[#B06000]" />
                            <span>ATTN</span>
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-gray-400 font-medium"
                >
                  No fleets found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          limit={pagination.limit}
          onPageChange={pagination.onPageChange}
          onLimitChange={pagination.onLimitChange}
          isLoading={pagination.isLoading}
          itemLabel="vehicles"
        />
      )}
    </div>
  );
}

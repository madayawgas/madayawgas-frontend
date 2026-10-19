// src/components/fleet/fuel/FuelVehiclesTable.jsx
import { useState } from "react";
import {
  Truck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Fuel,
  ChevronRight,
} from "lucide-react";

function formatCurrency(val) {
  const num = Number(val) || 0;
  return `₱${num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(val, decimals = 2) {
  const num = Number(val) || 0;
  return num.toLocaleString("en-PH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function FuelVehiclesTable({
  vehicles = [],
  isLoading = false,
  onSelectVehicle,
  onViewLogsForVehicle,
}) {
  const [sortKey, setSortKey] = useState("fuelUsedLiters");
  const [sortOrder, setSortOrder] = useState("desc");

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const sortedVehicles = [...vehicles].sort((a, b) => {
    let valA = a[sortKey];
    let valB = b[sortKey];

    if (valA === null || valA === undefined) valA = sortOrder === "asc" ? Infinity : -Infinity;
    if (valB === null || valB === undefined) valB = sortOrder === "asc" ? Infinity : -Infinity;

    if (typeof valA === "string") {
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === "asc" ? valA - valB : valB - valA;
  });

  const renderSortIcon = (key) => {
    if (sortKey !== key) {
      return <ArrowUpDown size={12} className="opacity-40" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp size={12} className="text-[#FFDF2C]" />
    ) : (
      <ArrowDown size={12} className="text-[#FFDF2C]" />
    );
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[960px]">
          <thead className="bg-[#0D4B6E] text-white text-xs md:text-sm sticky top-0 z-10 shadow-xs select-none">
            <tr>
              <th
                onClick={() => handleSort("plateNumber")}
                className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[20%] cursor-pointer hover:bg-[#0B4A6E] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Vehicle Asset</span>
                  {renderSortIcon("plateNumber")}
                </div>
              </th>

              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[16%]">
                Driver
              </th>

              <th
                onClick={() => handleSort("fuelUsedLiters")}
                className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap w-[13%] cursor-pointer hover:bg-[#0B4A6E] transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Fuel (L)</span>
                  {renderSortIcon("fuelUsedLiters")}
                </div>
              </th>

              <th
                onClick={() => handleSort("fuelCost")}
                className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap w-[13%] cursor-pointer hover:bg-[#0B4A6E] transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total Cost</span>
                  {renderSortIcon("fuelCost")}
                </div>
              </th>

              <th
                onClick={() => handleSort("distanceTraveledKm")}
                className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap w-[12%] cursor-pointer hover:bg-[#0B4A6E] transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Distance</span>
                  {renderSortIcon("distanceTraveledKm")}
                </div>
              </th>

              <th
                onClick={() => handleSort("kmPerLiter")}
                className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-center whitespace-nowrap w-[13%] cursor-pointer hover:bg-[#0B4A6E] transition-colors"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Efficiency</span>
                  {renderSortIcon("kmPerLiter")}
                </div>
              </th>

              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-center whitespace-nowrap w-[7%]">
                Fill-ups
              </th>

              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap w-[6%]">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-7 h-7 border-2 border-[#0B4A6E] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-[#0A4B6E]">
                      Computing fuel consumption telemetry...
                    </span>
                  </div>
                </td>
              </tr>
            ) : sortedVehicles.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[#0A4B6E] shadow-xs">
                      <Fuel className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-[#0A4B6E]">
                      No Fuel Records Detected
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                      No fuel consumption records were found for the selected period. Try adjusting your date range filter or vehicle scope.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedVehicles.map((v) => {
                const vehicleId = v.vehicleId || v.id;
                const plate = v.plateNumber || "N/A";
                const model = v.model || "";
                const driverName = v.driver?.fullName || v.driver?.username || "Unassigned";
                const liters = Number(v.fuelUsedLiters || 0);
                const cost = Number(v.fuelCost || 0);
                const distance = Number(v.distanceTraveledKm || 0);
                const kmPerLiter = v.kmPerLiter !== null && v.kmPerLiter !== undefined ? Number(v.kmPerLiter) : null;
                const count = v.fuelEntriesCount || 0;
                const rating = v.efficiencyRating;
                const variance = v.varianceFromFleetAvgPercent;

                return (
                  <tr
                    key={vehicleId}
                    className="hover:bg-[#F4F9FC] transition-colors duration-150 group"
                  >
                    {/* Vehicle Asset */}
                    <td className="py-3.5 px-4 md:px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs">
                          <Truck size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-[#0A4B6E] group-hover:underline text-xs md:text-sm truncate">
                              {plate}
                            </span>
                            {v.vehicleType && (
                              <span className="px-1.5 py-0 text-[9px] font-bold bg-[#E8F3F8] text-[#0A4B6E] rounded-md border border-[#BCE1F1]">
                                {v.vehicleType.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#6D8AA2] font-medium block truncate max-w-[150px]">
                            {model || "Vehicle Asset"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Driver */}
                    <td className="py-3.5 px-4 md:px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center shrink-0 font-bold text-[10px]">
                          <User size={12} />
                        </div>
                        <span className="truncate text-xs md:text-[13px] font-medium text-[#0A4B6E]">
                          {driverName}
                        </span>
                      </div>
                    </td>

                    {/* Fuel Volume */}
                    <td className="py-3.5 px-4 md:px-5 text-right">
                      <span className="font-bold text-[#0A4B6E] text-sm">{formatNumber(liters)}</span>{" "}
                      <span className="text-xs text-[#6D8AA2] font-semibold">L</span>
                    </td>

                    {/* Total Cost */}
                    <td className="py-3.5 px-4 md:px-5 text-right font-bold text-[#1B4B75] text-sm">
                      {formatCurrency(cost)}
                    </td>

                    {/* Distance */}
                    <td className="py-3.5 px-4 md:px-5 text-right">
                      <span className="font-bold text-slate-800 text-xs md:text-sm">{formatNumber(distance, 0)}</span>{" "}
                      <span className="text-xs text-[#6D8AA2] font-semibold">KM</span>
                    </td>

                    {/* Efficiency (km/L) */}
                    <td className="py-3.5 px-4 md:px-5 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-900 text-sm">
                            {kmPerLiter !== null ? formatNumber(kmPerLiter, 2) : "—"}
                          </span>
                          {kmPerLiter !== null && (
                            <span className="text-xs text-[#6D8AA2] font-semibold">km/L</span>
                          )}
                        </div>

                        {rating && kmPerLiter !== null && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 border ${
                              rating === "ABOVE_AVERAGE"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : rating === "BELOW_AVERAGE"
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {rating === "ABOVE_AVERAGE"
                              ? `+${variance}% vs Fleet`
                              : rating === "BELOW_AVERAGE"
                              ? `${variance}% vs Fleet`
                              : "Fleet Avg"}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Fill-ups */}
                    <td className="py-3.5 px-4 md:px-5 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-[#E8F3F8] text-[#0A4B6E] font-bold text-xs border border-[#9BCBE3]">
                        {count}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 md:px-5 text-right">
                      <button
                        type="button"
                        onClick={() => onViewLogsForVehicle && onViewLogsForVehicle(vehicleId)}
                        className="inline-flex items-center gap-1 bg-[#E8F3F8] hover:bg-[#D2EAF7] text-[#0A4B6E] font-bold text-xs px-2.5 py-1 rounded-full border border-[#9BCBE3] shadow-2xs transition active:scale-95 cursor-pointer"
                        title="View intake logs for this vehicle"
                      >
                        <span>Logs</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

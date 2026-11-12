// src/components/route-dispatch/TodayDispatchesTable.jsx
import React from "react";
import {
  Truck,
  User,
  MapPin,
  Clock,
  Layers,
  ArrowRight,
  AlertTriangle,
  Plus,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Pagination from "../ui/Pagination";
import { formatPhilippineTime } from "../../utils/date.js";

export default function TodayDispatchesTable({
  entries = [],
  sortConfig = { key: "truckPlate", direction: "asc" },
  onSort,
  selectedId,
  onSelectEntry,
  onDispatch,
  onEndTrip,
  onCheckInReturn,
  canManage = false,
  pagination,
}) {
  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={12} className="inline ml-1 text-[#FFDF2C]" />
    ) : (
      <ChevronDown size={12} className="inline ml-1 text-[#FFDF2C]" />
    );
  };

  const getStatusBadge = (entry) => {
    switch (entry.operationalStatus) {
      case "OUT_ON_ROAD":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>OUT ON ROUTE</span>
          </span>
        );
      case "RETURNED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>RETURNED (AUDIT PENDING)</span>
          </span>
        );
      case "READY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-bold shrink-0">
            <Clock size={11} className="text-[#0A4B6E]" />
            <span>READY TO DISPATCH</span>
          </span>
        );
      case "UNAVAILABLE": {
        const gating = entry.gating || {};
        const isMaintenance = gating.variant === "maintenance";
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
              isMaintenance
                ? "bg-amber-50 text-amber-900 border-amber-300"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <AlertTriangle size={11} className={isMaintenance ? "text-amber-700" : "text-rose-600"} />
            <span>{gating.reasonTag || "UNAVAILABLE"}</span>
          </span>
        );
      }
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold">
            {entry.operationalStatus || "PENDING"}
          </span>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-2xs">
      {/* Scrollable Table Viewport */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[960px]">
          {/* Table Header */}
          <thead className="bg-[#0D4B6E] text-white text-xs sticky top-0 z-10 shadow-xs select-none">
            <tr>
              {/* Vehicle Asset */}
              <th
                className="py-3 px-3.5 font-semibold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[20%]"
                onClick={() => onSort && onSort("truckPlate")}
              >
                Vehicle Asset {renderSortIndicator("truckPlate")}
              </th>

              {/* Operational Status */}
              <th
                className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[15%]"
                onClick={() => onSort && onSort("operationalStatus")}
              >
                Status {renderSortIndicator("operationalStatus")}
              </th>

              {/* Service Zone */}
              <th
                className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[16%]"
                onClick={() => onSort && onSort("zoneCode")}
              >
                Service Zone {renderSortIndicator("zoneCode")}
              </th>

              {/* Assigned Crew */}
              <th
                className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[17%]"
                onClick={() => onSort && onSort("driverName")}
              >
                Assigned Crew {renderSortIndicator("driverName")}
              </th>

              {/* Deployment & Cargo Manifest */}
              <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[20%]">
                Staging & Cargo Details
              </th>

              {/* Actions */}
              <th className="py-3 px-3.5 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap w-[12%]">
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100 text-xs">
            {entries.length > 0 ? (
              entries.map((entry) => {
                const isOutOnRoad = entry.operationalStatus === "OUT_ON_ROAD";
                const isReturned = entry.operationalStatus === "RETURNED";
                const isTrip = isOutOnRoad || isReturned;
                const isReady = entry.operationalStatus === "READY";
                const isUnavailable = entry.operationalStatus === "UNAVAILABLE";
                const isSelected =
                  Boolean(selectedId) &&
                  (selectedId === entry.id ||
                    selectedId === entry.scheduleId ||
                    selectedId === entry.tripId ||
                    selectedId === entry.truckPlate);
                const cargo = entry.cargo || {};
                const departureFormatted = entry.departureTime
                  ? formatPhilippineTime(entry.departureTime)
                  : null;

                return (
                  <tr
                    key={entry.id || entry.truckPlate}
                    onClick={() => onSelectEntry && onSelectEntry(entry)}
                    className={`transition-colors duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-[#E2EDF3] text-[#0A4B6E] font-semibold"
                        : "bg-white hover:bg-[#F4F9FC]"
                    }`}
                  >
                    {/* Vehicle Asset Column (Preserved distinctive Navy + Yellow Truck Icon) */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 font-bold shadow-2xs">
                          <Truck size={15} />
                        </div>
                        <div>
                          <div className="font-bold text-[#0A4B6E] text-xs tracking-tight">
                            {entry.truckPlate}
                          </div>
                          <div className="text-[11px] text-[#3E5C76]">
                            {entry.truckModel || "Delivery Vehicle"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getStatusBadge(entry)}
                    </td>

                    {/* Service Zone Column */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        <MapPin size={11} className="text-[#0A4B6E] shrink-0" />
                        <span>{entry.zoneCode || entry.zoneName || "—"}</span>
                      </div>
                      <div className="text-[11px] text-[#3E5C76] truncate max-w-[150px]">
                        {entry.zoneName || "District Route"}
                      </div>
                    </td>

                    {/* Assigned Crew Column */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                        <User size={11} className="text-[#3E5C76] shrink-0" />
                        <span className="truncate max-w-[140px] font-semibold">
                          {entry.driverName || "Unassigned"}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#3E5C76] truncate max-w-[140px]">
                        Sales: {entry.salesName || "Unassigned"}
                      </div>
                    </td>

                    {/* Deployment & Cargo Details Column */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isTrip ? (
                        <div className="space-y-0.5">
                          {departureFormatted && (
                            <div className="flex items-center gap-1 text-[11px] text-[#3E5C76] font-medium">
                              <Clock size={11} className="text-[#0A4B6E]" />
                              <span>Departed {departureFormatted}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[11px] font-bold text-[#0A4B6E]">
                            <Layers size={11} className="text-[#0A4B6E] shrink-0" />
                            <span>
                              {cargo.cylinderUnits > 0 && cargo.canisterUnits > 0 ? (
                                <>
                                  {cargo.cylinderUnits} cyl · {cargo.canisterUnits} cans ({cargo.canisterCrates} crt)
                                </>
                              ) : cargo.canisterUnits > 0 ? (
                                <>
                                  {cargo.canisterUnits} cans ({cargo.canisterCrates} crt
                                  {cargo.canisterRemainder > 0 ? ` +${cargo.canisterRemainder}` : ""})
                                </>
                              ) : cargo.cylinderUnits > 0 ? (
                                <>{cargo.cylinderUnits} cylinders</>
                              ) : (
                                "0 units loaded"
                              )}
                            </span>
                          </div>
                        </div>
                      ) : isReady ? (
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Cleared for gate departure</span>
                          </div>
                          <div className="text-[11px] text-[#3E5C76]">
                            Safety inspections & driver duty OK
                          </div>
                        </div>
                      ) : isUnavailable ? (
                        <div className="space-y-0.5 max-w-[200px]">
                          <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1 truncate">
                            <AlertTriangle size={11} className="text-amber-700 shrink-0" />
                            <span className="truncate">{entry.gating?.reasonTag || "Dispatch Gated"}</span>
                          </div>
                          <div className="text-[11px] text-amber-800/90 truncate">
                            {entry.gating?.reasonText || "Vehicle locked"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* Actions Column (1 Primary Action per Row) */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      {canManage ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ready to Dispatch: 1 Primary Yellow Action Button */}
                          {isReady && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDispatch && onDispatch(entry);
                              }}
                              className="px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 uppercase tracking-wider shrink-0 active:scale-95"
                              title="Dispatch vehicle on distribution route"
                            >
                              <Plus size={12} strokeWidth={2.5} />
                              <span>DISPATCH</span>
                            </button>
                          )}

                          {/* Out on the Road: 1 Primary Navy Action Button to End Trip */}
                          {isOutOnRoad && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEndTrip && onEndTrip(entry);
                              }}
                              className="px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 uppercase tracking-wider shrink-0 active:scale-95"
                              title="Record return odometer and end active trip"
                            >
                              <span>END TRIP</span>
                              <ArrowRight size={12} strokeWidth={2.5} />
                            </button>
                          )}

                          {/* Returned to Yard: 1 Primary Yellow Action Button to Check In Stock */}
                          {isReturned && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCheckInReturn && onCheckInReturn(entry);
                              }}
                              className="px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 uppercase tracking-wider shrink-0 active:scale-95"
                              title="Perform dock physical return check-in & stock reconciliation"
                            >
                              <span>CHECK-IN</span>
                              <ArrowRight size={12} strokeWidth={2.5} />
                            </button>
                          )}

                          {/* Unavailable Vehicle: Gated Indicator */}
                          {isUnavailable && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                              <AlertTriangle size={11} className="text-amber-700 shrink-0" />
                              <span>Gated</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">View Only</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-600">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center mb-2">
                      <Truck size={22} />
                    </div>
                    <p className="font-bold text-xs text-slate-800">No vehicle dispatch records found</p>
                    <p className="text-[11px] text-[#3E5C76] mt-0.5 max-w-sm">
                      No matching records found for this view. Try adjusting your search query, status tab, or service zone filter.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pinned Bottom Pagination */}
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

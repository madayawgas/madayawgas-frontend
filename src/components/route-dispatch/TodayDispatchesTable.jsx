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
  CalendarX,
  AlertOctagon,
  Plus,
} from "lucide-react";
import Pagination from "../ui/Pagination";
import { formatPhilippineTime } from "../../utils/date.js";

export default function TodayDispatchesTable({
  entries = [],
  sortConfig = { key: "truckPlate", direction: "asc" },
  onSort,
  onDispatch,
  onCancelSchedule,
  onMiddayReload,
  onCheckInReturn,
  onCancelTrip,
  canManage = false,
  pagination,
}) {
  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return (
      <span className="ml-1 text-[10px] text-[#FFDF2C]">
        {sortConfig.direction === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  const getStatusBadge = (entry) => {
    switch (entry.operationalStatus) {
      case "OUT_ON_ROAD":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>OUT ON ROUTE</span>
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

              {/* Deployment / Cargo Details */}
              <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[18%]">
                Deployment & Cargo Details
              </th>

              {/* Actions */}
              <th className="py-3 px-3.5 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap w-[14%]">
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100 text-xs">
            {entries.length > 0 ? (
              entries.map((entry) => {
                const isTrip = entry.operationalStatus === "OUT_ON_ROAD";
                const isReady = entry.operationalStatus === "READY";
                const isUnavailable = entry.operationalStatus === "UNAVAILABLE";
                const cargo = entry.cargo || {};
                const departureFormatted = entry.departureTime
                  ? formatPhilippineTime(entry.departureTime)
                  : null;

                return (
                  <tr
                    key={entry.id || entry.truckPlate}
                    className="hover:bg-[#F8FAFC] transition-colors duration-150"
                  >
                    {/* Vehicle Asset Column */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            isTrip
                              ? "bg-emerald-50 text-emerald-800"
                              : isUnavailable
                              ? "bg-amber-50 text-amber-700"
                              : "bg-[#E8F3F8] text-[#0A4B6E]"
                          }`}
                        >
                          <Truck size={14} />
                        </div>
                        <div>
                          <div className="font-bold text-[#0A4B6E] text-xs tracking-tight">
                            {entry.truckPlate}
                          </div>
                          <div className="text-[10px] text-[#6D8AA2]">
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
                      <div className="text-[10px] text-[#6D8AA2] truncate max-w-[150px]">
                        {entry.zoneName || "District Route"}
                      </div>
                    </td>

                    {/* Assigned Crew Column */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                        <User size={11} className="text-[#6D8AA2] shrink-0" />
                        <span className="truncate max-w-[140px] font-semibold">
                          {entry.driverName || "Unassigned"}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#6D8AA2] truncate max-w-[140px]">
                        Sales: {entry.salesName || "Unassigned"}
                      </div>
                    </td>

                    {/* Deployment & Cargo Details Column */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isTrip ? (
                        <div className="space-y-0.5">
                          {departureFormatted && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-700 font-medium">
                              <Clock size={11} className="text-[#6D8AA2]" />
                              <span>Departed {departureFormatted}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[11px] font-bold text-[#0A4B6E]">
                            <Layers size={11} className="text-[#0A4B6E]" />
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
                          <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Ready for departure</span>
                          </div>
                          <div className="text-[10px] text-[#6D8AA2]">
                            All inspections & attendance cleared
                          </div>
                        </div>
                      ) : isUnavailable ? (
                        <div className="space-y-0.5 max-w-[200px]">
                          <div className="text-[11px] font-semibold text-amber-900 flex items-center gap-1 truncate">
                            <AlertTriangle size={11} className="text-amber-600 shrink-0" />
                            <span className="truncate">{entry.gating?.reasonTag || "Blocked"}</span>
                          </div>
                          <div className="text-[10px] text-amber-800/80 truncate">
                            {entry.gating?.reasonText || "Dispatch locked"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      {canManage ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ready to Dispatch Actions */}
                          {isReady && (
                            <>
                              <button
                                type="button"
                                onClick={() => onCancelSchedule && onCancelSchedule(entry)}
                                className="px-2 py-1 rounded-full text-[10px] font-semibold bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-600 hover:text-rose-700 transition cursor-pointer flex items-center gap-1"
                                title="Cancel this vehicle's run for today"
                              >
                                <CalendarX size={11} />
                                <span>Cancel</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onDispatch && onDispatch(entry)}
                                className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] transition cursor-pointer shadow-2xs flex items-center gap-1 uppercase tracking-wider"
                                title="Dispatch truck on distribution route"
                              >
                                <Plus size={12} />
                                <span>Dispatch</span>
                              </button>
                            </>
                          )}

                          {/* Out on the Road Actions */}
                          {isTrip && (
                            <>
                              <button
                                type="button"
                                onClick={() => onMiddayReload && onMiddayReload(entry)}
                                className="px-2 py-1 rounded-full text-[10px] font-bold bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#0A4B6E] transition cursor-pointer"
                                title="Record midday reload cargo intake"
                              >
                                + Reload
                              </button>

                              <button
                                type="button"
                                onClick={() => onCancelTrip && onCancelTrip(entry)}
                                className="px-2 py-1 rounded-full text-[10px] font-semibold bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 transition cursor-pointer flex items-center gap-0.5"
                                title="Cancel trip and check returned cargo to yard"
                              >
                                <AlertOctagon size={11} />
                                <span>Cancel</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onCheckInReturn && onCheckInReturn(entry)}
                                className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] transition cursor-pointer shadow-2xs flex items-center gap-1"
                                title="Check-in return & reconcile stock"
                              >
                                <span>Check-In</span>
                                <ArrowRight size={11} />
                              </button>
                            </>
                          )}

                          {/* Unavailable Vehicle Actions */}
                          {isUnavailable && (
                            <div className="flex items-center gap-1.5 justify-end">
                              <span className="text-[10px] text-slate-400 italic">
                                Locked
                              </span>
                              <button
                                type="button"
                                onClick={() => onCancelSchedule && onCancelSchedule(entry)}
                                className="px-2 py-1 rounded-full text-[10px] font-semibold bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-600 hover:text-rose-700 transition cursor-pointer flex items-center gap-1"
                                title="Cancel this vehicle's run for today"
                              >
                                <CalendarX size={11} />
                                <span>Cancel Run</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">View Only</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Truck size={28} className="text-slate-300 mb-2" />
                    <p className="font-semibold text-xs text-slate-700">No vehicle dispatch records found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your search query, status tab, or service zone filter.
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

// src/components/route-dispatch/TodayDispatchesCards.jsx
import React from "react";
import {
  Truck,
  Plus,
  MapPin,
  Clock,
  Layers,
  ArrowRight,
  AlertTriangle,
  Calendar,
  CalendarX,
  AlertOctagon,
} from "lucide-react";
import { formatPhilippineDate, formatPhilippineTime } from "../../utils/date.js";

export default function TodayDispatchesCards({
  statusTab = "ALL",
  activeTrips = [],
  availableSchedules = [],
  unavailableSchedules = [],
  onDispatch,
  onCancelSchedule,
  onMiddayReload,
  onCheckInReturn,
  onCancelTrip,
  canManage = false,
  getFullCargoBreakdown,
  todayPht,
}) {
  const showOutOnRoad = statusTab === "ALL" || statusTab === "OUT_ON_ROAD";
  const showReady = statusTab === "ALL" || statusTab === "READY";
  const showUnavailable = statusTab === "ALL" || statusTab === "UNAVAILABLE";

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-6 pr-1 pb-4">
      {/* SECTION 1: OUT ON THE ROAD */}
      {showOutOnRoad && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-[#0A4B6E] uppercase tracking-wide">
                Out on the Road ({activeTrips.length})
              </h3>
            </div>
            <span className="text-[11px] text-[#6D8AA2]">
              Active distribution runs in progress
            </span>
          </div>

          {activeTrips.length === 0 ? (
            <div className="bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-2xl p-8 text-center">
              <Truck size={28} className="mx-auto text-[#6D8AA2] mb-2 opacity-50" />
              <p className="text-xs font-semibold text-[#0A4B6E]">
                No active trucks currently out on the road
              </p>
              <p className="text-[11px] text-[#6D8AA2] mt-0.5">
                Vehicles ready to depart can be dispatched below.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {activeTrips.map((trip) => {
                const departureFormatted = trip.departureTime
                  ? formatPhilippineTime(trip.departureTime)
                  : "—";
                const cargo = getFullCargoBreakdown ? getFullCargoBreakdown(trip) : {};

                return (
                  <div
                    key={trip.id}
                    className="bg-white border border-[#D5E3EC] hover:border-[#0A4B6E]/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all text-left"
                  >
                    <div>
                      {/* Top: Plate & Zone */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-bold text-[#0A4B6E] tracking-tight">
                              {trip.truckPlate}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              EN ROUTE
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-[#6D8AA2] mt-0.5">
                            <MapPin size={11} className="text-[#0A4B6E]" />
                            <span>
                              Zone: <strong className="text-[#0A4B6E]">{trip.zoneCode || trip.zoneName}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center shrink-0">
                          <Truck size={15} />
                        </div>
                      </div>

                      {/* Middle Meta Details */}
                      <div className="bg-[#F8FAFC] rounded-xl p-2.5 border border-[#E2E8F0] space-y-1 text-xs mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[#6D8AA2]">Crew:</span>
                          <span className="font-medium text-slate-800 truncate max-w-[170px] text-right">
                            {trip.driverName} · {trip.salesName}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-[#6D8AA2] flex items-center gap-1">
                            <Clock size={11} /> Departed:
                          </span>
                          <span className="font-semibold text-slate-700">{departureFormatted}</span>
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-[#E2E8F0]">
                          <span className="text-[#6D8AA2] flex items-center gap-1">
                            <Layers size={11} /> Cargo On-Board:
                          </span>
                          <span className="font-bold text-[#0A4B6E] text-right">
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
                              "0 units"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {canManage && (
                      <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => onMiddayReload && onMiddayReload(trip)}
                            className="w-full py-1.5 px-2 bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#0A4B6E] rounded-full text-xs font-bold transition cursor-pointer"
                          >
                            + Midday Reload
                          </button>

                          <button
                            type="button"
                            onClick={() => onCancelTrip && onCancelTrip(trip)}
                            className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-full text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                          >
                            <AlertOctagon size={12} />
                            <span>Cancel Trip</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onCheckInReturn && onCheckInReturn(trip)}
                          className="w-full py-1.5 px-3 bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] rounded-full text-xs font-bold transition cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                        >
                          <span>Check-In Return</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: READY TO DISPATCH */}
      {showReady && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0A4B6E]" />
              <h3 className="text-sm font-bold text-[#0A4B6E] uppercase tracking-wide">
                Ready to Dispatch ({availableSchedules.length})
              </h3>
              {todayPht && (
                <span className="text-[10px] font-bold text-[#0A4B6E] bg-[#E8F3F8] border border-[#BCE1F1] px-2.5 py-0.5 rounded-full">
                  Today · {formatPhilippineDate(todayPht)}
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#6D8AA2]">
              Scheduled vehicle deployments ready for departure
            </span>
          </div>

          {availableSchedules.length === 0 ? (
            <div className="bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-2xl p-8 text-center">
              <Calendar size={28} className="mx-auto text-[#6D8AA2] mb-2 opacity-50" />
              <p className="text-xs font-semibold text-[#0A4B6E]">
                No pending schedules ready to deploy today
              </p>
              <p className="text-[11px] text-[#6D8AA2] mt-0.5">
                Generate upcoming schedules from the Route Planner or click Dispatch Truck for an ad-hoc run.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {availableSchedules.map((sched) => (
                <div
                  key={sched.id}
                  className="bg-white border border-[#D5E3EC] hover:border-[#0A4B6E]/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all text-left"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-bold text-[#0A4B6E] tracking-tight">
                            {sched.truckPlate}
                          </span>
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                            SCHEDULED
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6D8AA2]">{sched.truckModel}</p>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-[#EDF3F7] text-[#0A4B6E] flex items-center justify-center shrink-0">
                        <Truck size={15} />
                      </div>
                    </div>

                    <div className="bg-[#F8FAFC] rounded-xl p-2.5 border border-[#E2E8F0] space-y-1 text-xs mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[#6D8AA2]">Route Zone:</span>
                        <span className="font-bold text-[#0A4B6E]">
                          {sched.zoneCode || sched.zoneName}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[#6D8AA2]">Assigned Crew:</span>
                        <span className="font-medium text-slate-800 truncate max-w-[170px] text-right">
                          {sched.driverName || "Driver"} · {sched.salesName || "Sales Rep"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-[#E2E8F0]">
                        <span className="text-[#6D8AA2]">Scheduled Date:</span>
                        <span className="font-bold text-[#0A4B6E]">
                          {formatPhilippineDate(sched.scheduledDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0]">
                      <button
                        type="button"
                        onClick={() => onCancelSchedule && onCancelSchedule(sched)}
                        className="py-2 px-3 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-600 hover:text-rose-700 rounded-full text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                        title="Cancel this vehicle's run for today"
                      >
                        <CalendarX size={13} />
                        <span>Cancel Run</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDispatch && onDispatch(sched)}
                        className="flex-1 py-2 px-3 bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] rounded-full text-xs font-bold transition cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                      >
                        <Plus size={13} />
                        <span>Dispatch Truck</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: UNAVAILABLE VEHICLES */}
      {showUnavailable && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-sm font-bold text-[#0A4B6E] uppercase tracking-wide">
                Unavailable Vehicles ({unavailableSchedules.length})
              </h3>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Scheduled · Blocked from Dispatch
              </span>
            </div>
            <span className="text-[11px] text-[#6D8AA2]">
              Vehicles with mechanical or driver constraints
            </span>
          </div>

          {unavailableSchedules.length === 0 ? (
            <div className="bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-2xl p-6 text-center">
              <p className="text-xs font-semibold text-[#6D8AA2]">
                All scheduled vehicles are operational and ready for dispatch
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {unavailableSchedules.map((sched) => {
                const gating = sched.gating || {};
                const badgeClasses =
                  gating.variant === "maintenance"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : gating.variant === "danger"
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-slate-100 text-slate-700 border-slate-200";

                return (
                  <div
                    key={sched.id}
                    className="bg-[#FCFDFE] border border-amber-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all text-left"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-base font-bold text-[#0A4B6E] tracking-tight">
                              {sched.truckPlate}
                            </span>
                            <span
                              className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${badgeClasses}`}
                            >
                              {gating.reasonTag || "UNAVAILABLE"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6D8AA2]">{sched.truckModel}</p>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                          <AlertTriangle size={15} />
                        </div>
                      </div>

                      {/* Status Callout Banner */}
                      {gating.reasonText && (
                        <div className="mb-2.5 p-2 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                          <span>{gating.reasonText}</span>
                        </div>
                      )}

                      <div className="bg-[#F8FAFC] rounded-xl p-2.5 border border-[#E2E8F0] space-y-1 text-xs mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[#6D8AA2]">Route Zone:</span>
                          <span className="font-bold text-[#0A4B6E]">
                            {sched.zoneCode || sched.zoneName}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-[#6D8AA2]">Assigned Crew:</span>
                          <span className="font-medium text-slate-800 truncate max-w-[170px] text-right">
                            {sched.driverName || "Driver"} · {sched.salesName || "Sales Rep"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-[#E2E8F0]">
                          <span className="text-[#6D8AA2]">Scheduled Date:</span>
                          <span className="font-bold text-[#0A4B6E]">
                            {formatPhilippineDate(sched.scheduledDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
                      <span className="text-[11px] font-medium text-slate-500 italic">
                        Dispatch locked
                      </span>

                      {canManage && (
                        <button
                          type="button"
                          onClick={() => onCancelSchedule && onCancelSchedule(sched)}
                          className="py-1.5 px-3 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-600 hover:text-rose-700 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Cancel this vehicle's run for today"
                        >
                          <CalendarX size={13} />
                          <span>Cancel Run</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

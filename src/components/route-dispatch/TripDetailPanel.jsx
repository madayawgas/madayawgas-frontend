// src/components/route-dispatch/TripDetailPanel.jsx
import React, { useState } from "react";
import {
  Truck,
  User,
  MapPin,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  FileSpreadsheet,
  CalendarX,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { isCanisterProduct, getCanisterCrates } from "../../utils/product.js";
import { formatPhilippineTime, formatPhilippineDate } from "../../utils/date.js";

export default function TripDetailPanel({
  entry,
  trip,
  schedule,
  onClose,
  onDispatch,
  onMiddayReload,
  onReturnCheckIn,
  onReconciliation,
  onCancelTrip,
  onCancelSchedule,
  canManage = true,
}) {
  const activeEntry = entry || trip || schedule;
  if (!activeEntry) return null;

  const isTrip = Boolean(
    activeEntry.isTrip ||
      activeEntry.operationalStatus === "OUT_ON_ROAD" ||
      activeEntry.departureTime ||
      activeEntry.tripId
  );
  const isReady = activeEntry.operationalStatus === "READY";
  const isUnavailable = activeEntry.operationalStatus === "UNAVAILABLE";

  // Trip-specific data
  const tripData = isTrip ? (trip || activeEntry) : null;
  const currentStatus = (tripData?.status || activeEntry?.status || "").toUpperCase();
  const isSettled = currentStatus === "SETTLED";
  const isPendingRecon = currentStatus === "AWAITING_SYNC" || currentStatus === "FLAGGED_VARIANCE";
  const isOnRoute = currentStatus === "IN_PROGRESS" || activeEntry.operationalStatus === "OUT_ON_ROAD";

  const departureFormatted = tripData?.departureTime
    ? formatPhilippineTime(tripData.departureTime)
    : activeEntry.departureTime
    ? formatPhilippineTime(activeEntry.departureTime)
    : "—";

  const returnFormatted = tripData?.returnTime
    ? formatPhilippineTime(tripData.returnTime)
    : null;

  // Staging Loads analysis
  const loadsList = Array.isArray(tripData?.loads) ? tripData.loads : [];
  const dispatchLoads = loadsList.filter((l) => l.transferType === "DISPATCH_LOAD");
  const middayLoads = loadsList.filter((l) => l.transferType === "MIDDAY_RELOAD");
  const returnUnload = loadsList.find((l) => l.transferType === "RETURN_UNLOAD");
  const reconciliation = tripData?.reconciliation || null;

  // Cargo summary for scheduled or trip
  const cargo = activeEntry.cargo || {};
  const gating = activeEntry.gating || {};

  return (
    <div className="flex flex-col gap-4 text-left font-sans">
      {/* 1. OPERATIONAL LIFECYCLE / STATUS SECTION */}
      {isTrip ? (
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#0A4B6E]">
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-[#0A4B6E]" />
              <span>Trip Lifecycle Progress</span>
            </span>
            <span className="text-[11px] text-[#3E5C76] font-medium">
              {isOnRoute ? "Step 1 of 3: Active Route" : isPendingRecon ? "Step 2 of 3: Return Unload" : "Step 3 of 3: Settled"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {/* Step 1: Out on Route */}
            <div
              className={`p-2.5 rounded-lg text-center transition-all ${
                isOnRoute
                  ? "bg-[#0A4B6E] text-white shadow-2xs font-semibold"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                {isOnRoute ? (
                  <span className="w-2 h-2 rounded-full bg-[#FFDF2C]" />
                ) : (
                  <CheckCircle2 size={13} className="text-emerald-600" />
                )}
              </div>
              <p className="text-[11px] font-bold truncate">1. On Route</p>
              <p className={`text-[11px] truncate ${isOnRoute ? "text-[#FFDF2C]" : "text-emerald-700"}`}>
                {isOnRoute ? "Departed" : "Completed"}
              </p>
            </div>

            {/* Step 2: Return Check-In */}
            <div
              className={`p-2.5 rounded-lg text-center transition-all ${
                isPendingRecon
                  ? "bg-amber-500 text-white shadow-2xs font-semibold"
                  : isSettled
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-slate-100 text-[#3E5C76]"
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                {isPendingRecon ? (
                  <Clock size={12} className="text-white" />
                ) : isSettled ? (
                  <CheckCircle2 size={13} className="text-emerald-600" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                )}
              </div>
              <p className="text-[11px] font-bold truncate">2. Return Check-In</p>
              <p className={`text-[11px] truncate ${isPendingRecon ? "text-amber-100" : isSettled ? "text-emerald-700" : "text-slate-500"}`}>
                {isPendingRecon ? "Needs Audit" : isSettled ? "Unloaded" : "Pending"}
              </p>
            </div>

            {/* Step 3: Reconcile & Settle */}
            <div
              className={`p-2.5 rounded-lg text-center transition-all ${
                isSettled
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-semibold"
                  : "bg-slate-100 text-[#3E5C76]"
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                {isSettled ? (
                  <CheckCircle2 size={13} className="text-[#FFDF2C]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                )}
              </div>
              <p className="text-[11px] font-bold truncate">3. Settle Trip</p>
              <p className={`text-[11px] truncate ${isSettled ? "text-[#FFDF2C]" : "text-slate-500"}`}>
                {isSettled ? "Closed" : "Pending"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0A4B6E] flex items-center gap-1.5 uppercase tracking-wider">
              {isReady ? (
                <>
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Staged Departure Status</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={14} className="text-amber-600" />
                  <span>Departure Gating Assessment</span>
                </>
              )}
            </span>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isReady
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-900 border-amber-300"
              }`}
            >
              {isReady ? "CLEARED FOR DISPATCH" : gating.reasonTag || "DISPATCH BLOCKED"}
            </span>
          </div>
          <p className="text-xs text-[#3E5C76] leading-relaxed">
            {isReady
              ? "Assigned driver has clocked in, safety inspections are verified, and vehicle PM odometer is within operational tolerance."
              : gating.reasonText || "This vehicle cannot depart until compliance conditions are satisfied."}
          </p>
        </div>
      )}

      {/* 2. VEHICLE SPECIFICATIONS & ROUTE ASSIGNMENT */}
      <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
          <Truck size={14} className="text-[#0A4B6E]" />
          <span>Vehicle & Route Assignment</span>
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#3E5C76] font-medium">Plate Number</span>
            <span className="font-bold text-[#0A4B6E]">{activeEntry.truckPlate}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#3E5C76] font-medium">Model / Asset</span>
            <span className="font-semibold text-slate-800">
              {activeEntry.truckModel || activeEntry.model || "Delivery Truck"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#3E5C76] font-medium flex items-center gap-1">
              <MapPin size={12} className="text-[#0A4B6E]" />
              <span>Service Zone</span>
            </span>
            <span className="font-bold text-[#0A4B6E]">
              {activeEntry.zoneCode ? `${activeEntry.zoneCode} — ` : ""}
              {activeEntry.zoneName || "District Route"}
            </span>
          </div>

          {departureFormatted && departureFormatted !== "—" && (
            <div className="flex items-center justify-between">
              <span className="text-[#3E5C76] font-medium flex items-center gap-1">
                <Clock size={12} className="text-[#0A4B6E]" />
                <span>Departure Time</span>
              </span>
              <span className="font-semibold text-slate-800">{departureFormatted}</span>
            </div>
          )}

          {returnFormatted && (
            <div className="flex items-center justify-between">
              <span className="text-[#3E5C76] font-medium flex items-center gap-1">
                <RotateCcw size={12} className="text-emerald-700" />
                <span>Return Time</span>
              </span>
              <span className="font-semibold text-emerald-800">{returnFormatted}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. ASSIGNED CREW & ATTENDANCE */}
      <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
          <User size={14} className="text-[#0A4B6E]" />
          <span>Assigned Crew & Attendance</span>
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#3E5C76] font-medium">Assigned Driver</span>
            <span className="font-bold text-slate-800">
              {activeEntry.driverName || activeEntry.driver?.name || "Unassigned"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#3E5C76] font-medium">Sales Representative</span>
            <span className="font-semibold text-slate-800">
              {activeEntry.salesName || activeEntry.salesUser?.username || "Unassigned"}
            </span>
          </div>

          {activeEntry.driverPhone && (
            <div className="flex items-center justify-between">
              <span className="text-[#3E5C76] font-medium">Driver Contact</span>
              <span className="font-mono text-slate-700">{activeEntry.driverPhone}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. CARGO MANIFEST & TRANSFER SLIPS */}
      {isTrip && loadsList.length > 0 ? (
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
            <Layers size={14} className="text-[#0A4B6E]" />
            <span>Cargo Manifest & Stock Slips</span>
          </h3>

          <div className="space-y-2.5">
            {/* Initial Departure Loads */}
            {dispatchLoads.map((load) => (
              <div key={load.id || load.slipNumber} className="bg-white rounded-lg p-2.5 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#0A4B6E] flex items-center gap-1">
                    <Truck size={12} /> Initial Departure Load
                  </span>
                  <span className="text-[11px] font-mono text-[#3E5C76] bg-slate-100 px-1.5 py-0.5 rounded">
                    {load.slipNumber}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  {load.items?.map((item, idx) => {
                    const isCan = isCanisterProduct(item);
                    const units = Number(item.quantityUnits) || 0;
                    const { crates, remainder } = getCanisterCrates(units);

                    return (
                      <div key={idx} className="flex justify-between items-center text-slate-700">
                        <span className="truncate pr-2">{item.productName}</span>
                        <span className="font-bold text-[#0A4B6E] shrink-0">
                          {units} {isCan ? "cans" : "cyl"}
                          {isCan && crates > 0 ? ` (${crates} crt${remainder > 0 ? ` +${remainder}` : ""})` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Midday Reloads */}
            {middayLoads.map((load) => (
              <div key={load.id || load.slipNumber} className="bg-amber-50/70 rounded-lg p-2.5 border border-amber-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-900 flex items-center gap-1">
                    <Plus size={12} strokeWidth={2.5} /> Midday Reload Transfer
                  </span>
                  <span className="text-[11px] font-mono text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                    {load.slipNumber}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  {load.items?.map((item, idx) => {
                    const isCan = isCanisterProduct(item);
                    const units = Number(item.quantityUnits) || 0;
                    const { crates, remainder } = getCanisterCrates(units);

                    return (
                      <div key={idx} className="flex justify-between items-center text-amber-950">
                        <span className="truncate pr-2">{item.productName}</span>
                        <span className="font-bold shrink-0">
                          +{units} {isCan ? "cans" : "cyl"}
                          {isCan && crates > 0 ? ` (${crates} crt${remainder > 0 ? ` +${remainder}` : ""})` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Return Physical Unload */}
            {returnUnload && (
              <div className="bg-blue-50/70 rounded-lg p-2.5 border border-[#BCE1F1] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#0A4B6E] flex items-center gap-1">
                    <RotateCcw size={12} /> Return Physical Unload
                  </span>
                  <span className="text-[11px] font-mono text-[#0A4B6E] bg-white px-1.5 py-0.5 rounded">
                    {returnUnload.slipNumber}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  {returnUnload.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-700">
                      <span className="truncate pr-2">
                        {item.productName} ({item.condition?.replace("_", " ")})
                      </span>
                      <span className="font-bold text-[#0A4B6E] shrink-0">{item.quantityUnits} units</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* 5. RECONCILIATION AUDIT SUMMARY */}
      {reconciliation && (
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="font-bold text-xs text-[#0A4B6E] flex items-center gap-1.5 uppercase tracking-wider">
              <FileSpreadsheet size={14} className="text-[#0A4B6E]" />
              <span>Reconciliation Audit Math</span>
            </span>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                reconciliation.isSettled
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {reconciliation.isSettled ? "SETTLED & CLOSED" : "PENDING AUDIT"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[#3E5C76] block text-[11px]">Loaded Full</span>
              <span className="font-bold text-slate-800 text-sm">{reconciliation.totalLoadedFull ?? "—"}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[#3E5C76] block text-[11px]">Total Sold Full</span>
              <span className="font-bold text-slate-800 text-sm">{reconciliation.totalSoldFull ?? "—"}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[#3E5C76] block text-[11px]">Returned Full</span>
              <span className="font-bold text-slate-800 text-sm">{reconciliation.totalReturnedFull ?? "—"}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[#3E5C76] block text-[11px]">Returned Empty Good</span>
              <span className="font-bold text-slate-800 text-sm">{reconciliation.totalReturnedEmptyGood ?? "—"}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#3E5C76]">Full Discrepancy:</span>
              <span className={`font-bold ${Number(reconciliation.fullDiscrepancy) === 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {reconciliation.fullDiscrepancy ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#3E5C76]">Empty Discrepancy:</span>
              <span className={`font-bold ${Number(reconciliation.emptyDiscrepancy) === 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {reconciliation.emptyDiscrepancy ?? 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6. OPERATIONAL ACTIONS CONTAINER */}
      {canManage && (
        <div className="pt-3 border-t border-slate-200 space-y-2.5">
          {/* Scheduled Run Actions */}
          {!isTrip && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onDispatch && onDispatch(activeEntry)}
                disabled={isUnavailable}
                className="w-full py-2.5 px-4 rounded-full text-[11px] font-bold bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Dispatch Vehicle</span>
              </button>

              <button
                type="button"
                onClick={() => onCancelSchedule && onCancelSchedule(activeEntry)}
                className="w-full py-2 px-4 rounded-full text-[11px] font-bold bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-600 hover:text-rose-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-widest"
              >
                <CalendarX size={13} />
                <span>Cancel Scheduled Run</span>
              </button>
            </div>
          )}

          {/* Active Trip Actions */}
          {isTrip && isOnRoute && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onMiddayReload && onMiddayReload(tripData || activeEntry)}
                  className="w-full py-2.5 px-3 rounded-full text-[11px] font-bold bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#0A4B6E] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 uppercase tracking-widest"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>+ Midday Reload</span>
                </button>

                <button
                  type="button"
                  onClick={() => onReturnCheckIn && onReturnCheckIn(tripData || activeEntry)}
                  className="w-full py-2.5 px-3 rounded-full text-[11px] font-bold bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 uppercase tracking-widest"
                >
                  <span>Return Check-In</span>
                  <ArrowRight size={13} strokeWidth={2.5} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => onCancelTrip && onCancelTrip(tripData || activeEntry)}
                className="w-full py-2 px-4 rounded-full text-[11px] font-bold bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-widest"
              >
                <AlertOctagon size={13} />
                <span>Cancel Active Trip</span>
              </button>
            </div>
          )}

          {/* Settled Trip Actions */}
          {isTrip && isPendingRecon && (
            <button
              type="button"
              onClick={() => onReconciliation && onReconciliation(tripData || activeEntry)}
              className="w-full py-2.5 px-4 rounded-full text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 uppercase tracking-widest"
            >
              <span>Reconcile & Settle Trip</span>
              <ArrowRight size={13} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// src/components/route-dispatch/TripDetailPanel.jsx
import React from "react";
import {
  Truck,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  RotateCcw,
  Plus,
  CalendarX,
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { formatPhilippineTime } from "../../utils/date.js";
import TripReconciliationLedger from "./TripReconciliationLedger.jsx";

export default function TripDetailPanel({
  entry,
  trip,
  schedule,
  onMiddayReload,
  onCancelTrip,
  onCancelSchedule,
  canManage = true,
}) {
  const activeEntry = entry || trip || schedule;
  if (!activeEntry) return null;

  const isTrip = Boolean(
    activeEntry.isTrip ||
      activeEntry.operationalStatus === "OUT_ON_ROAD" ||
      activeEntry.operationalStatus === "RETURNED" ||
      activeEntry.departureTime ||
      activeEntry.tripId
  );
  const isReady = activeEntry.operationalStatus === "READY";
  const isUnavailable = activeEntry.operationalStatus === "UNAVAILABLE";

  // Trip-specific data
  const tripData = isTrip ? (trip || activeEntry) : null;
  const currentStatus = (tripData?.rawStatus || tripData?.status || activeEntry?.status || "").toUpperCase();
  const reconStatus = (tripData?.reconciliation?.status || tripData?.status || "").toUpperCase();
  const isReturned = currentStatus === "RETURNED" || activeEntry?.operationalStatus === "RETURNED";
  const isFlaggedVariance = reconStatus === "FLAGGED_VARIANCE";
  const isAwaitingSync = reconStatus === "AWAITING_SYNC" && !isReturned && currentStatus === "COMPLETED";
  const isSettled = reconStatus === "SETTLED" || (currentStatus === "COMPLETED" && !isFlaggedVariance && !isAwaitingSync);
  const isPendingRecon = isReturned || isAwaitingSync || isFlaggedVariance;
  const isOnRoute = (currentStatus === "IN_PROGRESS" || activeEntry?.operationalStatus === "OUT_ON_ROAD") && !isReturned;

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
  const reconciliation = tripData?.reconciliation || null;

  // Gating summary for scheduled entries
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
              {isOnRoute ? "Step 1 of 3: Active Route" : isReturned ? "Step 2 of 3: Yard Return · Stock Check-In Needed" : isPendingRecon ? "Step 2 of 3: Return Unload" : "Step 3 of 3: Settled"}
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
              <p className={`text-[11px] truncate ${isReturned ? "text-amber-100 font-bold" : isPendingRecon ? "text-amber-100" : isSettled ? "text-emerald-700" : "text-slate-500"}`}>
                {isReturned ? "Ready for Dock" : isPendingRecon ? "Needs Audit" : isSettled ? "Unloaded" : "Pending"}
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

      {/* 3. ASSIGNED CREW */}
      <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
          <User size={14} className="text-[#0A4B6E]" />
          <span>Assigned Crew</span>
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

      {/* 4 & 5. UNIFIED LOADED VS. RETURNED & RECONCILIATION LEDGER */}
      {isTrip && (loadsList.length > 0 || reconciliation) ? (
        <TripReconciliationLedger trip={tripData} />
      ) : null}

      {/* 6. CONTEXTUAL & DESTRUCTIVE ACTIONS (Primary CTAs live in SideDrawer sticky footer) */}
      {canManage && ((!isTrip && !activeEntry.isRedispatch) || (isTrip && isOnRoute)) && (
        <div className="pt-3 border-t border-slate-200 space-y-2">
          {/* Scheduled Run Secondary Action */}
          {!isTrip && !activeEntry.isRedispatch && (
            <button
              type="button"
              onClick={() => onCancelSchedule && onCancelSchedule(activeEntry)}
              className="w-full py-2 px-4 rounded-full text-[11px] font-bold bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-600 hover:text-rose-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-widest"
            >
              <CalendarX size={13} />
              <span>Cancel Scheduled Run</span>
            </button>
          )}

          {/* Active Trip Contextual & Destructive Actions */}
          {isTrip && isOnRoute && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onMiddayReload && onMiddayReload(tripData || activeEntry)}
                className="w-full py-2.5 px-3 rounded-full text-[11px] font-bold bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#0A4B6E] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 uppercase tracking-widest"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>Midday Reload</span>
              </button>

              <button
                type="button"
                onClick={() => onCancelTrip && onCancelTrip(tripData || activeEntry)}
                className="w-full py-2.5 px-3 rounded-full text-[11px] font-bold bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 uppercase tracking-widest"
              >
                <AlertOctagon size={13} />
                <span>Cancel Active Trip</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

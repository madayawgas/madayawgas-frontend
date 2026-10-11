// src/components/route-dispatch/TripDetailPanel.jsx
import { useState } from "react";
import {
  Truck,
  User,
  MapPin,
  Gauge,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Copy,
  Check,
  RotateCcw,
  Plus,
  FileSpreadsheet,
} from "lucide-react";
import { isCanisterProduct, getCanisterCrates } from "../../utils/product.js";

export default function TripDetailPanel({
  trip,
  onClose,
  onMiddayReload,
  onReturnCheckIn,
  onReconciliation,
  canManage = true,
}) {
  const [copiedId, setCopiedId] = useState(false);

  if (!trip) return null;

  const handleCopyPlateNumber = () => {
    if (!trip.truckPlate) return;
    navigator.clipboard.writeText(trip.truckPlate);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getStatusBadge = (status) => {
    switch ((status || "").toUpperCase()) {
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            OUT ON ROUTE
          </span>
        );
      case "AWAITING_SYNC":
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
            <Clock size={12} className="text-amber-600" />
            PENDING RECONCILIATION
          </span>
        );
      case "SETTLED":
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-[#0A4B6E] border border-[#BCE1F1] text-xs font-bold px-2.5 py-0.5 rounded-full">
            <CheckCircle2 size={12} className="text-[#0A4B6E]" />
            SETTLED & CLOSED
          </span>
        );
      case "FLAGGED_VARIANCE":
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-50 text-[#D93025] border border-rose-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
            <AlertTriangle size={12} className="text-[#D93025]" />
            FLAGGED VARIANCE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {status || "PENDING"}
          </span>
        );
    }
  };

  // Determine active step for 3-stage stepper
  const currentStatus = (trip.status || "").toUpperCase();
  const isSettled = currentStatus === "SETTLED";
  const isPendingRecon = currentStatus === "AWAITING_SYNC" || currentStatus === "FLAGGED_VARIANCE";
  const isOnRoute = currentStatus === "IN_PROGRESS";

  const departureDate = trip.departureTime
    ? new Date(trip.departureTime).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    : "—";

  const departureTimeStr = trip.departureTime
    ? new Date(trip.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";

  const returnTimeStr = trip.returnTime
    ? new Date(trip.returnTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  // Staging Loads analysis
  const loadsList = Array.isArray(trip.loads) ? trip.loads : [];
  const dispatchLoads = loadsList.filter((l) => l.transferType === "DISPATCH_LOAD");
  const middayLoads = loadsList.filter((l) => l.transferType === "MIDDAY_RELOAD");
  const returnUnload = loadsList.find((l) => l.transferType === "RETURN_UNLOAD");

  const reconciliation = trip.reconciliation || null;

  return (
    <div className="w-full max-w-[430px] shrink-0 h-full flex flex-col overflow-hidden bg-white rounded-2xl border border-[#0A4B6E]/20 shadow-sm p-4 text-left">
      {/* 1. TOP HEADER BANNER */}
      <div className="shrink-0 rounded-xl p-3.5 bg-[#F4F8FA] border border-[#BCE1F1]/70 mb-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 shadow-2xs">
              <Truck size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-bold text-[#0A4B6E] truncate leading-tight tracking-tight">
                  {trip.truckPlate}
                </h2>
                <button
                  type="button"
                  onClick={handleCopyPlateNumber}
                  className="p-1 rounded text-slate-400 hover:text-[#0A4B6E] hover:bg-white transition-colors cursor-pointer"
                  title="Copy Vehicle Plate"
                >
                  {copiedId ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
              <div className="text-xs text-slate-500 font-medium truncate">
                {trip.truckModel || "Delivery Truck"}
              </div>
              <div className="flex items-center gap-1 text-xs text-[#6D8AA2] font-medium mt-0.5 truncate">
                <MapPin size={11} className="text-[#0A4B6E] shrink-0" />
                <span>Zone: <strong className="text-[#0A4B6E]">{trip.zoneCode || trip.zoneName}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#BCE1F1]/60 flex items-center justify-between">
          <span className="text-[11px] text-[#6D8AA2]">Trip Status</span>
          {getStatusBadge(trip.status)}
        </div>
      </div>

      {/* 2. SCROLLABLE BODY */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3.5 pr-1">
        {/* 2.1 Lifecycle Stepper Bar */}
        <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#0A4B6E] mb-2">
            <span>Trip Lifecycle Progress</span>
            <span className="text-[10px] text-slate-500 font-medium">
              {isOnRoute ? "Step 1 of 3" : isPendingRecon ? "Step 2 of 3" : "Step 3 of 3"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 relative">
            {/* Step 1: Out on Route */}
            <div className={`p-2 rounded-lg text-center transition-all ${
              isOnRoute
                ? "bg-[#0A4B6E] text-white shadow-xs"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}>
              <div className="flex items-center justify-center mb-0.5">
                {isOnRoute ? (
                  <span className="w-2 h-2 rounded-full bg-[#FFDF2C] animate-pulse" />
                ) : (
                  <CheckCircle2 size={13} className="text-emerald-600" />
                )}
              </div>
              <p className="text-[10px] font-bold truncate">1. Out on Route</p>
              <p className={`text-[9px] truncate ${isOnRoute ? "text-[#FFDF2C]" : "text-emerald-700"}`}>
                {isOnRoute ? "Active Run" : "Departed"}
              </p>
            </div>

            {/* Step 2: Return Check-In */}
            <div className={`p-2 rounded-lg text-center transition-all ${
              isPendingRecon
                ? "bg-amber-500 text-white shadow-xs"
                : isSettled
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-slate-100 text-slate-400"
            }`}>
              <div className="flex items-center justify-center mb-0.5">
                {isPendingRecon ? (
                  <Clock size={12} className="text-white" />
                ) : isSettled ? (
                  <CheckCircle2 size={13} className="text-emerald-600" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                )}
              </div>
              <p className="text-[10px] font-bold truncate">2. Return Check-In</p>
              <p className={`text-[9px] truncate ${isPendingRecon ? "text-amber-100" : isSettled ? "text-emerald-700" : "text-slate-400"}`}>
                {isPendingRecon ? "Needs Audit" : isSettled ? "Unloaded" : "Pending Return"}
              </p>
            </div>

            {/* Step 3: Reconcile & Settle */}
            <div className={`p-2 rounded-lg text-center transition-all ${
              isSettled
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-xs"
                : "bg-slate-100 text-slate-400"
            }`}>
              <div className="flex items-center justify-center mb-0.5">
                {isSettled ? (
                  <CheckCircle2 size={13} className="text-[#FFDF2C]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                )}
              </div>
              <p className="text-[10px] font-bold truncate">3. Settle Trip</p>
              <p className={`text-[9px] truncate ${isSettled ? "text-white" : "text-slate-400"}`}>
                {isSettled ? "Settled (0 Var)" : "Final Audit"}
              </p>
            </div>
          </div>
        </div>

        {/* 2.2 Operational Context Guidance Callout */}
        {isOnRoute && (
          <div className="p-3 rounded-xl bg-[#E8F3F8] border border-[#BCE1F1] text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#0A4B6E] mb-1">
              <Truck size={14} className="text-[#0A4B6E]" />
              <span>Truck is Currently Out on Route</span>
            </div>
            <p className="text-[#486581] text-[11px] leading-relaxed">
              The crew is actively distributing LPG in <strong>{trip.zoneName || trip.zoneCode}</strong>.
            </p>
            <ul className="mt-1.5 space-y-1 text-[11px] text-[#0A4B6E] list-disc list-inside">
              <li>
                <strong>Need more stock?</strong> Click <em>"+ Midday Reload"</em> below to record an additional staging slip.
              </li>
              <li>
                <strong>Truck returned to yard?</strong> Click <em>"Return Check-In ➔"</em> to record return mileage and unload physical cylinders.
              </li>
            </ul>
          </div>
        )}

        {isPendingRecon && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
              <RotateCcw size={14} className="text-amber-700" />
              <span>Truck Returned · Awaiting Stock Reconciliation</span>
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              The truck has completed its run and physically unloaded at Bunawan Yard. Return odometer has been logged at{" "}
              <strong>{trip.returnOdometer?.toLocaleString()} km</strong> (+{trip.distanceDrivenKm || 0} km).
            </p>
            <p className="mt-1 text-[11px] font-bold text-amber-900">
              Next step: Click <em>"Reconcile & Settle Trip ➔"</em> to verify that returned full/empty cylinders match mobile sales receipts.
            </p>
          </div>
        )}

        {isSettled && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
              <CheckCircle2 size={14} className="text-emerald-700" />
              <span>Trip Closed with Zero Discrepancy</span>
            </div>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              All loaded cylinders, customer sales invoices, and returned empties have been mathematically verified. All records are locked and archived.
            </p>
          </div>
        )}

        {/* 2.3 Vehicle & Crew Card */}
        <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8F0]">
            <span className="font-bold text-[#0A4B6E] flex items-center gap-1.5">
              <Truck size={13} /> Vehicle Details
            </span>
            <span className="font-bold text-slate-800">{trip.truckPlate}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[#6D8AA2] block">Vehicle Model</span>
              <span className="font-semibold text-slate-700">{trip.truckModel || "—"}</span>
            </div>
            <div>
              <span className="text-[#6D8AA2] block">Service Zone</span>
              <span className="font-semibold text-[#0A4B6E]">{trip.zoneCode}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0] space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[#6D8AA2] flex items-center gap-1">
                <User size={11} /> Driver:
              </span>
              <span className="font-semibold text-slate-800">{trip.driverName || "Unassigned"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6D8AA2] flex items-center gap-1">
                <User size={11} /> Sales Rep:
              </span>
              <span className="font-semibold text-slate-800">{trip.salesName || "Unassigned"}</span>
            </div>
          </div>
        </div>

        {/* 2.4 Telemetry & Odometer Readings */}
        <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8F0]">
            <span className="font-bold text-[#0A4B6E] flex items-center gap-1.5">
              <Gauge size={13} /> Telemetry & Mileage
            </span>
            <span className="text-[11px] text-slate-500">{departureDate}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white p-2 rounded-lg border border-[#E2E8F0]">
              <span className="text-[#6D8AA2] block text-[10px]">Departure Odo</span>
              <span className="font-bold text-slate-800 text-xs">
                {trip.departureOdometer ? `${trip.departureOdometer.toLocaleString()} km` : "—"}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{departureTimeStr}</span>
            </div>

            <div className="bg-white p-2 rounded-lg border border-[#E2E8F0]">
              <span className="text-[#6D8AA2] block text-[10px]">Return Odo</span>
              <span className="font-bold text-slate-800 text-xs">
                {trip.returnOdometer ? `${trip.returnOdometer.toLocaleString()} km` : "Pending Return"}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {returnTimeStr ? returnTimeStr : "In Transit"}
              </span>
            </div>
          </div>

          {trip.distanceDrivenKm ? (
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-[#6D8AA2]">Total Distance Driven:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                +{trip.distanceDrivenKm} km
              </span>
            </div>
          ) : null}
        </div>

        {/* 2.5 Staging Transfer Slips & Items */}
        <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8F0]">
            <span className="font-bold text-[#0A4B6E] flex items-center gap-1.5">
              <Layers size={13} /> Staging Transfer Slips
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E]">
              {loadsList.length} Total Slips
            </span>
          </div>

          {loadsList.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">No detailed load slips attached.</p>
          ) : (
            <div className="space-y-2">
              {/* Departure Load */}
              {dispatchLoads.map((load) => (
                <div key={load.id || load.slipNumber} className="bg-white rounded-lg p-2.5 border border-[#E2E8F0]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[11px] text-[#0A4B6E] flex items-center gap-1">
                      <Truck size={11} /> Initial Departure Load
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                      {load.slipNumber}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {load.items?.map((item, idx) => {
                      const isCan = isCanisterProduct(item);
                      const units = Number(item.quantityUnits) || 0;
                      const { crates, remainder } = getCanisterCrates(units);

                      return (
                        <div key={idx} className="flex justify-between items-center text-[11px] text-slate-700">
                          <span className="truncate pr-2">{item.productName}</span>
                          <span className="font-bold shrink-0">
                            {units} {isCan ? "cans" : "cylinders"}
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
                <div key={load.id || load.slipNumber} className="bg-amber-50/60 rounded-lg p-2.5 border border-amber-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[11px] text-amber-900 flex items-center gap-1">
                      <Plus size={11} /> Midday Reload Transfer
                    </span>
                    <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                      {load.slipNumber}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {load.items?.map((item, idx) => {
                      const isCan = isCanisterProduct(item);
                      const units = Number(item.quantityUnits) || 0;
                      const { crates, remainder } = getCanisterCrates(units);

                      return (
                        <div key={idx} className="flex justify-between items-center text-[11px] text-amber-950">
                          <span className="truncate pr-2">{item.productName}</span>
                          <span className="font-bold shrink-0">
                            +{units} {isCan ? "cans" : "cylinders"}
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
                <div className="bg-blue-50/60 rounded-lg p-2.5 border border-[#BCE1F1]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[11px] text-[#0A4B6E] flex items-center gap-1">
                      <RotateCcw size={11} /> Physical Return Unload
                    </span>
                    <span className="text-[10px] font-mono text-[#0A4B6E] bg-white px-1.5 py-0.2 rounded">
                      {returnUnload.slipNumber}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {returnUnload.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] text-slate-700">
                        <span className="truncate pr-2">
                          {item.productName} ({item.condition?.replace("_", " ")})
                        </span>
                        <span className="font-bold shrink-0">{item.quantityUnits} units</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2.6 Reconciliation Audit Math Summary */}
        {reconciliation && (
          <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] space-y-2 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8F0]">
              <span className="font-bold text-[#0A4B6E] flex items-center gap-1.5">
                <FileSpreadsheet size={13} /> Reconciliation Audit
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                reconciliation.isSettled
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {reconciliation.isSettled ? "SETTLED" : "PENDING AUDIT"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="bg-white p-2 rounded border border-[#E2E8F0]">
                <span className="text-[#6D8AA2] block text-[10px]">Loaded Full</span>
                <span className="font-bold text-slate-800">{reconciliation.totalLoadedFull ?? "—"}</span>
              </div>
              <div className="bg-white p-2 rounded border border-[#E2E8F0]">
                <span className="text-[#6D8AA2] block text-[10px]">Total Sold Full</span>
                <span className="font-bold text-slate-800">{reconciliation.totalSoldFull ?? "—"}</span>
              </div>
              <div className="bg-white p-2 rounded border border-[#E2E8F0]">
                <span className="text-[#6D8AA2] block text-[10px]">Returned Full</span>
                <span className="font-bold text-slate-800">{reconciliation.totalReturnedFull ?? "—"}</span>
              </div>
              <div className="bg-white p-2 rounded border border-[#E2E8F0]">
                <span className="text-[#6D8AA2] block text-[10px]">Returned Empty Good</span>
                <span className="font-bold text-slate-800">{reconciliation.totalReturnedEmptyGood ?? "—"}</span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
              <span className="text-[#6D8AA2]">Full Discrepancy:</span>
              <span className={`font-bold ${
                Number(reconciliation.fullDiscrepancy) === 0 ? "text-emerald-700" : "text-rose-700"
              }`}>
                {reconciliation.fullDiscrepancy ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#6D8AA2]">Empty Discrepancy:</span>
              <span className={`font-bold ${
                Number(reconciliation.emptyDiscrepancy) === 0 ? "text-emerald-700" : "text-rose-700"
              }`}>
                {reconciliation.emptyDiscrepancy ?? 0}
              </span>
            </div>

            {reconciliation.supervisorNotes && (
              <div className="mt-1 pt-1.5 border-t border-[#E2E8F0] text-[10.5px] text-slate-500 italic">
                "{reconciliation.supervisorNotes}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. STICKY ACTION FOOTER BAR */}
      {canManage && (
        <div className="shrink-0 pt-3 mt-2 border-t border-[#BCE1F1]/60 space-y-2">
          {isOnRoute && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onMiddayReload && onMiddayReload(trip)}
                className="w-full text-center py-2 px-3 bg-white border border-[#BCE1F1] hover:bg-[#E8F3F8] text-[#0A4B6E] rounded-full text-xs font-bold transition-colors cursor-pointer"
              >
                + Midday Reload
              </button>
              <button
                type="button"
                onClick={() => onReturnCheckIn && onReturnCheckIn(trip)}
                className="w-full text-center py-2 px-3 bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] rounded-full text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                Return Check-In ➔
              </button>
            </div>
          )}

          {isPendingRecon && (
            <button
              type="button"
              onClick={() => onReconciliation && onReconciliation(trip)}
              className="w-full text-center py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
            >
              <span>Reconcile & Settle Trip ➔</span>
            </button>
          )}

          {isSettled && (
            <button
              type="button"
              onClick={() => onReconciliation && onReconciliation(trip)}
              className="w-full text-center py-2 px-3 bg-[#E8F3F8] hover:bg-[#D5E3EC] text-[#0A4B6E] rounded-full text-xs font-bold transition-colors cursor-pointer"
            >
              View Full Audit Report
            </button>
          )}
        </div>
      )}
    </div>
  );
}

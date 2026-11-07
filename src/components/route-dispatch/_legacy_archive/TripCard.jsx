// src/components/route-dispatch/TripCard.jsx
import { Truck, User, MapPin, Gauge, Layers, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

export default function TripCard({
  trip,
  isSelected = false,
  onClick,
  onMiddayReload,
  onReturnCheckIn,
  onReconciliation,
  canManage = true,
}) {
  const getStatusBadge = (status) => {
    switch ((status || "").toUpperCase()) {
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            OUT ON ROUTE
          </span>
        );
      case "AWAITING_SYNC":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
            <Clock size={11} className="text-amber-600" />
            PENDING RECONCILIATION
          </span>
        );
      case "SETTLED":
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
            <CheckCircle2 size={11} className="text-[#0A4B6E]" />
            SETTLED & CLOSED
          </span>
        );
      case "FLAGGED_VARIANCE":
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-[#D93025] border border-rose-200 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
            <AlertTriangle size={11} className="text-[#D93025]" />
            FLAGGED VARIANCE
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
            {status || "PENDING"}
          </span>
        );
    }
  };

  const formattedDeparture = trip.departureTime
    ? new Date(trip.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div
      onClick={() => onClick && onClick(trip)}
      className={`rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between cursor-pointer select-none text-left ${
        isSelected
          ? "bg-[#E8F3F8]/40 border-2 border-[#0A4B6E] ring-2 ring-[#0A4B6E]/20 shadow-md"
          : "bg-white border border-[#D5E3EC] hover:border-[#0A4B6E]/40 hover:shadow-sm shadow-xs"
      }`}
    >
      <div>
        {/* Top: Vehicle Plate Number & Status */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="font-bold text-base text-[#0A4B6E] tracking-tight">
                {trip.truckPlate || "No Plate"}
              </span>
              {getStatusBadge(trip.status)}
            </div>
            <div className="flex items-center gap-1 text-xs text-[#6D8AA2] truncate">
              <MapPin size={12} className="text-[#0A4B6E] shrink-0" />
              <span className="truncate">
                Zone: <strong className="text-[#0A4B6E]">{trip.zoneCode || trip.zoneName}</strong>
              </span>
            </div>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            isSelected ? "bg-[#0A4B6E] text-[#FFDF2C]" : "bg-[#E8F3F8] text-[#0A4B6E]"
          }`}>
            <Truck size={16} />
          </div>
        </div>

        {/* Middle Details Grid */}
        <div className="space-y-1.5 bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] text-xs mb-3">
          <div className="flex justify-between items-center">
            <span className="text-[#6D8AA2] flex items-center gap-1">
              <Truck size={12} /> Model:
            </span>
            <span className="font-semibold text-slate-800 truncate max-w-[170px] text-right">
              {trip.truckModel || "Delivery Vehicle"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#6D8AA2] flex items-center gap-1">
              <User size={12} /> Crew:
            </span>
            <span className="font-medium text-slate-700 truncate max-w-[170px] text-right">
              {trip.driverName} <span className="text-[#6D8AA2]">· {trip.salesName}</span>
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#6D8AA2] flex items-center gap-1">
              <Gauge size={12} /> Departure Odo:
            </span>
            <span className="font-semibold text-slate-800">
              {trip.departureOdometer ? `${trip.departureOdometer.toLocaleString()} km` : "—"}
              <span className="font-normal text-slate-500 text-[11px] ml-1">({formattedDeparture})</span>
            </span>
          </div>

          {trip.returnOdometer && (
            <div className="flex justify-between items-center pt-1 border-t border-[#E2E8F0]">
              <span className="text-[#6D8AA2] flex items-center gap-1">
                <Gauge size={12} /> Return Odo:
              </span>
              <span className="font-bold text-slate-800">
                {trip.returnOdometer.toLocaleString()} km
                {trip.distanceDrivenKm ? (
                  <span className="text-emerald-700 font-semibold text-[11px] ml-1">
                    (+{trip.distanceDrivenKm} km)
                  </span>
                ) : null}
              </span>
            </div>
          )}

          {trip.loads?.length > 0 && (
            <div className="flex justify-between items-center pt-1 border-t border-[#E2E8F0]">
              <span className="text-[#6D8AA2] flex items-center gap-1">
                <Layers size={12} /> Transfer Slips:
              </span>
              <span className="font-bold text-[#0A4B6E]">
                {trip.loads.length} Slips Recorded
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Buttons based on Lifecycle */}
      {canManage && (
        <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
          {trip.status === "IN_PROGRESS" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMiddayReload(trip);
                }}
                className="w-full text-center py-2 px-2.5 bg-white border border-[#BCE1F1] hover:bg-[#E8F3F8] text-[#0A4B6E] rounded-full text-xs font-bold transition-colors cursor-pointer"
                title="Send extra LPG stock to truck mid-route"
              >
                + Midday Reload
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReturnCheckIn(trip);
                }}
                className="w-full text-center py-2 px-2.5 bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] rounded-full text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="Truck back at yard: log mileage and unload items"
              >
                Return Check-In ➔
              </button>
            </div>
          )}

          {trip.status === "AWAITING_SYNC" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReconciliation(trip);
              }}
              className="w-full text-center py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1"
              title="Audit returned physical stock against mobile sales receipts"
            >
              <span>Reconcile & Settle Trip ➔</span>
            </button>
          )}

          {(trip.status === "SETTLED" || trip.status === "FLAGGED_VARIANCE") && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReconciliation(trip);
              }}
              className="w-full text-center py-2 px-3 bg-[#E8F3F8] hover:bg-[#D5E3EC] text-[#0A4B6E] rounded-full text-xs font-bold transition-colors cursor-pointer"
            >
              View Reconciliation Audit Report
            </button>
          )}
        </div>
      )}
    </div>
  );
}

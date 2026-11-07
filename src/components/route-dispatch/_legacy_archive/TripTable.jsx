// src/components/route-dispatch/TripTable.jsx
import {
  Truck,
  User,
  MapPin,
  Gauge,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";

export default function TripTable({
  trips = [],
  selectedTrip,
  onSelectTrip,
  sortConfig = { key: "truckPlate", direction: "asc" },
  onSort,
  onMiddayReload,
  onReturnCheckIn,
  onReconciliation,
  canManage = true,
}) {
  const getStatusBadge = (status) => {
    switch ((status || "").toUpperCase()) {
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            OUT ON ROUTE
          </span>
        );
      case "AWAITING_SYNC":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
            <Clock size={10} className="text-amber-600" />
            PENDING RECON
          </span>
        );
      case "SETTLED":
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-[#0A4B6E] border border-[#BCE1F1] text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
            <CheckCircle2 size={10} className="text-[#0A4B6E]" />
            SETTLED
          </span>
        );
      case "FLAGGED_VARIANCE":
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-[#D93025] border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
            <AlertTriangle size={10} className="text-[#D93025]" />
            VARIANCE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
            {status || "PENDING"}
          </span>
        );
    }
  };

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return null;
    return <span className="ml-1 text-[10px]">{sortConfig.direction === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[840px]">
          {/* Table Header */}
          <thead className="bg-[#0D4B6E] text-white text-xs sticky top-0 z-10 shadow-xs select-none">
            <tr>
              <th
                className="py-3 px-3.5 font-semibold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[17%]"
                onClick={() => onSort && onSort("truckPlate")}
              >
                Vehicle Plate {renderSortArrow("truckPlate")}
              </th>
              <th
                className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[13%]"
                onClick={() => onSort && onSort("zoneCode")}
              >
                Service Zone {renderSortArrow("zoneCode")}
              </th>
              <th
                className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[16%]"
                onClick={() => onSort && onSort("truckModel")}
              >
                Vehicle Model {renderSortArrow("truckModel")}
              </th>
              <th
                className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[16%]"
                onClick={() => onSort && onSort("driverName")}
              >
                Assigned Crew {renderSortArrow("driverName")}
              </th>
              <th
                className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[15%]"
                onClick={() => onSort && onSort("departureOdometer")}
              >
                Odometer & Km {renderSortArrow("departureOdometer")}
              </th>
              <th
                className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px] text-center cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[11%]"
                onClick={() => onSort && onSort("status")}
              >
                Status {renderSortArrow("status")}
              </th>
              <th className="py-3 px-3 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap w-[11%]">
                Action
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100 text-xs">
            {trips.length > 0 ? (
              trips.map((trip) => {
                const isSelected = selectedTrip?.id === trip.id;
                const formattedDate = trip.departureTime
                  ? new Date(trip.departureTime).toLocaleDateString([], { month: "short", day: "numeric" })
                  : "—";
                const formattedTime = trip.departureTime
                  ? new Date(trip.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "";

                return (
                  <tr
                    key={trip.id}
                    onClick={() => onSelectTrip && onSelectTrip(trip)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? "bg-[#E8F3F8]/70 hover:bg-[#E8F3F8] ring-1 ring-inset ring-[#0A4B6E]/30"
                        : "hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {/* Vehicle Plate & Departure Date */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-bold text-[#0A4B6E] flex items-center gap-1.5">
                        <Truck size={13} className="text-[#0A4B6E] shrink-0" />
                        <span>{trip.truckPlate}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {formattedDate} {formattedTime ? `· ${formattedTime}` : ""}
                      </div>
                    </td>

                    {/* Zone */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-800 font-semibold">
                        <MapPin size={11} className="text-[#0A4B6E] shrink-0" />
                        <span>{trip.zoneCode || trip.zoneName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {trip.zoneName || "District Route"}
                      </div>
                    </td>

                    {/* Vehicle Model */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{trip.truckModel || "Delivery Truck"}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                        {trip.onBoardSummary?.totalUnits ? `${trip.onBoardSummary.totalUnits} units onboard` : "Standard Cargo"}
                      </div>
                    </td>

                    {/* Crew */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                        <User size={11} className="text-[#6D8AA2] shrink-0" />
                        <span>{trip.driverName || "Unassigned"}</span>
                      </div>
                      <div className="text-[10px] text-[#6D8AA2] truncate max-w-[130px]">
                        {trip.salesName ? `Sales: ${trip.salesName}` : "No sales rep"}
                      </div>
                    </td>

                    {/* Odometer */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <Gauge size={11} className="text-slate-400 shrink-0" />
                        <span>{trip.departureOdometer?.toLocaleString() || "—"} km</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {trip.returnOdometer ? (
                          <span>
                            Ret: {trip.returnOdometer.toLocaleString()} km{" "}
                            {trip.distanceDrivenKm ? (
                              <strong className="text-emerald-700">(+{trip.distanceDrivenKm} km)</strong>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-slate-400">In transit</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(trip.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {canManage && (
                        <div className="flex items-center justify-end gap-1.5">
                          {trip.status === "IN_PROGRESS" && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMiddayReload && onMiddayReload(trip);
                                }}
                                className="px-2 py-1 rounded-full text-[10px] font-bold bg-white border border-[#BCE1F1] hover:bg-[#E8F3F8] text-[#0A4B6E] transition cursor-pointer"
                                title="Midday reload"
                              >
                                + Reload
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReturnCheckIn && onReturnCheckIn(trip);
                                }}
                                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] transition cursor-pointer shadow-2xs"
                                title="Return check-in"
                              >
                                Check-In
                              </button>
                            </>
                          )}

                          {trip.status === "AWAITING_SYNC" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReconciliation && onReconciliation(trip);
                              }}
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer shadow-2xs"
                              title="Reconcile and settle"
                            >
                              Settle ➔
                            </button>
                          )}

                          {(trip.status === "SETTLED" || trip.status === "FLAGGED_VARIANCE") && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReconciliation && onReconciliation(trip);
                              }}
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E8F3F8] hover:bg-[#D5E3EC] text-[#0A4B6E] transition cursor-pointer"
                              title="View audit"
                            >
                              Audit
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Truck size={24} className="text-slate-300 mb-2" />
                    <p className="font-semibold text-xs text-slate-600">No operational trips found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try clearing search or active filter criteria.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

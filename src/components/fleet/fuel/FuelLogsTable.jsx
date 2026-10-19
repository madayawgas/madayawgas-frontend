// src/components/fleet/fuel/FuelLogsTable.jsx
import {
  Truck,
  UserRound,
  MapPin,
  Eye,
  Receipt,
  Calendar,
  Clock,
} from "lucide-react";
import Badge from "../../ui/Badge";
import { formatPhilippineDate, formatPhilippineTime } from "../../../utils/date.js";

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

export default function FuelLogsTable({
  logs = [],
  isLoading = false,
  onPreviewReceipt,
}) {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[980px]">
          <thead className="bg-[#0D4B6E] text-white text-xs md:text-sm sticky top-0 z-10 shadow-xs select-none">
            <tr>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[17%]">
                Date & Time
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[20%]">
                Vehicle Asset
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[15%]">
                Driver
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[17%]">
                Fuel Station
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap w-[10%]">
                Volume
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap w-[12%]">
                Total Cost
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap w-[10%]">
                Odometer
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-center whitespace-nowrap w-[9%]">
                Receipt
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
                      Loading fuel intake logs...
                    </span>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[#E8F3F8] flex items-center justify-center text-[#0A4B6E] shadow-xs">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-[#0A4B6E]">
                      No Intake Records Logged
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                      Fuel purchase entries logged by frontline drivers or operations supervisors will appear here.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const logId = log.id;
                const plate = log.vehicle?.plateNumber || "N/A";
                const model = log.vehicle?.model || "";
                const vehicleType = log.vehicle?.vehicleType || "";
                const driverName = log.driver?.fullName || log.driver?.username || "Driver";
                const station = log.fuelStation || "Commercial Station";
                const fuelType = (log.fuelType || "DIESEL").toUpperCase();
                const liters = Number(log.litersPumped || log.liters || 0);
                const cost = Number(log.totalCost || 0);
                const pricePerLiter = Number(log.pricePerLiter || (liters > 0 ? cost / liters : 0));
                const odometer = log.odometerReading !== null && log.odometerReading !== undefined
                  ? Number(log.odometerReading)
                  : null;
                const hasReceipt = Boolean(log.receiptMediaUrl || log.receiptMediaKey);

                return (
                  <tr
                    key={logId}
                    className="hover:bg-[#F4F9FC] transition-colors duration-150 group"
                  >
                    {/* Date & Time */}
                    <td className="py-3.5 px-4 md:px-5">
                      <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs md:text-sm">
                        <Calendar size={13} className="text-[#6D8AA2] shrink-0" />
                        <span>{formatPhilippineDate(log.fueledAt || log.createdAt, { fallback: "—" })}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#6D8AA2] font-medium pl-4 mt-0.5">
                        <Clock size={11} className="shrink-0" />
                        <span>{formatPhilippineTime(log.fueledAt || log.createdAt)}</span>
                      </div>
                    </td>

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
                            {vehicleType && (
                              <Badge variant="info" className="px-1.5 py-0 text-[9px] font-bold">
                                {vehicleType.replace(/_/g, " ")}
                              </Badge>
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
                          <UserRound size={12} />
                        </div>
                        <span className="truncate text-xs md:text-[13px] font-medium text-[#0A4B6E]">
                          {driverName}
                        </span>
                      </div>
                    </td>

                    {/* Fuel Station & Type */}
                    <td className="py-3.5 px-4 md:px-5">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate flex items-center gap-1.5">
                          <MapPin size={13} className="text-[#6D8AA2] shrink-0" />
                          <span className="truncate">{station}</span>
                        </p>
                        <div className="mt-1">
                          <Badge variant="neutral" className="px-2 py-0 text-[10px] font-bold">
                            {fuelType}
                          </Badge>
                        </div>
                      </div>
                    </td>

                    {/* Volume (L) */}
                    <td className="py-3.5 px-4 md:px-5 text-right">
                      <span className="font-bold text-[#0A4B6E] text-sm">
                        {formatNumber(liters)}
                      </span>{" "}
                      <span className="text-xs text-[#6D8AA2] font-semibold">L</span>
                    </td>

                    {/* Total Cost */}
                    <td className="py-3.5 px-4 md:px-5 text-right">
                      <div className="font-bold text-[#1B4B75] text-sm">
                        {formatCurrency(cost)}
                      </div>
                      <div className="text-[11px] text-[#6D8AA2] font-medium mt-0.5">
                        ₱{formatNumber(pricePerLiter, 2)} / L
                      </div>
                    </td>

                    {/* Odometer */}
                    <td className="py-3.5 px-4 md:px-5 text-right">
                      {odometer !== null ? (
                        <span className="font-bold text-slate-800 text-xs md:text-sm">
                          {odometer.toLocaleString()} KM
                        </span>
                      ) : (
                        <span className="text-slate-300 font-medium">—</span>
                      )}
                    </td>

                    {/* Receipt Media Preview */}
                    <td className="py-3.5 px-4 md:px-5 text-center">
                      {hasReceipt ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (onPreviewReceipt) {
                              onPreviewReceipt({
                                fileUrl: log.receiptMediaUrl,
                                storageKey: log.receiptMediaKey,
                                fileName: `${plate} - ${station} Receipt`,
                                title: `${plate} - Fuel Receipt (${formatCurrency(cost)})`,
                              });
                            }
                          }}
                          className="inline-flex items-center gap-1 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs px-3 py-1 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer"
                          title="View fuel purchase receipt"
                        >
                          <Eye size={12} className="shrink-0" />
                          <span>Receipt</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs italic">—</span>
                      )}
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

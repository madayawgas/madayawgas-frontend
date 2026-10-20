// src/components/fleet/apprehensions/ApprehensionsTable.jsx
import {
  FileWarning,
  ShieldAlert,
  Truck,
  UserRound,
  MapPin,
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

function getStatusBadgeConfig(status) {
  const normalized = (status || "").toUpperCase();
  switch (normalized) {
    case "SETTLED":
      return {
        label: "SETTLED",
        variant: "success",
      };
    case "DISPUTED":
      return {
        label: "DISPUTED",
        variant: "info",
      };
    case "CANCELLED":
      return {
        label: "CANCELLED",
        variant: "neutral",
      };
    case "RECORDED":
    default:
      return {
        label: "OPEN",
        variant: "warning",
      };
  }
}

function getAgencyBadgeColor(agency) {
  const clean = (agency || "").toUpperCase().trim();
  if (clean.includes("LTO")) return "bg-blue-50 text-blue-800 border-blue-200";
  if (clean.includes("CTTMO")) return "bg-amber-50 text-amber-900 border-amber-200";
  if (clean.includes("PNP") || clean.includes("HPG")) return "bg-purple-50 text-purple-800 border-purple-200";
  if (clean.includes("DPWH")) return "bg-orange-50 text-orange-800 border-orange-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function ApprehensionsTable({
  apprehensions = [],
  isLoading = false,
  onSelectApprehension,
}) {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[980px]">
          <thead className="bg-[#0D4B6E] text-white text-xs md:text-sm sticky top-0 z-10 shadow-xs select-none">
            <tr>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[17%]">
                Citation Ticket #
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[16%]">
                Incident Time
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[19%]">
                Vehicle Asset
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[14%]">
                Driver
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[16%]">
                Violation Classification
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-center whitespace-nowrap w-[9%]">
                Agency
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap w-[10%]">
                Penalty
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-center whitespace-nowrap w-[9%]">
                Status
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
                      Loading driver road apprehensions...
                    </span>
                  </div>
                </td>
              </tr>
            ) : apprehensions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[#E8F3F8] flex items-center justify-center text-[#0A4B6E] shadow-xs">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-[#0A4B6E]">
                      No Road Apprehensions Detected
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                      No road citations were recorded for the selected filter criteria. Road traffic tickets logged by drivers or supervisors will appear here.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              apprehensions.map((item) => {
                const id = item.id;
                const ticketNo = item.citationTicketNo || "CITATION PENDING";
                const plate = item.vehicle?.plateNumber || "N/A";
                const model = item.vehicle?.model || "";
                const vehicleType = item.vehicle?.vehicleType || "";
                const driverName = item.driver?.fullName || item.driver?.username || "Driver";
                const violation = item.violationType || "Traffic Violation";
                const agency = item.apprehendingAgency || "Traffic Enforcer";
                const penalty = Number(item.penaltyAmount || 0);
                const statusCfg = getStatusBadgeConfig(item.status);

                return (
                  <tr
                    key={id}
                    onClick={() => onSelectApprehension && onSelectApprehension(item)}
                    className="hover:bg-[#F4F9FC] transition-colors duration-150 cursor-pointer group"
                  >
                    {/* Citation Ticket # */}
                    <td className="py-3.5 px-4 md:px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                          <FileWarning size={15} />
                        </div>
                        <span className="font-bold text-[#0A4B6E] group-hover:underline truncate text-xs md:text-sm">
                          {ticketNo}
                        </span>
                      </div>
                    </td>

                    {/* Incident Time */}
                    <td className="py-3.5 px-4 md:px-5">
                      <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs md:text-sm">
                        <Calendar size={13} className="text-[#6D8AA2] shrink-0" />
                        <span>{formatPhilippineDate(item.incidentTime || item.createdAt, { fallback: "—" })}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#6D8AA2] font-medium pl-4 mt-0.5">
                        <Clock size={11} className="shrink-0" />
                        <span>{formatPhilippineTime(item.incidentTime || item.createdAt)}</span>
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

                    {/* Violation Classification */}
                    <td className="py-3.5 px-4 md:px-5 text-slate-800">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 max-w-[200px]" title={violation}>
                          {violation}
                        </p>
                        {item.location && (
                          <p className="text-[11px] text-[#6D8AA2] font-medium truncate max-w-[180px] flex items-center gap-1 mt-0.5" title={item.location}>
                            <MapPin size={11} className="text-[#6D8AA2] shrink-0" />
                            <span>{item.location}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Agency */}
                    <td className="py-3.5 px-4 md:px-5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${getAgencyBadgeColor(
                          agency
                        )}`}
                      >
                        {agency}
                      </span>
                    </td>

                    {/* Penalty */}
                    <td className="py-3.5 px-4 md:px-5 text-right font-bold text-[#1B4B75] text-sm">
                      {formatCurrency(penalty)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 md:px-5 text-center">
                      <Badge
                        variant={statusCfg.variant}
                        className="px-2.5 py-0.5 text-[10px] font-bold uppercase"
                      >
                        {statusCfg.label}
                      </Badge>
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

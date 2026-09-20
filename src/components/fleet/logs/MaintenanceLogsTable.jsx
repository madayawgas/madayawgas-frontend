// src/components/fleet/logs/MaintenanceLogsTable.jsx
import { useState, Fragment } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Badge from "../../ui/Badge";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  } catch {
    return dateStr;
  }
}

function formatCurrency(val) {
  const num = Number(val) || 0;
  return `₱${num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function MaintenanceLogsTable({
  logs = [],
  isLoading = false,
}) {
  const [expandedRowId, setExpandedRowId] = useState(null);

  const toggleRow = (id) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-[#0D4B6E] text-white text-xs md:text-sm sticky top-0 z-10 shadow-xs">
            <tr>
              <th className="py-3 px-4 md:px-5 font-medium whitespace-nowrap w-[16%]">Official Receipt</th>
              <th className="py-3 px-4 md:px-5 font-medium whitespace-nowrap w-[17%]">Vehicle Asset</th>
              <th className="py-3 px-4 md:px-5 font-medium whitespace-nowrap w-[15%]">Service Type</th>
              <th className="py-3 px-4 md:px-5 font-medium whitespace-nowrap w-[20%]">Service Center</th>
              <th className="py-3 px-4 md:px-5 font-medium text-right whitespace-nowrap w-[11%]">Total Cost</th>
              <th className="py-3 px-4 md:px-5 font-medium text-center whitespace-nowrap w-[11%]">Status</th>
              <th className="py-3 px-4 md:px-5 font-medium text-right whitespace-nowrap w-[10%]">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-[#0B4A6E] border-t-transparent rounded-full animate-spin" />
                    <span>Loading maintenance logs...</span>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                  No maintenance logs match your search or filter.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const logId = log.id;
                const isExpanded = expandedRowId === logId;
                const plate = log.plateNumber || log.truck?.plateNumber || "N/A";
                const model = log.truck?.model || "";
                const typeName = log.maintenanceTypeName || "MAINTENANCE";
                const shop = log.workOrder?.shopName || log.shopName || "In-House Facility";
                const parts = Number(log.partsCost) || 0;
                const labor = Number(log.laborCost) || 0;
                const total = Number(log.totalCost) || parts + labor;

                return (
                  <Fragment key={logId}>
                    <tr
                      onClick={() => toggleRow(logId)}
                      className={`transition-colors duration-150 cursor-pointer ${
                        isExpanded ? "bg-[#E2EDF3] text-[#0A4B6E]" : "hover:bg-[#E8F3F8]/70 bg-white"
                      }`}
                    >
                      {/* Official Receipt & Resolved Date */}
                      <td className="py-3.5 px-4 md:px-5">
                        <div className="font-mono font-bold text-[#0B4A6E] truncate">
                          {log.officialReceiptNumber || "Pending OR"}
                        </div>
                        <div className="text-[11px] text-[#6D8AA2] italic truncate">
                          {formatDate(log.dateResolved || log.createdAt)}
                        </div>
                      </td>

                      {/* Vehicle Asset */}
                      <td className="py-3.5 px-4 md:px-5">
                        <div className="font-bold text-gray-800 truncate">{plate}</div>
                        {model && <div className="text-[11px] text-[#6D8AA2] font-normal truncate">{model}</div>}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 md:px-5">
                        <Badge variant="roles" className="text-[10px] px-2 py-0.5 truncate max-w-full inline-block">
                          {typeName}
                        </Badge>
                      </td>

                      {/* Shop Name */}
                      <td className="py-3.5 px-4 md:px-5 text-gray-700 font-medium">
                        <div className="truncate" title={shop}>
                          {shop}
                        </div>
                      </td>

                      {/* Total Cost */}
                      <td className="py-3.5 px-4 md:px-5 text-right font-bold text-[#0A4B6E] whitespace-nowrap">
                        {formatCurrency(total)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 md:px-5 text-center whitespace-nowrap">
                        <Badge variant="success" className="text-[10px] px-2 py-0.5">
                          COMPLETED
                        </Badge>
                      </td>

                      {/* Expand Toggle */}
                      <td className="py-3.5 px-4 md:px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            className="p-1 rounded-full text-slate-500 hover:text-[#0B4A6E] hover:bg-slate-200/60 transition-colors cursor-pointer"
                            title={isExpanded ? "Collapse Details" : "Expand Details"}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail Accordion Row */}
                    {isExpanded && (
                      <tr key={`${logId}-details`} className="bg-[#F8FBFC] border-b border-gray-100">
                        <td colSpan={7} className="py-4 px-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-[#0A4B6E]/20 shadow-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-[#6D8AA2] uppercase tracking-wider">
                                Service Scope
                              </span>
                              <p className="text-xs text-slate-800 font-medium">
                                {log.workOrder?.description || log.description || "Routine maintenance overhaul."}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-[#6D8AA2] uppercase tracking-wider">
                                Cost Breakdown
                              </span>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                Parts: <strong className="text-[#0A4B6E]">{formatCurrency(parts)}</strong>
                                <br />
                                Labor: <strong className="text-[#0A4B6E]">{formatCurrency(labor)}</strong>
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-[#6D8AA2] uppercase tracking-wider">
                                Odometer at Service
                              </span>
                              <p className="text-xs font-bold text-[#0A4B6E] font-mono">
                                {log.odometerAtService
                                  ? `${Number(log.odometerAtService).toLocaleString()} KM`
                                  : "N/A"}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-[#6D8AA2] uppercase tracking-wider">
                                Vehicle Downtime
                              </span>
                              <p className="text-xs font-bold text-amber-700">
                                {log.downtimeDays !== undefined ? `${log.downtimeDays} Day(s)` : "1 Day"}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

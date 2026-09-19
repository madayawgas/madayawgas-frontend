// src/components/dashboard/MaintenanceDashboardSection.jsx
import { useState, useMemo, Fragment } from "react";
import {
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Badge from "../ui/Badge";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
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

export default function MaintenanceDashboardSection({
  logs = [],
  isLoading = false,
  onRefresh,
}) {
  const [selectedType, setSelectedType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRowId, setExpandedRowId] = useState(null);

  const toggleRow = (id) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  // 1. Calculate KPI Metrics from all completed logs
  const { totalLogged, totalExpenditure, totalDowntime, averageCost } =
    useMemo(() => {
      const count = logs.length;
      const expenditure = logs.reduce((sum, log) => {
        const parts = Number(log.partsCost) || 0;
        const labor = Number(log.laborCost) || 0;
        const total = Number(log.totalCost) || parts + labor;
        return sum + total;
      }, 0);
      const downtime = logs.reduce((sum, log) => {
        return sum + (Number(log.downtimeDays) || 1);
      }, 0);
      const avg = count > 0 ? expenditure / count : 0;

      return {
        totalLogged: count,
        totalExpenditure: expenditure,
        totalDowntime: downtime,
        averageCost: avg,
      };
    }, [logs]);

  // 2. Filter logs by type & search query
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const type = (log.maintenanceTypeName || "").toUpperCase();
      if (selectedType !== "ALL" && type !== selectedType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const receipt = (log.officialReceiptNumber || "").toLowerCase();
        const plate = (
          log.plateNumber ||
          log.truck?.plateNumber ||
          ""
        ).toLowerCase();
        const model = (
          log.truckModel ||
          log.truck?.model ||
          ""
        ).toLowerCase();
        const shop = (
          log.workOrder?.shopName ||
          log.shopName ||
          ""
        ).toLowerCase();
        const desc = (
          log.workOrder?.description ||
          log.description ||
          ""
        ).toLowerCase();

        return (
          receipt.includes(q) ||
          plate.includes(q) ||
          model.includes(q) ||
          shop.includes(q) ||
          desc.includes(q)
        );
      }
      return true;
    });
  }, [logs, selectedType, searchQuery]);

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
      {/* Header with Title, Super Admin Badge & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-[#E8F3F8] rounded-2xl flex items-center justify-center text-[#0B4A6E] shrink-0 shadow-xs">
            <FileText className="w-6 h-6 text-[#0B4A6E]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl md:text-2xl font-bold text-[#0B4A6E]">
                Historical Maintenance Logs
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Super Admin Access
              </span>
            </div>
            <p className="text-xs md:text-sm text-[#6D8AA2] mt-0.5">
              Settled repairs archive, parts & labor expenditures, and official
              receipts.
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto shrink-0 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#0B4A6E] ${
                isLoading ? "animate-spin" : ""
              }`}
            />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* 4 KPI Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Logged */}
        <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Logged
          </span>
          <div className="mt-2">
            <h3 className="text-2xl md:text-3xl font-bold text-[#0B4A6E]">
              {totalLogged}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Completed Work Orders</p>
          </div>
        </div>

        {/* Total Expenditure */}
        <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Expenditure
          </span>
          <div className="mt-2">
            <h3 className="text-2xl md:text-3xl font-bold text-[#0B4A6E]">
              {formatCurrency(totalExpenditure)}
            </h3>
            <p className="text-xs font-semibold text-emerald-600 mt-1">
              Parts & Labor Combined
            </p>
          </div>
        </div>

        {/* Total Downtime */}
        <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Downtime
          </span>
          <div className="mt-2">
            <h3 className="text-2xl md:text-3xl font-bold text-amber-600">
              {totalDowntime} {totalDowntime === 1 ? "day" : "days"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Cumulative Fleet Idle</p>
          </div>
        </div>

        {/* Average Cost / Order */}
        <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Average Cost / Order
          </span>
          <div className="mt-2">
            <h3 className="text-2xl md:text-3xl font-bold text-[#0B4A6E]">
              {formatCurrency(averageCost)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Mean Service Cost</p>
          </div>
        </div>
      </div>

      {/* Filter Pills and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-1">
        {/* Type Filter Pills */}
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-full border border-slate-200/80 gap-1 shrink-0 self-start">
          <button
            type="button"
            onClick={() => setSelectedType("ALL")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedType === "ALL"
                ? "bg-[#0B4A6E] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-transparent"
            }`}
          >
            All Types
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("CORRECTIVE")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedType === "CORRECTIVE"
                ? "bg-[#0B4A6E] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-transparent"
            }`}
          >
            CORRECTIVE
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("PREVENTIVE")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedType === "PREVENTIVE"
                ? "bg-[#0B4A6E] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-transparent"
            }`}
          >
            PREVENTIVE
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search OR#, plate, shop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F3F5F5] border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0B4A6E] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Historical Maintenance Table */}
      <div className="w-full border border-[#0A4B6E]/25 rounded-2xl overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto max-h-[480px] custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#0D4B6E] text-white text-xs uppercase tracking-wider sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-3.5 px-4 font-semibold whitespace-nowrap">
                  Official Receipt (OR#)
                </th>
                <th className="py-3.5 px-4 font-semibold whitespace-nowrap">
                  Vehicle
                </th>
                <th className="py-3.5 px-4 font-semibold whitespace-nowrap">
                  Type
                </th>
                <th className="py-3.5 px-4 font-semibold whitespace-nowrap">
                  Facility
                </th>
                <th className="py-3.5 px-4 font-semibold whitespace-nowrap">
                  Resolution & Downtime
                </th>
                <th className="py-3.5 px-4 font-semibold whitespace-nowrap">
                  Serviced ODO
                </th>
                <th className="py-3.5 px-4 font-semibold whitespace-nowrap">
                  Parts / Labor
                </th>
                <th className="py-3.5 px-4 font-semibold whitespace-nowrap">
                  Total Cost
                </th>
                <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-center">
                  Severity
                </th>
                <th className="py-3.5 px-3 font-semibold whitespace-nowrap text-right w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#0B4A6E] border-t-transparent rounded-full animate-spin" />
                      <span>Loading maintenance logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-12 text-center text-gray-400 italic"
                  >
                    No maintenance logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const logId = log.id;
                  const isExpanded = expandedRowId === logId;
                  const plate =
                    log.plateNumber || log.truck?.plateNumber || "N/A";
                  const model =
                    log.truckModel || log.truck?.model || "";
                  const typeName =
                    log.maintenanceTypeName || "CORRECTIVE";
                  const shop =
                    log.workOrder?.shopName ||
                    log.shopName ||
                    "In-House Facility";
                  const parts = Number(log.partsCost) || 0;
                  const labor = Number(log.laborCost) || 0;
                  const total =
                    Number(log.totalCost) || parts + labor;
                  const downtime =
                    log.downtimeDays !== undefined
                      ? Number(log.downtimeDays)
                      : 1;
                  const severity = (
                    log.severity || "LOW"
                  ).toUpperCase();

                  const severityBadgeVariant =
                    severity === "CRITICAL"
                      ? "danger"
                      : severity === "HIGH"
                      ? "danger"
                      : severity === "MEDIUM"
                      ? "warning"
                      : "success";

                  return (
                    <Fragment key={logId}>
                      <tr
                        onClick={() => toggleRow(logId)}
                        className={`transition-colors cursor-pointer ${
                          isExpanded
                            ? "bg-[#E2EDF3]/40"
                            : "hover:bg-slate-50/80 bg-white"
                        }`}
                      >
                        {/* OR# */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-[#0B4A6E]">
                            {log.officialReceiptNumber || "Pending OR"}
                          </span>
                        </td>

                        {/* Vehicle */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">
                            {plate}
                          </div>
                          {model && (
                            <div className="text-[11px] text-[#6D8AA2] font-normal">
                              {model}
                            </div>
                          )}
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4">
                          <Badge
                            variant="roles"
                            className="text-[10px] px-2.5 py-0.5"
                          >
                            {typeName}
                          </Badge>
                        </td>

                        {/* Facility */}
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          <div className="max-w-[200px] truncate" title={shop}>
                            {shop}
                          </div>
                        </td>

                        {/* Resolution & Downtime */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">
                            {formatDate(log.dateResolved || log.createdAt)}
                          </div>
                          <div className="text-[11px] font-semibold text-amber-600">
                            {downtime} day(s) downtime
                          </div>
                        </td>

                        {/* Serviced ODO */}
                        <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                          {log.odometerAtService
                            ? `${Number(
                                log.odometerAtService
                              ).toLocaleString()} km`
                            : "-"}
                        </td>

                        {/* Parts / Labor */}
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <div>
                            P:{" "}
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(parts)}
                            </span>
                          </div>
                          <div>
                            L:{" "}
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(labor)}
                            </span>
                          </div>
                        </td>

                        {/* Total Cost */}
                        <td className="py-3.5 px-4 font-bold text-[#0A4B6E] whitespace-nowrap">
                          {formatCurrency(total)}
                        </td>

                        {/* Severity */}
                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant={severityBadgeVariant}
                            className="text-[10px] px-2.5 py-0.5"
                          >
                            {severity}
                          </Badge>
                        </td>

                        {/* Expand Chevron */}
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            className="p-1 rounded-full text-slate-400 hover:text-[#0B4A6E] hover:bg-slate-200/50 transition cursor-pointer"
                            title={
                              isExpanded ? "Collapse Details" : "Expand Details"
                            }
                          >
                            {isExpanded ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr
                          key={`${logId}-expanded`}
                          className="bg-[#F8FBFC] border-b border-gray-100"
                        >
                          <td colSpan={10} className="py-4 px-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-[#0A4B6E]/20 shadow-xs">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-[#6D8AA2] uppercase tracking-wider">
                                  Scope of Work
                                </span>
                                <p className="text-xs text-slate-800 font-medium">
                                  {log.workOrder?.description ||
                                    log.description ||
                                    "Maintenance inspection and service overhaul."}
                                </p>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-[#6D8AA2] uppercase tracking-wider">
                                  Cost Breakdown
                                </span>
                                <p className="text-xs text-slate-700 leading-relaxed">
                                  Parts:{" "}
                                  <strong className="text-[#0A4B6E]">
                                    {formatCurrency(parts)}
                                  </strong>
                                  <br />
                                  Labor:{" "}
                                  <strong className="text-[#0A4B6E]">
                                    {formatCurrency(labor)}
                                  </strong>
                                </p>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-[#6D8AA2] uppercase tracking-wider">
                                  Service Timeline
                                </span>
                                <p className="text-xs text-slate-700">
                                  Started:{" "}
                                  <strong>
                                    {formatDate(log.dateStarted)}
                                  </strong>
                                  <br />
                                  Resolved:{" "}
                                  <strong>
                                    {formatDate(log.dateResolved)}
                                  </strong>
                                </p>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-[#6D8AA2] uppercase tracking-wider">
                                  Official Documentation
                                </span>
                                <p className="text-xs font-mono font-bold text-[#0B4A6E]">
                                  OR: {log.officialReceiptNumber || "Pending"}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Recorded on {formatDate(log.createdAt)}
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
    </div>
  );
}


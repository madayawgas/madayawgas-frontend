// src/components/fleet/analytics/RecurringIssuesAnalytics.jsx
import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  Wrench,
  Truck,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Search,
  FileText,
} from "lucide-react";
import { fleetApi } from "../../../api/fleet.js";
import Badge from "../../ui/Badge";
import SearchBar from "../../ui/SearchBar";

const LOOKBACK_OPTIONS = [
  { value: 30, label: "Last 30 Days" },
  { value: 60, label: "Last 60 Days" },
  { value: 90, label: "Last 90 Days" },
  { value: 180, label: "Last 180 Days" },
];

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

const getSeverityBadgeVariant = (severity) => {
  const normalized = (severity || "").toUpperCase();
  switch (normalized) {
    case "CRITICAL":
      return "danger";
    case "HIGH":
      return "warning";
    case "MEDIUM":
      return "roles";
    case "LOW":
      return "success";
    default:
      return "neutral";
  }
};

/**
 * RecurringIssuesAnalytics
 * Fleet reliability and chronic defect intelligence adhering to Madayaw Gas UI standards.
 */
export default function RecurringIssuesAnalytics({
  trucks = [],
  onCreateWorkOrderForTruck,
}) {
  const [days, setDays] = useState(90);
  const [minOccurrences, setMinOccurrences] = useState(2);
  const [selectedTruckId, setSelectedTruckId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [analyticsData, setAnalyticsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRowId, setExpandedRowId] = useState(null);

  const toggleRow = (id) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const params = {
        days,
        minOccurrences,
      };
      if (selectedTruckId) {
        params.truckId = selectedTruckId;
      }
      const res = await fleetApi.getRecurringIssuesAnalytics(params);
      setAnalyticsData(res?.data?.recurringIssues || []);
    } catch (err) {
      console.error("Failed to load recurring defect analytics:", err);
      setError("Unable to compute recurring defect analytics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [days, minOccurrences, selectedTruckId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Aggregate insights
  const totalRecurrences = useMemo(() => {
    return analyticsData.reduce((sum, item) => sum + (item.occurrenceCount || 0), 0);
  }, [analyticsData]);

  const topIssueType = useMemo(() => {
    if (analyticsData.length === 0) return "None";
    const freqMap = {};
    analyticsData.forEach((item) => {
      const type = (item.incidentTypeName || "Other").replace(/_/g, " ");
      freqMap[type] = (freqMap[type] || 0) + item.occurrenceCount;
    });
    let maxType = "None";
    let maxCount = 0;
    Object.entries(freqMap).forEach(([t, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxType = t;
      }
    });
    return maxType;
  }, [analyticsData]);

  // Filter analytics data by search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return analyticsData;
    const q = searchQuery.toLowerCase().trim();
    return analyticsData.filter((item) => {
      const plate = (item.plateNumber || "").toLowerCase();
      const model = (item.truckModel || "").toLowerCase();
      const type = (item.incidentTypeName || "").toLowerCase();
      const category = (item.defectCategory || "").toLowerCase();
      const descs = (item.descriptions || []).join(" ").toLowerCase();
      return (
        plate.includes(q) ||
        model.includes(q) ||
        type.includes(q) ||
        category.includes(q) ||
        descs.includes(q)
      );
    });
  }, [analyticsData, searchQuery]);

  return (
    <div className="flex flex-col h-full space-y-4 pb-4">
      {/* 1. TOP TOOLBAR CONTROLS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <SearchBar
          placeholder="Search by vehicle plate, model, defect, or notes"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md"
        />

        {/* Filter Controls & Lookback Horizon Pills */}
        <div className="flex flex-wrap items-center gap-2.5 justify-end shrink-0">
          {/* Segmented Lookback Horizon */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-full border border-slate-200/80 gap-1">
            {LOOKBACK_OPTIONS.map((opt) => {
              const isSelected = days === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDays(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#0B4A6E] text-[#FFDF2C] shadow-xs"
                      : "text-slate-600 hover:text-slate-900 bg-transparent"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Min Occurrences Pill Selector */}
          <select
            value={minOccurrences}
            onChange={(e) => setMinOccurrences(parseInt(e.target.value, 10))}
            className="px-3.5 py-1.5 text-xs bg-white rounded-full border border-[#0A4B6E]/30 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/20 text-[#0A4B6E] font-semibold cursor-pointer shadow-2xs"
          >
            <option value={1}>1+ Repeats</option>
            <option value={2}>2+ Repeats</option>
            <option value={3}>3+ Repeats</option>
            <option value={4}>4+ Repeats</option>
          </select>

          {/* Vehicle Filter Selector */}
          <select
            value={selectedTruckId}
            onChange={(e) => setSelectedTruckId(e.target.value)}
            className="px-3.5 py-1.5 text-xs bg-white rounded-full border border-[#0A4B6E]/30 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/20 text-[#0A4B6E] font-semibold cursor-pointer shadow-2xs max-w-[160px]"
          >
            <option value="">All Vehicles</option>
            {trucks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.plateNumber} {t.model ? `(${t.model})` : ""}
              </option>
            ))}
          </select>

          {/* Refresh Action Button */}
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-[#0A4B6E] font-semibold text-xs px-3.5 py-1.5 rounded-full transition-colors cursor-pointer shadow-2xs active:scale-95"
            title="Refresh defect analytics"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-[#0A4B6E] ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. STAT CARDS SUMMARY (Branded Madayaw Gas Palette) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Recurring Defect Clusters */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4 md:p-5 border border-[#BCE1F1]/70 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-[#6D8AA2] uppercase">
              Recurring Defect Clusters
            </span>
            <p className="text-2xl md:text-[26px] font-bold text-[#1B4B75] mt-0.5">
              {analyticsData.length}
            </p>
            <p className="text-xs text-[#588094] font-medium mt-0.5">
              Repeated component failure groups
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-xs">
            <AlertOctagon size={24} className="text-[#FFDF2C]" />
          </div>
        </div>

        {/* Card 2: Total Incident Recurrences */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4 md:p-5 border border-[#BCE1F1]/70 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-[#6D8AA2] uppercase">
              Total Incident Recurrences
            </span>
            <p className="text-2xl md:text-[26px] font-bold text-[#1B4B75] mt-0.5">
              {totalRecurrences}
            </p>
            <p className="text-xs text-[#588094] font-medium mt-0.5">
              Aggregated breakdown events
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-xs">
            <AlertTriangle size={24} className="text-[#FFDF2C]" />
          </div>
        </div>

        {/* Card 3: Dominant Chronic Defect */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4 md:p-5 border border-[#BCE1F1]/70 shadow-2xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[11px] font-bold tracking-wider text-[#6D8AA2] uppercase">
              Most Frequent Defect
            </span>
            <p className="text-xl md:text-2xl font-bold text-[#1B4B75] mt-0.5 truncate">
              {topIssueType}
            </p>
            <p className="text-xs text-[#588094] font-medium mt-0.5">
              Highest recurrence classification
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-xs">
            <Wrench size={24} className="text-[#FFDF2C]" />
          </div>
        </div>
      </div>

      {/* 3. MASTER TABLE: Recurring Defects & Detailed Breakdown History */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-[#0D4B6E] text-white text-xs md:text-sm sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[20%]">
                  Vehicle Asset
                </th>
                <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[24%]">
                  Defect Classification
                </th>
                <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[15%]">
                  Recurrences
                </th>
                <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[13%]">
                  Latest Severity
                </th>
                <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[13%]">
                  Last Reported
                </th>
                <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap w-[15%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-7 h-7 border-2 border-[#0B4A6E] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-[#0A4B6E]">
                        Computing recurring defect intelligence...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-red-600 font-medium">
                    {error}
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-[#0A4B6E]">
                        No Chronic Defects Detected
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                        No vehicle has logged repeated incidents exceeding {minOccurrences} occurrences in the last {days} days. Fleet health and preventive maintenance cycles are performing reliably.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const rowKey = `${item.truckId}-${item.incidentTypeId}-${idx}`;
                  const isExpanded = expandedRowId === rowKey;
                  const targetTruck = trucks.find((t) => t.id === item.truckId) || {
                    id: item.truckId,
                    plateNumber: item.plateNumber,
                    model: item.truckModel,
                  };

                  return (
                    <Fragment key={rowKey}>
                      <tr
                        onClick={() => toggleRow(rowKey)}
                        className={`transition-colors duration-150 cursor-pointer ${
                          isExpanded
                            ? "bg-[#FEF6D1] text-[#0A4B6E]"
                            : "hover:bg-[#FEF6D1] bg-white"
                        }`}
                      >
                        {/* Vehicle Asset */}
                        <td className="py-3.5 px-4 md:px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 shadow-2xs">
                              <Truck size={15} />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-[#0A4B6E] block truncate">
                                {item.plateNumber}
                              </span>
                              <span className="text-[11px] text-[#6D8AA2] font-medium block truncate">
                                {item.truckModel || "Fleet Vehicle"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Defect Classification */}
                        <td className="py-3.5 px-4 md:px-5">
                          <div className="font-semibold text-slate-800 truncate">
                            {(item.incidentTypeName || "MECHANICAL_DEFECT").replace(/_/g, " ")}
                          </div>
                          {item.defectCategory && (
                            <div className="text-[11px] font-mono text-[#6D8AA2] truncate">
                              {item.defectCategory.replace(/_/g, " ")}
                            </div>
                          )}
                        </td>

                        {/* Recurrence Count */}
                        <td className="py-3.5 px-4 md:px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-[#C93B32] border border-rose-200 shadow-2xs">
                            <AlertTriangle size={12} className="shrink-0 text-[#C93B32]" />
                            <span>{item.occurrenceCount} Occurrences</span>
                          </span>
                        </td>

                        {/* Latest Severity */}
                        <td className="py-3.5 px-4 md:px-5">
                          <Badge
                            variant={getSeverityBadgeVariant(item.latestSeverity)}
                            className="px-2.5 py-0.5 text-[10.5px] font-bold uppercase"
                          >
                            {item.latestSeverity || "MEDIUM"}
                          </Badge>
                        </td>

                        {/* Last Reported Date */}
                        <td className="py-3.5 px-4 md:px-5">
                          <div className="flex items-center gap-1 text-slate-700 font-medium">
                            <Clock size={13} className="text-[#6D8AA2] shrink-0" />
                            <span>{formatDate(item.latestIncidentDate)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 md:px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {onCreateWorkOrderForTruck && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCreateWorkOrderForTruck(targetTruck);
                                }}
                                className="flex items-center gap-1 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold rounded-full py-1.5 px-3 text-xs transition-all shadow-2xs cursor-pointer active:scale-95"
                                title="Create Work Order for this vehicle"
                              >
                                <Wrench size={12} className="shrink-0" />
                                <span>Work Order</span>
                              </button>
                            )}

                            <div className="w-6 h-6 flex items-center justify-center text-[#0A4B6E]">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Incident Reports Drawer */}
                      {isExpanded && (
                        <tr className="bg-[#E8F3F8]/40">
                          <td colSpan={6} className="p-4 md:p-5 border-t border-[#BCE1F1]/60">
                            <div className="bg-white rounded-xl p-4 border border-[#BCE1F1]/70 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-[#0A4B6E] uppercase tracking-wider">
                                  <FileText size={14} />
                                  <span>Logged Incident Observations & Roadside Reports</span>
                                </div>
                                <span className="text-[11px] text-[#6D8AA2] font-semibold">
                                  {item.descriptions?.length || 0} Incident Reports Recorded
                                </span>
                              </div>

                              {item.descriptions && item.descriptions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                  {item.descriptions.map((desc, dIdx) => (
                                    <div
                                      key={dIdx}
                                      className="bg-[#F8FAFC] rounded-xl p-3 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed"
                                    >
                                      <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                                        {dIdx + 1}
                                      </div>
                                      <div className="space-y-1">
                                        <p className="font-medium">{desc}</p>
                                        <span className="text-[10.5px] text-[#6D8AA2] block">
                                          Logged during mid-route operation
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 italic">
                                  No additional observation notes recorded for this defect cluster.
                                </p>
                              )}

                              <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                                <span className="text-slate-500">
                                  Target Asset: <strong>{item.plateNumber}</strong> ({item.truckModel || "Fleet Vehicle"})
                                </span>
                                {onCreateWorkOrderForTruck && (
                                  <button
                                    type="button"
                                    onClick={() => onCreateWorkOrderForTruck(targetTruck)}
                                    className="flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold rounded-full py-1.5 px-4 text-xs transition-all shadow-2xs cursor-pointer active:scale-95"
                                  >
                                    <Wrench size={13} />
                                    <span>Create Corrective Work Order</span>
                                  </button>
                                )}
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

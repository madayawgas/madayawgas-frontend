// src/components/fleet/analytics/RecurringIssuesAnalytics.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  Wrench,
  Truck,
  RotateCcw,
  Calendar,
  Filter,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { fleetApi } from "../../../api/fleet.js";
import Button from "../../ui/Button";

const LOOKBACK_OPTIONS = [
  { value: 30, label: "Last 30 Days" },
  { value: 60, label: "Last 60 Days" },
  { value: 90, label: "Last 90 Days" },
  { value: 180, label: "Last 180 Days" },
];

const SEVERITY_COLORS = {
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
};

/**
 * RecurringIssuesAnalytics
 * Fleet reliability intelligence surfacing repeated component failures
 * and high-frequency defects across vehicles over configurable time horizons.
 */
export default function RecurringIssuesAnalytics({
  trucks = [],
  onCreateWorkOrderForTruck,
}) {
  const [days, setDays] = useState(90);
  const [minOccurrences, setMinOccurrences] = useState(2);
  const [selectedTruckId, setSelectedTruckId] = useState("");
  const [analyticsData, setAnalyticsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
      console.error("Failed to load recurring issues analytics:", err);
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
      const type = item.incidentTypeName || "Other";
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

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="shrink-0 p-4 border-b border-slate-200/70 bg-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#1B4B75] flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-600" />
              <span>Chronic Defect & Recurring Issues Intelligence</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies chronic mechanical failures across the fleet requiring root-cause intervention.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#0B4A6E] hover:bg-slate-50 transition-all text-xs flex items-center gap-1"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Lookback Horizon Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#6D8AA2] uppercase tracking-wider mr-1">
              Window:
            </span>
            {LOOKBACK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  days === opt.value
                    ? "bg-[#0B4A6E] text-white shadow-sm"
                    : "bg-[#F3F5F5] text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Occurrence & Vehicle Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Min Repeats:</span>
              <select
                value={minOccurrences}
                onChange={(e) => setMinOccurrences(parseInt(e.target.value, 10))}
                className="px-2.5 py-1 text-xs bg-[#F3F5F5] rounded-lg border border-slate-200 focus:outline-none focus:border-[#0B4A6E] text-slate-800 font-medium"
              >
                <option value={1}>1+ occurrences</option>
                <option value={2}>2+ occurrences</option>
                <option value={3}>3+ occurrences</option>
                <option value={4}>4+ occurrences</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Vehicle:</span>
              <select
                value={selectedTruckId}
                onChange={(e) => setSelectedTruckId(e.target.value)}
                className="px-2.5 py-1 text-xs bg-[#F3F5F5] rounded-lg border border-slate-200 focus:outline-none focus:border-[#0B4A6E] text-slate-800 font-medium max-w-[150px]"
              >
                <option value="">All Trucks</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.plateNumber} {t.model ? `(${t.model})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Insight Badges Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="bg-[#E8F3F8] rounded-xl p-3 border border-[#BCE1F1]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6D8AA2]">
              Chronic Issue Groups
            </div>
            <div className="text-lg font-bold text-[#1B4B75] mt-0.5">{analyticsData.length}</div>
            <div className="text-[11px] text-slate-600">Repeated defect clusters</div>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Total Incident Recurrences
            </div>
            <div className="text-lg font-bold text-amber-800 mt-0.5">{totalRecurrences}</div>
            <div className="text-[11px] text-amber-700">Aggregated breakdown events</div>
          </div>

          <div className="bg-[#F3F5F5] rounded-xl p-3 border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6D8AA2]">
              Dominant Chronic Defect
            </div>
            <div className="text-base font-bold text-slate-800 mt-0.5 truncate">{topIssueType}</div>
            <div className="text-[11px] text-slate-500">Highest frequency failure</div>
          </div>
        </div>
      </div>

      {/* Content Area - Independent Scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <div className="w-7 h-7 border-2 border-[#0B4A6E] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Analyzing recurring defect trends...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : analyticsData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Chronic Defects Detected</h3>
            <p className="text-xs text-slate-500 max-w-md">
              No vehicle has logged repeated incidents exceeding {minOccurrences} occurrences in the last {days} days. Fleet health and preventive maintenance cycles are performing reliably.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analyticsData.map((item, idx) => {
              const severityClass = SEVERITY_COLORS[item.latestSeverity] || "bg-slate-50 text-slate-700 border-slate-200";
              const targetTruck = trucks.find((t) => t.id === item.truckId);

              return (
                <div
                  key={`${item.truckId}-${item.incidentTypeId}-${idx}`}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between hover:border-slate-300 transition-all space-y-3"
                >
                  <div>
                    {/* Header: Truck & Severity */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-[#0B4A6E]" />
                          <span className="font-bold text-sm text-[#0B4A6E]">{item.plateNumber}</span>
                          {item.truckModel && (
                            <span className="text-xs text-slate-400 font-normal">
                              ({item.truckModel})
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                          <span>{item.incidentTypeName}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${severityClass}`}
                        >
                          {item.latestSeverity}
                        </span>
                        <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {item.occurrenceCount} occurrences
                        </span>
                      </div>
                    </div>

                    {/* Timeline Details */}
                    <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Latest reported:{" "}
                        {item.latestIncidentDate
                          ? new Date(item.latestIncidentDate).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>

                    {/* Incident Descriptions List */}
                    {item.descriptions && item.descriptions.length > 0 && (
                      <div className="mt-2.5 bg-slate-50 rounded-lg p-2.5 border border-slate-200/80 space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6D8AA2]">
                          Logged Incident Reports
                        </div>
                        <ul className="space-y-1 text-xs text-slate-600">
                          {item.descriptions.slice(0, 3).map((desc, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-1.5 leading-snug">
                              <span className="text-red-500 font-bold">•</span>
                              <span className="line-clamp-2">{desc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action: Create Work Order */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Recommendation: Overhaul assembly
                    </span>

                    {onCreateWorkOrderForTruck && (
                      <Button
                        type="button"
                        onClick={() => onCreateWorkOrderForTruck(targetTruck || { id: item.truckId, plateNumber: item.plateNumber, model: item.truckModel })}
                        className="rounded-full bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0B4A6E] font-bold text-xs uppercase tracking-wider px-3 py-1 shadow-sm flex items-center gap-1"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>Create Work Order</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

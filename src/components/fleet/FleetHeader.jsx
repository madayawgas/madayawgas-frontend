// src/components/fleet/FleetHeader.jsx
import { Plus, Wrench, AlertTriangle, AlertOctagon } from "lucide-react";
import Badge from "../ui/Badge";

export default function FleetHeader({
  onAddTruck,
  canCreate = true,
  pmSummary = null,
  onTogglePmDueFilter,
  isPmDueFilterActive = false,
  onReportIncident,
  onOpenIncidentsLog,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#6D8AA2] mb-6 gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl md:text-[32px] font-bold text-[#1B4B75]">
          Fleet Board
        </h1>

        {/* PM & OPERATIONAL HEALTH METRICS STRIP */}
        {pmSummary && (
          <div className="flex flex-wrap items-center gap-2 sm:ml-2">
            <span className="text-xs text-[#588094] font-medium hidden lg:inline">
              Overview:
            </span>

            <span className="px-3 py-1 bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] rounded-full text-[11px] font-bold">
              {pmSummary.operationalVehicles || 0} Operational
            </span>

            {/* CLICKABLE PM DUE FILTER CHIP */}
            <button
              type="button"
              onClick={onTogglePmDueFilter}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                isPmDueFilterActive
                  ? "bg-[#D93025] text-white border-[#D93025] shadow-xs"
                  : (pmSummary.pmDueTotal || 0) > 0
                  ? "bg-[#FCE8E6] text-[#D93025] border-[#FAD2CF] hover:bg-red-100"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
              title="Click to toggle PM Due filter"
            >
              {(pmSummary.pmDueTotal || 0) > 0 && (
                <AlertTriangle size={13} className="shrink-0" />
              )}
              <span>{pmSummary.pmDueTotal || 0} PM Due</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* VIEW FLEET INCIDENTS LOG */}
        {onOpenIncidentsLog && (
          <button
            type="button"
            onClick={onOpenIncidentsLog}
            className="flex items-center gap-1.5 bg-[#F3F5F5] hover:bg-gray-200/80 border border-gray-300 text-[#0A4B6E] font-semibold text-xs px-3.5 py-2.5 rounded-full transition-colors cursor-pointer shadow-xs active:scale-95"
            title="View Fleet Incidents Log"
          >
            <AlertOctagon size={15} />
            <span>Incident Logs</span>
          </button>
        )}

        {/* REPORT MID-ROUTE INCIDENT / BREAKDOWN */}
        {canCreate && onReportIncident && (
          <button
            type="button"
            onClick={onReportIncident}
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100/80 border border-[#F6C445] text-[#854D0E] font-semibold text-xs px-3.5 py-2.5 rounded-full transition-colors cursor-pointer shadow-xs active:scale-95"
            title="Report Mid-Route Incident or Breakdown"
          >
            <AlertTriangle size={15} />
            <span>Report Incident</span>
          </button>
        )}

        {/* ADD NEW FLEET */}
        {canCreate && (
          <button
            type="button"
            onClick={onAddTruck}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-[#0A4B6E] text-[#0A4B6E] font-semibold text-xs px-4 py-2.5 rounded-full transition-colors cursor-pointer shadow-xs active:scale-95"
          >
            <Plus size={16} />
            <span>Add New Fleet</span>
          </button>
        )}
      </div>
    </div>
  );
}
// src/components/fleet/FleetHeader.jsx
import { useState, useEffect, useRef } from "react";
import { Plus, AlertTriangle, AlertOctagon, ChevronDown, ClipboardList } from "lucide-react";

export default function FleetHeader({
  onAddTruck,
  canCreate = true,
  pmSummary = null,
  onTogglePmDueFilter,
  isPmDueFilterActive = false,
  onReportIncident,
  onOpenIncidentsLog,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen]);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#6D8AA2] mb-6 gap-4">
      {/* Left side: Title & Soft Operational Overview indicators */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl md:text-[32px] font-bold text-[#1B4B75]">
          Fleet Board
        </h1>

        {/* Minimal Health & PM Overview Strip */}
        {pmSummary && (
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>{pmSummary.operationalVehicles || 0} Operational</span>
            </span>

            {/* Clickable PM Due Filter Chip */}
            <button
              type="button"
              onClick={onTogglePmDueFilter}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                isPmDueFilterActive
                  ? "bg-[#D93025] text-white border-[#D93025] shadow-xs"
                  : (pmSummary.pmDueTotal || 0) > 0
                  ? "bg-rose-50 text-[#D93025] border-rose-200 hover:bg-rose-100"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
              title="Click to filter vehicles with PM due"
            >
              {(pmSummary.pmDueTotal || 0) > 0 && (
                <AlertTriangle size={12} className="shrink-0" />
              )}
              <span>{pmSummary.pmDueTotal || 0} PM Due</span>
            </button>
          </div>
        )}
      </div>

      {/* Right side: Consolidated Action Controls */}
      <div className="flex items-center gap-3">
        {/* Incident Actions Dropdown (Replaces 2 separate bulky buttons with 1 clean trigger) */}
        {(onOpenIncidentsLog || onReportIncident) && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-[#0A4B6E] font-semibold text-xs px-3.5 py-2.5 rounded-full transition-colors cursor-pointer shadow-2xs active:scale-95"
            >
              <AlertOctagon size={14} className="text-amber-600" />
              <span>Incidents</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-30 animate-scale-in">
                {onOpenIncidentsLog && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenIncidentsLog();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#E8F3F8] hover:text-[#0A4B6E] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ClipboardList size={14} className="text-[#0A4B6E]" />
                    <span>View Incident Logs</span>
                  </button>
                )}

                {canCreate && onReportIncident && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onReportIncident();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>Report Roadside Incident</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Primary Action: Add New Fleet Button */}
        {canCreate && (
          <button
            type="button"
            onClick={onAddTruck}
            className="flex items-center gap-2 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs md:text-sm px-4 py-2.5 rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Fleet</span>
          </button>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import {
  Plus,
  AlertTriangle,
  AlertOctagon,
  ChevronDown,
  ClipboardList,
  Truck,
  Wrench,
  FileText,
  Fuel,
  FileWarning,
} from "lucide-react";

export default function FleetHeader({
  activeSubTab = "vehicles",
  onTabChange,
  trucksCount = 0,
  workOrdersCount = 0,
  logsCount = 0,
  fuelLogsCount = 0,
  apprehensionsCount = 0,
  pendingApprovalCount = 0,
  canCreate = true,
  onAddTruck,
  onCreateWorkOrder,
  pmSummary = null,
  onTogglePmDueFilter,
  isPmDueFilterActive = false,
  onReportIncident,
  onOpenIncidentsLog,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close incident dropdown on click outside
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

  const isMaintenanceHub =
    activeSubTab === "work-orders" ||
    activeSubTab === "logs" ||
    activeSubTab === "analytics";

  return (
    <div className="flex flex-col mb-4">
      {/* 1. SECONDARY SUBNAV FOR MAINTENANCE HUB ONLY */}
      {isMaintenanceHub && (
        <div className="w-full flex items-center justify-start mb-3">
          <div className="inline-flex items-center p-1 bg-[#EDF3F7] rounded-full border border-[#D5E3EC] shadow-2xs gap-1 max-w-full overflow-x-auto custom-scrollbar">
            {/* Work Orders */}
            <button
              type="button"
              onClick={() => onTabChange("work-orders")}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSubTab === "work-orders"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                  : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
              }`}
            >
              <Wrench className="w-3.5 h-3.5 shrink-0" />
              <span>Work Orders</span>
              {pendingApprovalCount > 0 ? (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[11px] font-bold">
                  {pendingApprovalCount} pending
                </span>
              ) : (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold min-w-[20px] text-center ${
                    activeSubTab === "work-orders"
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/90 text-slate-700"
                  }`}
                >
                  {workOrdersCount}
                </span>
              )}
            </button>

            {/* Maintenance Logs */}
            <button
              type="button"
              onClick={() => onTabChange("logs")}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSubTab === "logs"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                  : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Maintenance Logs</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold min-w-[20px] text-center ${
                  activeSubTab === "logs"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/90 text-slate-700"
                }`}
              >
                {logsCount}
              </span>
            </button>

            {/* Defect Analytics */}
            <button
              type="button"
              onClick={() => onTabChange("analytics")}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSubTab === "analytics"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                  : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
              <span>Recurring Defects</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. OPERATIONAL HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3.5 border-b border-[#6D8AA2]/20 gap-3 min-h-[44px]">
        {/* VIEW 1: FLEET BOARD (VEHICLES & FLEETS) */}
        {activeSubTab === "vehicles" && (
          <>
            {/* Left: Operational Metrics */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs h-[30px]">
                <Truck size={14} className="text-[#0A4B6E]" />
                <span>
                  {pmSummary?.totalVehicles || pmSummary?.totalTrucks || trucksCount} Registered Vehicles
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs shadow-2xs h-[30px]">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>{pmSummary?.operationalVehicles || 0} Operational</span>
              </span>

              {/* Clickable PM Due Filter Chip */}
              <button
                type="button"
                onClick={onTogglePmDueFilter}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs h-[30px] ${
                  isPmDueFilterActive
                    ? "bg-[#D93025] text-white border-[#D93025] shadow-xs"
                    : (pmSummary?.pmDueTotal || 0) > 0
                    ? "bg-rose-50 text-[#D93025] border-rose-200 hover:bg-rose-100"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                }`}
                title="Click to filter vehicles with PM due"
              >
                {(pmSummary?.pmDueTotal || 0) > 0 && (
                  <AlertTriangle size={13} className="shrink-0" />
                )}
                <span>{pmSummary?.pmDueTotal || 0} PM Due</span>
              </button>
            </div>

            {/* Right: Incidents Dropdown & Add New Fleet Action */}
            <div className="flex items-center gap-2.5 h-[30px]">
              {(onOpenIncidentsLog || onReportIncident) && (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Roadside Incidents Menu"
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-[#0A4B6E] font-semibold text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer shadow-2xs active:scale-95 h-[30px]"
                  >
                    <AlertOctagon size={13} className="text-amber-600" />
                    <span>Incidents</span>
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${
                        isMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-30 animate-scale-in">
                      {onOpenIncidentsLog && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onOpenIncidentsLog();
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-[#E8F3F8] hover:text-[#0A4B6E] flex items-center gap-2.5 cursor-pointer transition-colors"
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
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-amber-900 hover:bg-amber-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                        >
                          <AlertTriangle size={14} className="text-amber-600" />
                          <span>Report Roadside Incident</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {canCreate && onAddTruck && (
                <button
                  type="button"
                  onClick={onAddTruck}
                  aria-label="Add New Fleet Vehicle"
                  className="flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer h-[30px]"
                >
                  <Plus size={14} />
                  <span>Add New Fleet</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* VIEW 2: WORK ORDERS */}
        {activeSubTab === "work-orders" && (
          <>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs h-[30px]">
                <Wrench size={13} className="text-[#0A4B6E]" />
                <span>{workOrdersCount} Work Orders</span>
              </span>

              {pendingApprovalCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-bold text-xs shadow-2xs h-[30px]">
                  <AlertTriangle size={13} className="text-amber-600" />
                  <span>{pendingApprovalCount} Awaiting Approval</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 h-[30px]">
              {canCreate && onCreateWorkOrder && (
                <button
                  type="button"
                  onClick={onCreateWorkOrder}
                  aria-label="Add Work Order"
                  className="flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer h-[30px]"
                >
                  <Plus size={14} />
                  <span>Add Work Order</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* VIEW 3: MAINTENANCE LOGS */}
        {activeSubTab === "logs" && (
          <>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs h-[30px]">
                <FileText size={13} className="text-[#0A4B6E]" />
                <span>{logsCount} Completed Maintenance Records</span>
              </span>
            </div>
            <div className="flex items-center gap-2 h-[30px]" />
          </>
        )}

        {/* VIEW 4: RECURRING DEFECTS */}
        {activeSubTab === "analytics" && (
          <>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs h-[30px]">
                <AlertOctagon size={13} className="text-[#0A4B6E]" />
                <span>Cross-Fleet Defect Intelligence & Recurrence Analytics</span>
              </span>
            </div>
            <div className="flex items-center gap-2 h-[30px]" />
          </>
        )}

        {/* VIEW 5: FUEL MONITORING */}
        {activeSubTab === "fuel" && (
          <>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs h-[30px]">
                <Fuel size={14} className="text-[#0A4B6E]" />
                <span>Fuel Monitoring & Consumption Telemetry</span>
              </span>
              {fuelLogsCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs h-[30px]">
                  {fuelLogsCount} Records
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 h-[30px]" />
          </>
        )}

        {/* VIEW 6: APPREHENSIONS */}
        {activeSubTab === "apprehensions" && (
          <>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs h-[30px]">
                <FileWarning size={14} className="text-amber-600" />
                <span>Driver Roadside Apprehensions & Citations</span>
              </span>
              {apprehensionsCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-bold text-xs h-[30px]">
                  {apprehensionsCount} Citations
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 h-[30px]" />
          </>
        )}
      </div>
    </div>
  );
}

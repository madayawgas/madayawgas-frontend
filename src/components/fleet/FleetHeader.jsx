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
    <div className="flex flex-col mb-4">
      {/* 1. TOP: Centered Segmented Control View Switcher */}
      <div className="w-full flex items-center justify-center mb-3">
        <div className="inline-flex items-center p-1 bg-[#EDF3F7] rounded-full border border-[#D5E3EC] shadow-inner gap-1 max-w-full overflow-x-auto custom-scrollbar">
          {/* 1. Vehicles & Fleets Tab */}
          <button
            type="button"
            onClick={() => onTabChange("vehicles")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === "vehicles"
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-sm font-bold scale-[1.02]"
                : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
            }`}
          >
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span>Vehicles & Fleets</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                activeSubTab === "vehicles"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/90 text-slate-600"
              }`}
            >
              {trucksCount}
            </span>
          </button>

          {/* 2. Work Orders Tab */}
          <button
            type="button"
            onClick={() => onTabChange("work-orders")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === "work-orders"
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-sm font-bold scale-[1.02]"
                : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
            }`}
          >
            <Wrench className="w-3.5 h-3.5 shrink-0" />
            <span>Work Orders</span>
            {pendingApprovalCount > 0 ? (
              <span className="bg-amber-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold animate-pulse">
                {pendingApprovalCount} pending
              </span>
            ) : (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                  activeSubTab === "work-orders"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/90 text-slate-600"
                }`}
              >
                {workOrdersCount}
              </span>
            )}
          </button>

          {/* 3. Maintenance Logs Tab */}
          <button
            type="button"
            onClick={() => onTabChange("logs")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === "logs"
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-sm font-bold scale-[1.02]"
                : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Maintenance Logs</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                activeSubTab === "logs"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/90 text-slate-600"
              }`}
            >
              {logsCount}
            </span>
          </button>

          {/* 4. Fuel Log Tab (NEW) */}
          <button
            type="button"
            onClick={() => onTabChange("fuel")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === "fuel"
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-sm font-bold scale-[1.02]"
                : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
            }`}
          >
            <Fuel className="w-3.5 h-3.5 shrink-0" />
            <span>Fuel Log</span>
            {fuelLogsCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                  activeSubTab === "fuel"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/90 text-slate-600"
                }`}
              >
                {fuelLogsCount}
              </span>
            )}
          </button>

          {/* 5. Apprehensions Tab (NEW) */}
          <button
            type="button"
            onClick={() => onTabChange("apprehensions")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === "apprehensions"
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-sm font-bold scale-[1.02]"
                : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
            }`}
          >
            <FileWarning className="w-3.5 h-3.5 shrink-0" />
            <span>Apprehensions</span>
            {apprehensionsCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                  activeSubTab === "apprehensions"
                    ? "bg-white/20 text-white"
                    : "bg-amber-100 text-amber-900 border border-amber-300"
                }`}
              >
                {apprehensionsCount}
              </span>
            )}
          </button>

          {/* 6. Recurring Defect Report Tab */}
          <button
            type="button"
            onClick={() => onTabChange("analytics")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === "analytics"
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-sm font-bold scale-[1.02]"
                : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
            <span>Recurring Defect Report</span>
          </button>
        </div>
      </div>

      {/* 2. BOTTOM: Context-Aware Badges & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3.5 border-b border-[#6D8AA2]/20 gap-3 min-h-[44px]">
        {/* TAB 1: VEHICLES & FLEETS */}
        {activeSubTab === "vehicles" && (
          <>
            {/* Left: Operational Indicators */}
            <div className="flex flex-wrap items-center gap-2">
              {pmSummary && (
                <>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs">
                    <ClipboardList size={13} className="text-[#0A4B6E]" />
                    <span>{pmSummary.totalVehicles || pmSummary.totalTrucks || 0} Registered Vehicles</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>{pmSummary.operationalVehicles || 0} Operational</span>
                  </span>

                  {/* Clickable PM Due Filter Chip */}
                  <button
                    type="button"
                    onClick={onTogglePmDueFilter}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
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
                </>
              )}
            </div>

            {/* Right: Incidents Dropdown & Add New Fleet */}
            <div className="flex items-center gap-2.5 h-[30px]">
              {(onOpenIncidentsLog || onReportIncident) && (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-[#0A4B6E] font-semibold text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer shadow-2xs active:scale-95 h-[30px]"
                  >
                    <AlertOctagon size={13} className="text-amber-600" />
                    <span>Incidents</span>
                    <ChevronDown
                      size={13}
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

              {canCreate && onAddTruck && (
                <button
                  type="button"
                  onClick={onAddTruck}
                  className="flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer h-[30px]"
                >
                  <Plus size={14} />
                  <span>Add New Fleet</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* TAB 2: WORK ORDERS */}
        {activeSubTab === "work-orders" && (
          <>
            {/* Left: Work Orders Summary */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs">
                <Wrench size={13} className="text-[#0A4B6E]" />
                <span>{workOrdersCount} Work Orders</span>
              </span>

              {pendingApprovalCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs shadow-2xs animate-pulse">
                  <AlertTriangle size={12} className="text-amber-600" />
                  <span>{pendingApprovalCount} Awaiting Approval</span>
                </span>
              )}
            </div>

            {/* Right: Create Work Order Button */}
            <div className="flex items-center gap-2.5 h-[30px]">
              {canCreate && onCreateWorkOrder && (
                <button
                  type="button"
                  onClick={onCreateWorkOrder}
                  className="flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer h-[30px]"
                >
                  <Plus size={14} />
                  <span>Add Work Order</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* TAB 3: MAINTENANCE LOGS */}
        {activeSubTab === "logs" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs">
                <FileText size={13} className="text-[#0A4B6E]" />
                <span>{logsCount} Maintenance Records</span>
              </span>
            </div>
            <div className="flex items-center gap-2 h-[30px]" />
          </>
        )}

        {/* TAB 4: FUEL MONITORING / FUEL LOG */}
        {activeSubTab === "fuel" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs">
                <Fuel size={13} className="text-[#0A4B6E]" />
                <span>Fleet Fuel Monitoring & Consumption Telemetry</span>
              </span>
            </div>
            <div className="flex items-center gap-2 h-[30px]" />
          </>
        )}

        {/* TAB 5: APPREHENSIONS */}
        {activeSubTab === "apprehensions" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs">
                <FileWarning size={13} className="text-amber-600" />
                <span>Driver Roadside Apprehensions & Traffic Citations</span>
              </span>
            </div>
            <div className="flex items-center gap-2 h-[30px]" />
          </>
        )}

        {/* TAB 6: RECURRING DEFECT REPORT */}
        {activeSubTab === "analytics" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs">
                <AlertOctagon size={13} className="text-[#0A4B6E]" />
                <span>Cross-Fleet Recurring Defect Intelligence</span>
              </span>
            </div>
            <div className="flex items-center gap-2 h-[30px]" />
          </>
        )}
      </div>
    </div>
  );
}
// src/components/route-dispatch/RouteDispatchHeader.jsx
import { Truck, Calendar, MapPin, Plus, RefreshCw } from "lucide-react";

export default function RouteDispatchHeader({
  activeTab = "trips",
  onTabChange,
  tripsCount = 0,
  inProgressCount = 0,
  awaitingSyncCount = 0,
  schedulesCount = 0,
  zonesCount = 0,
  canManage = true,
  onOpenDispatchModal,
  onOpenBatchGenerateModal,
  onOpenAddScheduleModal,
  onOpenAddTemplateModal,
  onOpenAddZoneModal,
}) {
  return (
    <div className="flex flex-col mb-4">
      {/* 1. TOP: Centered Segmented Control View Switcher */}
      <div className="w-full flex items-center justify-center mb-3">
        <div className="inline-flex items-center p-1 bg-[#EDF3F7] rounded-full border border-[#D5E3EC] shadow-inner gap-1 max-w-full overflow-x-auto custom-scrollbar">
          {/* Active Trips & Yard Return Tab */}
          <button
            type="button"
            onClick={() => onTabChange("trips")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "trips"
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-sm font-bold scale-[1.02]"
                : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
            }`}
          >
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span>Active Trips & Yard Return</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                activeTab === "trips"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/90 text-slate-600"
              }`}
            >
              {tripsCount}
            </span>
          </button>

          {/* Daily Schedules & Master Templates Tab */}
          <button
            type="button"
            onClick={() => onTabChange("schedules")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "schedules"
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-sm font-bold scale-[1.02]"
                : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Daily Schedules & Templates</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                activeTab === "schedules"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/90 text-slate-600"
              }`}
            >
              {schedulesCount}
            </span>
          </button>

          {/* Service Zones Tab */}
          <button
            type="button"
            onClick={() => onTabChange("zones")}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "zones"
                ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-sm font-bold scale-[1.02]"
                : "text-[#486581] hover:text-[#0A4B6E] hover:bg-white/70 font-medium"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>Service Zones</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                activeTab === "zones"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/90 text-slate-600"
              }`}
            >
              {zonesCount}
            </span>
          </button>
        </div>
      </div>

      {/* 2. BOTTOM: Context-Aware Badges & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3.5 border-b border-[#6D8AA2]/20 gap-3">
        {/* TAB 1: TRIPS */}
        {activeTab === "trips" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs">
                <Truck size={13} className="text-[#0A4B6E]" />
                <span>{tripsCount} Recorded Deployments</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>{inProgressCount} Out on Route</span>
              </span>

              {awaitingSyncCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>{awaitingSyncCount} Pending Reconciliation</span>
                </span>
              )}
            </div>

            {canManage && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onOpenDispatchModal}
                  className="flex items-center gap-1.5 bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] font-bold text-xs px-4 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95 h-[32px]"
                >
                  <Plus size={15} />
                  <span>Dispatch Truck Run</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* TAB 2: SCHEDULES */}
        {activeTab === "schedules" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs">
                <Calendar size={13} className="text-[#0A4B6E]" />
                <span>{schedulesCount} Daily Schedules</span>
              </span>
              <span className="text-xs text-[#6D8AA2] font-medium hidden sm:inline">
                Recurring Master Route Engine Active
              </span>
            </div>

            {canManage && (
              <div className="flex flex-wrap items-center gap-2">
                {onOpenAddTemplateModal && (
                  <button
                    type="button"
                    onClick={onOpenAddTemplateModal}
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-[#D5E3EC] text-[#0A4B6E] font-bold text-xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95 h-[32px]"
                  >
                    <Plus size={14} className="text-[#0A4B6E]" />
                    <span>+ Add Route Template</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenAddScheduleModal}
                  className="flex items-center gap-1.5 bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] font-bold text-xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95 h-[32px]"
                >
                  <Plus size={14} />
                  <span>+ Daily Schedule</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenBatchGenerateModal}
                  className="flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#F2D014] text-[#0A4B6E] font-bold text-xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95 h-[32px]"
                >
                  <RefreshCw size={14} />
                  <span>Batch Generate</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* TAB 3: ZONES */}
        {activeTab === "zones" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs">
                <MapPin size={13} className="text-[#0A4B6E]" />
                <span>{zonesCount} Active Service Zones</span>
              </span>
            </div>

            {canManage && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onOpenAddZoneModal}
                  className="flex items-center gap-1.5 bg-[#0A4B6E] hover:bg-[#0E384E] text-white font-bold text-xs px-4 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95 h-[32px]"
                >
                  <Plus size={14} />
                  <span>Add Service Zone</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

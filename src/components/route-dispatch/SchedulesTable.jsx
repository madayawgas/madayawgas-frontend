// src/components/route-dispatch/SchedulesTable.jsx
import { useState, useMemo } from "react";
import {
  Calendar,
  Truck,
  User,
  MapPin,
  XCircle,
  Plus,
  Search,
  Filter,
  List,
  CalendarDays,
} from "lucide-react";
import RouteCalendarView from "./RouteCalendarView";

export default function SchedulesTable({
  schedules = [],
  trips = [],
  onCancelSchedule,
  onOpenAddSchedule,
  onDispatchSchedule,
  onSelectTrip,
  canManage = true,
}) {
  const [viewMode, setViewMode] = useState("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const getStatusBadge = (status) => {
    switch ((status || "").toUpperCase()) {
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-bold px-2 py-0.5 rounded-full">
            SCHEDULED
          </span>
        );
      case "DISPATCHED":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
            DISPATCHED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="text-slate-600 font-bold text-xs">{status}</span>
        );
    }
  };

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      // 1. Status Filter
      if (statusFilter !== "ALL") {
        if ((s.status || "").toUpperCase() !== statusFilter) return false;
      }

      // 2. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const plate = (s.truckPlate || "").toLowerCase();
        const model = (s.truckModel || "").toLowerCase();
        const sales = (s.salesName || "").toLowerCase();
        const zoneCode = (s.zoneCode || "").toLowerCase();
        const zoneName = (s.zoneName || "").toLowerCase();
        const notes = (s.notes || "").toLowerCase();
        const date = (s.scheduledDate || "").toLowerCase();

        const matches =
          plate.includes(q) ||
          model.includes(q) ||
          sales.includes(q) ||
          zoneCode.includes(q) ||
          zoneName.includes(q) ||
          notes.includes(q) ||
          date.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [schedules, searchTerm, statusFilter]);

  return (
    <div className="bg-white rounded-2xl border border-[#D5E3EC] p-4 sm:p-5 shadow-xs text-left space-y-4">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#0A4B6E] flex items-center gap-1.5">
              <Calendar size={15} />
              <span>Date-Stamped Operational Daily Schedules</span>
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1]">
              {schedules.length} Total Runs
            </span>
          </div>
          <p className="text-xs text-[#6D8AA2] mt-0.5">
            Operational single-day truck dispatches, route zones, and sales personnel
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {/* Table vs Calendar Toggle */}
          <div className="inline-flex items-center p-0.5 bg-[#EDF3F7] rounded-full border border-[#D5E3EC] shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                  : "text-[#486581] hover:text-[#0A4B6E]"
              }`}
              title="Table View"
            >
              <List size={13} />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "calendar"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-bold"
                  : "text-[#486581] hover:text-[#0A4B6E]"
              }`}
              title="Calendar View"
            >
              <CalendarDays size={13} />
              <span>Calendar</span>
            </button>
          </div>

          {canManage && onOpenAddSchedule && (
            <button
              type="button"
              onClick={onOpenAddSchedule}
              className="flex items-center gap-1.5 bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] font-bold text-xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95 h-[30px]"
            >
              <Plus size={14} />
              <span>+ Add Daily Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Content based on View Mode */}
      {viewMode === "calendar" ? (
        <div className="pt-2">
          <RouteCalendarView
            schedules={schedules}
            trips={trips}
            onDispatchSchedule={onDispatchSchedule}
            onSelectTrip={onSelectTrip}
            onOpenAddScheduleModal={onOpenAddSchedule}
            canManage={canManage}
          />
        </div>
      ) : (
        <>
          {/* Controls: Inline Search Bar & Status Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]/70">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search vehicle, sales rep, zone, date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-full pl-8 pr-3 py-1.5 text-xs text-[#0A4B6E] focus:outline-[#0A4B6E]"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
              {["ALL", "SCHEDULED", "DISPATCHED", "CANCELLED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === st
                      ? "bg-[#0A4B6E] text-white shadow-2xs font-bold"
                      : "bg-[#F1F5F9] text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

      {/* 3. Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[#EDF3F7] text-[#0A4B6E] font-bold border-b border-[#D5E3EC]">
              <th className="p-3 rounded-l-xl">Scheduled Date</th>
              <th className="p-3">Vehicle</th>
              <th className="p-3">Service Zone</th>
              <th className="p-3">Assigned Sales</th>
              <th className="p-3">Status</th>
              <th className="p-3">Notes</th>
              <th className="p-3 rounded-r-xl text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filteredSchedules.length > 0 ? (
              filteredSchedules.map((s) => (
                <tr key={s.id} className="hover:bg-[#F8FAFC]">
                  <td className="p-3 font-bold text-[#0A4B6E] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#6D8AA2]" />
                      <span>{s.scheduledDate}</span>
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-[#0A4B6E]">
                    <div>{s.truckPlate}</div>
                    <div className="text-[11px] text-[#6D8AA2] font-normal">{s.truckModel}</div>
                  </td>
                  <td className="p-3">
                    <span className="bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] px-2 py-0.5 rounded-md font-bold text-[11px]">
                      {s.zoneCode || s.zoneName}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 font-medium">
                    {s.salesName || "Sales Person"}
                  </td>
                  <td className="p-3">{getStatusBadge(s.status)}</td>
                  <td className="p-3 text-slate-500 max-w-xs truncate">
                    {s.notes || "—"}
                  </td>
                  <td className="p-3 text-right">
                    {canManage && s.status === "SCHEDULED" && (
                      <button
                        type="button"
                        onClick={() => onCancelSchedule(s.id)}
                        className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-bold text-[11px] px-2.5 py-1 rounded-full border border-rose-200 hover:bg-rose-50 cursor-pointer transition-colors"
                      >
                        <XCircle size={12} />
                        <span>Cancel</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Calendar size={20} className="text-slate-300" />
                    <span className="text-xs font-semibold text-slate-500">
                      {searchTerm || statusFilter !== "ALL"
                        ? "No schedules match your search or filter."
                        : "No daily schedules recorded."}
                    </span>
                    {canManage && onOpenAddSchedule && (
                      <button
                        type="button"
                        onClick={onOpenAddSchedule}
                        className="mt-1 text-xs font-bold text-[#0A4B6E] hover:underline cursor-pointer"
                      >
                        + Create a Daily Schedule now
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  );
}


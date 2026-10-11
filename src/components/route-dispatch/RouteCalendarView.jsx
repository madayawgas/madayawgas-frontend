// src/components/route-dispatch/RouteCalendarView.jsx
import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Truck,
  Clock,
  MapPin,
  User,
  Plus,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  X,
  FileSpreadsheet,
} from "lucide-react";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTripDate(trip) {
  if (trip.scheduledDate) return trip.scheduledDate.slice(0, 10);
  if (trip.departureTime) {
    const d = new Date(trip.departureTime);
    return formatDateKey(d);
  }
  return null;
}

function getScheduleDate(schedule) {
  if (schedule.scheduledDate) return schedule.scheduledDate.slice(0, 10);
  return null;
}

export default function RouteCalendarView({
  trips = [],
  schedules = [],
  selectedTrip = null,
  onSelectTrip,
  onDispatchSchedule,
  onMiddayReload,
  onReturnCheckIn,
  onReconciliation,
  onOpenDispatchModal,
  onOpenAddScheduleModal,
  canManage = true,
}) {
  // Current calendar view month/year
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Selected date for day agenda view (defaults to today)
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  // Filter type: 'all' | 'trips' | 'schedules'
  const [activityFilter, setActivityFilter] = useState("all");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = useMemo(() => {
    return currentDate.toLocaleString("default", { month: "long" });
  }, [currentDate]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateKey(formatDateKey(now));
  };

  // Group Trips by Date
  const tripsByDate = useMemo(() => {
    const map = {};
    trips.forEach((t) => {
      const key = getTripDate(t);
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [trips]);

  // Group Schedules by Date
  const schedulesByDate = useMemo(() => {
    const map = {};
    schedules.forEach((s) => {
      const key = getScheduleDate(s);
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(s);
      }
    });
    return map;
  }, [schedules]);

  // Month Statistics
  const monthStats = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthTrips = trips.filter((t) => {
      const k = getTripDate(t);
      return k && k.startsWith(prefix);
    });
    const monthSchedules = schedules.filter((s) => {
      const k = getScheduleDate(s);
      return k && k.startsWith(prefix);
    });

    return {
      totalTrips: monthTrips.length,
      inProgress: monthTrips.filter((t) => t.status === "IN_PROGRESS").length,
      awaitingSync: monthTrips.filter((t) => t.status === "AWAITING_SYNC").length,
      settled: monthTrips.filter((t) => t.status === "SETTLED").length,
      totalSchedules: monthSchedules.length,
    };
  }, [trips, schedules, year, month]);

  // Generate calendar grid days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      const key = formatDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: key === todayKey,
      });
    }

    // 2. Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const key = formatDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: key === todayKey,
      });
    }

    // 3. Next month leading days (to complete 35 or 42 grid cells)
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remainingSlots = totalSlots - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i);
      const key = formatDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: key === todayKey,
      });
    }

    return days;
  }, [year, month, todayKey]);

  // Selected Day Items
  const selectedDayTrips = useMemo(() => {
    if (!selectedDateKey) return [];
    return tripsByDate[selectedDateKey] || [];
  }, [tripsByDate, selectedDateKey]);

  const selectedDaySchedules = useMemo(() => {
    if (!selectedDateKey) return [];
    return schedulesByDate[selectedDateKey] || [];
  }, [schedulesByDate, selectedDateKey]);

  const selectedDateFormatted = useMemo(() => {
    if (!selectedDateKey) return "";
    const [y, m, d] = selectedDateKey.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDateKey]);

  const getTripStatusBadge = (status) => {
    switch ((status || "").toUpperCase()) {
      case "IN_PROGRESS":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          label: "In Progress",
          dot: "bg-emerald-500 animate-pulse",
        };
      case "AWAITING_SYNC":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          label: "Awaiting Sync",
          dot: "bg-amber-500",
        };
      case "SETTLED":
        return {
          bg: "bg-blue-50 text-[#0A4B6E] border-[#BCE1F1]",
          label: "Settled",
          dot: "bg-[#0A4B6E]",
        };
      case "FLAGGED_VARIANCE":
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-200",
          label: "Flagged",
          dot: "bg-rose-500",
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          label: status || "Unknown",
          dot: "bg-slate-400",
        };
    }
  };

  const getScheduleStatusBadge = (status) => {
    switch ((status || "").toUpperCase()) {
      case "SCHEDULED":
        return {
          bg: "bg-sky-50 text-sky-800 border-sky-200",
          label: "Scheduled",
        };
      case "DISPATCHED":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          label: "Dispatched",
        };
      case "CANCELLED":
        return {
          bg: "bg-slate-100 text-slate-500 border-slate-200",
          label: "Cancelled",
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-600 border-slate-200",
          label: status,
        };
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white rounded-2xl border border-[#D5E3EC] shadow-xs text-left">
      {/* 1. CALENDAR CONTROLS & HEADER */}
      <div className="shrink-0 p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F8FAFC]">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-[#D5E3EC] rounded-full p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-[#EDF3F7] rounded-full text-[#0A4B6E] cursor-pointer transition-colors"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs sm:text-sm font-bold text-[#0A4B6E] min-w-[130px] text-center">
              {monthName} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-[#EDF3F7] rounded-full text-[#0A4B6E] cursor-pointer transition-colors"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 bg-white border border-[#D5E3EC] hover:bg-[#EDF3F7] text-[#0A4B6E] text-xs font-bold rounded-full cursor-pointer shadow-2xs transition-colors"
          >
            Today
          </button>
        </div>

        {/* Filter Switcher: All | Trips Only | Schedules Only */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center p-0.5 bg-[#EDF3F7] rounded-full border border-[#D5E3EC] shadow-2xs">
            <button
              type="button"
              onClick={() => setActivityFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                activityFilter === "all"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] font-bold shadow-2xs"
                  : "text-[#486581] hover:text-[#0A4B6E]"
              }`}
            >
              All Runs
            </button>
            <button
              type="button"
              onClick={() => setActivityFilter("trips")}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                activityFilter === "trips"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] font-bold shadow-2xs"
                  : "text-[#486581] hover:text-[#0A4B6E]"
              }`}
            >
              Trips Only
            </button>
            <button
              type="button"
              onClick={() => setActivityFilter("schedules")}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                activityFilter === "schedules"
                  ? "bg-[#0A4B6E] text-[#FFDF2C] font-bold shadow-2xs"
                  : "text-[#486581] hover:text-[#0A4B6E]"
              }`}
            >
              Schedules Only
            </button>
          </div>

          {/* Monthly Tally Badges */}
          <div className="hidden xl:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-bold">
              <Truck size={12} />
              <span>{monthStats.totalTrips} Trips</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>{monthStats.inProgress} Active</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[11px] font-bold">
              <CalendarIcon size={12} />
              <span>{monthStats.totalSchedules} Scheduled</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. SPLIT LAYOUT: MONTH GRID (LEFT/TOP) + AGENDA DRAWER (RIGHT/BOTTOM) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT/CENTER: 7-COLUMN MONTH GRID */}
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto custom-scrollbar border-r border-[#E2E8F0]">
          {/* Day of week header row */}
          <div className="grid grid-cols-7 border-b border-[#E2E8F0] bg-[#F1F5F9] text-center font-bold text-xs text-[#0A4B6E] py-2 shrink-0">
            {DAYS_OF_WEEK.map((day, idx) => (
              <div
                key={day}
                className={`py-1 ${idx === 0 || idx === 6 ? "text-slate-400" : ""}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-[#E2E8F0] gap-[1px]">
            {calendarDays.map((cell) => {
              const dayTrips = tripsByDate[cell.dateKey] || [];
              const daySchedules = schedulesByDate[cell.dateKey] || [];

              const visibleTrips =
                activityFilter === "schedules" ? [] : dayTrips;
              const visibleSchedules =
                activityFilter === "trips" ? [] : daySchedules;

              const totalItems = visibleTrips.length + visibleSchedules.length;
              const isSelected = selectedDateKey === cell.dateKey;

              return (
                <div
                  key={cell.dateKey}
                  onClick={() => setSelectedDateKey(cell.dateKey)}
                  className={`min-h-[92px] sm:min-h-[105px] p-1.5 flex flex-col justify-between transition-colors cursor-pointer group ${
                    cell.isCurrentMonth
                      ? isSelected
                        ? "bg-[#EBF5FB]"
                        : "bg-white hover:bg-slate-50"
                      : isSelected
                      ? "bg-[#F0F4F8]"
                      : "bg-[#F8FAFC] text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {/* Cell Header: Day Number + Item Count */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                        cell.isToday
                          ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs font-extrabold"
                          : isSelected
                          ? "bg-[#D5E3EC] text-[#0A4B6E]"
                          : cell.isCurrentMonth
                          ? "text-[#0A4B6E]"
                          : "text-slate-400"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {totalItems > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1]">
                        {totalItems}
                      </span>
                    )}
                  </div>

                  {/* Event Pills Container */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {/* Trips Pills */}
                    {visibleTrips.slice(0, 2).map((t) => {
                      const badge = getTripStatusBadge(t.status);
                      const isTripSelected =
                        selectedTrip && selectedTrip.id === t.id;

                      return (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateKey(cell.dateKey);
                            if (onSelectTrip) onSelectTrip(t);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center justify-between gap-1 border truncate transition-all cursor-pointer shadow-2xs ${badge.bg} ${
                            isTripSelected
                              ? "ring-2 ring-[#0A4B6E] shadow-sm scale-[1.02]"
                              : "hover:scale-[1.01]"
                          }`}
                          title={`${t.truckPlate} - ${t.zoneName || t.zoneCode} (${badge.label})`}
                        >
                          <div className="flex items-center gap-1 truncate">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                            <span className="truncate">{t.truckPlate}</span>
                          </div>
                          <span className="text-[9px] shrink-0 opacity-80 uppercase">
                            {t.zoneCode || "TRIP"}
                          </span>
                        </div>
                      );
                    })}

                    {/* Schedules Pills */}
                    {visibleSchedules.slice(0, 2).map((s) => {
                      const badge = getScheduleStatusBadge(s.status);

                      return (
                        <div
                          key={s.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateKey(cell.dateKey);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center justify-between gap-1 border truncate transition-all cursor-pointer shadow-2xs ${badge.bg} hover:scale-[1.01]`}
                          title={`Scheduled: ${s.truckPlate} - ${s.zoneName || s.zoneCode} (${badge.label})`}
                        >
                          <div className="flex items-center gap-1 truncate">
                            <CalendarIcon size={10} className="shrink-0 text-sky-700" />
                            <span className="truncate">{s.truckPlate}</span>
                          </div>
                          <span className="text-[9px] shrink-0 opacity-80 uppercase">
                            {s.zoneCode || "SCHED"}
                          </span>
                        </div>
                      );
                    })}

                    {/* Overflow pill */}
                    {totalItems > 4 && (
                      <div className="text-[9px] font-bold text-[#6D8AA2] text-center pt-0.5">
                        +{totalItems - 4} more runs
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT/BOTTOM: SELECTED DATE AGENDA PANEL */}
        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col bg-white overflow-hidden border-t lg:border-t-0">
          {/* Agenda Header */}
          <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <CalendarIcon size={15} className="text-[#0A4B6E]" />
                <h3 className="text-xs sm:text-sm font-bold text-[#0A4B6E]">
                  Day Agenda
                </h3>
                {selectedDateKey === todayKey && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0A4B6E] text-[#FFDF2C]">
                    Today
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6D8AA2] mt-0.5">
                {selectedDateFormatted}
              </p>
            </div>

            {/* Quick Add Schedule Shortcut */}
            {canManage && onOpenAddScheduleModal && (
              <button
                type="button"
                onClick={onOpenAddScheduleModal}
                className="flex items-center gap-1 bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] font-bold text-[11px] px-3 py-1.5 rounded-full cursor-pointer shadow-2xs transition-transform active:scale-95"
                title="Schedule a truck run for this date"
              >
                <Plus size={13} />
                <span>+ Schedule</span>
              </button>
            )}
          </div>

          {/* Agenda Body: List of Trips & Schedules */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {/* Section A: Operational Trips on this Date */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-[#0A4B6E] flex items-center gap-1.5">
                  <Truck size={13} />
                  <span>Delivery Trips ({selectedDayTrips.length})</span>
                </h4>
                {selectedDayTrips.length === 0 && canManage && onOpenDispatchModal && (
                  <button
                    type="button"
                    onClick={onOpenDispatchModal}
                    className="text-[11px] font-bold text-[#0A4B6E] hover:underline cursor-pointer"
                  >
                    + Dispatch Run
                  </button>
                )}
              </div>

              {selectedDayTrips.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-[#D5E3EC] bg-[#F8FAFC] text-center">
                  <p className="text-xs text-[#6D8AA2]">No trips recorded for this date.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedDayTrips.map((trip) => {
                    const badge = getTripStatusBadge(trip.status);
                    const isSelected =
                      selectedTrip && selectedTrip.id === trip.id;

                    return (
                      <div
                        key={trip.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isSelected
                            ? "border-[#0A4B6E] bg-[#E8F3F8]/50 shadow-sm ring-1 ring-[#0A4B6E]"
                            : "border-[#D5E3EC] bg-white hover:border-[#0A4B6E]/40"
                        }`}
                      >
                        {/* Top: Plate & Status */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div>
                            <span className="font-extrabold text-xs text-[#0A4B6E] tracking-tight">
                              {trip.truckPlate}
                            </span>
                            <span className="text-[11px] text-[#6D8AA2] ml-2">
                              {trip.truckModel}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            <span>{badge.label}</span>
                          </span>
                        </div>

                        {/* Mid: Crew & Zone */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#486581] mb-2 bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
                          <div className="truncate">
                            <span className="text-[#6D8AA2] block text-[10px]">Zone:</span>
                            <span className="font-semibold text-[#0A4B6E] truncate">
                              {trip.zoneName || trip.zoneCode || "Unassigned"}
                            </span>
                          </div>
                          <div className="truncate">
                            <span className="text-[#6D8AA2] block text-[10px]">Driver:</span>
                            <span className="font-semibold truncate">
                              {trip.driverName || "Danilo Driver"}
                            </span>
                          </div>
                          <div className="truncate">
                            <span className="text-[#6D8AA2] block text-[10px]">Sales Rep:</span>
                            <span className="font-semibold truncate">
                              {trip.salesName || "Juan Sales"}
                            </span>
                          </div>
                          <div className="truncate">
                            <span className="text-[#6D8AA2] block text-[10px]">Departure Odo:</span>
                            <span className="font-semibold">
                              {trip.departureOdometer ? `${trip.departureOdometer.toLocaleString()} km` : "—"}
                            </span>
                          </div>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0]/80">
                          <button
                            type="button"
                            onClick={() => onSelectTrip && onSelectTrip(trip)}
                            className="text-[11px] font-bold text-[#0A4B6E] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open Details</span>
                            <ArrowRight size={11} />
                          </button>

                          {canManage && (
                            <div className="flex items-center gap-1.5">
                              {trip.status === "IN_PROGRESS" && (
                                <>
                                  {onMiddayReload && (
                                    <button
                                      type="button"
                                      onClick={() => onMiddayReload(trip)}
                                      className="px-2 py-1 text-[10px] font-bold rounded-md bg-[#E8F3F8] text-[#0A4B6E] hover:bg-[#D5E3EC] cursor-pointer"
                                    >
                                      Reload
                                    </button>
                                  )}
                                  {onReturnCheckIn && (
                                    <button
                                      type="button"
                                      onClick={() => onReturnCheckIn(trip)}
                                      className="px-2 py-1 text-[10px] font-bold rounded-md bg-[#0A4B6E] text-[#FFDF2C] hover:bg-[#0E384E] cursor-pointer"
                                    >
                                      Check-In
                                    </button>
                                  )}
                                </>
                              )}

                              {trip.status === "AWAITING_SYNC" && onReconciliation && (
                                <button
                                  type="button"
                                  onClick={() => onReconciliation(trip)}
                                  className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-[#0A4B6E] text-[#FFDF2C] hover:bg-[#0E384E] cursor-pointer"
                                >
                                  Settle Sync
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section B: Daily Truck Schedules on this Date */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-[#0A4B6E] flex items-center gap-1.5">
                  <CalendarIcon size={13} />
                  <span>Daily Schedules ({selectedDaySchedules.length})</span>
                </h4>
              </div>

              {selectedDaySchedules.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-[#D5E3EC] bg-[#F8FAFC] text-center">
                  <p className="text-xs text-[#6D8AA2]">No planned schedules for this date.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDaySchedules.map((sched) => {
                    const badge = getScheduleStatusBadge(sched.status);

                    return (
                      <div
                        key={sched.id}
                        className="p-3 rounded-xl border border-[#D5E3EC] bg-white hover:border-[#0A4B6E]/40 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-xs text-[#0A4B6E]">
                            {sched.truckPlate}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#486581] flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                          <span className="flex items-center gap-1">
                            <MapPin size={11} className="text-[#6D8AA2]" />
                            <strong className="text-[#0A4B6E]">{sched.zoneName || sched.zoneCode}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={11} className="text-[#6D8AA2]" />
                            <span>{sched.salesName || "Unassigned"}</span>
                          </span>
                        </div>

                        {sched.notes && (
                          <p className="text-[10px] text-slate-500 italic mb-2">
                            "{sched.notes}"
                          </p>
                        )}

                        {/* If status is SCHEDULED, provide quick Dispatch button */}
                        {canManage && sched.status === "SCHEDULED" && onDispatchSchedule && (
                          <div className="pt-2 border-t border-[#E2E8F0] flex justify-end">
                            <button
                              type="button"
                              onClick={() => onDispatchSchedule(sched)}
                              className="flex items-center gap-1 px-3 py-1 bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] text-[10px] font-bold rounded-full cursor-pointer shadow-2xs transition-transform active:scale-95"
                            >
                              <PlayCircle size={12} />
                              <span>Dispatch This Run</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


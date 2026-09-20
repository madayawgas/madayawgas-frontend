import { useState, useEffect, useCallback, useMemo } from "react";
import { History, Gauge, Clock, User, Plus, Search, X } from "lucide-react";
import SideDrawer from "../ui/SideDrawer";
import Badge from "../ui/Badge";
import Pagination from "../ui/Pagination";
import { fleetApi } from "../../api/fleet.js";

/**
 * OdometerHistoryModal
 * Displays chronological odometer logs and trip deltas in a right-sliding panel
 * with search and multi-type filters matching the Incident Logs experience.
 */
export default function OdometerHistoryModal({
  isOpen,
  truck,
  onClose,
  onOpenCheckIn,
}) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState("All");
  const [selectedTripRange, setSelectedTripRange] = useState("All");
  const [page, setPage] = useState(1);
  const limit = 10;

  // React 19 render-time state reset when opening
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setPage(1);
      setSearchDraft("");
      setCommittedSearch("");
      setSelectedSource("All");
      setSelectedTripRange("All");
    }
  }

  const fetchLogs = useCallback(async () => {
    if (!truck?.id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fleetApi.getTruckOdometerLogs(truck.id);
      const logList = res?.data?.logs || [];
      // Sort descending by loggedAt
      logList.sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));
      setLogs(logList);
    } catch (err) {
      console.error("Failed to load odometer logs:", err);
      setError("Failed to load odometer log history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [truck?.id]);

  useEffect(() => {
    if (isOpen && truck?.id) {
      fetchLogs();
    }
  }, [isOpen, truck?.id, fetchLogs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Source filter
      if (selectedSource !== "All" && log.source !== selectedSource) {
        return false;
      }

      // 2. Trip Delta range filter
      const delta = Number(log.distanceDelta) || 0;
      if (selectedTripRange === "HIGH" && delta < 100) {
        return false;
      }
      if (selectedTripRange === "MEDIUM" && (delta < 20 || delta >= 100)) {
        return false;
      }
      if (selectedTripRange === "SHORT" && delta >= 20) {
        return false;
      }

      // 3. Search query filter
      if (committedSearch.trim()) {
        const q = committedSearch.toLowerCase().trim();
        const notes = (log.notes || "").toLowerCase();
        const supervisor = (log.loggedByName || "").toLowerCase();
        const source = (log.source || "").toLowerCase();
        const odo = String(log.odometerReading || "");
        return (
          notes.includes(q) ||
          supervisor.includes(q) ||
          source.includes(q) ||
          odo.includes(q)
        );
      }

      return true;
    });
  }, [logs, selectedSource, selectedTripRange, committedSearch]);

  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice((page - 1) * limit, page * limit);
  }, [filteredLogs, page, limit]);

  if (!isOpen || !truck) return null;

  const currentOdo = Number(truck.currentOdometer) || 0;
  const lastPmOdo = Number(
    truck.lastPmOdometer !== undefined
      ? truck.lastPmOdometer
      : truck.lastPMOdometer || 0
  );
  const distanceSinceLastPm = Math.max(0, currentOdo - lastPmOdo);
  const isPmDue = distanceSinceLastPm >= 5000;

  const formatDateTime = (isoString) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Mileage & Odometer History"
      subtitle={`${truck.plateNumber || "Truck"} • ${truck.model || "Isuzu Elf"}`}
      icon={History}
      badge={
        <Badge variant="neutral" className="px-2.5 py-0.5 text-[10px] font-bold">
          {truck.plateNumber || "Truck"}
        </Badge>
      }
      width="max-w-xl lg:max-w-3xl"
      footer={({ onClose: closeDrawer }) => (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          {onOpenCheckIn && (
            <button
              type="button"
              onClick={() => {
                onOpenCheckIn(truck);
              }}
              className="flex-1 py-3 px-5 rounded-full font-bold text-xs uppercase tracking-wider bg-white hover:bg-sky-50 text-[#0A4B6E] border-2 border-[#0A4B6E] flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Gauge size={15} />
              <span>Record Return Odometer</span>
            </button>
          )}
          <button
            type="button"
            onClick={closeDrawer}
            className={`py-3 px-5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0B4A6E] transition-all shadow-2xs cursor-pointer active:scale-95 text-center ${
              onOpenCheckIn ? "flex-1" : "w-full"
            }`}
          >
            CLOSE
          </button>
        </div>
      )}
    >
      <div className="space-y-4">
        {/* VEHICLE STATS BANNER */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-[#BCE1F1]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A4B6E] text-white flex items-center justify-center shrink-0">
              <Gauge size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#0A4B6E] text-sm">
                {truck.plateNumber || "Truck"}
              </h3>
              <p className="text-[11px] text-[#588094]">
                {truck.model || "Isuzu Elf"}{" "}
                {truck.yearModel ? `(${truck.yearModel})` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div>
              <span className="text-[#588094] block text-[10.5px]">
                Current Odometer
              </span>
              <span className="font-bold text-sm text-[#0A4B6E]">
                {currentOdo.toLocaleString()} KM
              </span>
            </div>
            <div className="h-7 w-[1px] bg-gray-300 hidden sm:block" />
            <div>
              <span className="text-[#588094] block text-[10.5px]">
                Since Last PM
              </span>
              <span
                className={`font-bold text-sm ${
                  isPmDue ? "text-[#C93B32]" : "text-[#0A4B6E]"
                }`}
              >
                {distanceSinceLastPm.toLocaleString()} / 5,000 KM
              </span>
            </div>
            {isPmDue && (
              <Badge variant="danger" className="px-2.5 py-0.5 font-bold text-[10px]">
                PM DUE
              </Badge>
            )}
          </div>
        </div>

        {/* FILTER TOOLBAR (Search + Source + Trip Range) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-3 border-b border-gray-100">
          {/* Search Input (Search-on-Enter - Strategy B) */}
          <div className="relative">
            <input
              type="text"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setCommittedSearch(searchDraft.trim());
                  setPage(1);
                }
              }}
              placeholder="Search notes, supervisor..."
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-full py-2 pl-8 pr-7 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/20 transition-all"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            {searchDraft && (
              <button
                type="button"
                onClick={() => {
                  setSearchDraft("");
                  setCommittedSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => {
              setSelectedSource(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-gray-50 border border-gray-200 rounded-full py-2 px-3 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/20 transition-all cursor-pointer"
          >
            <option value="All">All Sources</option>
            <option value="POST_DISPATCH_RETURN">Post-Dispatch Return</option>
            <option value="MAINTENANCE_SERVICE">Maintenance Check</option>
            <option value="MANUAL_ENTRY">Manual Entry</option>
          </select>

          {/* Trip Distance Range Filter */}
          <select
            value={selectedTripRange}
            onChange={(e) => {
              setSelectedTripRange(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-gray-50 border border-gray-200 rounded-full py-2 px-3 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/20 transition-all cursor-pointer"
          >
            <option value="All">All Trip Ranges</option>
            <option value="HIGH">High Mileage (≥ 100 KM)</option>
            <option value="MEDIUM">Medium Trip (20 – 99 KM)</option>
            <option value="SHORT">Short / Yard (&lt; 20 KM)</option>
          </select>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        {/* LOADING SKELETON */}
        {isLoading && (
          <div className="space-y-2.5 py-6">
            <div className="h-12 bg-gray-100 animate-pulse rounded-xl" />
            <div className="h-12 bg-gray-100 animate-pulse rounded-xl" />
            <div className="h-12 bg-gray-100 animate-pulse rounded-xl" />
          </div>
        )}

        {/* LOGS TABLE */}
        {!isLoading && filteredLogs.length > 0 && (
          <div className="space-y-3">
            <div className="overflow-x-auto border border-gray-200 rounded-2xl custom-scrollbar shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#F3F5F5] sticky top-0 z-10 text-[#0A4B6E] font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3.5 whitespace-nowrap">Date & Time</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Reading (KM)</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Trip Delta</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Source</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Logged By</th>
                    <th className="py-3 px-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#E8F3F8]/70 transition-colors duration-150 bg-white">
                      <td className="py-3 px-3.5 text-gray-700 whitespace-nowrap font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-[#588094] shrink-0" />
                          <span>{formatDateTime(log.loggedAt)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-[#0A4B6E] whitespace-nowrap">
                        {Number(log.odometerReading).toLocaleString()} KM
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {log.distanceDelta !== undefined &&
                        log.distanceDelta !== null ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#E8F5E9] text-[#2E7D32]">
                            +{Number(log.distanceDelta).toLocaleString()} KM
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-gray-600 whitespace-nowrap">
                        {log.source === "POST_DISPATCH_RETURN"
                          ? "Post-Dispatch Return"
                          : log.source === "MAINTENANCE_SERVICE"
                          ? "Maintenance Check"
                          : log.source?.replace(/_/g, " ") || "Manual Entry"}
                      </td>
                      <td className="py-3 px-3.5 text-gray-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-[#588094] shrink-0" />
                          <span>{log.loggedByName || "Supervisor"}</span>
                        </div>
                      </td>
                      <td
                        className="py-3 px-3.5 text-gray-500 max-w-xs truncate"
                        title={log.notes}
                      >
                        {log.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-1">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  limit={limit}
                  onPageChange={(p) => setPage(p)}
                  isLoading={isLoading}
                  itemLabel="records"
                />
              </div>
            )}
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && filteredLogs.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <Gauge size={42} className="mb-2 stroke-[1.5] text-gray-300" />
            <p className="font-semibold text-sm text-gray-600">
              No Odometer Logs Found
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              {committedSearch || selectedSource !== "All" || selectedTripRange !== "All"
                ? "No odometer records matched your search or filter criteria."
                : "No single-point return check-ins have been recorded for this vehicle yet."}
            </p>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}

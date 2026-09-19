// src/components/fleet/OdometerHistoryModal.jsx
import { useState, useEffect, useCallback } from "react";
import { History, Gauge, Calendar, User, Clock } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { fleetApi } from "../../api/fleet.js";

export default function OdometerHistoryModal({
  isOpen,
  truck,
  onClose,
  onOpenCheckIn,
}) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (!isOpen || !truck) return null;

  const currentOdo = Number(truck.currentOdometer) || 0;
  const lastPmOdo = Number(truck.lastPmOdometer) || 0;
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

  const footerContent = (
    <div className="w-full flex items-center justify-between gap-3">
      {onOpenCheckIn && (
        <Button
          type="button"
          variant="yellow"
          onClick={() => {
            onClose();
            onOpenCheckIn(truck);
          }}
          className="!w-auto px-5 py-2 text-xs font-bold uppercase tracking-wider"
        >
          LOG RETURN ODOMETER
        </Button>
      )}
      <Button
        type="button"
        variant="cancel"
        onClick={onClose}
        className="ml-auto text-xs"
      >
        CLOSE
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Odometer & Mileage Audit History"
      maxWidth="max-w-3xl"
      footer={footerContent}
    >
      <div className="py-2 text-left space-y-4">
        {/* VEHICLE STATS BANNER */}
        <div className="bg-[#BAE6FD]/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 border border-[#0A4B6E]/15">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0A4B6E] text-white flex items-center justify-center shrink-0">
              <History size={22} />
            </div>
            <div>
              <h3 className="font-bold text-[#0A4B6E] text-base leading-tight">
                {truck.plateNumber || "Truck"}
              </h3>
              <p className="text-xs text-[#588094]">
                {truck.model || "Isuzu Elf"} {truck.yearModel ? `(${truck.yearModel})` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div>
              <span className="text-[#588094] block text-[11px]">Current Odometer</span>
              <span className="font-bold text-sm text-[#0A4B6E]">
                {currentOdo.toLocaleString()} KM
              </span>
            </div>
            <div className="h-7 w-[1px] bg-gray-300 hidden sm:block" />
            <div>
              <span className="text-[#588094] block text-[11px]">Since Last PM</span>
              <span className={`font-bold text-sm ${isPmDue ? "text-red-600" : "text-[#0A4B6E]"}`}>
                {distanceSinceLastPm.toLocaleString()} / 5,000 KM
              </span>
            </div>
            {isPmDue && (
              <Badge variant="danger" className="px-3 py-1 font-bold">
                PM DUE
              </Badge>
            )}
          </div>
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
            <div className="h-10 bg-gray-100 animate-pulse rounded-xl" />
            <div className="h-10 bg-gray-100 animate-pulse rounded-xl" />
            <div className="h-10 bg-gray-100 animate-pulse rounded-xl" />
          </div>
        )}

        {/* LOGS TABLE */}
        {!isLoading && logs.length > 0 && (
          <div className="overflow-x-auto max-h-[360px] overflow-y-auto border border-gray-200 rounded-xl custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F3F5F5] sticky top-0 z-10 text-[#0A4B6E] font-bold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3 whitespace-nowrap">Date & Time</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Reading (KM)</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Trip Delta</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Source</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Logged By</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#EBF5FB]/60 transition-colors">
                    <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-[#588094] shrink-0" />
                        <span>{formatDateTime(log.loggedAt)}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#0A4B6E] whitespace-nowrap">
                      {Number(log.odometerReading).toLocaleString()} KM
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {log.distanceDelta !== undefined && log.distanceDelta !== null ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#2E7D32]">
                          +{Number(log.distanceDelta).toLocaleString()} KM
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                      {log.source === "POST_DISPATCH_RETURN"
                        ? "Post-Dispatch Return"
                        : log.source === "MAINTENANCE_SERVICE"
                        ? "Maintenance Check"
                        : log.source?.replace(/_/g, " ") || "Manual Entry"}
                    </td>
                    <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-[#588094] shrink-0" />
                        <span>{log.loggedByName || "Supervisor"}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 max-w-xs truncate" title={log.notes}>
                      {log.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && logs.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <Gauge size={36} className="mb-2 stroke-[1.5] text-gray-300" />
            <p className="font-semibold text-sm text-gray-600">No Odometer Logs Found</p>
            <p className="text-xs text-gray-400 mt-1">
              No single-point return check-ins have been recorded for this vehicle yet.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

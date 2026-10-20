// src/components/alerts/EmergencyAlertBanner.jsx
import { useState } from "react";
import { useSocket } from "../../context/SocketContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";
import {
  AlertTriangle,
  Volume2,
  VolumeX,
  CheckCircle,
  Clock,
  Truck,
  User,
  X,
  ShieldAlert,
} from "lucide-react";
import { formatPhilippineTime } from "../../utils/date.js";

export default function EmergencyAlertBanner() {
  const {
    activeAlerts,
    acknowledgeAlert,
    resolveAlert,
    isMuted,
    toggleMute,
  } = useSocket();
  const { can } = useAuth();
  const canManage = can ? can(PERMISSIONS.ALERTS_MANAGE) : false;

  const [activeIdx, setActiveIdx] = useState(0);
  const [resolvingAlertId, setResolvingAlertId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activeAlerts || activeAlerts.length === 0) {
    return null;
  }

  const currentAlert = activeAlerts[activeIdx] || activeAlerts[0];
  const isAcknowledged = (currentAlert.status || "").toUpperCase() === "ACKNOWLEDGED";

  const handleAcknowledge = async () => {
    try {
      setIsSubmitting(true);
      await acknowledgeAlert(currentAlert.id);
    } catch (err) {
      console.error("Failed to acknowledge emergency alert:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolvingAlertId) return;
    try {
      setIsSubmitting(true);
      await resolveAlert(resolvingAlertId, resolutionNotes);
      setResolvingAlertId(null);
      setResolutionNotes("");
    } catch (err) {
      console.error("Failed to resolve emergency alert:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={`w-full text-white shadow-md border-b transition-all duration-300 ${
          isAcknowledged
            ? "bg-[#D97706] border-amber-600"
            : "bg-[#DC2626] border-red-700 animate-pulse-subtle"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* LEFT: Incident Indicator & Core Metadata */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert size={20} className="text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  {currentAlert.emergencyType || "SOS ALERT"}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isAcknowledged
                      ? "bg-amber-900/60 text-amber-100"
                      : "bg-red-950 text-red-200 animate-pulse"
                  }`}
                >
                  {isAcknowledged ? "ACKNOWLEDGED" : "ACTIVE SOS"}
                </span>
                {activeAlerts.length > 1 && (
                  <span className="text-[11px] text-white/80">
                    ({activeIdx + 1} of {activeAlerts.length})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs mt-0.5 text-white/90 flex-wrap">
                <span className="flex items-center gap-1 font-semibold truncate">
                  <User size={13} />
                  {currentAlert.driver?.fullName || currentAlert.driverName || "Driver SOS"}
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  <Truck size={13} />
                  {currentAlert.vehicle?.plateNumber || currentAlert.plateNumber || "Truck"}
                </span>
                <span className="flex items-center gap-1 text-white/80">
                  <Clock size={13} />
                  {formatPhilippineTime(currentAlert.createdAt || new Date())}
                </span>
                {currentAlert.description && (
                  <span className="text-white/95 italic truncate max-w-[280px] md:max-w-[420px]">
                    "{currentAlert.description}"
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Triage Actions & Mute Controls */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* Audio Mute / Unmute Button */}
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title={isMuted ? "Unmute Alarm" : "Mute Alarm"}
              aria-label={isMuted ? "Unmute Alarm" : "Mute Alarm"}
            >
              {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>

            {/* Pagination between multiple active alerts */}
            {activeAlerts.length > 1 && (
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setActiveIdx((prev) =>
                      prev > 0 ? prev - 1 : activeAlerts.length - 1
                    )
                  }
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded cursor-pointer"
                >
                  &larr;
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIdx((prev) =>
                      prev < activeAlerts.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded cursor-pointer"
                >
                  &rarr;
                </button>
              </div>
            )}

            {/* Supervisor Actions: Acknowledge & Resolve */}
            {canManage && (
              <div className="flex items-center gap-2">
                {!isAcknowledged && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleAcknowledge}
                    className="px-3 py-1 bg-[#FFDF2C] text-[#0A4B6E] text-xs font-bold rounded-lg hover:bg-[#ebd024] transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    ACKNOWLEDGE
                  </button>
                )}

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setResolvingAlertId(currentAlert.id)}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg transition cursor-pointer disabled:opacity-50"
                >
                  RESOLVE
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RESOLUTION MODAL */}
      {resolvingAlertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-800 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#1B4B75] flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600" />
                Resolve Emergency Alert
              </h3>
              <button
                type="button"
                onClick={() => setResolvingAlertId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Resolution Notes / Summary
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Tow truck dispatched, driver safe, vehicle transported to yard."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A4B6E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingAlertId(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-bold bg-[#0A4B6E] text-white hover:bg-[#083a56] rounded-lg transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Confirm Resolve"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// src/components/fleet/apprehensions/ApprehensionDetailModal.jsx
import { useState } from "react";
import { createPortal } from "react-dom";
import {
  FileWarning,
  ShieldAlert,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Truck,
  User,
  DollarSign,
  Camera,
  Maximize2,
  X,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  FileText,
  Phone,
  Route,
} from "lucide-react";
import Button from "../../ui/Button";
import DocumentViewerModal from "../../ui/DocumentViewerModal.jsx";
import { formatPhilippineDateTime } from "../../../utils/date.js";
import { resolveMediaUrl } from "../../../utils/media.js";

function formatCurrency(val) {
  const num = Number(val) || 0;
  return `₱${num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ApprehensionDetailModal({
  isOpen = false,
  onClose,
  apprehension = null,
  canManage = false,
  onUpdateStatus,
}) {
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusPrompt, setStatusPrompt] = useState(null); // 'SETTLED' | 'DISPUTED' | 'CANCELLED'
  const [resolutionNotes, setResolutionNotes] = useState("");

  if (!isOpen || !apprehension || typeof document === "undefined") {
    return null;
  }

  const ticketNo = apprehension.citationTicketNo || "N/A";
  const violation = apprehension.violationType || "Road Traffic Violation";
  const agency = apprehension.apprehendingAgency || "Traffic Enforcement";
  const penalty = Number(apprehension.penaltyAmount || 0);
  const status = apprehension.status || "RECORDED";
  const incidentTime = formatPhilippineDateTime(
    apprehension.incidentTime || apprehension.createdAt,
    { fallback: "—" }
  );
  const settledTime = apprehension.settledAt
    ? formatPhilippineDateTime(apprehension.settledAt)
    : null;
  const plate = apprehension.vehicle?.plateNumber || "N/A";
  const model = apprehension.vehicle?.model || "";
  const driverName = apprehension.driver?.fullName || apprehension.driver?.username || "Driver";
  const driverPhone = apprehension.driver?.phone;
  const tripNumber = apprehension.trip?.tripNumber;
  const notes = apprehension.notes;
  const mediaUrl = apprehension.ticketMediaUrl || resolveMediaUrl(apprehension.ticketMediaKey);

  const handleConfirmStatusChange = async () => {
    if (!statusPrompt) return;
    try {
      setIsUpdatingStatus(true);
      await onUpdateStatus(apprehension.id, {
        status: statusPrompt,
        notes: resolutionNotes || undefined,
      });
      setStatusPrompt(null);
      setResolutionNotes("");
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in text-left"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full p-5 space-y-4 border border-slate-200/90 shadow-2xl overflow-hidden relative animate-scale-in max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
              <FileWarning size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-[#0A4B6E] truncate">
                  Ticket #{ticketNo}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    status === "SETTLED"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : status === "DISPUTED"
                      ? "bg-blue-50 text-blue-800 border-blue-200"
                      : status === "CANCELLED"
                      ? "bg-slate-100 text-slate-600 border-slate-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="text-[11px] text-[#6D8AA2] font-medium mt-0.5">
                Logged road apprehension incident
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 pr-1">
          {/* TOP BANNER: Violation & Penalty */}
          <div className="bg-[#E8F3F8] border border-[#9BCBE3] rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D8AA2] block">
                Violation Classification
              </span>
              <p className="text-base font-bold text-[#1B4B75] mt-0.5">{violation}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-[#0A4B6E] border border-[#9BCBE3]">
                  {agency}
                </span>
                {apprehension.location && (
                  <span className="text-xs text-[#588094] font-medium flex items-center gap-1">
                    <MapPin size={12} className="text-[#588094]" />
                    <span>{apprehension.location}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D8AA2] block">
                Penalty Amount
              </span>
              <p className="text-2xl font-bold text-[#1B4B75] mt-0.5">
                {formatCurrency(penalty)}
              </p>
            </div>
          </div>

          {/* TWO-COLUMN METRICS: Vehicle & Driver vs Settlement & Telemetry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm">
            {/* Column 1: Asset & Driver */}
            <div className="bg-white rounded-2xl p-4 border border-[#9BCBE3]/80 shadow-xs space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A4B6E] block pb-1.5 border-b border-slate-100">
                Asset & Personnel
              </span>

              <div className="flex items-center justify-between">
                <span className="text-[#6D8AA2] flex items-center gap-1.5">
                  <Truck size={14} /> Vehicle:
                </span>
                <span className="font-bold text-slate-900">
                  {plate} {model ? `(${model})` : ""}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#6D8AA2] flex items-center gap-1.5">
                  <User size={14} /> Driver:
                </span>
                <span className="font-bold text-slate-900">{driverName}</span>
              </div>

              {driverPhone && (
                <div className="flex items-center justify-between">
                  <span className="text-[#6D8AA2] flex items-center gap-1.5">
                    <Phone size={14} /> Contact:
                  </span>
                  <span className="font-medium text-slate-800">{driverPhone}</span>
                </div>
              )}

              {tripNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-[#6D8AA2] flex items-center gap-1.5">
                    <Route size={14} /> Dispatch Trip:
                  </span>
                  <span className="font-bold text-[#0A4B6E]">
                    Trip #{tripNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Column 2: Incident & Resolution Timeline */}
            <div className="bg-white rounded-2xl p-4 border border-[#9BCBE3]/80 shadow-xs space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A4B6E] block pb-1.5 border-b border-slate-100">
                Timeline & Status
              </span>

              <div className="flex items-center justify-between">
                <span className="text-[#6D8AA2] flex items-center gap-1.5">
                  <Calendar size={14} /> Incident Time:
                </span>
                <span className="font-medium text-slate-800 text-right">
                  {incidentTime}
                </span>
              </div>

              {settledTime && (
                <div className="flex items-center justify-between">
                  <span className="text-[#6D8AA2] flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" /> Settled On:
                  </span>
                  <span className="font-medium text-slate-800 text-right">
                    {settledTime}
                  </span>
                </div>
              )}

              {apprehension.settledByName && (
                <div className="flex items-center justify-between">
                  <span className="text-[#6D8AA2] flex items-center gap-1.5">
                    Settled By:
                  </span>
                  <span className="font-bold text-slate-900">
                    {apprehension.settledByName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CITATION TICKET PHOTO PROOF */}
          <div className="bg-white rounded-2xl p-4 border border-[#9BCBE3]/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5">
                <Camera size={13} />
                <span>Citation Ticket Proof</span>
              </span>
              {mediaUrl && (
                <button
                  type="button"
                  onClick={() => setShowPhotoViewer(true)}
                  className="text-xs font-bold text-[#0A4B6E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Maximize2 size={12} />
                  <span>Full View</span>
                </button>
              )}
            </div>

            {mediaUrl ? (
              <div
                onClick={() => setShowPhotoViewer(true)}
                className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center max-h-48 cursor-pointer group"
              >
                <img
                  src={mediaUrl}
                  alt={`Ticket Proof ${ticketNo}`}
                  className="max-h-48 w-full object-contain group-hover:scale-102 transition-transform"
                />
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3 py-1.5 rounded-full bg-slate-900/80 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                    <Maximize2 size={13} />
                    <span>Click to enlarge photo</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No citation ticket proof attached.
              </div>
            )}
          </div>

          {/* NOTES / REMARKS */}
          {notes && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 text-xs md:text-sm text-slate-700 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D8AA2] block">
                Driver / Officer Remarks
              </span>
              <p className="italic leading-relaxed">{notes}</p>
            </div>
          )}

          {/* SUPERVISOR RESOLUTION PROMPT */}
          {statusPrompt && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3 animate-scale-in">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span className="font-bold text-xs text-amber-900">
                  Confirm Status Change to {statusPrompt}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                  Resolution Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Fine settled at traffic office / ticket disputed..."
                  className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="cancel"
                  onClick={() => setStatusPrompt(null)}
                  disabled={isUpdatingStatus}
                  className="text-xs py-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="blue"
                  onClick={handleConfirmStatusChange}
                  disabled={isUpdatingStatus}
                  className="text-xs py-1"
                >
                  {isUpdatingStatus ? "Updating..." : "CONFIRM UPDATE"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            {canManage && status !== "SETTLED" && !statusPrompt && (
              <button
                type="button"
                onClick={() => setStatusPrompt("SETTLED")}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} />
                <span>Mark Settled</span>
              </button>
            )}

            {canManage && status === "RECORDED" && !statusPrompt && (
              <button
                type="button"
                onClick={() => setStatusPrompt("DISPUTED")}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <HelpCircle size={13} />
                <span>Dispute Ticket</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] shadow-2xs transition active:scale-95 cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>

      {/* SHARED FULLSCREEN LIGHTBOX FOR CITATION PROOF */}
      {mediaUrl && (
        <DocumentViewerModal
          isOpen={showPhotoViewer}
          onClose={() => setShowPhotoViewer(false)}
          item={mediaUrl}
          title={`Citation Proof - Ticket #${ticketNo}`}
          defaultExpanded={true}
        />
      )}
    </div>,
    document.body
  );
}

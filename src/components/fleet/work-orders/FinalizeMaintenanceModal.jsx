// src/components/fleet/work-orders/FinalizeMaintenanceModal.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Wrench,
  Calendar,
  Gauge,
  Clock,
  Upload,
  Camera,
  FileText,
  Trash2,
  AlertTriangle,
  Image as ImageIcon,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";
import { uploadMediaFile } from "../../../api/media.js";
import { resolveMediaUrl } from "../../../utils/media.js";

const SEVERITY_OPTIONS = [
  { value: "LOW", label: "Low", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "MEDIUM", label: "Medium", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "HIGH", label: "High", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "CRITICAL", label: "Critical", color: "bg-red-50 text-red-700 border-red-200" },
];

/**
 * Timezone-safe date helper to format Date objects or ISO date strings to YYYY-MM-DD in local time.
 */
function toLocalDateString(dateInput) {
  if (!dateInput) return "";
  if (typeof dateInput === "string") {
    const match = dateInput.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match && !dateInput.includes("T")) return match[1];
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * FinalizeMaintenanceModal
 * Streamlined 2-column modal to capture parts & labor costs, serviced odometer, downtime,
 * and optional photo-first receipt documentation for audit logging.
 */
export default function FinalizeMaintenanceModal({
  isOpen,
  workOrder,
  truck = null,
  onClose,
  onFinalize,
}) {
  const [stagedReceipts, setStagedReceipts] = useState([]);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [textRefInput, setTextRefInput] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [dateStarted, setDateStarted] = useState("");
  const [dateResolved, setDateResolved] = useState("");
  const [partsCost, setPartsCost] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [downtimeDays, setDowntimeDays] = useState(1);
  const [odometerAtService, setOdometerAtService] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const currentOdometer = Number(
    truck?.currentOdometer ||
    workOrder?.currentOdometer ||
    workOrder?.truck?.currentOdometer ||
    0
  );

  // Initialize modal state on open
  useEffect(() => {
    if (isOpen && workOrder) {
      const localToday = toLocalDateString(new Date());
      const scheduled = toLocalDateString(workOrder.scheduledDate) || localToday;
      const initialResolved = scheduled > localToday ? scheduled : localToday;

      setStagedReceipts(workOrder.receipts || []);
      setShowTextFallback(false);
      setTextRefInput("");
      setSeverity("MEDIUM");
      setDateStarted(scheduled);
      setDateResolved(initialResolved);
      setPartsCost(workOrder.partsCost ? String(workOrder.partsCost) : "");
      setLaborCost(workOrder.laborCost ? String(workOrder.laborCost) : "");
      setDowntimeDays(1);
      setOdometerAtService(currentOdometer ? String(currentOdometer) : "");
      setError("");
    }
  }, [isOpen, workOrder, currentOdometer]);

  // Auto-compute downtime days when dates change
  const calculatedDowntime = useMemo(() => {
    if (!dateStarted || !dateResolved) return 1;
    const start = new Date(dateStarted);
    const end = new Date(dateResolved);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? Math.max(1, diffDays) : 0;
  }, [dateStarted, dateResolved]);

  // Total cost live computation (manual accounting principle)
  const numericParts = parseFloat(partsCost) || 0;
  const numericLabor = parseFloat(laborCost) || 0;
  const totalCost = numericParts + numericLabor;

  const handleDateStartedChange = (e) => {
    const newStart = e.target.value;
    setDateStarted(newStart);
    if (dateResolved && newStart && dateResolved < newStart) {
      setDateResolved(newStart);
    }
    if (error && error.includes("Resolution date")) {
      setError("");
    }
  };

  const handleDateResolvedChange = (e) => {
    const newResolved = e.target.value;
    setDateResolved(newResolved);
    if (error && error.includes("Resolution date")) {
      setError("");
    }
  };

  const handleFileSelected = async (file) => {
    if (!file) return;
    setError("");
    setIsUploadingReceipt(true);

    try {
      const uploadResult = await uploadMediaFile(file, "maintenance/receipts");
      const newRcpt = {
        id: `rcpt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        fileName: uploadResult.originalName || file.name,
        fileUrl: uploadResult.storageKey || uploadResult.url,
        previewUrl: uploadResult.url || resolveMediaUrl(uploadResult.storageKey),
        storageKey: uploadResult.storageKey,
        fileType: uploadResult.mimeType || file.type,
        receiptNumber: file.name.replace(/\.[^/.]+$/, "").slice(0, 24) || "Receipt",
        isManual: false,
      };
      setStagedReceipts((prev) => [...prev, newRcpt]);
    } catch (err) {
      console.error("Failed to upload receipt:", err);
      setError(err?.message || "Failed to process and upload receipt file.");
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleAddTextReference = (e) => {
    e.preventDefault();
    if (!textRefInput.trim()) return;
    const newRcpt = {
      id: `rcpt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      receiptNumber: textRefInput.trim(),
      isManual: true,
    };
    setStagedReceipts((prev) => [...prev, newRcpt]);
    setTextRefInput("");
    setShowTextFallback(false);
  };

  const handleRemoveReceipt = (id) => {
    setStagedReceipts((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!dateStarted || !dateResolved) {
      setError("Both repair start date and resolution date are required.");
      return;
    }

    if (new Date(dateResolved) < new Date(dateStarted)) {
      setError("Resolution date cannot be earlier than the start date.");
      return;
    }

    const odo = parseInt(odometerAtService, 10);
    if (isNaN(odo) || odo < 0) {
      setError("Please provide a valid odometer reading at service.");
      return;
    }

    if (odo > 999999) {
      setError("Odometer at service cannot exceed 999,999 km.");
      return;
    }

    if (currentOdometer > 0 && odo < currentOdometer) {
      setError(
        `Odometer at service (${odo.toLocaleString()} km) cannot be less than current odometer (${currentOdometer.toLocaleString()} km).`
      );
      return;
    }

    const primaryOr = stagedReceipts[0]?.receiptNumber || "N/A";

    const payload = {
      officialReceiptNumber: primaryOr,
      receipts: stagedReceipts,
      severity,
      dateStarted: new Date(dateStarted).toISOString(),
      dateResolved: new Date(dateResolved).toISOString(),
      partsCost: numericParts,
      laborCost: numericLabor,
      downtimeDays: parseInt(downtimeDays, 10) || calculatedDowntime || 1,
      odometerAtService: odo,
    };

    try {
      setIsSubmitting(true);
      await onFinalize(workOrder.id, payload);
      onClose();
    } catch (err) {
      console.error("Failed to finalize maintenance log:", err);
      setError(err?.message || "Failed to finalize maintenance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !workOrder) return null;

  // Robust plate number & model resolution (prioritize workOrder properties)
  const truckPlate =
    workOrder?.plateNumber ||
    workOrder?.truck?.plateNumber ||
    truck?.plateNumber ||
    "N/A";

  const truckModel =
    workOrder?.truckModel ||
    workOrder?.model ||
    workOrder?.truck?.model ||
    truck?.model ||
    truck?.truckModel ||
    "";

  const vehicleType =
    workOrder?.vehicleType ||
    workOrder?.truck?.vehicleType ||
    truck?.vehicleType ||
    "DELIVERY_TRUCK";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Finalize Maintenance"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left py-1">
        {/* Work Order & Vehicle Context Banner */}
        <div className="bg-[#E8F3F8] rounded-2xl p-3.5 flex items-center justify-between border border-[#BCE1F1]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A4B6E] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Wrench size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#0A4B6E] text-base leading-tight">
                  {truckPlate}
                </h3>
                {vehicleType && (
                  <Badge variant="info" className="text-[9.5px] px-2 py-0">
                    {vehicleType.replace("_", " ")}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#588094]">
                {truckModel ? `${truckModel} • ` : ""}WO #{workOrder.workOrderNumber || workOrder.id?.slice(0, 8)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[#588094] block">Provider</span>
            <span className="font-semibold text-xs text-[#0A4B6E]">
              {workOrder.shopName || "External Facility"}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* PHOTO-FIRST RECEIPT DOCUMENTATION (OPTIONAL) */}
        <div className="bg-[#F8FAFC] border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#0A4B6E]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E]">
                Receipt Documentation (Optional)
              </span>
            </div>
            {!showTextFallback && (
              <button
                type="button"
                onClick={() => setShowTextFallback(true)}
                className="text-[11px] font-bold text-[#0A4B6E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Add Text Note</span>
              </button>
            )}
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => {
              handleFileSelected(e.target.files?.[0]);
              e.target.value = "";
            }}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              handleFileSelected(e.target.files?.[0]);
              e.target.value = "";
            }}
            className="hidden"
          />

          {/* Compact Dropzone */}
          <div
            onDrop={(e) => {
              e.preventDefault();
              if (!isUploadingReceipt) handleFileSelected(e.dataTransfer.files?.[0]);
            }}
            onDragOver={(e) => e.preventDefault()}
            className="border border-dashed border-[#BCE1F1] hover:border-[#0A4B6E]/50 bg-white rounded-xl p-3 text-center transition-all"
          >
            {isUploadingReceipt ? (
              <div className="flex flex-col items-center justify-center py-1 space-y-1">
                <Loader2 size={18} className="text-[#0A4B6E] animate-spin" />
                <p className="text-xs font-semibold text-[#0A4B6E]">
                  Compressing & Uploading Receipt...
                </p>
                <p className="text-[10px] text-[#6D8AA2]">
                  Enforcing 5 MB ceiling
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-[#588094]">
                  Upload receipt photo or PDF for audit documentation (Max 5 MB)
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingReceipt}
                    className="py-1 px-3 rounded-full text-xs font-bold bg-[#0A4B6E] text-[#FFDF2C] hover:bg-[#083b57] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Upload size={12} />
                    <span>Browse File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isUploadingReceipt}
                    className="py-1 px-3 rounded-full text-xs font-bold bg-white text-[#0A4B6E] border border-gray-300 hover:bg-slate-50 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Camera size={12} />
                    <span>Take Photo</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Inline Text Fallback Form */}
          {showTextFallback && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={textRefInput}
                onChange={(e) => setTextRefInput(e.target.value)}
                placeholder="Enter OR# or text note (e.g. OR-88991)"
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#0A4B6E]"
              />
              <button
                type="button"
                onClick={handleAddTextReference}
                className="py-1.5 px-3 rounded-xl text-xs font-bold bg-[#0A4B6E] text-white hover:bg-[#083b57] cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setTextRefInput("");
                  setShowTextFallback(false);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Attached Receipts Chips */}
          {stagedReceipts.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {stagedReceipts.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs"
                >
                  {r.fileUrl && r.fileType?.startsWith("image/") ? (
                    <img
                      src={resolveMediaUrl(r.fileUrl || r.previewUrl)}
                      alt="Receipt"
                      className="w-5 h-5 rounded object-cover border border-slate-200"
                    />
                  ) : r.fileType === "application/pdf" ? (
                    <span className="w-5 h-5 rounded bg-red-100 text-red-700 flex items-center justify-center font-bold text-[9px]">
                      PDF
                    </span>
                  ) : (
                    <FileText size={13} className="text-[#0A4B6E]" />
                  )}
                  <span className="font-mono text-xs text-gray-700 max-w-[140px] truncate">
                    {r.receiptNumber || r.fileName || "Receipt"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveReceipt(r.id)}
                    className="text-gray-400 hover:text-red-500 cursor-pointer ml-1"
                    title="Remove"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SERVICE DETAILS (2-COLUMN BALANCED GRID) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Date Started */}
          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1">
              Date Started <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={dateStarted}
                onChange={handleDateStartedChange}
                className="w-full pl-8 pr-3 py-2 text-xs font-medium bg-[#F3F5F5] rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0A4B6E] text-gray-800"
              />
              <Calendar className="w-3.5 h-3.5 text-[#588094] absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Date Resolved */}
          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1">
              Date Resolved <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                min={dateStarted}
                value={dateResolved}
                onChange={handleDateResolvedChange}
                className="w-full pl-8 pr-3 py-2 text-xs font-medium bg-[#F3F5F5] rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0A4B6E] text-gray-800"
              />
              <Calendar className="w-3.5 h-3.5 text-[#588094] absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Parts Cost */}
          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1">
              Parts Cost (PHP)
            </label>
            <div className="relative">
              <span className="text-gray-500 absolute left-3 top-2 text-xs font-bold">₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={partsCost}
                onChange={(e) => setPartsCost(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 text-xs font-medium bg-[#F3F5F5] rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0A4B6E] text-gray-800"
              />
            </div>
          </div>

          {/* Labor Cost */}
          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1">
              Labor Cost (PHP)
            </label>
            <div className="relative">
              <span className="text-gray-500 absolute left-3 top-2 text-xs font-bold">₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 text-xs font-medium bg-[#F3F5F5] rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0A4B6E] text-gray-800"
              />
            </div>
          </div>

          {/* Live Total Cost Banner */}
          <div className="md:col-span-2 bg-[#F3F5F5] border border-gray-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0A4B6E]">
              Total Settled Maintenance Cost
            </span>
            <span className="text-sm font-bold text-[#0A4B6E]">
              ₱{totalCost.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Odometer at Service */}
          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1">
              Odometer at Service (km) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min={currentOdometer || 0}
                max={999999}
                value={odometerAtService}
                onChange={(e) => setOdometerAtService(e.target.value)}
                placeholder="e.g. 46500"
                className="w-full pl-8 pr-3 py-2 text-xs font-medium bg-[#F3F5F5] rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0A4B6E] text-gray-800 font-mono"
              />
              <Gauge className="w-3.5 h-3.5 text-[#588094] absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Downtime Days */}
          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1">
              Downtime (Days)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={downtimeDays}
                onChange={(e) => setDowntimeDays(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs font-medium bg-[#F3F5F5] rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0A4B6E] text-gray-800"
              />
              <Clock className="w-3.5 h-3.5 text-[#588094] absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Service Severity */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1">
              Severity
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SEVERITY_OPTIONS.map((opt) => {
                const isSelected = severity === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSeverity(opt.value)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      isSelected
                        ? `${opt.color} border-current ring-1 ring-[#0A4B6E]/30 font-bold shadow-2xs`
                        : "bg-[#F3F5F5] border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="w-full flex flex-col items-center pt-2">
          <Button
            type="submit"
            variant="yellow"
            disabled={isSubmitting}
            className="w-full font-bold text-xs uppercase tracking-wider mb-2"
          >
            {isSubmitting ? "FINALIZING..." : "FINALIZE & RELEASE VEHICLE"}
          </Button>
          <Button
            type="button"
            variant="cancel"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-xs"
          >
            CANCEL
          </Button>
        </div>
      </form>
    </Modal>
  );
}

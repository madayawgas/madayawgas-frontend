// src/components/fleet/work-orders/FinalizeMaintenanceModal.jsx
import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, AlertTriangle, FileText, Wrench, Calendar, Gauge, ShieldCheck, Clock } from "lucide-react";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";

const SEVERITY_OPTIONS = [
  { value: "LOW", label: "Low", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "MEDIUM", label: "Medium", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "HIGH", label: "High", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "CRITICAL", label: "Critical", color: "bg-red-50 text-red-700 border-red-200" },
];

/**
 * FinalizeMaintenanceModal
 * Captures official receipt, final parts & labor costs, downtime, and serviced odometer.
 * Completes the work order, resets PM baseline if PREVENTIVE, and releases vehicle to ACTIVE status.
 */
export default function FinalizeMaintenanceModal({
  isOpen,
  workOrder,
  truck = null,
  onClose,
  onFinalize,
}) {
  const [officialReceiptNumber, setOfficialReceiptNumber] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [dateStarted, setDateStarted] = useState("");
  const [dateResolved, setDateResolved] = useState("");
  const [partsCost, setPartsCost] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [downtimeDays, setDowntimeDays] = useState(1);
  const [odometerAtService, setOdometerAtService] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentOdometer = Number(truck?.currentOdometer || workOrder?.truck?.currentOdometer || 0);
  const isPreventive = 
    workOrder?.maintenanceType?.name === "PREVENTIVE" || 
    workOrder?.maintenanceTypeName === "PREVENTIVE" ||
    workOrder?.maintenanceTypeId === 1 || 
    workOrder?.maintenanceTypeId === "1";

  // Initialize modal state on open
  useEffect(() => {
    if (isOpen && workOrder) {
      const today = new Date().toISOString().split("T")[0];
      const scheduled = workOrder.scheduledDate 
        ? new Date(workOrder.scheduledDate).toISOString().split("T")[0]
        : today;

      setOfficialReceiptNumber("");
      setSeverity("MEDIUM");
      setDateStarted(scheduled || today);
      setDateResolved(today);
      setPartsCost("");
      setLaborCost("");
      setDowntimeDays(1);
      setOdometerAtService(currentOdometer ? String(currentOdometer) : "");
      setError("");
    }
  }, [isOpen, workOrder, currentOdometer]);

  // Auto-compute downtime days when dates change if not manually edited
  const calculatedDowntime = useMemo(() => {
    if (!dateStarted || !dateResolved) return 1;
    const start = new Date(dateStarted);
    const end = new Date(dateResolved);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? Math.max(1, diffDays) : 0;
  }, [dateStarted, dateResolved]);

  // Total cost live computation
  const numericParts = parseFloat(partsCost) || 0;
  const numericLabor = parseFloat(laborCost) || 0;
  const totalCost = numericParts + numericLabor;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!officialReceiptNumber.trim()) {
      setError("Official Receipt Number (OR#) is required.");
      return;
    }

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

    if (currentOdometer > 0 && odo < currentOdometer) {
      setError(`Odometer at service (${odo.toLocaleString()} km) cannot be less than current odometer (${currentOdometer.toLocaleString()} km).`);
      return;
    }

    const payload = {
      officialReceiptNumber: officialReceiptNumber.trim(),
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
      setError(err?.message || "Failed to finalize maintenance. Please verify the receipt number and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !workOrder) return null;

  const truckPlate = truck?.plateNumber || workOrder.truck?.plateNumber || "N/A";
  const truckModel = truck?.model || workOrder.truck?.model || "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Finalize Maintenance & Release Truck"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left py-2">
        {/* Work Order & Truck Banner */}
        <div className="bg-[#E8F3F8] rounded-xl p-3.5 flex items-center justify-between border border-[#BCE1F1]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A4B6E] text-white flex items-center justify-center shrink-0">
              <Wrench size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#0A4B6E] text-base leading-tight">
                {truckPlate}
              </h3>
              <p className="text-xs text-[#588094]">
                {truckModel ? `${truckModel} • ` : ""}WO #{workOrder.workOrderNumber || workOrder.id?.slice(0, 8)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[#588094] block">Service Provider</span>
            <span className="font-semibold text-xs text-[#0A4B6E]">
              {workOrder.shopName || "External Facility"}
            </span>
          </div>
        </div>

        {/* Informational Alert Box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex gap-2.5 text-xs text-emerald-900">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-emerald-950">
              Finalizing will mark this Work Order as COMPLETED and restore the vehicle to ACTIVE status.
            </p>
            <p className="text-emerald-800 leading-relaxed text-[11px]">
              • Operational status will transition to <strong>ACTIVE</strong> with driver relationship preserved.<br />
              {isPreventive && (
                <span className="font-semibold text-emerald-950 block mt-0.5">
                  • Preventive Baseline Reset: The vehicle's PM baseline odometer will update to the serviced odometer.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Official Receipt Number */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
              Official Receipt Number (OR#) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={officialReceiptNumber}
                onChange={(e) => setOfficialReceiptNumber(e.target.value)}
                placeholder="e.g. OR-2026-88991"
                className="w-full pl-9 pr-3.5 py-2 text-xs font-medium bg-[#F3F5F5] rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] text-gray-800 font-mono"
              />
              <FileText className="w-4 h-4 text-[#588094] absolute left-3 top-2.5" />
            </div>
            <span className="text-[11px] text-[#588094] mt-1 block">
              Unique receipt issued by {workOrder.shopName || "the repair facility"}.
            </span>
          </div>

          {/* Severity */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
              Service Severity <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SEVERITY_OPTIONS.map((opt) => {
                const isSelected = severity === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSeverity(opt.value)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      isSelected
                        ? `${opt.color} border-current ring-2 ring-[#0A4B6E]/30 font-bold shadow-xs`
                        : "bg-[#F3F5F5] border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Started */}
          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
              Date Started <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={dateStarted}
                onChange={(e) => setDateStarted(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs font-medium bg-[#F3F5F5] rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] text-gray-800"
              />
              <Calendar className="w-4 h-4 text-[#588094] absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Date Resolved */}
          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
              Date Resolved <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={dateResolved}
                onChange={(e) => setDateResolved(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs font-medium bg-[#F3F5F5] rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] text-gray-800"
              />
              <Calendar className="w-4 h-4 text-[#588094] absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Parts Cost */}
          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
              Parts Cost (PHP)
            </label>
            <div className="relative">
              <span className="text-gray-500 absolute left-3.5 top-2 text-xs font-bold">₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={partsCost}
                onChange={(e) => setPartsCost(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3.5 py-2 text-xs font-medium bg-[#F3F5F5] rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] text-gray-800"
              />
            </div>
          </div>

          {/* Labor Cost */}
          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
              Labor Cost (PHP)
            </label>
            <div className="relative">
              <span className="text-gray-500 absolute left-3.5 top-2 text-xs font-bold">₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3.5 py-2 text-xs font-medium bg-[#F3F5F5] rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] text-gray-800"
              />
            </div>
          </div>

          {/* Total Cost Display */}
          <div className="md:col-span-2 bg-[#F3F5F5] border border-gray-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] leading-none shrink-0">
                ₱
              </span>
              <span className="text-xs font-semibold text-[#0A4B6E]">Total Settled Maintenance Cost</span>
            </div>
            <span className="text-base font-bold text-[#0A4B6E]">
              ₱{totalCost.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Downtime Days */}
          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
              Downtime (Days)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={downtimeDays}
                onChange={(e) => setDowntimeDays(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs font-medium bg-[#F3F5F5] rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] text-gray-800"
              />
              <Clock className="w-4 h-4 text-[#588094] absolute left-3 top-2.5" />
            </div>
            <span className="text-[11px] text-[#588094] mt-1 block">
              Computed: {calculatedDowntime} day(s) based on dates.
            </span>
          </div>

          {/* Odometer at Service */}
          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
              Odometer at Service (km) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min={currentOdometer || 0}
                value={odometerAtService}
                onChange={(e) => setOdometerAtService(e.target.value)}
                placeholder="e.g. 46500"
                className="w-full pl-9 pr-3.5 py-2 text-xs font-medium bg-[#F3F5F5] rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] text-gray-800 font-mono"
              />
              <Gauge className="w-4 h-4 text-[#588094] absolute left-3 top-2.5" />
            </div>
            <span className="text-[11px] text-[#588094] mt-1 block">
              Current odometer: {currentOdometer.toLocaleString()} km
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="w-full flex flex-col items-center pt-2">
          <Button
            type="submit"
            variant="yellow"
            disabled={isSubmitting}
            className="w-full font-bold text-sm uppercase tracking-wider mb-2"
          >
            {isSubmitting ? "FINALIZING..." : "FINALIZE & RELEASE TRUCK"}
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

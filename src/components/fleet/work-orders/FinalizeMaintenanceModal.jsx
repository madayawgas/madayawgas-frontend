// src/components/fleet/work-orders/FinalizeMaintenanceModal.jsx
import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, AlertTriangle, FileText, Wrench, DollarSign, Calendar, Gauge, ShieldCheck, Clock } from "lucide-react";
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
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Work Order & Truck Banner */}
        <div className="bg-[#E8F3F8] rounded-xl p-3.5 border border-[#BCE1F1] flex flex-wrap items-center justify-between gap-3 text-sm">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6D8AA2]">
              Vehicle & Work Order
            </div>
            <div className="font-bold text-[#1B4B75] text-base flex items-center gap-1.5 mt-0.5">
              <span>{truckPlate}</span>
              {truckModel && <span className="text-xs font-medium text-slate-500 font-normal">({truckModel})</span>}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              WO #{workOrder.workOrderNumber || workOrder.id?.slice(0, 8)} •{" "}
              <span className="font-semibold text-[#0B4A6E]">
                {workOrder.maintenanceType?.name || workOrder.maintenanceTypeName || "MAINTENANCE"}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6D8AA2]">
              Service Provider
            </div>
            <div className="font-semibold text-slate-800 text-sm mt-0.5">
              {workOrder.shopName || "External Facility"}
            </div>
            <div className="text-xs text-slate-500">
              Est. Cost: ₱{(Number(workOrder.estimatedCost) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Informational Alert Box */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex gap-3 text-xs text-emerald-900">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-emerald-950">
              Finalizing will mark this Work Order as <span className="underline">COMPLETED</span> and restore the vehicle.
            </p>
            <p className="text-emerald-800 leading-relaxed">
              • Operational status will transition from <span className="font-medium">UNDER_MAINTENANCE</span> to <span className="font-medium">ACTIVE</span>.<br />
              • Assigned driver relationship will be strictly preserved.<br />
              {isPreventive && (
                <span className="font-medium text-emerald-950 block mt-0.5">
                  • <strong>Preventive Baseline Reset:</strong> The vehicle's PM baseline odometer will be updated to the serviced odometer, resetting the 5,000-km interval.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Official Receipt Number */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold tracking-wider uppercase text-[#6D8AA2] mb-1">
              Official Receipt Number (OR#) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={officialReceiptNumber}
                onChange={(e) => setOfficialReceiptNumber(e.target.value)}
                placeholder="e.g. OR-2026-88991"
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#F3F5F5] rounded-xl border border-slate-200 focus:outline-none focus:border-[#0B4A6E] focus:bg-white transition-all text-slate-800 font-mono"
              />
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Must be the unique receipt issued by {workOrder.shopName || "the repair facility"}.
            </p>
          </div>

          {/* Severity */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold tracking-wider uppercase text-[#6D8AA2] mb-1.5">
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
                    className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      isSelected
                        ? `${opt.color} border-current ring-2 ring-offset-1 ring-slate-400 font-bold shadow-sm`
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
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
            <label className="block text-[11px] font-bold tracking-wider uppercase text-[#6D8AA2] mb-1">
              Date Started <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={dateStarted}
                onChange={(e) => setDateStarted(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#F3F5F5] rounded-xl border border-slate-200 focus:outline-none focus:border-[#0B4A6E] focus:bg-white transition-all text-slate-800"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Date Resolved */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider uppercase text-[#6D8AA2] mb-1">
              Date Resolved <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={dateResolved}
                onChange={(e) => setDateResolved(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#F3F5F5] rounded-xl border border-slate-200 focus:outline-none focus:border-[#0B4A6E] focus:bg-white transition-all text-slate-800"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Parts Cost */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider uppercase text-[#6D8AA2] mb-1">
              Parts Cost (PHP)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={partsCost}
                onChange={(e) => setPartsCost(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#F3F5F5] rounded-xl border border-slate-200 focus:outline-none focus:border-[#0B4A6E] focus:bg-white transition-all text-slate-800"
              />
              <span className="text-slate-400 absolute left-3.5 top-2 text-sm font-semibold">₱</span>
            </div>
          </div>

          {/* Labor Cost */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider uppercase text-[#6D8AA2] mb-1">
              Labor Cost (PHP)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#F3F5F5] rounded-xl border border-slate-200 focus:outline-none focus:border-[#0B4A6E] focus:bg-white transition-all text-slate-800"
              />
              <span className="text-slate-400 absolute left-3.5 top-2 text-sm font-semibold">₱</span>
            </div>
          </div>

          {/* Total Cost Display */}
          <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-700">Total Maintenance Cost</span>
            </div>
            <span className="text-base font-bold text-[#0B4A6E]">
              ₱{totalCost.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Downtime Days */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider uppercase text-[#6D8AA2] mb-1">
              Downtime (Days)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={downtimeDays}
                onChange={(e) => setDowntimeDays(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#F3F5F5] rounded-xl border border-slate-200 focus:outline-none focus:border-[#0B4A6E] focus:bg-white transition-all text-slate-800"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Computed: {calculatedDowntime} day(s) based on dates.
            </p>
          </div>

          {/* Odometer at Service */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider uppercase text-[#6D8AA2] mb-1">
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
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#F3F5F5] rounded-xl border border-slate-200 focus:outline-none focus:border-[#0B4A6E] focus:bg-white transition-all text-slate-800 font-mono"
              />
              <Gauge className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Current vehicle odometer: {currentOdometer.toLocaleString()} km
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full px-5 text-slate-600"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0B4A6E] font-bold px-6 shadow-sm flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>Finalizing...</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalize & Release Truck</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

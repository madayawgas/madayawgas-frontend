// src/components/fleet/OdometerCheckInModal.jsx
import { useState, useMemo } from "react";
import { Gauge, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

export default function OdometerCheckInModal({
  isOpen,
  truck,
  onClose,
  onSubmit,
}) {
  const [odometerReading, setOdometerReading] = useState("");
  const [source, setSource] = useState("POST_DISPATCH_RETURN");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const currentOdo = Number(truck?.currentOdometer) || 0;
  const lastPmOdo = Number(truck?.lastPmOdometer) || 0;
  const currentDistanceSincePm = Math.max(0, currentOdo - lastPmOdo);

  const driverDisplay = truck?.driver
    ? `${truck.driver.firstName || ""} ${truck.driver.lastName || ""}`.trim() || truck.driver.username
    : truck?.driverName && truck.driverName !== "Unassigned"
    ? truck.driverName
    : "No Assigned";

  // Real-time calculation of trip delta and PM threshold
  const { newOdoNum, diffTrip, newDistanceSincePm, isMonotonicValid, willBePmDue } = useMemo(() => {
    if (odometerReading === "" || odometerReading === undefined) {
      return {
        newOdoNum: null,
        diffTrip: 0,
        newDistanceSincePm: currentDistanceSincePm,
        isMonotonicValid: false,
        willBePmDue: currentDistanceSincePm >= 5000,
      };
    }

    const val = Number(odometerReading);
    if (isNaN(val) || val < 0) {
      return {
        newOdoNum: val,
        diffTrip: 0,
        newDistanceSincePm: currentDistanceSincePm,
        isMonotonicValid: false,
        willBePmDue: currentDistanceSincePm >= 5000,
      };
    }

    const valid = val >= currentOdo;
    const diff = valid ? val - currentOdo : 0;
    const sincePm = val - lastPmOdo;
    const pmDue = sincePm >= 5000;

    return {
      newOdoNum: val,
      diffTrip: diff,
      newDistanceSincePm: sincePm,
      isMonotonicValid: valid,
      willBePmDue: pmDue,
    };
  }, [odometerReading, currentOdo, lastPmOdo, currentDistanceSincePm]);

  if (!isOpen || !truck) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isMonotonicValid || newOdoNum === null) return;

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      await onSubmit({
        truckId: truck.id,
        odometerReading: newOdoNum,
        source,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error("Failed to record odometer check-in:", err);
      setErrorMsg(err.message || "Failed to record odometer check-in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerContent = (
    <div className="w-full flex flex-col items-center">
      {errorMsg && (
        <div className="w-full bg-red-50 text-red-700 p-3 rounded-xl text-xs font-medium border border-red-200 mb-3 text-left">
          {errorMsg}
        </div>
      )}
      <Button
        type="button"
        variant="yellow"
        disabled={isSubmitting || !isMonotonicValid || odometerReading === ""}
        onClick={handleSubmit}
        className="w-full font-bold text-sm uppercase tracking-wider mb-2"
      >
        {isSubmitting ? "RECORDING..." : "CONFIRM CHECK-IN"}
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
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vehicle Return Odometer Check-In"
      maxWidth="max-w-lg"
      footer={footerContent}
    >
      <div className="space-y-4 text-left py-2">
        {/* VEHICLE CONTEXT BANNER */}
        <div className="bg-[#BAE6FD]/40 rounded-xl p-3.5 flex items-center justify-between border border-[#0A4B6E]/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A4B6E] text-white flex items-center justify-center shrink-0">
              <Gauge size={20} />
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
          <div className="text-right">
            <span className="text-[11px] text-[#588094] block">Assigned Driver</span>
            <span className="font-semibold text-xs text-[#0A4B6E]">{driverDisplay}</span>
          </div>
        </div>

        {/* CURRENT REGISTERED METRICS */}
        <div className="grid grid-cols-2 gap-3 bg-[#F3F5F5] rounded-xl p-3.5 text-xs">
          <div>
            <span className="text-[#588094] block text-[11px]">Current Registered Odometer</span>
            <span className="font-bold text-sm text-[#0A4B6E]">
              {currentOdo.toLocaleString()} KM
            </span>
          </div>
          <div>
            <span className="text-[#588094] block text-[11px]">Last PM Service Odometer</span>
            <span className="font-bold text-sm text-[#0A4B6E]">
              {lastPmOdo.toLocaleString()} KM
            </span>
          </div>
        </div>

        {/* NEW ODOMETER READING INPUT */}
        <div>
          <Input
            label="Return Odometer Reading (KM)"
            type="number"
            name="odometerReading"
            value={odometerReading}
            onChange={(e) => {
              const val = e.target.value;
              setOdometerReading(val === "" ? "" : val);
              setErrorMsg("");
            }}
            placeholder={`Enter reading (>= ${currentOdo.toLocaleString()} KM)`}
            required
            autoFocus
          />
          <span className="text-[11px] text-[#588094] mt-1 block">
            Logged upon plant check-in by Logistics Supervisor.
          </span>
        </div>

        {/* MONOTONIC VALIDATION VIOLATION ALERT */}
        {odometerReading !== "" && newOdoNum !== null && !isMonotonicValid && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-xs flex items-start gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold">Monotonic Integrity Violation</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed">
                New odometer reading ({newOdoNum.toLocaleString()} KM) cannot be lower than the current registered odometer ({currentOdo.toLocaleString()} KM). Odometer readings must strictly increase.
              </p>
            </div>
          </div>
        )}

        {/* VALID CALCULATION & PM PREVIEW */}
        {isMonotonicValid && (
          <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#2E7D32] font-bold">
                <CheckCircle2 size={16} />
                <span>Trip Usage Calculation</span>
              </div>
              <Badge variant="success" className="px-2.5 py-0.5 text-[10.5px]">
                +{diffTrip.toLocaleString()} KM This Trip
              </Badge>
            </div>

            <div className="flex items-center justify-between text-[#1B5E20] pt-1 text-[11.5px]">
              <span>Distance toward 5,000-km PM:</span>
              <span className="font-bold">
                {newDistanceSincePm.toLocaleString()} / 5,000 KM ({Math.min(100, Math.round((newDistanceSincePm / 5000) * 100))}%)
              </span>
            </div>

            {willBePmDue ? (
              <div className="bg-red-100/80 text-red-800 border border-red-300 rounded-lg p-2 text-[11px] flex items-center gap-2 mt-1">
                <AlertTriangle size={14} className="shrink-0 text-red-700" />
                <span>
                  <strong>Preventive Maintenance Due!</strong> This reading reaches or exceeds the 5,000-km threshold.
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-[#2E7D32]">
                {Math.max(0, 5000 - newDistanceSincePm).toLocaleString()} KM remaining before next scheduled PM service.
              </div>
            )}
          </div>
        )}

        {/* SOURCE SELECTION */}
        <div>
          <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
            Check-In Source
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
          >
            <option value="POST_DISPATCH_RETURN">Post-Dispatch Yard Return</option>
            <option value="MAINTENANCE_SERVICE">Maintenance Service Inspection</option>
            <option value="SUPERVISOR_CALIBRATION">Manual Supervisor Verification</option>
          </select>
        </div>

        {/* SUPERVISOR NOTES */}
        <div>
          <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
            Supervisor Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. End of shift return check-in, smooth run, no issues"
            className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}

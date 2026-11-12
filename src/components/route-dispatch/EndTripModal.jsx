// src/components/route-dispatch/EndTripModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Gauge,
  Clock,
  Truck,
  User,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
} from "lucide-react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import { formatPhilippineTime, getPhilippineTodayString } from "../../utils/date.js";

const MAX_ODOMETER = 999999;
const PM_INTERVAL_KM = 5000;

/**
 * EndTripModal — Yard gate return & return odometer check-in modal.
 * 
 * Conforms to API contract `POST /api/trips/:id/end`.
 * Captures mandatory return odometer, validates monotonic increase,
 * evaluates fleet PM baseline, and transitions trip to RETURNED.
 */
export default function EndTripModal({
  isOpen,
  onClose,
  trip,
  onEndTrip,
}) {
  const [odometerReading, setOdometerReading] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const departureOdo = Number(
    trip?.departureOdometer ?? trip?.truck_current_odometer ?? trip?.odometer ?? 0
  );
  const lastPmOdo = Number(trip?.truckLastPmOdometer ?? trip?.lastPmOdometer ?? 0);

  // Initialize inputs when modal opens or trip changes
  useEffect(() => {
    if (isOpen && trip) {
      setOdometerReading("");
      setReturnNotes("");
      setErrorMsg("");
      setIsSubmitting(false);
    }
  }, [isOpen, trip]);

  // Real-time calculation of trip delta and PM threshold
  const {
    newOdoNum,
    distanceDriven,
    isMonotonicValid,
    isCeilingValid,
    isPmDueSoon,
    isPmOverdue,
    remainingUntilPm,
  } = useMemo(() => {
    if (odometerReading === "" || odometerReading === undefined) {
      return {
        newOdoNum: null,
        distanceDriven: 0,
        isMonotonicValid: false,
        isCeilingValid: true,
        isPmDueSoon: false,
        isPmOverdue: false,
        remainingUntilPm: null,
      };
    }

    const val = Number(odometerReading);
    if (isNaN(val) || val < 0) {
      return {
        newOdoNum: val,
        distanceDriven: 0,
        isMonotonicValid: false,
        isCeilingValid: true,
        isPmDueSoon: false,
        isPmOverdue: false,
        remainingUntilPm: null,
      };
    }

    const monotonic = val >= departureOdo;
    const ceiling = val <= MAX_ODOMETER;
    const diff = monotonic ? val - departureOdo : 0;
    const sincePm = Math.max(0, val - lastPmOdo);
    const pmOverdue = sincePm >= PM_INTERVAL_KM;
    const pmDueSoon = !pmOverdue && PM_INTERVAL_KM - sincePm <= 200;
    const remaining = Math.max(0, PM_INTERVAL_KM - sincePm);

    return {
      newOdoNum: val,
      distanceDriven: diff,
      isMonotonicValid: monotonic,
      isCeilingValid: ceiling,
      isPmDueSoon: pmDueSoon,
      isPmOverdue: pmOverdue,
      remainingUntilPm: remaining,
    };
  }, [odometerReading, departureOdo, lastPmOdo]);

  if (!isOpen || !trip) return null;

  const departureFormatted = trip.departureTime
    ? formatPhilippineTime(trip.departureTime)
    : "—";

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isMonotonicValid || !isCeilingValid || newOdoNum === null) {
      setErrorMsg(`Return odometer must be greater than or equal to departure reading (${departureOdo.toLocaleString()} km).`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");

      const payload = {
        currentOdometer: Math.floor(newOdoNum),
        notes: returnNotes.trim() || undefined,
        returnTime: new Date().toISOString(),
      };

      await onEndTrip(trip.id, payload);
      onClose();
    } catch (err) {
      console.error("Failed to end trip:", err);
      setErrorMsg(err.message || "Failed to record return odometer and end trip.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="End Trip & Yard Return Check-In"
      subtitle={`${trip.truckPlate} · ${trip.tripNumber || "Delivery Run"}`}
      icon={Gauge}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !isMonotonicValid || !isCeilingValid}
            className="flex items-center gap-1.5"
          >
            <span>{isSubmitting ? "Recording..." : "Confirm Gate Return"}</span>
            <ArrowRight size={14} strokeWidth={2.5} />
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[#C93B32] flex items-center gap-2 font-semibold animate-scale-in">
            <AlertTriangle size={15} className="shrink-0 text-[#C93B32]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Departure Meta Card */}
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#0A4B6E] border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Truck size={14} className="text-[#0A4B6E]" />
              <span>{trip.truckPlate}</span>
              <span className="text-[11px] font-normal text-slate-500">
                ({trip.truckModel || "Delivery Vehicle"})
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#3E5C76] bg-slate-100 px-2 py-0.5 rounded">
              #{trip.tripNumber || "ACTIVE"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Assigned Driver</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <User size={12} className="text-[#3E5C76]" />
                {trip.driverName || "Assigned Driver"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Departure Time</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Clock size={12} className="text-[#3E5C76]" />
                {departureFormatted}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-slate-600 font-medium">Departure Odometer:</span>
            <span className="font-mono font-bold text-[#0A4B6E] text-sm">
              {departureOdo.toLocaleString()} km
            </span>
          </div>
        </div>

        {/* Return Odometer Input */}
        <div>
          <label className="block text-xs font-bold text-[#0A4B6E] mb-1.5">
            Return Odometer Reading (km) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min={departureOdo}
              max={MAX_ODOMETER}
              step="1"
              required
              autoFocus
              value={odometerReading}
              onChange={(e) => setOdometerReading(e.target.value)}
              placeholder={`e.g. ${departureOdo + 45}`}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold text-slate-900 focus:outline-none transition-all ${
                odometerReading !== "" && !isMonotonicValid
                  ? "border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-200"
                  : "border-slate-300 bg-white focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/20"
              }`}
            />
            <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
              KM
            </span>
          </div>

          {/* Real-time distance indicator */}
          {odometerReading !== "" && isMonotonicValid && (
            <div className="mt-2 flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Distance Driven This Trip:</span>
              </span>
              <span className="font-mono font-bold text-emerald-900">
                +{distanceDriven.toLocaleString()} km
              </span>
            </div>
          )}

          {odometerReading !== "" && !isMonotonicValid && (
            <p className="mt-1.5 text-[11px] text-[#C93B32] font-medium flex items-center gap-1">
              <AlertTriangle size={12} className="shrink-0" />
              Reading cannot be lower than departure odometer ({departureOdo.toLocaleString()} km).
            </p>
          )}
        </div>

        {/* Preventive Maintenance (PM) Status Alert */}
        {isPmOverdue && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 text-amber-700 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>5,000-km PM Threshold Exceeded:</strong> This vehicle has reached its preventive maintenance interval. Ending this trip will flag the asset for PM inspection in Fleet Management.
            </div>
          </div>
        )}

        {isPmDueSoon && (
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-2 text-[11px]">
            <Info size={14} className="shrink-0 text-blue-600" />
            <span>Preventive Maintenance due soon ({remainingUntilPm} km remaining).</span>
          </div>
        )}

        {/* Optional Gate Notes */}
        <div>
          <label className="block text-xs font-semibold text-[#0A4B6E] mb-1">
            Gate Arrival Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            placeholder="e.g. Arrived back at Bunawan yard dock safely, no route issues..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/20 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}

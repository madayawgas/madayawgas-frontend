// src/components/route-dispatch/ReturnCheckInModal.jsx
import { useState } from "react";
import { Gauge, X, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ReturnCheckInModal({
  isOpen,
  onClose,
  trip,
  products = [],
  onCompleteReturn,
}) {
  const departureOdo = trip?.departureOdometer || 45000;
  const [returnOdometer, setReturnOdometer] = useState(departureOdo + 120);

  // Return unloads count
  const defaultProdId = products[0]?.id || "e9b21f37-142c-4f76-96f3-a3d8b02e7b91";
  const [filledUnits, setFilledUnits] = useState(20);
  const [emptyGoodUnits, setEmptyGoodUnits] = useState(95);
  const [defectiveUnits, setDefectiveUnits] = useState(5);
  const [supervisorNotes, setSupervisorNotes] = useState("Evening physical return verified at yard gate");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !trip) return null;

  const distanceDriven = Number(returnOdometer) - departureOdo;
  const isOdometerValid = distanceDriven >= 0;

  // 5,000-km PM check calculation
  const remainingUntilPm = 5000 - ((Number(returnOdometer) || 0) % 5000);
  const isPmDueSoon = remainingUntilPm <= 200;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isOdometerValid) {
      setError(`Return odometer must be greater than or equal to departure odometer (${departureOdo.toLocaleString()} km)`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onCompleteReturn(trip.id, {
        returnOdometerKm: Number(returnOdometer),
        supervisorNotes,
        returnLoads: [
          { productId: defaultProdId, condition: "FILLED", quantityUnits: Number(filledUnits) },
          { productId: defaultProdId, condition: "EMPTY_GOOD", quantityUnits: Number(emptyGoodUnits) },
          { productId: defaultProdId, condition: "DEFECTIVE", quantityUnits: Number(defectiveUnits) },
        ],
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to complete return check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#D5E3EC] max-w-lg w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <Gauge size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A4B6E]">Plant Return Yard Check-In</h3>
              <p className="text-[11px] text-[#6D8AA2]">
                Vehicle: <strong className="text-[#0A4B6E]">{trip.truckPlate}</strong> · {trip.truckModel || "Delivery Truck"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-[#D93025] rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Telemetry Odometer */}
          <div className="space-y-2">
            <div className="p-3 bg-[#E8F3F8] rounded-xl border border-[#BCE1F1] flex justify-between items-center">
              <span className="text-[#6D8AA2] font-medium">Departure Odometer:</span>
              <span className="font-bold text-[#0A4B6E] text-sm">{departureOdo.toLocaleString()} km</span>
            </div>

            <div>
              <label className="block font-bold text-[#0A4B6E] mb-1">Return Odometer Reading (km) *</label>
              <input
                type="number"
                value={returnOdometer}
                onChange={(e) => setReturnOdometer(e.target.value)}
                className={`w-full bg-white border rounded-xl p-2.5 text-sm font-bold text-[#0A4B6E] focus:outline-[#0A4B6E] ${
                  !isOdometerValid ? "border-rose-400 bg-rose-50" : "border-[#CBD5E1]"
                }`}
              />

              {isOdometerValid ? (
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Distance driven: +{distanceDriven} km
                  </span>
                  <span className={isPmDueSoon ? "text-amber-600 font-bold" : "text-[#6D8AA2]"}>
                    PM Due in: {remainingUntilPm.toLocaleString()} km
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-[#D93025] font-semibold mt-1">
                  Return odometer must be at least {departureOdo.toLocaleString()} km
                </p>
              )}
            </div>
          </div>

          {/* Physical Return Counts */}
          <div className="space-y-2">
            <label className="block font-bold text-[#0A4B6E]">
              Physical Return Unload Counts (to Bunawan Yard)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                <span className="text-[11px] font-bold text-slate-700 block mb-1">Filled Unsold</span>
                <input
                  type="number"
                  min="0"
                  value={filledUnits}
                  onChange={(e) => setFilledUnits(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-bold text-center text-[#0A4B6E]"
                />
              </div>

              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                <span className="text-[11px] font-bold text-slate-700 block mb-1">Empty Good</span>
                <input
                  type="number"
                  min="0"
                  value={emptyGoodUnits}
                  onChange={(e) => setEmptyGoodUnits(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-bold text-center text-emerald-800"
                />
              </div>

              <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-200">
                <span className="text-[11px] font-bold text-rose-800 block mb-1">Defective Leakers</span>
                <input
                  type="number"
                  min="0"
                  value={defectiveUnits}
                  onChange={(e) => setDefectiveUnits(e.target.value)}
                  className="w-full bg-white border border-rose-300 rounded-lg p-1.5 text-xs font-bold text-center text-rose-700"
                />
              </div>
            </div>
          </div>

          {/* Supervisor Notes */}
          <div>
            <label className="block font-bold text-[#0A4B6E] mb-1">Yard Gate Check-In Notes</label>
            <input
              type="text"
              value={supervisorNotes}
              onChange={(e) => setSupervisorNotes(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs focus:outline-[#0A4B6E]"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isOdometerValid}
              className="px-5 py-2 rounded-full text-xs font-bold bg-[#0A4B6E] text-white hover:bg-[#0E384E] cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Completing..." : "Complete Return Check-In ➔"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

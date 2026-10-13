// src/components/route-dispatch/CancelTripModal.jsx
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { AlertOctagon, X, Truck, Gauge, RotateCcw, AlertTriangle } from "lucide-react";
import { formatPhilippineTime } from "../../utils/date.js";
import { isCanisterProduct, getCanisterCrates } from "../../utils/product.js";

const COMMON_REASONS = [
  "Mechanical Breakdown",
  "Inclement Weather / Flood",
  "Driver Emergency",
  "Road Obstruction / Accident",
  "Route Re-dispatch",
];

export default function CancelTripModal({
  isOpen,
  onClose,
  trip,
  products = [],
  onCancelTrip,
}) {
  const [reason, setReason] = useState("");
  const [returnOdometer, setReturnOdometer] = useState("");
  const [returnCounts, setReturnCounts] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Extract products currently loaded on the trip
  const onBoardProducts = useMemo(() => {
    if (!trip) return [];
    const loads = trip.loads || [];
    const loadItems = loads.flatMap((l) => l.items || []);

    // Sum loaded full minus any unloaded full
    const unitMap = new Map();
    loadItems.forEach((it) => {
      const pId = it.productId;
      if (!pId) return;
      const q = Number(it.quantityUnits) || 0;
      const current = unitMap.get(pId) || 0;
      if (it.condition === "FILLED" || !it.condition) {
        unitMap.set(pId, current + q);
      }
    });

    const result = [];
    unitMap.forEach((loadedUnits, pId) => {
      const prod = products.find((p) => p.id === pId) || {
        id: pId,
        name: loadItems.find((i) => i.productId === pId)?.productName || "LPG Product",
      };
      result.push({
        productId: pId,
        product: prod,
        loadedUnits: Math.max(0, loadedUnits),
      });
    });

    // If no explicit loads found, fallback to registered products
    if (result.length === 0 && products.length > 0) {
      result.push({
        productId: products[0].id,
        product: products[0],
        loadedUnits: 100,
      });
    }

    return result;
  }, [trip, products]);

  // Reset form when modal opens with a new trip
  useEffect(() => {
    if (trip && isOpen) {
      const depOdo = Number(trip.departureOdometer) || 45000;
      setReason("");
      setError(null);
      setReturnOdometer(trip.returnOdometer ? String(trip.returnOdometer) : String(depOdo + 15));

      // Default return intake: 100% of on-board loaded cargo returns as FILLED
      const initialCounts = {};
      onBoardProducts.forEach((item) => {
        initialCounts[item.productId] = {
          returnedFull: item.loadedUnits,
          returnedEmptyGood: 0,
          returnedDefective: 0,
        };
      });
      setReturnCounts(initialCounts);
    }
  }, [trip, isOpen, onBoardProducts]);

  if (!isOpen || !trip) return null;

  const departureOdometer = Number(trip.departureOdometer) || 45000;
  const parsedReturnOdo = Number(returnOdometer) || 0;
  const distanceDriven = Math.max(0, parsedReturnOdo - departureOdometer);
  const isOdometerValid = parsedReturnOdo >= departureOdometer;

  const handleReturnAllAsFull = () => {
    const updated = {};
    onBoardProducts.forEach((item) => {
      updated[item.productId] = {
        returnedFull: item.loadedUnits,
        returnedEmptyGood: 0,
        returnedDefective: 0,
      };
    });
    setReturnCounts(updated);
  };

  const handleCountChange = (productId, field, value) => {
    const parsed = value === "" ? 0 : Math.max(0, parseInt(value, 10) || 0);
    setReturnCounts((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [field]: parsed,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError("Please specify a reason for cancelling this trip.");
      return;
    }

    if (!isOdometerValid) {
      setError(
        `Return odometer (${parsedReturnOdo.toLocaleString()} km) cannot be less than departure odometer (${departureOdometer.toLocaleString()} km).`
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const returnLoads = [];
      Object.entries(returnCounts).forEach(([productId, counts]) => {
        const full = Number(counts.returnedFull) || 0;
        const empty = Number(counts.returnedEmptyGood) || 0;
        const def = Number(counts.returnedDefective) || 0;

        if (full > 0) {
          returnLoads.push({ productId, condition: "FILLED", quantityUnits: full });
        }
        if (empty > 0) {
          returnLoads.push({ productId, condition: "EMPTY_GOOD", quantityUnits: empty });
        }
        if (def > 0) {
          returnLoads.push({ productId, condition: "DEFECTIVE", quantityUnits: def });
        }
      });

      await onCancelTrip(trip.id, {
        reason: reason.trim(),
        returnOdometerKm: parsedReturnOdo,
        returnLoads,
      });

      onClose();
    } catch (err) {
      setError(err.message || "Failed to cancel trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl border border-rose-200 max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar animate-scale-in text-left">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold shrink-0">
              <AlertOctagon size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0A4B6E]">Abort & Cancel Active Trip</h3>
              <p className="text-xs text-[#6D8AA2]">
                Aborts delivery run mid-way and checks returned stock back into Bunawan yard.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer transition"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium p-3 rounded-xl flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Trip Metadata Card */}
        <div className="bg-[#F8FAFC] border border-[#CBD5E1]/60 rounded-xl p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-[#0A4B6E]">
              <Truck size={14} />
              <span>{trip.truckPlate}</span>
              <span className="text-slate-500 font-normal">({trip.truckModel})</span>
            </div>
            <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200">
              Zone: {trip.zoneCode || trip.zoneName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-200/60">
            <div>
              <span className="text-[#6D8AA2]">Crew: </span>
              <strong>{trip.driverName}</strong> · {trip.salesName}
            </div>
            <div className="text-right">
              <span className="text-[#6D8AA2]">Departed: </span>
              <strong>{trip.departureTime ? formatPhilippineTime(trip.departureTime) : "Today"}</strong>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason for Cancellation */}
          <div>
            <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
              Cancellation Reason <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Engine breakdown along Lanang highway"
              className="w-full bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10 outline-none transition"
            />

            {/* Quick Reason Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {COMMON_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                    reason === r
                      ? "bg-rose-50 border-rose-300 text-rose-700 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Return Odometer Reading */}
          <div className="bg-[#F8FAFC] border border-[#CBD5E1]/60 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0A4B6E] uppercase tracking-wider flex items-center gap-1.5">
                <Gauge size={14} />
                <span>Return Odometer (KM) <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[11px] text-[#6D8AA2]">
                Departure: <strong>{departureOdometer.toLocaleString()} km</strong>
              </span>
            </div>

            <input
              type="number"
              required
              min={departureOdometer}
              value={returnOdometer}
              onChange={(e) => setReturnOdometer(e.target.value)}
              placeholder={String(departureOdometer)}
              className="w-full bg-white text-slate-800 text-sm font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10 outline-none transition"
            />

            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200">
              <span className="text-[#6D8AA2]">Trip Mileage Logged:</span>
              <span className={`font-bold ${isOdometerValid ? "text-emerald-700" : "text-rose-600"}`}>
                +{distanceDriven.toLocaleString()} km driven
              </span>
            </div>
          </div>

          {/* Physical Return Cargo Intake */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#0A4B6E] uppercase tracking-wider">
                  Yard Return Cargo Intake
                </h4>
                <p className="text-[11px] text-[#6D8AA2]">
                  Specify physical units unloaded back into Bunawan yard bulk stock.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReturnAllAsFull}
                className="text-[11px] text-[#0A4B6E] font-bold hover:underline cursor-pointer flex items-center gap-1"
                title="Reset to 100% on-board units returning as full"
              >
                <RotateCcw size={11} />
                <span>Return All as Full</span>
              </button>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {onBoardProducts.map(({ productId, product, loadedUnits }) => {
                const counts = returnCounts[productId] || {
                  returnedFull: loadedUnits,
                  returnedEmptyGood: 0,
                  returnedDefective: 0,
                };

                const isCanister = isCanisterProduct(product);
                const { crates: fullCrates } = isCanister ? getCanisterCrates(counts.returnedFull) : { crates: null };

                return (
                  <div
                    key={productId}
                    className="p-3 bg-[#F8FAFC] border border-[#CBD5E1]/60 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-[#0A4B6E]">
                      <span>{product?.name || "Product SKU"}</span>
                      <span className="text-[11px] text-[#6D8AA2] font-semibold">
                        Loaded on truck: <strong>{loadedUnits} units</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wide mb-1">
                          Full (Unsold)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={counts.returnedFull}
                          onChange={(e) => handleCountChange(productId, "returnedFull", e.target.value)}
                          className="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-emerald-600 outline-none text-center font-bold"
                        />
                        {isCanister && (
                          <span className="text-[9px] text-[#6D8AA2] block text-center mt-0.5">
                            ({fullCrates} crates)
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#0A4B6E] uppercase tracking-wide mb-1">
                          Empty Good
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={counts.returnedEmptyGood}
                          onChange={(e) => handleCountChange(productId, "returnedEmptyGood", e.target.value)}
                          className="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-[#0A4B6E] outline-none text-center font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-rose-800 uppercase tracking-wide mb-1">
                          Defective
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={counts.returnedDefective}
                          onChange={(e) => handleCountChange(productId, "returnedDefective", e.target.value)}
                          className="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-rose-600 outline-none text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-full text-xs font-bold transition cursor-pointer"
            >
              Keep Trip Active
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !isOdometerValid || !reason.trim()}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <AlertOctagon size={13} />
              <span>{isSubmitting ? "Cancelling..." : "Confirm Trip Cancellation"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

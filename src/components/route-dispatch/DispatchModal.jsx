// src/components/route-dispatch/DispatchModal.jsx
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Truck,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  User,
  MapPin,
} from "lucide-react";
import { isCanisterProduct } from "../../utils/product.js";
import {
  getPhilippineTodayString,
  toPhilippineDateInputString,
  formatPhilippineDate,
} from "../../utils/date.js";

/**
 * Simplified, Clean Truck Dispatch Modal for MadayawGas
 * Streamlined single-view departure staging:
 * 1. Clean vehicle & driver summary with 1-click reassignment if off-duty
 * 2. Uncluttered cargo loadout entries with automatic 24-canister crate math
 * 3. Single prominent "Confirm Dispatch" action
 */
export default function DispatchModal({
  isOpen,
  onClose,
  onDispatch,
  schedules = [],
  vehicles = [],
  drivers = [],
  activeDutyDriverIds = new Set(),
  zones = [],
  products = [],
  salesUsers = [],
  plantInventory = [],
  initialScheduleId = "",
}) {
  const [isAdHoc, setIsAdHoc] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState(initialScheduleId || "");

  // Reset or synchronize initial schedule
  useEffect(() => {
    if (initialScheduleId) {
      setSelectedScheduleId(initialScheduleId);
      setIsAdHoc(false);
    }
  }, [initialScheduleId, isOpen]);

  // Reset error whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  // Ad-hoc run fields
  const [truckId, setTruckId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [salesUserId, setSalesUserId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [notes, setNotes] = useState("");

  // Initial load items with canister vs cylinder awareness
  const [loadItems, setLoadItems] = useState(() => {
    const defaultProd = products[0];
    const isCan = isCanisterProduct(defaultProd);
    return [
      {
        productId: defaultProd?.id || "",
        condition: "FILLED",
        quantityUnits: isCan ? 120 : 25,
      },
    ];
  });

  // Ensure load items synchronize once products resolve
  useEffect(() => {
    if (products.length > 0) {
      setLoadItems((prev) => {
        const hasMissing = prev.some((it) => !it.productId);
        if (hasMissing) {
          const firstProd = products[0];
          const isCan = isCanisterProduct(firstProd);
          return [
            {
              productId: firstProd.id,
              condition: "FILLED",
              quantityUnits: isCan ? 120 : 25,
            },
          ];
        }
        return prev;
      });
    }
  }, [products, isOpen]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const todayPht = getPhilippineTodayString();

  // Scheduled routes ready to dispatch today
  const scheduledOptions = useMemo(() => {
    return schedules.filter((s) => {
      const isScheduled = (s.status || "").toUpperCase() === "SCHEDULED";
      const schedDate = toPhilippineDateInputString(s.scheduledDate);
      const isToday = schedDate === todayPht;
      const isPreselected = initialScheduleId && s.id === initialScheduleId;
      const isAllowed = s.gating ? s.gating.canDispatch : true;
      return isScheduled && (isToday || isPreselected) && isAllowed;
    });
  }, [schedules, todayPht, initialScheduleId]);

  // Auto-select schedule if preselected or only one is available
  useEffect(() => {
    if (!isAdHoc && scheduledOptions.length > 0) {
      if (initialScheduleId && scheduledOptions.some((s) => s.id === initialScheduleId)) {
        setSelectedScheduleId(initialScheduleId);
      } else if (!selectedScheduleId && scheduledOptions.length === 1) {
        setSelectedScheduleId(scheduledOptions[0].id);
      }
    }
  }, [scheduledOptions, isAdHoc, initialScheduleId, selectedScheduleId]);

  const isDriverOnDuty = (id) => {
    if (!id || !activeDutyDriverIds) return false;
    return activeDutyDriverIds instanceof Set
      ? activeDutyDriverIds.has(id)
      : Array.isArray(activeDutyDriverIds)
      ? activeDutyDriverIds.includes(id)
      : false;
  };

  const selectedSchedule = useMemo(() => {
    if (isAdHoc) return null;
    return scheduledOptions.find((s) => s.id === selectedScheduleId) || null;
  }, [isAdHoc, scheduledOptions, selectedScheduleId]);

  const currentTruck = useMemo(() => {
    if (isAdHoc) {
      return vehicles.find((v) => v.id === truckId) || null;
    }
    if (selectedSchedule) {
      return vehicles.find((v) => v.id === selectedSchedule.truckId) || null;
    }
    return null;
  }, [isAdHoc, truckId, selectedSchedule, vehicles]);

  const resolvedDriverId = useMemo(() => {
    if (isAdHoc) {
      return driverId || currentTruck?.driverId || null;
    }
    return driverId || selectedSchedule?.driverId || selectedSchedule?.truckDriverId || currentTruck?.driverId || null;
  }, [isAdHoc, driverId, currentTruck, selectedSchedule]);

  const resolvedDriver = useMemo(() => {
    if (!resolvedDriverId) return null;
    return drivers.find((d) => d.id === resolvedDriverId || d.userId === resolvedDriverId) || null;
  }, [resolvedDriverId, drivers]);

  const isResolvedDriverOnDuty = Boolean(resolvedDriverId && isDriverOnDuty(resolvedDriverId));
  const isResolvedDriverOffDuty = Boolean(resolvedDriverId && !isResolvedDriverOnDuty);

  const handleAddItem = () => {
    const defaultProd = products[0];
    if (!defaultProd) return;
    const isCan = isCanisterProduct(defaultProd);
    setLoadItems((prev) => [
      ...prev,
      {
        productId: defaultProd.id,
        condition: "FILLED",
        quantityUnits: isCan ? 48 : 20,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setLoadItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setLoadItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);

      const validLoads = loadItems.filter((item) => Number(item.quantityUnits) > 0);
      if (validLoads.length === 0) {
        throw new Error("Please specify at least one product with quantity > 0");
      }

      let payload = {};
      if (!isAdHoc) {
        if (!selectedScheduleId) {
          throw new Error("Please select a scheduled route");
        }
        const sched = selectedSchedule;
        if (!sched) throw new Error("Selected route is no longer available");

        const selTruck = vehicles.find((v) => v.id === sched.truckId);
        const selDriver = resolvedDriver;

        if (!resolvedDriverId) {
          throw new Error("A driver must be assigned to dispatch this vehicle");
        }

        if (!isResolvedDriverOnDuty) {
          const dName = selDriver?.fullName || selDriver?.username || "Assigned Driver";
          throw new Error(
            `Driver '${dName}' has not clocked in yet. Please reassign to an on-duty driver.`
          );
        }

        payload = {
          scheduleId: sched.isTemplateDerived ? null : sched.id,
          truckId: sched.truckId,
          truckPlate: sched.truckPlate,
          truckModel: sched.truckModel,
          driverId: resolvedDriverId,
          driverName: selDriver
            ? selDriver.fullName || `${selDriver.firstName || ""} ${selDriver.lastName || ""}`.trim() || selDriver.username
            : sched.driverName || "Juan Driver",
          salesUserId: sched.salesUserId,
          salesName: sched.salesName,
          zoneId: sched.zoneId,
          zoneCode: sched.zoneCode,
          notes,
          initialLoads: validLoads.map((item) => ({
            productId: item.productId,
            condition: item.condition,
            quantityUnits: Number(item.quantityUnits),
          })),
        };
      } else {
        if (!truckId) throw new Error("Please select a vehicle");
        if (!zoneId) throw new Error("Please select a service zone");
        if (!salesUserId) throw new Error("Please select an assigned sales personnel");
        if (!resolvedDriverId) throw new Error("Please select a driver");
        if (!isResolvedDriverOnDuty) {
          const dName = resolvedDriver?.fullName || resolvedDriver?.username || "Driver";
          throw new Error(`Driver '${dName}' has not clocked in yet. Please select an on-duty driver.`);
        }

        const selTruck = vehicles.find((v) => v.id === truckId);
        const selDriver = resolvedDriver;
        const selSales = salesUsers.find((u) => u.id === salesUserId);
        const selZone = zones.find((z) => z.id === zoneId);

        payload = {
          truckId,
          truckPlate: selTruck?.plateNumber,
          truckModel: selTruck?.model,
          driverId: resolvedDriverId,
          driverName: selDriver
            ? selDriver.fullName || `${selDriver.firstName || ""} ${selDriver.lastName || ""}`.trim() || selDriver.username
            : "Juan Driver",
          salesUserId,
          salesName: selSales
            ? selSales.fullName || `${selSales.firstName || ""} ${selSales.lastName || ""}`.trim() || selSales.username
            : "Sales Person",
          zoneId,
          zoneCode: selZone?.code,
          notes,
          initialLoads: validLoads.map((item) => ({
            productId: item.productId,
            condition: item.condition,
            quantityUnits: Number(item.quantityUnits),
          })),
        };
      }

      await onDispatch(payload);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to dispatch truck");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modalNode = (
    <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in text-left">
        {/* Header: Clean & Pleasant with Truck Icon */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            {/* The nice Truck icon preserved */}
            <div className="w-9 h-9 rounded-full bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Truck size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A4B6E]">Dispatch Truck</h3>
              <p className="text-[11px] text-[#3E5C76]">Assign cargo loads and confirm vehicle departure</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-[#D93025] rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switch (Only show if not preselected) */}
          {!initialScheduleId && (
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-[#0A4B6E]">Dispatch Type:</span>
              <div className="inline-flex p-0.5 bg-[#EDF3F7] rounded-full border border-[#D5E3EC]">
                <button
                  type="button"
                  onClick={() => setIsAdHoc(false)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    !isAdHoc ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs" : "text-[#3E5C76] hover:text-[#0A4B6E]"
                  }`}
                >
                  Scheduled Route
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdHoc(true)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isAdHoc ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs" : "text-[#3E5C76] hover:text-[#0A4B6E]"
                  }`}
                >
                  Ad-Hoc Run
                </button>
              </div>
            </div>
          )}

          {/* Vehicle & Route Section */}
          {!isAdHoc ? (
            <div className="space-y-3">
              {/* If no initialScheduleId, let user pick from schedule dropdown */}
              {!initialScheduleId && (
                <div>
                  <label className="block font-bold text-[#0A4B6E] mb-1">
                    Select Scheduled Route <span className="text-rose-600">*</span>
                  </label>
                  {scheduledOptions.length > 0 ? (
                    <select
                      value={selectedScheduleId}
                      onChange={(e) => setSelectedScheduleId(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] font-medium focus:outline-[#0A4B6E]"
                    >
                      <option value="">Select a schedule...</option>
                      {scheduledOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.truckPlate} ({s.truckModel}) — {s.zoneCode || "Zone"} · Driver: {s.driverName || "Driver"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                      No scheduled routes awaiting dispatch today. Switch to Ad-Hoc Run.
                    </div>
                  )}
                </div>
              )}

              {/* Vehicle & Crew Summary Card */}
              {selectedSchedule && (
                <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck size={15} className="text-[#0A4B6E]" />
                      <strong className="text-sm font-bold text-[#0A4B6E]">
                        {selectedSchedule.truckPlate}
                      </strong>
                      <span className="text-[11px] text-[#3E5C76]">({selectedSchedule.truckModel})</span>
                    </div>

                    <span className="text-[11px] font-semibold text-[#0A4B6E] bg-white border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <MapPin size={10} className="text-[#0A4B6E]" />
                      <span>{selectedSchedule.zoneCode} — {selectedSchedule.zoneName || "Zone"}</span>
                    </span>
                  </div>

                  {/* Driver Row with Duty Status */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5">
                      <User size={13} className="text-[#3E5C76]" />
                      <span className="text-[#3E5C76]">Driver:</span>
                      <strong className="text-slate-800">
                        {resolvedDriver?.fullName || selectedSchedule.driverName || "Juan Driver"}
                      </strong>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isResolvedDriverOnDuty
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-900 border border-amber-300"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isResolvedDriverOnDuty ? "bg-emerald-600" : "bg-amber-600"
                        }`}
                      />
                      <span>{isResolvedDriverOnDuty ? "Clocked In" : "Off Duty"}</span>
                    </span>
                  </div>

                  {/* If driver is off-duty, offer simple 1-click substitute selector */}
                  {isResolvedDriverOffDuty && (
                    <div className="pt-2 border-t border-amber-200/80 space-y-1">
                      <label className="block text-[11px] font-bold text-amber-900">
                        Driver is not clocked in yet. Reassign on-duty driver:
                      </label>
                      <select
                        value={driverId}
                        onChange={(e) => setDriverId(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-[#0A4B6E]"
                      >
                        <option value="">Select replacement driver...</option>
                        {drivers.map((d) => {
                          const onDuty = isDriverOnDuty(d.id);
                          return (
                            <option key={d.id} value={d.id}>
                              {d.fullName || `${d.firstName || ""} ${d.lastName || ""}`.trim() || d.username} {onDuty ? "• (On Duty)" : "• (Off Duty)"}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Ad-Hoc Run Form */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#0A4B6E] mb-1">
                  Vehicle <span className="text-rose-600">*</span>
                </label>
                <select
                  value={truckId}
                  onChange={(e) => setTruckId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2 text-xs text-[#0A4B6E] focus:outline-[#0A4B6E]"
                  required
                >
                  <option value="">Select truck...</option>
                  {vehicles
                    .filter((v) => {
                      const status = (v.status || v.operationalStatus || "ACTIVE").toUpperCase();
                      return status === "ACTIVE" && v.allowDispatch !== false && v.isGrounded !== true;
                    })
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plateNumber} ({v.model})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0A4B6E] mb-1">
                  Zone <span className="text-rose-600">*</span>
                </label>
                <select
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2 text-xs text-[#0A4B6E] focus:outline-[#0A4B6E]"
                  required
                >
                  <option value="">Select zone...</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.code} — {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0A4B6E] mb-1">
                  Driver <span className="text-rose-600">*</span>
                </label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2 text-xs text-[#0A4B6E] focus:outline-[#0A4B6E]"
                  required
                >
                  <option value="">Select driver...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName || d.username} {isDriverOnDuty(d.id) ? "• (On Duty)" : "• (Off Duty)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0A4B6E] mb-1">
                  Sales Person <span className="text-rose-600">*</span>
                </label>
                <select
                  value={salesUserId}
                  onChange={(e) => setSalesUserId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2 text-xs text-[#0A4B6E] focus:outline-[#0A4B6E]"
                  required
                >
                  <option value="">Select sales...</option>
                  {salesUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Cargo Staging Section (Clean, Uncluttered) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#0A4B6E] text-xs">
                Cargo to Load (Initial Departure)
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[#0A4B6E] hover:text-[#0E384E] font-bold text-[11px] flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-full transition-colors"
              >
                <Plus size={13} strokeWidth={2.5} /> Add Item
              </button>
            </div>

            <div className="space-y-2">
              {loadItems.map((item, idx) => {
                const selectedProd = products.find((p) => p.id === item.productId) || products[0];
                const isCan = isCanisterProduct(selectedProd);
                const qty = Number(item.quantityUnits) || 0;
                const crates = Math.floor(qty / 24);

                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-[#F8FAFC] p-2 rounded-xl border border-slate-200"
                  >
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                      aria-label={`Product item ${idx + 1}`}
                      className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-xs text-[#0A4B6E] font-semibold"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.containerType})
                        </option>
                      ))}
                    </select>

                    <div className="w-24 shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={item.quantityUnits}
                        onChange={(e) => handleItemChange(idx, "quantityUnits", e.target.value)}
                        placeholder="Units"
                        aria-label={`Quantity units ${idx + 1}`}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-center text-[#0A4B6E]"
                      />
                    </div>

                    <div className="w-18 text-right text-[11px] text-[#3E5C76] font-semibold shrink-0">
                      {isCan && crates > 0 ? `${crates} crates` : ""}
                    </div>

                    {loadItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        aria-label="Remove item"
                        className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-[11px] font-bold text-[#0A4B6E] mb-1">
              Departure Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Regular residential deliveries"
              className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl p-2 text-xs text-slate-800 focus:outline-[#0A4B6E]"
            />
          </div>

          {/* Sticky Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!isAdHoc && isResolvedDriverOffDuty)}
              className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] transition-all cursor-pointer shadow-2xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isSubmitting ? "Dispatching..." : "Confirm Dispatch ➔"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

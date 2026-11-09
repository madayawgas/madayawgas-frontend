// src/components/route-dispatch/DispatchModal.jsx
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Truck,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Check,
  ArrowRight,
  User,
  UserCheck,
  MapPin,
} from "lucide-react";
import { isCanisterProduct } from "../../utils/product.js";
import {
  getPhilippineTodayString,
  toPhilippineDateInputString,
  formatPhilippineDate,
} from "../../utils/date.js";

/**
 * Enterprise Truck Dispatch Modal for MadayawGas
 * Features:
 * - Real-time Bunawan warehouse stock availability validation
 * - Dynamic remaining stock countdown as dispatcher types
 * - 1-click quick-fill action chips (Max available, +1 Crate)
 * - Zero Unicode emojis (clean Lucide vector icons only)
 * - Standardized Accent Yellow (#FFDF2C) primary action button
 */
export default function DispatchModal({
  isOpen,
  onClose,
  onDispatch,
  schedules = [],
  allSchedules = [],
  trips = [],
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

  // Ad-hoc run & personnel selection fields
  const [truckId, setTruckId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [salesUserId, setSalesUserId] = useState("");
  const [isChangingSalesUser, setIsChangingSalesUser] = useState(false);
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

  // Synchronize salesUserId whenever selected schedule changes
  useEffect(() => {
    if (!isAdHoc && selectedSchedule) {
      setSalesUserId(selectedSchedule.salesUserId || "");
      setIsChangingSalesUser(false);
    }
  }, [selectedScheduleId, selectedSchedule, isAdHoc]);

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

  const resolvedSalesUserId = useMemo(() => {
    if (isAdHoc) return salesUserId || null;
    return salesUserId || selectedSchedule?.salesUserId || null;
  }, [isAdHoc, salesUserId, selectedSchedule]);

  const resolvedSalesPerson = useMemo(() => {
    if (!resolvedSalesUserId) return null;
    return salesUsers.find((u) => u.id === resolvedSalesUserId) || null;
  }, [resolvedSalesUserId, salesUsers]);

  const resolvedSalesPersonName = useMemo(() => {
    if (resolvedSalesPerson) {
      return (
        resolvedSalesPerson.fullName ||
        `${resolvedSalesPerson.firstName || ""} ${resolvedSalesPerson.lastName || ""}`.trim() ||
        resolvedSalesPerson.username
      );
    }
    if (!isAdHoc && selectedSchedule?.salesName) {
      return selectedSchedule.salesName;
    }
    return null;
  }, [resolvedSalesPerson, isAdHoc, selectedSchedule]);

  // Combined schedules pool for cross-referencing assignments today
  const totalSchedules = allSchedules.length > 0 ? allSchedules : schedules;

  // Map of active ongoing trips by sales user ID (status === IN_PROGRESS)
  const activeTripBySalesUserId = useMemo(() => {
    const map = new Map();
    trips.forEach((t) => {
      if ((t.status || "").toUpperCase() === "IN_PROGRESS") {
        const uid = t.salesUserId || t.sales_user_id;
        if (uid) map.set(uid, t);
      }
    });
    return map;
  }, [trips]);

  // Map of other today's schedules by assigned sales user ID
  const assignedOtherScheduleMap = useMemo(() => {
    const map = new Map();
    totalSchedules.forEach((s) => {
      const isSched = (s.status || "").toUpperCase() === "SCHEDULED";
      // Exclude current schedule when in scheduled mode so pre-assigned sales rep can remain selected
      const isOther = isAdHoc ? true : (!selectedScheduleId || s.id !== selectedScheduleId);
      if (isSched && isOther && s.salesUserId) {
        map.set(s.salesUserId, s);
      }
    });
    return map;
  }, [totalSchedules, isAdHoc, selectedScheduleId]);

  const assignedOtherScheduleSalesUserIds = useMemo(() => {
    return new Set(assignedOtherScheduleMap.keys());
  }, [assignedOtherScheduleMap]);

  // Conflict detection for pre-assigned sales representative on the selected schedule
  const preassignedTripConflict = useMemo(() => {
    if (isAdHoc || !selectedSchedule?.salesUserId) return null;
    return activeTripBySalesUserId.get(selectedSchedule.salesUserId) || null;
  }, [isAdHoc, selectedSchedule, activeTripBySalesUserId]);

  const preassignedScheduleConflict = useMemo(() => {
    if (isAdHoc || !selectedSchedule?.salesUserId) return null;
    return assignedOtherScheduleMap.get(selectedSchedule.salesUserId) || null;
  }, [isAdHoc, selectedSchedule, assignedOtherScheduleMap]);

  const isPreassignedSalesUnavailable = Boolean(
    preassignedTripConflict || preassignedScheduleConflict
  );

  // Filtered list of Sales Persons who are genuinely available for dispatch
  const availableSalesUsers = useMemo(() => {
    return salesUsers.filter((u) => {
      // 1. Must be active and not blocked
      if (u.isActive === false || u.isBlocked === true) return false;

      // 2. Must not be on an active trip in progress
      if (activeTripBySalesUserId.has(u.id)) return false;

      // 3. Must not be assigned to another scheduled vehicle today
      if (assignedOtherScheduleSalesUserIds.has(u.id)) return false;

      return true;
    });
  }, [salesUsers, activeTripBySalesUserId, assignedOtherScheduleSalesUserIds]);

  const isSalesUserBusy = Boolean(
    resolvedSalesUserId &&
      (activeTripBySalesUserId.has(resolvedSalesUserId) ||
        assignedOtherScheduleSalesUserIds.has(resolvedSalesUserId))
  );

  // Helper: Computes live stock availability and remaining count for a given item row
  const getProductStockInfo = (productId, currentQuantity = 0, currentIndex = -1) => {
    const stockItem = plantInventory.find(
      (item) => (item.productId || item.product_id) === productId
    );
    const totalInYard = stockItem
      ? Number(stockItem.quantityFilled || stockItem.quantity_filled) || 0
      : null;

    // Sum quantities of other rows with the same productId
    const otherAllocated = loadItems.reduce((acc, it, idx) => {
      if (idx !== currentIndex && it.productId === productId) {
        return acc + (Number(it.quantityUnits) || 0);
      }
      return acc;
    }, 0);

    const availableForThisRow = totalInYard !== null ? Math.max(0, totalInYard - otherAllocated) : null;
    const qty = Number(currentQuantity || 0);
    const remainingInYard = availableForThisRow !== null ? availableForThisRow - qty : null;
    const isExceeded = remainingInYard !== null && remainingInYard < 0;

    return {
      totalInYard,
      availableForThisRow,
      remainingInYard,
      isExceeded,
      cratesInYard: totalInYard !== null ? Math.floor(totalInYard / 24) : 0,
      cratesAvailable: availableForThisRow !== null ? Math.floor(availableForThisRow / 24) : 0,
    };
  };

  // Check if any product row exceeds available warehouse stock
  const hasOverAllocatedItems = useMemo(() => {
    return loadItems.some((item, idx) => {
      const info = getProductStockInfo(item.productId, item.quantityUnits, idx);
      return info.isExceeded;
    });
  }, [loadItems, plantInventory]);

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

  const handleQuickSetQuantity = (index, newQty) => {
    setLoadItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantityUnits: Math.max(1, newQty) };
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

      if (hasOverAllocatedItems) {
        throw new Error("One or more staged products exceed physical warehouse stock");
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

        if (!resolvedSalesUserId) {
          throw new Error("Please select an assigned sales personnel");
        }

        if (activeTripBySalesUserId.has(resolvedSalesUserId)) {
          const trip = activeTripBySalesUserId.get(resolvedSalesUserId);
          throw new Error(
            `Sales representative '${resolvedSalesPersonName}' already has an ongoing trip (#${trip.tripNumber || "active"}) in progress. Please reassign an available sales person.`
          );
        }

        if (assignedOtherScheduleSalesUserIds.has(resolvedSalesUserId)) {
          const oSched = assignedOtherScheduleMap.get(resolvedSalesUserId);
          throw new Error(
            `Sales representative '${resolvedSalesPersonName}' is already assigned to vehicle ${oSched?.truckPlate || "another vehicle"} today. Please select an available sales person.`
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
          salesUserId: resolvedSalesUserId,
          salesName: resolvedSalesPersonName || "Sales Person",
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
        if (!resolvedSalesUserId) throw new Error("Please select an assigned sales personnel");
        if (activeTripBySalesUserId.has(resolvedSalesUserId)) {
          const trip = activeTripBySalesUserId.get(resolvedSalesUserId);
          throw new Error(
            `Sales representative '${resolvedSalesPersonName}' already has an ongoing trip (#${trip.tripNumber || "active"}) in progress. Please select an available sales person.`
          );
        }
        if (assignedOtherScheduleSalesUserIds.has(resolvedSalesUserId)) {
          const oSched = assignedOtherScheduleMap.get(resolvedSalesUserId);
          throw new Error(
            `Sales representative '${resolvedSalesPersonName}' is already assigned to a scheduled vehicle (${oSched?.truckPlate || "today"}). Please select an available sales person.`
          );
        }
        if (!resolvedDriverId) throw new Error("Please select a driver");
        if (!isResolvedDriverOnDuty) {
          const dName = resolvedDriver?.fullName || resolvedDriver?.username || "Driver";
          throw new Error(`Driver '${dName}' has not clocked in yet. Please select an on-duty driver.`);
        }

        const selTruck = vehicles.find((v) => v.id === truckId);
        const selDriver = resolvedDriver;
        const selZone = zones.find((z) => z.id === zoneId);

        payload = {
          truckId,
          truckPlate: selTruck?.plateNumber,
          truckModel: selTruck?.model,
          driverId: resolvedDriverId,
          driverName: selDriver
            ? selDriver.fullName || `${selDriver.firstName || ""} ${selDriver.lastName || ""}`.trim() || selDriver.username
            : "Juan Driver",
          salesUserId: resolvedSalesUserId,
          salesName: resolvedSalesPersonName || "Sales Person",
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
      setError(err.message || "Failed to dispatch vehicle");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isFormBlocked =
    isSubmitting ||
    hasOverAllocatedItems ||
    !resolvedSalesUserId ||
    isSalesUserBusy ||
    (!isAdHoc && isResolvedDriverOffDuty);

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
              <h3 className="text-sm font-bold text-[#0A4B6E]">Dispatch Vehicle</h3>
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
              <AlertCircle size={14} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switch (Only show if not preselected from a row) */}
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
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                      <AlertCircle size={14} className="text-amber-700 shrink-0" />
                      <span>No scheduled routes awaiting dispatch today. Switch to Ad-Hoc Run.</span>
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
                      <label className="block text-[11px] font-bold text-amber-900 flex items-center gap-1">
                        <AlertCircle size={12} className="text-amber-700" />
                        <span>Driver is not clocked in yet. Reassign on-duty driver:</span>
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
                              {d.fullName || `${d.firstName || ""} ${d.lastName || ""}`.trim() || d.username} {onDuty ? "(On Duty)" : "(Off Duty)"}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {/* Sales Person Row & Assignment */}
                  {!resolvedSalesUserId ? (
                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#0A4B6E] flex items-center gap-1.5">
                          <UserCheck size={13} className="text-[#0A4B6E]" />
                          <span>Assign Sales Person <span className="text-rose-600">*</span></span>
                        </label>
                        <span className="text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                          Required for Cabin App
                        </span>
                      </div>
                      <select
                        value={salesUserId}
                        onChange={(e) => setSalesUserId(e.target.value)}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2 text-xs text-slate-800 font-medium focus:outline-[#0A4B6E]"
                        required
                      >
                        <option value="">
                          {availableSalesUsers.length > 0
                            ? "Select sales personnel..."
                            : "No available sales personnel"}
                        </option>
                        {availableSalesUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username}
                          </option>
                        ))}
                      </select>
                      {availableSalesUsers.length === 0 && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-center gap-1.5 mt-1">
                          <AlertCircle size={13} className="text-amber-700 shrink-0" />
                          <span>All sales representatives are currently on active trips or assigned to other scheduled vehicles today.</span>
                        </div>
                      )}
                    </div>
                  ) : !isChangingSalesUser && !isPreassignedSalesUnavailable ? (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={13} className="text-[#3E5C76]" />
                        <span className="text-[#3E5C76]">Sales Person:</span>
                        <strong className="text-slate-800">
                          {resolvedSalesPersonName}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsChangingSalesUser(true)}
                        className="text-[11px] font-semibold text-[#0A4B6E] hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className={`text-[11px] font-bold flex items-center gap-1.5 ${isPreassignedSalesUnavailable ? "text-amber-900" : "text-[#0A4B6E]"}`}>
                          {isPreassignedSalesUnavailable ? (
                            <AlertCircle size={13} className="text-amber-700 shrink-0" />
                          ) : (
                            <UserCheck size={13} className="text-[#0A4B6E]" />
                          )}
                          <span>
                            {preassignedTripConflict
                              ? `Assigned Rep on Active Trip (${preassignedTripConflict.tripNumber || "ongoing"}). Reassign:`
                              : preassignedScheduleConflict
                              ? `Assigned Rep Scheduled on Another Vehicle. Reassign:`
                              : "Reassign Sales Person"}
                          </span>
                        </label>
                        {!isPreassignedSalesUnavailable && (
                          <button
                            type="button"
                            onClick={() => {
                              setSalesUserId(selectedSchedule?.salesUserId || "");
                              setIsChangingSalesUser(false);
                            }}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            Keep Original
                          </button>
                        )}
                      </div>
                      <select
                        value={salesUserId}
                        onChange={(e) => setSalesUserId(e.target.value)}
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2 text-xs text-slate-800 font-medium focus:outline-[#0A4B6E]"
                      >
                        <option value="">
                          {availableSalesUsers.length > 0
                            ? "Select replacement sales personnel..."
                            : "No replacement sales personnel available"}
                        </option>
                        {availableSalesUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username}
                          </option>
                        ))}
                      </select>
                      {availableSalesUsers.length === 0 && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-center gap-1.5 mt-1">
                          <AlertCircle size={13} className="text-amber-700 shrink-0" />
                          <span>All other sales representatives are currently on active trips or assigned to other scheduled vehicles today.</span>
                        </div>
                      )}
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
                  <option value="">Select vehicle...</option>
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
                      {d.fullName || d.username} {isDriverOnDuty(d.id) ? "(On Duty)" : "(Off Duty)"}
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
                  <option value="">
                    {availableSalesUsers.length > 0
                      ? "Select sales..."
                      : "No available sales personnel"}
                  </option>
                  {availableSalesUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username}
                    </option>
                  ))}
                </select>
                {availableSalesUsers.length === 0 && (
                  <p className="text-[10px] text-amber-700 font-medium mt-1">
                    No sales personnel available (all on active trips or scheduled today).
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Cargo Staging Section with Real-Time Stock Availability Counter */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-bold text-[#0A4B6E] text-xs block">
                  Cargo to Load (Initial Departure)
                </label>
                <span className="text-[11px] text-[#3E5C76]">
                  Real-time warehouse verification prevents over-dispatching
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[#0A4B6E] hover:text-[#0E384E] font-bold text-[11px] flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-full transition-colors"
              >
                <Plus size={13} strokeWidth={2.5} /> Add Item
              </button>
            </div>

            <div className="space-y-2.5">
              {loadItems.map((item, idx) => {
                const selectedProd = products.find((p) => p.id === item.productId) || products[0];
                const isCan = isCanisterProduct(selectedProd);
                const qty = Number(item.quantityUnits) || 0;
                const crates = Math.floor(qty / 24);

                const stockInfo = getProductStockInfo(item.productId, item.quantityUnits, idx);
                const { availableForThisRow, remainingInYard, isExceeded, cratesAvailable } = stockInfo;

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border bg-[#F8FAFC] space-y-2 transition-colors ${
                      isExceeded
                        ? "border-rose-300 bg-rose-50/30 ring-1 ring-rose-200"
                        : "border-slate-200"
                    }`}
                  >
                    {/* Primary Row Controls */}
                    <div className="flex items-center gap-2">
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
                          max={availableForThisRow !== null ? availableForThisRow : undefined}
                          value={item.quantityUnits}
                          onChange={(e) => handleItemChange(idx, "quantityUnits", e.target.value)}
                          placeholder="Units"
                          aria-label={`Quantity units ${idx + 1}`}
                          className={`w-full bg-white rounded-lg p-2 text-xs font-bold text-center text-[#0A4B6E] border outline-none transition-colors ${
                            isExceeded
                              ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-200"
                              : "border-slate-300 focus:border-[#0A4B6E]"
                          }`}
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

                    {/* Live Warehouse Availability & Quick Action Sub-Row */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/70">
                      {/* Left: Total in Yard & Quick Fill Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[#3E5C76]">
                          Warehouse:{" "}
                          <strong className="text-slate-800">
                            {availableForThisRow !== null ? `${availableForThisRow} available` : "Checking stock..."}
                          </strong>
                        </span>

                        {availableForThisRow !== null && availableForThisRow > 0 && (
                          <div className="inline-flex items-center gap-1 ml-1">
                            {/* Max Available Chip */}
                            <button
                              type="button"
                              onClick={() => handleQuickSetQuantity(idx, availableForThisRow)}
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white hover:bg-slate-100 border border-slate-300 text-[#0A4B6E] transition-colors cursor-pointer shadow-2xs"
                              title={`Set quantity to max available warehouse stock (${availableForThisRow} units)`}
                            >
                              Max: {availableForThisRow}
                            </button>

                            {/* +1 Crate Chip (24 units for canisters) */}
                            {isCan && availableForThisRow >= 24 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const current = Number(item.quantityUnits) || 0;
                                  const nextCrateQty = Math.min(availableForThisRow, Math.floor(current / 24 + 1) * 24);
                                  handleQuickSetQuantity(idx, nextCrateQty);
                                }}
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white hover:bg-slate-100 border border-slate-300 text-[#0A4B6E] transition-colors cursor-pointer shadow-2xs"
                                title="Add 1 full crate (24 units)"
                              >
                                +1 Crt (24)
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Real-Time Dynamic Remaining Counter */}
                      <div>
                        {remainingInYard !== null && (
                          isExceeded ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                              <AlertCircle size={12} className="shrink-0 text-rose-600" />
                              <span>Exceeds stock by {Math.abs(remainingInYard)} (Max: {availableForThisRow})</span>
                            </span>
                          ) : remainingInYard === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800">
                              <Check size={11} className="shrink-0 text-blue-600" />
                              <span>All stock allocated</span>
                            </span>
                          ) : remainingInYard < 24 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900">
                              <AlertTriangle size={11} className="shrink-0 text-amber-700" />
                              <span>Low stock: {remainingInYard} remaining</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                              <Check size={11} className="shrink-0 text-emerald-600" />
                              <span>{remainingInYard} remaining in warehouse</span>
                            </span>
                          )
                        )}
                      </div>
                    </div>
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
              disabled={isFormBlocked}
              className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] transition-all cursor-pointer shadow-2xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-1.5"
            >
              <span>{isSubmitting ? "Dispatching..." : "Confirm Dispatch"}</span>
              <ArrowRight size={13} strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

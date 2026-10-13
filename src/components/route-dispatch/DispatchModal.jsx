import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Truck, X, Plus, Trash2 } from "lucide-react";
import { isCanisterProduct } from "../../utils/product.js";
import {
  getPhilippineTodayString,
  toPhilippineDateInputString,
  formatPhilippineDate,
} from "../../utils/date.js";

export default function DispatchModal({
  isOpen,
  onClose,
  onDispatch,
  schedules = [],
  vehicles = [],
  drivers = [],
  zones = [],
  products = [],
  salesUsers = [],
  initialScheduleId = "",
}) {
  const [isAdHoc, setIsAdHoc] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState(initialScheduleId || "");

  useEffect(() => {
    if (initialScheduleId) {
      setSelectedScheduleId(initialScheduleId);
      setIsAdHoc(false);
    }
  }, [initialScheduleId, isOpen]);
  
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

  // Ensure load items synchronize once products array resolves
  useEffect(() => {
    if (products.length > 0) {
      setLoadItems((prev) => {
        const hasMissing = prev.some(
          (it) => !it.productId || it.productId === "e9b21f37-142c-4f76-96f3-a3d8b02e7b91"
        );
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

  const scheduledOptions = schedules.filter((s) => {
    const isScheduled = (s.status || "").toUpperCase() === "SCHEDULED";
    const schedDate = toPhilippineDateInputString(s.scheduledDate);
    const isToday = schedDate === todayPht;
    const isPreselected = initialScheduleId && s.id === initialScheduleId;
    const isAllowed = s.gating ? s.gating.canDispatch : true;
    return isScheduled && (isToday || isPreselected) && isAllowed;
  });

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
        throw new Error("Please specify at least one product item with quantity > 0");
      }

      let payload = {};
      if (!isAdHoc) {
        if (!selectedScheduleId && scheduledOptions.length > 0) {
          throw new Error("Please select a scheduled operational run");
        }
        const sched = scheduledOptions.find((s) => s.id === selectedScheduleId) || scheduledOptions[0];
        if (!sched) throw new Error("No scheduled run available for dispatch");

        const selTruck = vehicles.find((v) => v.id === sched.truckId);
        const resolvedDriverId = driverId || sched.driverId || sched.truckDriverId || selTruck?.driverId || null;
        const selDriver = drivers.find((d) => d.id === resolvedDriverId);

        payload = {
          scheduleId: sched.isTemplateDerived ? null : sched.id,
          truckId: sched.truckId,
          truckPlate: sched.truckPlate,
          truckModel: sched.truckModel,
          driverId: resolvedDriverId,
          driverName: selDriver
            ? (selDriver.fullName || `${selDriver.firstName || ""} ${selDriver.lastName || ""}`.trim() || selDriver.username)
            : (sched.driverName || "Juan Driver"),
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
        if (!salesUserId) throw new Error("Please select an assigned Sales Person");

        const selTruck = vehicles.find((v) => v.id === truckId);
        const resolvedDriverId = driverId || selTruck?.driverId || null;
        const selDriver = drivers.find((d) => d.id === resolvedDriverId);
        const selSales = salesUsers.find((u) => u.id === salesUserId);
        const selZone = zones.find((z) => z.id === zoneId);

        payload = {
          truckId,
          truckPlate: selTruck?.plateNumber,
          truckModel: selTruck?.model,
          driverId: resolvedDriverId,
          driverName: selDriver
            ? (selDriver.fullName || `${selDriver.firstName || ""} ${selDriver.lastName || ""}`.trim() || selDriver.username)
            : "Juan Driver",
          salesUserId,
          salesName: selSales
            ? (selSales.fullName || `${selSales.firstName || ""} ${selSales.lastName || ""}`.trim() || selSales.username)
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
    <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-[#D5E3EC] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center font-bold">
              <Truck size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A4B6E]">Dispatch Truck Run</h3>
              <p className="text-[11px] text-[#6D8AA2]">Assign truck departure and initial staging load</p>
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
          {/* Dispatch Type Mode */}
          <div className="flex items-center justify-between p-2.5 bg-[#EDF3F7] rounded-xl">
            <span className="font-bold text-[#0A4B6E]">Operational Dispatch Mode:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdHoc(false)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  !isAdHoc ? "bg-[#0A4B6E] text-white shadow-xs" : "text-[#486581] hover:text-[#0A4B6E]"
                }`}
              >
                Scheduled Run
              </button>
              <button
                type="button"
                onClick={() => setIsAdHoc(true)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isAdHoc ? "bg-[#0A4B6E] text-white shadow-xs" : "text-[#486581] hover:text-[#0A4B6E]"
                }`}
              >
                Ad-Hoc / Relief Run
              </button>
            </div>
          </div>

          {!isAdHoc ? (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#0A4B6E] mb-1">Select Today's Schedule *</label>
                {scheduledOptions.length > 0 ? (
                  <select
                    value={selectedScheduleId}
                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] font-medium focus:outline-[#0A4B6E]"
                  >
                    <option value="">Select a schedule...</option>
                    {scheduledOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {formatPhilippineDate(s.scheduledDate)} — {s.truckPlate} ({s.zoneCode || "Zone"}) · {s.salesName || "Sales"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-slate-500 italic p-2 bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1]">
                    No scheduled runs awaiting dispatch today. Switch to Ad-Hoc Run.
                  </p>
                )}
              </div>

              {selectedScheduleId && (
                <div>
                  <label className="block font-bold text-[#0A4B6E] mb-1">Driver Assignment (Optional Override)</label>
                  <select
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] focus:outline-[#0A4B6E]"
                  >
                    <option value="">Default driver assigned to vehicle</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName || `${d.firstName || ""} ${d.lastName || ""}`.trim() || d.username}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#0A4B6E] mb-1">Vehicle *</label>
                <select
                  value={truckId}
                  onChange={(e) => setTruckId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] focus:outline-[#0A4B6E]"
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
                <label className="block font-bold text-[#0A4B6E] mb-1">Service Zone *</label>
                <select
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] focus:outline-[#0A4B6E]"
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
                <label className="block font-bold text-[#0A4B6E] mb-1">Sales Person *</label>
                <select
                  value={salesUserId}
                  onChange={(e) => setSalesUserId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] focus:outline-[#0A4B6E]"
                  required
                >
                  <option value="">Select sales person...</option>
                  {salesUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username} ({u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0A4B6E] mb-1">Driver</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] focus:outline-[#0A4B6E]"
                >
                  <option value="">Default vehicle driver</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName || `${d.firstName || ""} ${d.lastName || ""}`.trim() || d.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Initial Loads Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#0A4B6E]">
                Initial Staging Loads (Deducts from Bunawan Yard Stock)
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[#0A4B6E] hover:text-[#0E384E] font-bold text-[11px] flex items-center gap-1 cursor-pointer bg-white border border-[#CBD5E1] hover:bg-slate-50 px-2.5 py-1 rounded-lg"
              >
                <Plus size={13} /> Add Product Item
              </button>
            </div>

            <div className="space-y-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
              {loadItems.map((item, idx) => {
                const selectedProd =
                  products.find((p) => p.id === item.productId) || products[0];
                const isCanister = isCanisterProduct(selectedProd);
                const crates = Math.floor(Number(item.quantityUnits || 0) / 24);

                return (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                      className="flex-1 bg-white border border-[#CBD5E1] rounded-md p-1.5 text-xs text-[#0A4B6E] font-medium"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.containerType})
                        </option>
                      ))}
                    </select>

                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        value={item.quantityUnits}
                        onChange={(e) => handleItemChange(idx, "quantityUnits", e.target.value)}
                        placeholder="Units"
                        className="w-full bg-white border border-[#CBD5E1] rounded-md p-1.5 text-xs font-bold text-center text-[#0A4B6E]"
                      />
                    </div>

                    <div className="text-[11px] text-[#6D8AA2] font-semibold w-20 text-right shrink-0">
                      {isCanister && crates > 0 ? `${crates} crates` : ""}
                    </div>

                    {loadItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-[#0A4B6E] mb-1">Departure Notes / Special Instructions</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Regular morning residential and commercial route"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs focus:outline-[#0A4B6E]"
            />
          </div>

          {/* Submit */}
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
              disabled={isSubmitting}
              className="px-5 py-2 rounded-full text-xs font-bold bg-[#0A4B6E] text-[#FFDF2C] hover:bg-[#0E384E] cursor-pointer shadow-xs disabled:opacity-50"
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

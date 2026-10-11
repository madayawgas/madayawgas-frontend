import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, X, Trash2, CheckCircle2 } from "lucide-react";

const DAYS_OF_WEEK = [
  { num: 1, label: "Mon", full: "Monday" },
  { num: 2, label: "Tue", full: "Tuesday" },
  { num: 3, label: "Wed", full: "Wednesday" },
  { num: 4, label: "Thu", full: "Thursday" },
  { num: 5, label: "Fri", full: "Friday" },
  { num: 6, label: "Sat", full: "Saturday" },
  { num: 7, label: "Sun", full: "Sunday" },
];

export default function TemplateModal({
  isOpen,
  onClose,
  template = null,
  initialTruckId = "",
  initialDayOfWeek = 1,
  vehicles = [],
  zones = [],
  salesUsers = [],
  onSaveTemplate,
  onDeleteTemplate,
}) {
  const isEditing = Boolean(template?.id);

  const [truckId, setTruckId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [zoneId, setZoneId] = useState("");
  const [defaultSalesUserId, setDefaultSalesUserId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form state when opened or props change
  useEffect(() => {
    if (template) {
      setTruckId(template.truckId || "");
      setDayOfWeek(Number(template.dayOfWeek) || 1);
      setZoneId(template.zoneId || "");
      setDefaultSalesUserId(template.defaultSalesUserId || "");
      setIsActive(template.isActive !== false);
    } else {
      setTruckId(initialTruckId || vehicles[0]?.id || "");
      setDayOfWeek(Number(initialDayOfWeek) || 1);
      setZoneId(zones[0]?.id || "");
      setDefaultSalesUserId("");
      setIsActive(true);
    }
    setError(null);
  }, [template, initialTruckId, initialDayOfWeek, vehicles, zones, salesUsers, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!truckId) {
      setError("Please select a delivery vehicle");
      return;
    }
    if (!zoneId) {
      setError("Please select a target service zone");
      return;
    }

    try {
      setIsSubmitting(true);
      const selTruck = vehicles.find((v) => v.id === truckId);
      const selZone = zones.find((z) => z.id === zoneId);
      const selSales = salesUsers.find((u) => u.id === defaultSalesUserId);

      await onSaveTemplate({
        id: template?.id,
        truckId,
        dayOfWeek: Number(dayOfWeek),
        zoneId,
        defaultSalesUserId: defaultSalesUserId || null,
        isActive,
        truckPlate: selTruck?.plateNumber,
        truckModel: selTruck?.model,
        zoneCode: selZone?.code,
        zoneName: selZone?.name,
        salesName: selSales ? `${selSales.firstName} ${selSales.lastName}` : null,
      });

      onClose();
    } catch (err) {
      setError(err.message || "Failed to save route template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!template?.id || !onDeleteTemplate) return;
    if (window.confirm("Are you sure you want to remove this recurring template assignment?")) {
      try {
        setIsSubmitting(true);
        await onDeleteTemplate(template.id);
        onClose();
      } catch (err) {
        setError(err.message || "Failed to delete template");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const selectedVehicle = vehicles.find((v) => v.id === truckId);
  const selectedZone = zones.find((z) => z.id === zoneId);

  return createPortal(
    <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#D5E3EC] max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-in text-left font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center font-bold">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A4B6E]">
                {isEditing ? "Edit Route Template" : "Add Weekly Route Template"}
              </h3>
              <p className="text-[11px] text-[#6D8AA2]">
                Recurring weekly deployment pattern for automated schedule generation
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
          {/* 1. Day of Week Selector */}
          <div>
            <label className="block font-bold text-[#0A4B6E] mb-1.5">
              Day of Week *
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = dayOfWeek === d.num;
                return (
                  <button
                    key={d.num}
                    type="button"
                    onClick={() => setDayOfWeek(d.num)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-[#0A4B6E] text-[#FFDF2C] border-[#0A4B6E] shadow-xs scale-102"
                        : "bg-[#F8FAFC] text-[#486581] border-[#CBD5E1] hover:bg-[#E8F3F8] hover:text-[#0A4B6E]"
                    }`}
                  >
                    <div>{d.label}</div>
                    <div className="text-[9px] opacity-75 font-normal">{d.num}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Vehicle Selection */}
          <div>
            <label className="block font-bold text-[#0A4B6E] mb-1">
              Delivery Vehicle *
            </label>
            <select
              value={truckId}
              onChange={(e) => setTruckId(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] font-medium focus:outline-[#0A4B6E]"
              required
            >
              <option value="">Select vehicle...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} — {v.model} ({v.vehicleType || "TRUCK"})
                </option>
              ))}
            </select>
            {selectedVehicle?.driver && (
              <p className="text-[11px] text-[#6D8AA2] mt-1 pl-1">
                Soft-bound driver: <span className="font-semibold text-[#0A4B6E]">{selectedVehicle.driver.name}</span>
              </p>
            )}
          </div>

          {/* 3. Service Zone Selection */}
          <div>
            <label className="block font-bold text-[#0A4B6E] mb-1">
              Target Service Zone *
            </label>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] font-medium focus:outline-[#0A4B6E]"
              required
            >
              <option value="">Select service zone...</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.code} — {z.name}
                </option>
              ))}
            </select>
            {selectedZone?.description && (
              <p className="text-[11px] text-[#6D8AA2] mt-1 pl-1">
                Coverage: {selectedZone.description}
              </p>
            )}
          </div>

          {/* 4. Default Assigned Sales Person */}
          <div>
            <label className="block font-bold text-[#0A4B6E] mb-1">
              Default Assigned Sales Person (Optional)
            </label>
            <select
              value={defaultSalesUserId}
              onChange={(e) => setDefaultSalesUserId(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] font-medium focus:outline-[#0A4B6E]"
            >
              <option value="">None (Can be assigned upon dispatch)</option>
              {salesUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.username})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#6D8AA2] mt-1 pl-1">
              Automatically pre-fills the sales representative during daily schedule generation
            </p>
          </div>

          {/* 5. Active Status */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="templateIsActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-[#0A4B6E] rounded focus:ring-0 cursor-pointer"
            />
            <label htmlFor="templateIsActive" className="text-xs text-[#0A4B6E] font-semibold cursor-pointer">
              Active recurring template (included in batch schedule runs)
            </label>
          </div>

          {/* Constraint note */}
          <div className="p-2.5 bg-[#EDF3F7] border border-[#D5E3EC] rounded-xl text-[11px] text-[#486581] flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[#0A4B6E] shrink-0" />
            <span>
              <strong>Rule:</strong> Exactly one master template is maintained per vehicle per day of week. Saving will update the assignment for this slot.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
            <div>
              {isEditing && onDeleteTemplate && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
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
                {isSubmitting ? "Saving..." : isEditing ? "Save Template ➔" : "+ Add Template"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}


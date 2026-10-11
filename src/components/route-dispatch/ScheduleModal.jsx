// src/components/route-dispatch/ScheduleModal.jsx
import { useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, X } from "lucide-react";

export default function ScheduleModal({
  isOpen,
  onClose,
  vehicles = [],
  salesUsers = [],
  zones = [],
  onCreateSchedule,
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [scheduledDate, setScheduledDate] = useState(today);
  const [truckId, setTruckId] = useState(vehicles[0]?.id || "");
  const [salesUserId, setSalesUserId] = useState(salesUsers[0]?.id || "");
  const [zoneId, setZoneId] = useState(zones[0]?.id || "");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);
      const selTruck = vehicles.find((v) => v.id === truckId);
      const selSales = salesUsers.find((u) => u.id === salesUserId);
      const selZone = zones.find((z) => z.id === zoneId);

      await onCreateSchedule({
        scheduledDate,
        truckId,
        salesUserId,
        zoneId,
        notes,
        truckPlate: selTruck?.plateNumber,
        truckModel: selTruck?.model,
        salesName: selSales ? `${selSales.firstName} ${selSales.lastName}` : "Sales Person",
        zoneCode: selZone?.code,
        zoneName: selZone?.name,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalNode = (
    <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-[#D5E3EC] max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center font-bold">
              <Calendar size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A4B6E]">Create Ad-Hoc Schedule</h3>
              <p className="text-[11px] text-[#6D8AA2]">Single-day operational truck deployment</p>
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
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-[#0A4B6E]">Deployment Date *</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setScheduledDate(new Date().toISOString().slice(0, 10))}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3F8] text-[#0A4B6E] hover:bg-[#D5EAF4] cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tmrw = new Date();
                    tmrw.setDate(tmrw.getDate() + 1);
                    setScheduledDate(tmrw.toISOString().slice(0, 10));
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3F8] text-[#0A4B6E] hover:bg-[#D5EAF4] cursor-pointer"
                >
                  Tomorrow
                </button>
              </div>
            </div>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] font-bold focus:outline-[#0A4B6E]"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-[#0A4B6E] mb-1">Vehicle *</label>
            <select
              value={truckId}
              onChange={(e) => setTruckId(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] focus:outline-[#0A4B6E]"
              required
            >
              <option value="">Select vehicle...</option>
              {vehicles.map((v) => (
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
            <label className="block font-bold text-[#0A4B6E] mb-1">Assigned Sales Person</label>
            <select
              value={salesUserId}
              onChange={(e) => setSalesUserId(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0A4B6E] focus:outline-[#0A4B6E]"
            >
              <option value="">Select sales person...</option>
              {salesUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#0A4B6E] mb-1">Notes / Instructions</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ad-hoc hospital supply relief"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs focus:outline-[#0A4B6E]"
            />
          </div>

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
              className="px-5 py-2 rounded-full text-xs font-bold bg-[#0A4B6E] text-white hover:bg-[#0E384E] cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Schedule ➔"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

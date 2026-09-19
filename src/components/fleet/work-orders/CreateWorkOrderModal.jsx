// src/components/fleet/work-orders/CreateWorkOrderModal.jsx
import { useState, useEffect } from "react";
import { Wrench, Truck, AlertTriangle, AlertOctagon, DollarSign, Calendar, MapPin } from "lucide-react";
import { fleetApi } from "../../../api/fleet.js";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import Select from "../../ui/Select";

/**
 * CreateWorkOrderModal
 * Creates manual work orders for preventive maintenance, corrective repairs, or accidents.
 * Enforces financial approval gate notice (>= ₱5,000.00 threshold) and vehicle grounding notice.
 */
export default function CreateWorkOrderModal({
  isOpen,
  truck = null,
  trucks = [],
  onClose,
  onSubmit,
}) {
  const [selectedTruckId, setSelectedTruckId] = useState(truck?.id || "");
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  const [maintenanceTypeId, setMaintenanceTypeId] = useState("1");
  const [shopName, setShopName] = useState("Bunawan Heavy Repair Center");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [description, setDescription] = useState("");
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTypes() {
      try {
        setIsLoadingTypes(true);
        const res = await fleetApi.getMaintenanceTypes();
        const types = res?.data?.types || [];
        setMaintenanceTypes(types);
        if (types.length > 0 && !maintenanceTypeId) {
          setMaintenanceTypeId(String(types[0].id));
        }
      } catch (err) {
        console.error("Failed to load maintenance types:", err);
      } finally {
        setIsLoadingTypes(false);
      }
    }

    if (isOpen) {
      loadTypes();
      if (truck?.id) {
        setSelectedTruckId(truck.id);
      } else if (trucks.length > 0 && !selectedTruckId) {
        setSelectedTruckId(trucks[0].id);
      }
    }
  }, [isOpen, truck, trucks, selectedTruckId, maintenanceTypeId]);

  if (!isOpen) return null;

  const currentTruck = truck || trucks.find((t) => t.id === selectedTruckId) || null;
  const numCost = Number(estimatedCost) || 0;
  const requiresApproval = numCost >= 5000.0;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedTruckId) {
      setError("Please select a target vehicle.");
      return;
    }
    if (!description.trim()) {
      setError("Work order scope/description is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload = {
        truckId: selectedTruckId,
        maintenanceTypeId: Number(maintenanceTypeId),
        shopName: shopName.trim() || "Bunawan Heavy Repair Center",
        estimatedCost: numCost,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : new Date().toISOString(),
        description: description.trim(),
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error("Failed to create work order:", err);
      setError(err?.message || "Failed to create work order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const truckOptions = trucks.map((t) => ({
    value: t.id,
    label: `${t.plateNumber || "Truck"} — ${t.model || "Isuzu Elf"} (${t.driverName || "No Driver"})`,
  }));

  const typeOptions = maintenanceTypes.map((t) => ({
    value: String(t.id),
    label: `${t.typeName} — ${t.description?.split("(")[0] || ""}`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Maintenance Work Order"
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="neutral"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs uppercase tracking-wider font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="yellow"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingTypes}
            className="text-xs uppercase tracking-wider font-bold px-6 shadow-xs"
          >
            {isSubmitting ? "Creating Work Order..." : "Create Work Order"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-left pt-1">
        {/* TARGET TRUCK INFO / SELECTOR */}
        {truck ? (
          <div className="bg-[#DDF4FF] border border-[#BAE6FD] rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#0A4B6E]">
              <Truck size={18} className="stroke-[2.2]" />
              <span className="font-bold text-sm">
                {truck.plateNumber || "Truck"}
              </span>
              <span className="text-[#5B8399]">
                ({truck.model || "Isuzu Elf"})
              </span>
            </div>
            <div className="text-gray-600 font-medium">
              Driver: <strong className="text-[#0A4B6E]">{truck.driverName || "No Assigned"}</strong>
            </div>
          </div>
        ) : (
          <Select
            label="Target Vehicle"
            required
            value={selectedTruckId}
            onChange={(e) => setSelectedTruckId(e.target.value)}
            options={truckOptions}
          />
        )}

        {/* MAINTENANCE SERVICE TYPE */}
        <Select
          label="Maintenance Classification Type"
          required
          value={maintenanceTypeId}
          onChange={(e) => setMaintenanceTypeId(e.target.value)}
          options={typeOptions}
          disabled={isLoadingTypes}
        />

        {/* SHOP / SERVICE CENTER NAME */}
        <div>
          <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1.5">
            Repair Facility / Vendor Name
          </label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="e.g., Bunawan Heavy Repair Center"
            className="w-full text-xs sm:text-sm bg-[#F3F5F5] border border-gray-200 rounded-xl py-2.5 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] focus:border-transparent transition-all placeholder:text-gray-400"
          />
        </div>

        {/* ESTIMATED COST & SCHEDULED DATE ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1.5">
              Estimated Cost (₱ PHP)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-500">₱</span>
              <input
                type="number"
                min="0"
                step="50"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0.00"
                className="w-full text-xs sm:text-sm bg-[#F3F5F5] border border-gray-200 rounded-xl py-2.5 pl-7 pr-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] focus:border-transparent transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1.5">
              Scheduled Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full text-xs sm:text-sm bg-[#F3F5F5] border border-gray-200 rounded-xl py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* FINANCIAL APPROVAL GATE WARNING NOTICE */}
        {requiresApproval ? (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-amber-900 text-xs shadow-2xs">
            <AlertTriangle size={17} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Managerial Cost Approval Gate</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Estimated cost meets or exceeds <strong>₱5,000.00</strong>. This work order will enter <strong className="font-bold">PENDING</strong> status and requires authorization by an authorized executive (Super Admin / Admin) before work can begin.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-[#5B8399]">
            Estimated costs under ₱5,000.00 are pre-approved and initiate directly in APPROVED status.
          </p>
        )}

        {/* VEHICLE GROUNDING NOTICE */}
        <div className="bg-red-50/80 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-red-800 text-xs">
          <AlertOctagon size={16} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-[11.5px] leading-relaxed">
            Creating a work order automatically places <strong>{currentTruck?.plateNumber || "the vehicle"}</strong> under maintenance (<strong className="font-bold">UNDER_MAINTENANCE</strong>). Assigned driver soft-binding is retained.
          </p>
        </div>

        {/* DESCRIPTION / WORK SCOPE TEXTAREA */}
        <div>
          <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1.5">
            Scope of Work & Repair Diagnosis <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (error) setError("");
            }}
            placeholder="Specify repair procedures, parts to replace, technician diagnosis, and shop instructions..."
            className="w-full text-xs sm:text-sm bg-[#F3F5F5] border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] focus:border-transparent transition-all placeholder:text-gray-400 resize-none"
          />
        </div>

        {/* ERROR NOTIFICATION */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

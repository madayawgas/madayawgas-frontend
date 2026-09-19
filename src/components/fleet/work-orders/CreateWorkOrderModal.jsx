// src/components/fleet/work-orders/CreateWorkOrderModal.jsx
import { useState, useEffect } from "react";
import { Truck, AlertTriangle, AlertOctagon, Calendar, MapPin } from "lucide-react";
import { fleetApi } from "../../../api/fleet.js";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";

/**
 * CreateWorkOrderModal
 * Creates manual work orders for preventive maintenance, corrective repairs, or accidents.
 * Matches the exact look, feel, and layout of Vehicle Return Odometer Check-In (OdometerCheckInModal).
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

  const driverDisplay = currentTruck?.driver
    ? `${currentTruck.driver.firstName || ""} ${currentTruck.driver.lastName || ""}`.trim() || currentTruck.driver.username
    : currentTruck?.driverName && currentTruck.driverName !== "Unassigned"
    ? currentTruck.driverName
    : "No Assigned";

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
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

  const footerContent = (
    <div className="w-full flex flex-col items-center">
      {error && (
        <div className="w-full bg-red-50 text-red-700 p-3 rounded-xl text-xs font-medium border border-red-200 mb-3 text-left">
          {error}
        </div>
      )}
      <Button
        type="button"
        variant="yellow"
        disabled={isSubmitting || isLoadingTypes || !description.trim()}
        onClick={handleSubmit}
        className="w-full font-bold text-sm uppercase tracking-wider mb-2"
      >
        {isSubmitting ? "CREATING..." : "CONFIRM WORK ORDER"}
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
      title="Create Maintenance Work Order"
      maxWidth="max-w-lg"
      footer={footerContent}
    >
      <div className="space-y-4 text-left py-2">
        {/* VEHICLE CONTEXT BANNER */}
        {truck ? (
          <div className="bg-[#BAE6FD]/40 rounded-xl p-3.5 flex items-center justify-between border border-[#0A4B6E]/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0A4B6E] text-white flex items-center justify-center shrink-0">
                <Truck size={20} />
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
        ) : (
          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
              Target Vehicle <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedTruckId}
              onChange={(e) => setSelectedTruckId(e.target.value)}
              className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
            >
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.plateNumber || "Truck"} — {t.model || "Fleet Asset"} ({t.driverName || "No Driver"})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* CURRENT REGISTERED METRICS */}
        {currentTruck && (
          <div className="grid grid-cols-2 gap-3 bg-[#F3F5F5] rounded-xl p-3.5 text-xs">
            <div>
              <span className="text-[#588094] block text-[11px]">Operational Status</span>
              <span className="font-bold text-sm text-[#0A4B6E]">
                {(currentTruck.status || currentTruck.operationalStatus || "ACTIVE").replace("_", " ")}
              </span>
            </div>
            <div>
              <span className="text-[#588094] block text-[11px]">Current Odometer</span>
              <span className="font-bold text-sm text-[#0A4B6E]">
                {Number(currentTruck.currentOdometer || 0).toLocaleString()} KM
              </span>
            </div>
          </div>
        )}

        {/* MAINTENANCE CLASSIFICATION TYPE */}
        <div>
          <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
            Maintenance Classification Type <span className="text-red-500">*</span>
          </label>
          <select
            value={maintenanceTypeId}
            onChange={(e) => setMaintenanceTypeId(e.target.value)}
            disabled={isLoadingTypes}
            className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
          >
            {maintenanceTypes.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.typeName} — {t.description?.split("(")[0] || ""}
              </option>
            ))}
          </select>
        </div>

        {/* SHOP / SERVICE CENTER NAME */}
        <div>
          <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
            Repair Facility / Vendor Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g., Bunawan Heavy Repair Center"
              className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl py-2 pl-9 pr-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
            />
            <MapPin size={15} className="absolute left-3 top-2.5 text-[#588094]" />
          </div>
          <span className="text-[11px] text-[#588094] mt-1 block">
            Authorized external shop or internal repair facility.
          </span>
        </div>

        {/* ESTIMATED COST & SCHEDULED DATE ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
              Estimated Cost (₱ PHP)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-gray-500">₱</span>
              <input
                type="number"
                min="0"
                step="50"
                value={estimatedCost}
                onChange={(e) => {
                  setEstimatedCost(e.target.value);
                  setError("");
                }}
                placeholder="0.00"
                className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl py-2 pl-7 pr-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
              Scheduled Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl py-2 pl-9 pr-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
              />
              <Calendar size={15} className="absolute left-3 top-2.5 text-[#588094]" />
            </div>
          </div>
        </div>

        {/* FINANCIAL APPROVAL GATE WARNING NOTICE */}
        {requiresApproval ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-900 text-xs">
            <AlertTriangle size={17} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Managerial Cost Approval Gate</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Estimated cost meets or exceeds <strong>₱5,000.00</strong>. This work order will enter <strong>PENDING</strong> status and requires authorization by an authorized executive (Super Admin / Admin) before work can begin.
              </p>
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-[#588094] block">
            Estimated costs under ₱5,000.00 are pre-approved and initiate directly in APPROVED status.
          </span>
        )}

        {/* VEHICLE GROUNDING NOTICE */}
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs">
          <AlertOctagon size={18} className="shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="font-bold">Vehicle Grounding Action</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed">
              Creating a work order automatically places <strong>{currentTruck?.plateNumber || "the vehicle"}</strong> under maintenance (<strong>UNDER_MAINTENANCE</strong>). Assigned driver ({driverDisplay}) will be retained.
            </p>
          </div>
        </div>

        {/* DESCRIPTION / WORK SCOPE TEXTAREA */}
        <div>
          <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
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
            className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] resize-none"
          />
          <span className="text-[11px] text-[#588094] mt-1 block">
            Logged upon work order creation by Maintenance Supervisor.
          </span>
        </div>
      </div>
    </Modal>
  );
}

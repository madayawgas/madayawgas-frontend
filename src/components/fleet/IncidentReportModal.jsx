// src/components/fleet/IncidentReportModal.jsx
import { useState, useEffect } from "react";
import { AlertOctagon, AlertTriangle, Truck, MapPin, FileText, CheckCircle2 } from "lucide-react";
import { fleetApi } from "../../api/fleet.js";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Select from "../ui/Select";

/**
 * IncidentReportModal
 * Captures mid-route breakdowns, roadside accidents, tire punctures, and mechanical failures.
 * In accordance with docs/api-contracts/fleet/maintenance.api.md:
 * - Dynamic incident types from GET /api/fleet/maintenance/incidents/types
 * - If severity === 'CRITICAL', automatically grounds vehicle to UNDER_MAINTENANCE
 * - Retains 1:1 driver soft-binding
 */
export default function IncidentReportModal({
  isOpen,
  truck = null,
  trucks = [],
  onClose,
  onSubmit,
}) {
  const [selectedTruckId, setSelectedTruckId] = useState(truck?.id || "");
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [incidentTypeId, setIncidentTypeId] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [incidentLocation, setIncidentLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Populate incident types dynamically
  useEffect(() => {
    async function loadTypes() {
      try {
        setIsLoadingTypes(true);
        const res = await fleetApi.getIncidentTypes();
        const types = res?.data?.types || [];
        setIncidentTypes(types);
        if (types.length > 0 && !incidentTypeId) {
          setIncidentTypeId(types[0].id);
        }
      } catch (err) {
        console.error("Failed to load incident types:", err);
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
  }, [isOpen, truck, trucks, selectedTruckId, incidentTypeId]);

  if (!isOpen) return null;

  const currentTruck = truck || trucks.find((t) => t.id === selectedTruckId) || null;
  const isCritical = severity === "CRITICAL";

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedTruckId) {
      setError("Please select a target vehicle.");
      return;
    }
    if (!incidentTypeId) {
      setError("Please select an incident classification.");
      return;
    }
    if (!description.trim()) {
      setError("Incident description is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload = {
        truckId: selectedTruckId,
        incidentTypeId: Number(incidentTypeId),
        severity,
        incidentLocation: incidentLocation.trim() || "Roadside mid-route",
        description: description.trim(),
        reportDate: new Date().toISOString(),
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error("Failed to report incident:", err);
      setError(err?.message || "Failed to submit incident report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const truckOptions = trucks.map((t) => ({
    value: t.id,
    label: `${t.plateNumber || "Truck"} — ${t.model || "Isuzu Elf"} (${t.driverName || "No Driver"})`,
  }));

  const typeOptions = incidentTypes.map((t) => ({
    value: t.id,
    label: t.typeName.replace(/_/g, " "),
  }));

  const severityOptions = [
    { value: "LOW", label: "LOW (Minor cosmetic / non-blocking issue)" },
    { value: "MEDIUM", label: "MEDIUM (Attention needed, vehicle operational)" },
    { value: "HIGH", label: "HIGH (Urgent repair needed soon)" },
    { value: "CRITICAL", label: "CRITICAL (Vehicle disabled / Stalled — Immediate Grounding)" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Incident / Breakdown"
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
            {isSubmitting ? "Submitting..." : "Submit Incident Report"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-left pt-1">
        {/* TARGET TRUCK DISPLAY OR SELECTOR */}
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

        {/* INCIDENT CLASSIFICATION TYPE */}
        <Select
          label="Incident Classification Type"
          required
          value={incidentTypeId}
          onChange={(e) => setIncidentTypeId(e.target.value)}
          options={typeOptions}
          disabled={isLoadingTypes}
        />

        {/* SEVERITY SELECTOR */}
        <Select
          label="Severity Level"
          required
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          options={severityOptions}
        />

        {/* CRITICAL WARNING BANNER */}
        {isCritical && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-red-800 text-xs">
            <AlertOctagon size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Critical Incident Grounding Notice</p>
              <p className="text-[11.5px] text-red-700 leading-relaxed">
                Marking this incident as <strong className="font-bold">CRITICAL</strong> will automatically transition {currentTruck?.plateNumber || "this vehicle"} to <strong className="font-bold">UNDER_MAINTENANCE</strong>. The assigned driver will remain soft-bound.
              </p>
            </div>
          </div>
        )}

        {/* INCIDENT LOCATION INPUT */}
        <div>
          <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1.5">
            Incident / Breakdown Location
          </label>
          <div className="relative">
            <input
              type="text"
              value={incidentLocation}
              onChange={(e) => setIncidentLocation(e.target.value)}
              placeholder="e.g., Km 14 Panacan Highway, Davao City"
              className="w-full text-xs sm:text-sm bg-[#F3F5F5] border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] focus:border-transparent transition-all placeholder:text-gray-400"
            />
            <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>

        {/* DESCRIPTION TEXTAREA */}
        <div>
          <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1.5">
            Incident Description & Roadside Status <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (error) setError("");
            }}
            placeholder="Describe what occurred, driver remarks, immediate symptoms (smoke, leak, puncture), and current vehicle towing or repair situation..."
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

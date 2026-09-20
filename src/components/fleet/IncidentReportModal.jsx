// src/components/fleet/IncidentReportModal.jsx
import { useState, useEffect } from "react";
import { AlertOctagon, AlertTriangle, Truck, MapPin } from "lucide-react";
import { fleetApi } from "../../api/fleet.js";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

/**
 * IncidentReportModal
 * Captures mid-route breakdowns, roadside accidents, tire punctures, and mechanical failures.
 * Matches the exact look, feel, and layout of Vehicle Return Odometer Check-In.
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
  const [errorMsg, setErrorMsg] = useState("");

  // Populate incident types dynamically
  useEffect(() => {
    async function loadTypes() {
      try {
        setIsLoadingTypes(true);
        const res = await fleetApi.getIncidentTypes();
        const types = res?.data?.types || [];
        setIncidentTypes(types);
        if (types.length > 0 && !incidentTypeId) {
          setIncidentTypeId(String(types[0].id));
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

  const driverDisplay = currentTruck?.driver
    ? `${currentTruck.driver.firstName || ""} ${currentTruck.driver.lastName || ""}`.trim() || currentTruck.driver.username
    : currentTruck?.driverName && currentTruck.driverName !== "Unassigned"
    ? currentTruck.driverName
    : "No Assigned";

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedTruckId) {
      setErrorMsg("Please select a target vehicle.");
      return;
    }
    if (!incidentTypeId) {
      setErrorMsg("Please select an incident classification.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Incident description and roadside status is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");

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
      setErrorMsg(err?.message || "Failed to submit incident report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerContent = (
    <div className="w-full flex flex-col items-center">
      {errorMsg && (
        <div className="w-full bg-red-50 text-red-700 p-3 rounded-xl text-xs font-medium border border-red-200 mb-3 text-left">
          {errorMsg}
        </div>
      )}
      <Button
        type="button"
        variant="yellow"
        disabled={isSubmitting || isLoadingTypes || !description.trim()}
        onClick={handleSubmit}
        className="w-full font-bold text-sm uppercase tracking-wider mb-2"
      >
        {isSubmitting ? "SUBMITTING..." : "SUBMIT INCIDENT REPORT"}
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
      title="Report Incident / Breakdown"
      maxWidth="max-w-lg"
      footer={footerContent}
    >
      <div className="space-y-4 text-left py-2">
        {/* VEHICLE CONTEXT BANNER */}
        {truck ? (
          <div className="bg-[#E8F3F8] rounded-xl p-3.5 flex items-center justify-between border border-[#BCE1F1]/60">
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

        {/* INCIDENT CLASSIFICATION TYPE */}
        <div>
          <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
            Incident Classification Type <span className="text-red-500">*</span>
          </label>
          <select
            value={incidentTypeId}
            onChange={(e) => setIncidentTypeId(e.target.value)}
            disabled={isLoadingTypes}
            className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
          >
            {incidentTypes.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.typeName.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* SEVERITY LEVEL */}
        <div>
          <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
            Severity Level <span className="text-red-500">*</span>
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
          >
            <option value="LOW">LOW (Minor cosmetic / non-blocking issue)</option>
            <option value="MEDIUM">MEDIUM (Attention needed, vehicle operational)</option>
            <option value="HIGH">HIGH (Urgent repair needed soon)</option>
            <option value="CRITICAL">CRITICAL (Vehicle disabled / Stalled — Immediate Grounding)</option>
          </select>
        </div>

        {/* CRITICAL WARNING BANNER */}
        {isCritical && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-xs flex items-start gap-2.5">
            <AlertOctagon size={18} className="shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold">Critical Incident Grounding Notice</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed">
                Marking this incident as <strong>CRITICAL</strong> will automatically transition {currentTruck?.plateNumber || "this vehicle"} to <strong>UNDER_MAINTENANCE</strong>. The assigned driver ({driverDisplay}) will remain soft-bound.
              </p>
            </div>
          </div>
        )}

        {/* INCIDENT LOCATION INPUT */}
        <div>
          <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
            Incident / Breakdown Location
          </label>
          <div className="relative">
            <input
              type="text"
              value={incidentLocation}
              onChange={(e) => setIncidentLocation(e.target.value)}
              placeholder="e.g., Km 14 Panacan Highway, Davao City"
              className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl py-2 pl-9 pr-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
            />
            <MapPin size={15} className="absolute left-3 top-2.5 text-[#588094]" />
          </div>
          <span className="text-[11px] text-[#588094] mt-1 block">
            Provide highway landmark, barangay, or plant location.
          </span>
        </div>

        {/* DESCRIPTION TEXTAREA */}
        <div>
          <label className="block text-xs font-semibold text-[#0A4B6E] mb-1.5">
            Incident Description & Roadside Status <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrorMsg("");
            }}
            placeholder="Describe what occurred, driver remarks, immediate symptoms (smoke, leak, puncture), and current vehicle towing or repair situation..."
            className="w-full bg-[#F3F5F5] border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E] resize-none"
          />
          <span className="text-[11px] text-[#588094] mt-1 block">
            Logged upon roadside incident report by Driver or Logistics Dispatcher.
          </span>
        </div>
      </div>
    </Modal>
  );
}

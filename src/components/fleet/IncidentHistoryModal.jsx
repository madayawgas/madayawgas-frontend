// src/components/fleet/IncidentHistoryModal.jsx
import { useState, useEffect, useCallback } from "react";
import { AlertOctagon, AlertTriangle, Plus, Clock, MapPin, User, Search, Filter } from "lucide-react";
import { fleetApi } from "../../api/fleet.js";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

/**
 * IncidentHistoryModal
 * Displays chronological breakdown, failure, and incident logs for a truck or fleet-wide.
 */
export default function IncidentHistoryModal({
  isOpen,
  truck = null,
  onClose,
  onOpenReport,
}) {
  const [incidents, setIncidents] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const loadIncidents = useCallback(async () => {
    try {
      setIsLoading(true);
      const [incRes, typesRes] = await Promise.all([
        truck?.id
          ? fleetApi.getTruckIncidents(truck.id)
          : fleetApi.getIncidents({
              severity: selectedSeverity === "All" ? undefined : selectedSeverity,
              incidentTypeId: selectedType === "All" ? undefined : selectedType,
              search: searchTerm || undefined,
            }),
        fleetApi.getIncidentTypes(),
      ]);

      let list = incRes?.data?.incidents || [];
      // Apply client filtering if truck-specific
      if (truck?.id) {
        if (selectedSeverity !== "All") {
          list = list.filter((i) => i.severity === selectedSeverity);
        }
        if (selectedType !== "All") {
          list = list.filter((i) => i.incidentTypeId === Number(selectedType));
        }
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          list = list.filter(
            (i) =>
              i.description?.toLowerCase().includes(q) ||
              i.incidentLocation?.toLowerCase().includes(q) ||
              i.incidentTypeName?.toLowerCase().includes(q)
          );
        }
      }

      setIncidents(list);
      setIncidentTypes(typesRes?.data?.types || []);
    } catch (err) {
      console.error("Failed to load incidents:", err);
    } finally {
      setIsLoading(false);
    }
  }, [truck?.id, selectedSeverity, selectedType, searchTerm]);

  useEffect(() => {
    if (isOpen) {
      loadIncidents();
    }
  }, [isOpen, loadIncidents]);

  if (!isOpen) return null;

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <Badge variant="danger" className="px-2.5 py-0.5 text-[10px] font-extrabold">
            CRITICAL
          </Badge>
        );
      case "HIGH":
        return (
          <Badge variant="warning" className="px-2 py-0.5 text-[10px] font-bold">
            HIGH
          </Badge>
        );
      case "MEDIUM":
        return (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-[10px] font-semibold">
            MEDIUM
          </span>
        );
      case "LOW":
        return (
          <Badge variant="success" className="px-2 py-0.5 text-[10px]">
            LOW
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="px-2 py-0.5 text-[10px]">
            {severity}
          </Badge>
        );
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Recent";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={truck ? `Incident Logs — ${truck.plateNumber || "Truck"}` : "Fleet Incident & Breakdown Logs"}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          {onOpenReport ? (
            <Button
              type="button"
              variant="yellow"
              onClick={() => {
                onClose();
                onOpenReport(truck);
              }}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
            >
              <Plus size={14} />
              <span>Report Incident</span>
            </Button>
          ) : <div />}
          <Button
            type="button"
            variant="neutral"
            onClick={onClose}
            className="text-xs uppercase tracking-wider font-semibold"
          >
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-left pt-1">
        {/* FILTER TOOLBAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pb-2 border-b border-gray-100">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search description, location..."
              className="w-full text-xs bg-[#F3F5F5] border border-gray-200 rounded-xl py-2 pl-8 pr-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          </div>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs bg-[#F3F5F5] border border-gray-200 rounded-xl py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
          >
            <option value="All">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Incident Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-[#F3F5F5] border border-gray-200 rounded-xl py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]"
          >
            <option value="All">All Types</option>
            {incidentTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.typeName.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* INCIDENT CARDS LIST */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-gray-500 font-medium">
            Loading incident records...
          </div>
        ) : incidents.length > 0 ? (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-[#F8FBFC] hover:bg-[#EBF5FB] border border-gray-100 rounded-xl p-3.5 transition-colors text-xs space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#0A4B6E] text-sm">
                      {inc.plateNumber || "Truck"}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-semibold text-[10px]">
                      {inc.incidentTypeName?.replace(/_/g, " ") || "INCIDENT"}
                    </span>
                    {getSeverityBadge(inc.severity)}
                  </div>

                  <div className="text-[#5B8399] flex items-center gap-1">
                    <Clock size={13} />
                    <span>{formatDate(inc.reportDate)}</span>
                  </div>
                </div>

                <div className="bg-white/80 border border-gray-100 rounded-lg p-2.5 text-gray-800 leading-relaxed font-sans">
                  {inc.description}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 pt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-gray-400" />
                    <span>{inc.incidentLocation || "Roadside mid-route"}</span>
                  </span>

                  <span className="flex items-center gap-1">
                    <User size={12} className="text-gray-400" />
                    <span>Reported by: <strong className="text-gray-700">{inc.reporterName || "Logistics Supervisor"}</strong></span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 space-y-2">
            <AlertOctagon size={36} className="mx-auto text-gray-300 stroke-[1.5]" />
            <p className="text-sm font-medium">No incidents recorded</p>
            <p className="text-xs">
              {searchTerm || selectedSeverity !== "All" || selectedType !== "All"
                ? "No incident logs matched your filter criteria."
                : "No roadside breakdowns or mechanical incidents recorded."}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

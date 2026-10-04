import { useState, useEffect, useCallback } from "react";
import { AlertOctagon, AlertTriangle, Plus, Clock, MapPin, User, Search, Filter, X } from "lucide-react";
import { fleetApi } from "../../api/fleet.js";
import SideDrawer from "../ui/SideDrawer";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Pagination from "../ui/Pagination";

/**
 * IncidentHistoryModal
 * Displays chronological breakdown, failure, and incident logs in a right-sliding panel.
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
  const [searchDraft, setSearchDraft] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [meta, setMeta] = useState({ page: 1, limit: 10, totalPages: 1, totalItems: 0 });

  // React 19 render-time state reset when opening
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setPage(1);
      setSearchDraft("");
      setCommittedSearch("");
      setSelectedSeverity("All");
      setSelectedType("All");
    }
  }

  const loadIncidents = useCallback(async () => {
    try {
      setIsLoading(true);
      const [incRes, typesRes] = await Promise.all([
        fleetApi.getIncidents({
          truckId: truck?.id || undefined,
          severity: selectedSeverity === "All" ? undefined : selectedSeverity,
          incidentTypeId: selectedType === "All" ? undefined : selectedType,
          search: committedSearch || undefined,
          page,
          limit,
        }),
        fleetApi.getIncidentTypes(),
      ]);

      setIncidents(incRes?.data?.incidents || []);
      if (incRes?.meta) {
        setMeta(incRes.meta);
      } else {
        const total = incRes?.data?.total || (incRes?.data?.incidents || []).length;
        setMeta({
          page,
          limit,
          totalItems: total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        });
      }
      setIncidentTypes(typesRes?.data?.types || []);
    } catch (err) {
      console.error("Failed to load incidents:", err);
    } finally {
      setIsLoading(false);
    }
  }, [truck?.id, selectedSeverity, selectedType, committedSearch, page, limit]);

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
          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-[10px] font-semibold">
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
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={truck ? `Incident Logs — ${truck.plateNumber || "Truck"}` : "Fleet Incident & Breakdown Logs"}
      subtitle={truck ? `${truck.model || "Isuzu Elf"} • Roadside incidents & defects` : "Fleet-wide breakdown & incident records"}
      icon={AlertOctagon}
      badge={
        truck ? (
          <Badge variant="neutral" className="px-2.5 py-0.5 text-[10px] font-bold">
            {truck.plateNumber || "Truck"}
          </Badge>
        ) : null
      }
      width="max-w-xl lg:max-w-2xl"
      footer={({ onClose: closeDrawer }) => (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          {onOpenReport && (
            <button
              type="button"
              onClick={() => {
                onOpenReport(truck);
              }}
              className="flex-1 py-3 px-5 rounded-full font-bold text-xs uppercase tracking-wider bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-[#F6C445] flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Plus size={15} />
              <span>Report Incident</span>
            </button>
          )}
          <button
            type="button"
            onClick={closeDrawer}
            className={`py-3 px-5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0B4A6E] transition-all shadow-2xs cursor-pointer active:scale-95 text-center ${
              onOpenReport ? "flex-1" : "w-full"
            }`}
          >
            CLOSE
          </button>
        </div>
      )}
    >
      <div className="space-y-4">
        {/* FILTER TOOLBAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-3 border-b border-gray-100">
          {/* Search with Search-on-Enter (Strategy B) */}
          <div className="relative">
            <input
              type="text"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setCommittedSearch(searchDraft.trim());
                  setPage(1);
                }
              }}
              placeholder="Search (Press Enter)..."
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-full py-2 pl-8 pr-7 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/20 transition-all"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            {searchDraft && (
              <button
                type="button"
                onClick={() => {
                  setSearchDraft("");
                  setCommittedSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => {
              setSelectedSeverity(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-gray-50 border border-gray-200 rounded-full py-2 px-3 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/20 transition-all cursor-pointer"
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
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-gray-50 border border-gray-200 rounded-full py-2 px-3 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/20 transition-all cursor-pointer"
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
          <div className="py-16 text-center text-xs text-gray-500 font-medium">
            Loading incident records...
          </div>
        ) : incidents.length > 0 ? (
          <div className="space-y-3">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-[#F8FBFC] hover:bg-[#E8F3F8]/70 border border-gray-100 rounded-2xl p-4 transition-colors duration-150 text-xs space-y-2.5 shadow-2xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#0A4B6E] text-sm">
                      {inc.plateNumber || "Truck"}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full font-semibold text-[10px]">
                      {inc.incidentTypeName?.replace(/_/g, " ") || "INCIDENT"}
                    </span>
                    {getSeverityBadge(inc.severity)}
                  </div>

                  <div className="text-[#5B8399] flex items-center gap-1 font-medium">
                    <Clock size={13} />
                    <span>{formatDate(inc.reportDate)}</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-3 text-gray-800 leading-relaxed font-sans text-xs shadow-2xs">
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

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div className="pt-2">
                <Pagination
                  currentPage={page}
                  totalPages={meta.totalPages}
                  totalItems={meta.totalItems}
                  limit={limit}
                  onPageChange={(p) => setPage(p)}
                  isLoading={isLoading}
                  itemLabel="incidents"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-400 space-y-2">
            <AlertOctagon size={42} className="mx-auto text-gray-300 stroke-[1.5]" />
            <p className="text-sm font-semibold text-gray-600">No incidents recorded</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {committedSearch || selectedSeverity !== "All" || selectedType !== "All"
                ? "No incident logs matched your filter criteria."
                : "No roadside breakdowns or mechanical incidents recorded."}
            </p>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}

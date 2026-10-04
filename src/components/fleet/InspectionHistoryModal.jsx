// src/components/fleet/InspectionHistoryModal.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  Plus,
  User,
  Clock,
  Search,
} from "lucide-react";
import { fleetApi } from "../../api/fleet.js";
import SideDrawer from "../ui/SideDrawer";
import Badge from "../ui/Badge";

/**
 * InspectionHistoryModal
 * Displays chronological safety inspection logs in a right-sliding panel
 * with search and multi-type filters matching the Incident Logs experience.
 */
export default function InspectionHistoryModal({
  isOpen,
  truck,
  onClose,
  onOpenInspect,
}) {
  const [inspections, setInspections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResult, setSelectedResult] = useState("All");
  const [selectedDispatch, setSelectedDispatch] = useState("All");

  const loadHistory = useCallback(async () => {
    if (!truck?.id) return;
    try {
      setIsLoading(true);
      const res = await fleetApi.getTruckInspections(truck.id);
      setInspections(res?.data?.inspections || []);
    } catch (err) {
      console.error("Failed to load inspection history:", err);
    } finally {
      setIsLoading(false);
    }
  }, [truck?.id]);

  useEffect(() => {
    if (isOpen && truck) {
      loadHistory();
    }
  }, [isOpen, truck, loadHistory]);

  // Filtered Inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter((insp) => {
      // 1. Result filter
      if (selectedResult !== "All" && insp.result !== selectedResult) {
        return false;
      }

      // 2. Dispatch status filter
      if (selectedDispatch === "DISPATCHED" && !insp.allowDispatch) {
        return false;
      }
      if (selectedDispatch === "GROUNDED" && insp.allowDispatch) {
        return false;
      }

      // 3. Search query filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const findings = (insp.findings || "").toLowerCase();
        const inspector = (insp.inspectorName || "").toLowerCase();
        const username = (insp.inspectorUsername || "").toLowerCase();
        return (
          findings.includes(q) ||
          inspector.includes(q) ||
          username.includes(q)
        );
      }

      return true;
    });
  }, [inspections, selectedResult, selectedDispatch, searchTerm]);

  if (!isOpen || !truck) return null;

  const getResultBadge = (result, allowDispatch) => {
    switch (result) {
      case "PASSED":
        return (
          <Badge variant="success" className="px-2.5 py-0.5 text-[10px] font-bold">
            PASSED
          </Badge>
        );
      case "NEEDS_ATTENTION":
        return (
          <span className="px-2.5 py-0.5 bg-[#FEF6D1] text-[#854D0E] border border-[#F6C445] rounded-full text-[10px] font-bold">
            NEEDS ATTENTION {allowDispatch === false ? "(GROUNDED)" : ""}
          </span>
        );
      case "FAILED":
        return (
          <Badge variant="danger" className="px-2.5 py-0.5 text-[10px] font-extrabold">
            FAILED (GROUNDED)
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="px-2 py-0.5 text-[10px]">
            {result}
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
      title="Safety Inspection History"
      subtitle={`${truck.plateNumber || "Truck"} • ${truck.model || "Isuzu Elf"}`}
      icon={ShieldCheck}
      badge={
        <Badge variant="neutral" className="px-2.5 py-0.5 text-[10px] font-bold">
          {truck.plateNumber || "Truck"}
        </Badge>
      }
      width="max-w-xl lg:max-w-2xl"
      footer={({ onClose: closeDrawer }) => (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          {onOpenInspect && (
            <button
              type="button"
              onClick={() => {
                onOpenInspect(truck);
              }}
              className="flex-1 py-3 px-5 rounded-full font-bold text-xs uppercase tracking-wider bg-white hover:bg-sky-50 text-[#0A4B6E] border-2 border-[#0A4B6E] flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Plus size={15} />
              <span>New Inspection</span>
            </button>
          )}
          <button
            type="button"
            onClick={closeDrawer}
            className={`py-3 px-5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0B4A6E] transition-all shadow-2xs cursor-pointer active:scale-95 text-center ${
              onOpenInspect ? "flex-1" : "w-full"
            }`}
          >
            CLOSE
          </button>
        </div>
      )}
    >
      <div className="space-y-4">
        {/* FILTER TOOLBAR (Search + Result + Dispatch Condition) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-3 border-b border-gray-100">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search findings, inspector..."
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-full py-2 pl-8 pr-3 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/20 transition-all"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          </div>

          {/* Inspection Result Filter */}
          <select
            value={selectedResult}
            onChange={(e) => setSelectedResult(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-full py-2 px-3 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/20 transition-all cursor-pointer"
          >
            <option value="All">All Results</option>
            <option value="PASSED">Passed</option>
            <option value="NEEDS_ATTENTION">Needs Attention</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Dispatch Status Filter */}
          <select
            value={selectedDispatch}
            onChange={(e) => setSelectedDispatch(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-full py-2 px-3 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/20 transition-all cursor-pointer"
          >
            <option value="All">All Dispatch Conditions</option>
            <option value="DISPATCHED">Cleared for Dispatch</option>
            <option value="GROUNDED">Grounded from Dispatch</option>
          </select>
        </div>

        {/* INSPECTION LOGS LIST */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-gray-500 font-medium">
            Loading inspection history...
          </div>
        ) : filteredInspections.length > 0 ? (
          <div className="space-y-3">
            {filteredInspections.map((insp) => (
              <div
                key={insp.id}
                className="bg-[#F8FBFC] hover:bg-[#E8F3F8]/70 border border-gray-100 rounded-2xl p-4 transition-colors duration-150 text-xs space-y-2.5 shadow-2xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getResultBadge(insp.result, insp.allowDispatch)}
                    <span className="text-gray-300">•</span>
                    <span className="text-[#5B8399] flex items-center gap-1 font-medium">
                      <Clock size={13} />
                      {formatDate(insp.inspectionDate)}
                    </span>
                  </div>

                  <div className="text-gray-600 flex items-center gap-1 font-medium">
                    <User size={13} className="text-[#5B8399]" />
                    <span>{insp.inspectorName || "Logistics Supervisor"}</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-3 text-gray-800 leading-relaxed font-sans text-xs shadow-2xs">
                  {insp.findings}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-400 space-y-2">
            <ShieldCheck size={42} className="mx-auto text-gray-300 stroke-[1.5]" />
            <p className="text-sm font-semibold text-gray-600">No inspection logs found</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {searchTerm || selectedResult !== "All" || selectedDispatch !== "All"
                ? "No inspection records matched your active search or filter criteria."
                : "No physical safety inspections have been conducted on this vehicle yet."}
            </p>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}

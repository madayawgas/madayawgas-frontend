// src/components/fleet/InspectionHistoryModal.jsx
import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Plus, Calendar, User, Clock, AlertTriangle, AlertOctagon, CheckCircle2 } from "lucide-react";
import { fleetApi } from "../../api/fleet.js";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

/**
 * InspectionHistoryModal
 * Displays chronological safety inspection logs for a specific truck.
 */
export default function InspectionHistoryModal({
  isOpen,
  truck,
  onClose,
  onOpenInspect,
}) {
  const [inspections, setInspections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterResult, setFilterResult] = useState("All");

  const loadHistory = useCallback(async () => {
    if (!truck?.id) return;
    try {
      setIsLoading(true);
      const res = await fleetApi.getTruckInspections(truck.id, {
        result: filterResult === "All" ? undefined : filterResult,
      });
      setInspections(res?.data?.inspections || []);
    } catch (err) {
      console.error("Failed to load inspection history:", err);
    } finally {
      setIsLoading(false);
    }
  }, [truck?.id, filterResult]);

  useEffect(() => {
    if (isOpen && truck) {
      loadHistory();
    }
  }, [isOpen, truck, loadHistory]);

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Safety Inspection History"
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          {onOpenInspect ? (
            <Button
              type="button"
              variant="yellow"
              onClick={() => {
                onClose();
                onOpenInspect(truck);
              }}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
            >
              <Plus size={14} />
              <span>New Inspection</span>
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
        {/* TRUCK CONTEXT & FILTER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-base text-[#0A4B6E]">
              {truck.plateNumber || "Truck"}
            </h3>
            <p className="text-xs text-[#5B8399]">
              {truck.model || "Isuzu Elf"} • Driver: {truck.driverName || "No Assigned"}
            </p>
          </div>

          {/* OUTCOME FILTER PILLS */}
          <div className="flex items-center gap-1.5 bg-[#F3F5F5] p-1 rounded-xl">
            {["All", "PASSED", "NEEDS_ATTENTION", "FAILED"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFilterResult(opt)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterResult === opt
                    ? "bg-[#0A4B6E] text-white shadow-xs"
                    : "text-[#5B8399] hover:text-[#0A4B6E]"
                }`}
              >
                {opt === "NEEDS_ATTENTION" ? "Needs Attn" : opt}
              </button>
            ))}
          </div>
        </div>

        {/* LOGS LIST */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-gray-500 font-medium">
            Loading inspection history...
          </div>
        ) : inspections.length > 0 ? (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {inspections.map((insp) => (
              <div
                key={insp.id}
                className="bg-[#F8FBFC] hover:bg-[#EBF5FB] border border-gray-100 rounded-xl p-3.5 transition-colors text-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getResultBadge(insp.result, insp.allowDispatch)}
                    <span className="text-gray-400">•</span>
                    <span className="text-[#5B8399] flex items-center gap-1">
                      <Clock size={13} />
                      {formatDate(insp.inspectionDate)}
                    </span>
                  </div>

                  <div className="text-gray-600 flex items-center gap-1 font-medium">
                    <User size={13} className="text-[#5B8399]" />
                    <span>{insp.inspectorName || "Logistics Supervisor"}</span>
                  </div>
                </div>

                <div className="bg-white/80 border border-gray-100 rounded-lg p-2.5 text-gray-800 leading-relaxed font-sans">
                  {insp.findings}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 space-y-2">
            <ShieldCheck size={36} className="mx-auto text-gray-300 stroke-[1.5]" />
            <p className="text-sm font-medium">No inspection logs found</p>
            <p className="text-xs">
              {filterResult !== "All"
                ? `No inspections matched "${filterResult}".`
                : "No physical safety inspections have been conducted on this vehicle yet."}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

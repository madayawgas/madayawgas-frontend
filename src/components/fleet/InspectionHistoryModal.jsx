// src/components/fleet/InspectionHistoryModal.jsx
import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Plus, Calendar, User, Clock, AlertTriangle, AlertOctagon, CheckCircle2 } from "lucide-react";
import { fleetApi } from "../../api/fleet.js";
import SideDrawer from "../ui/SideDrawer";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

/**
 * InspectionHistoryModal
 * Displays chronological safety inspection logs in a right-sliding panel.
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
        {/* OUTCOME FILTER PILLS */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <span className="text-xs font-semibold text-[#6D8AA2]">Filter by Outcome:</span>
          <div className="flex items-center gap-1.5 bg-[#F3F5F5] p-1 rounded-full">
            {["All", "PASSED", "NEEDS_ATTENTION", "FAILED"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFilterResult(opt)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
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
          <div className="py-16 text-center text-xs text-gray-500 font-medium">
            Loading inspection history...
          </div>
        ) : inspections.length > 0 ? (
          <div className="space-y-3">
            {inspections.map((insp) => (
              <div
                key={insp.id}
                className="bg-[#F8FBFC] hover:bg-[#EBF5FB] border border-gray-100 rounded-2xl p-4 transition-colors text-xs space-y-2.5 shadow-2xs"
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
              {filterResult !== "All"
                ? `No inspection records matched "${filterResult}".`
                : "No physical safety inspections have been conducted on this vehicle yet."}
            </p>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}

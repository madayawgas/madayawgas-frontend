import { useState, useEffect, useRef } from "react";
import { Funnel } from "lucide-react";
import Button from "../../ui/Button";

const STATUS_OPTIONS = [
  { key: "ALL", label: "All Statuses", activeBg: "bg-[#0A4B6E] text-white border-[#0A4B6E]", inactiveBg: "bg-[#F3F5F5] text-gray-700 border-gray-200" },
  { key: "PENDING", label: "Pending Approval", activeBg: "bg-amber-600 text-white border-amber-600", inactiveBg: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "APPROVED", label: "Approved", activeBg: "bg-blue-600 text-white border-blue-600", inactiveBg: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "SCHEDULED", label: "Scheduled", activeBg: "bg-purple-600 text-white border-purple-600", inactiveBg: "bg-purple-50 text-purple-700 border-purple-200" },
  { key: "IN_PROGRESS", label: "In Progress", activeBg: "bg-amber-600 text-white border-amber-600", inactiveBg: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "COMPLETED", label: "Completed", activeBg: "bg-emerald-600 text-white border-emerald-600", inactiveBg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { key: "CANCELLED", label: "Cancelled", activeBg: "bg-rose-600 text-white border-rose-600", inactiveBg: "bg-rose-50 text-rose-700 border-rose-200" },
];

export default function FilterWorkOrder({
  label = "Filter Status",
  selectedStatus = "ALL",
  onApply,
  pendingCount = 0,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(selectedStatus);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setStatus(selectedStatus);
  }, [selectedStatus]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApply = () => {
    if (onApply) {
      onApply(status);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setStatus("ALL");
    if (onApply) {
      onApply("ALL");
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`bg-[#FCFEFE] hover:bg-[#F3F8FB] text-[#0A4B6E] px-3 py-1.5 rounded-full text-xs font-semibold border border-[#0A4B6E]/30 hover:border-[#0A4B6E]/60 flex items-center gap-1.5 transition-all duration-150 h-[30px] min-w-[110px] justify-between cursor-pointer shadow-2xs ${className}`}
      >
        <span>{label}</span>
        <Funnel size={12} className="text-[#0A4B6E] shrink-0" />
      </button>

      {/* Filter Card Dropdown */}
      <div
        className={`absolute right-0 mt-1.5 w-[290px] bg-white border border-[#0A4B6E]/20 rounded-2xl shadow-xl z-50 p-3.5 origin-top-right transition-all duration-150 ease-out ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-1.5 text-[#0A4B6E] font-bold text-xs">
            <Funnel size={12} className="text-[#0A4B6E]" />
            <span>Filter Work Orders</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-[10px] font-bold text-gray-400 hover:text-gray-700 uppercase tracking-wider cursor-pointer"
          >
            CLOSE
          </button>
        </div>

        {/* Status Selection Group */}
        <div className="mb-3 text-left">
          <label className="block text-[11px] font-bold text-[#0A4B6E] mb-1.5 uppercase tracking-wide">
            Work Order Status:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = status === opt.key;
              const hasBadge = opt.key === "PENDING" && pendingCount > 0;

              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStatus(opt.key)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                    isSelected ? opt.activeBg : `${opt.inactiveBg} opacity-80 hover:opacity-100`
                  }`}
                >
                  <span>{opt.label}</span>
                  {hasBadge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-white font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <Button
            variant="secondary"
            onClick={handleClear}
            className="!px-2.5 !py-1 !text-[10px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wider !rounded-full !h-[26px]"
          >
            CLEAR ALL
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            className="!px-3 !py-1 !text-[10px] font-bold uppercase tracking-wider !rounded-full !h-[26px]"
          >
            APPLY FILTER
          </Button>
        </div>
      </div>
    </div>
  );
}

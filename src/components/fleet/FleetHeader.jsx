// src/components/fleet/FleetHeader.jsx
import { Plus } from "lucide-react";

export default function FleetHeader({ onAddTruck, canCreate = true }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#6D8AA2] mb-6">
      <h1 className="text-2xl md:text-[32px] font-bold text-[#1B4B75]">
        Fleet Board
      </h1>

      {canCreate && (
        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          <button
            type="button"
            onClick={onAddTruck}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-[#0A4B6E] text-[#0A4B6E] font-semibold text-xs px-4 py-2.5 rounded-full transition-colors cursor-pointer shadow-xs active:scale-95"
          >
            <Plus size={16} />
            <span>Add New Fleet</span>
          </button>
        </div>
      )}
    </div>
  );
}
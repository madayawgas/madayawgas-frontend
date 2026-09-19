import { Plus } from "lucide-react";

export default function ItemHeader({ onAddItem, canCreate = true }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#6D8AA2] mb-6">
      <h1 className="text-2xl md:text-[32px] font-bold text-[#1B4B75]">
        Item Profile
      </h1>

      {canCreate && (
        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          <button
            type="button"
            onClick={onAddItem}
            className="flex items-center gap-2 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs md:text-sm px-4 py-2.5 rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Item</span>
          </button>
        </div>
      )}
    </div>
  );
}

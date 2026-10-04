// src/components/items/ItemCard.jsx
import { List, Package, Flame } from "lucide-react";
import Badge from "../ui/Badge";

export default function ItemCard({ item, isSelected = false, onClick }) {
  const isActive =
    item.isActive !== undefined
      ? Boolean(item.isActive)
      : (item.status || "").toUpperCase() === "ACTIVE";
  const statusLabel = isActive ? "ACTIVE" : "INACTIVE";

  const isCylinder =
    (item.containerType || item.category || "").toUpperCase().includes("CYLINDER") ||
    (item.category || "").toUpperCase().includes("TANK");

  const getItemIcon = () => {
    if (isCylinder) {
      return <Flame size={16} />;
    }
    return <Package size={16} />;
  };

  const formattedWeight = () => {
    if (item.netWeightKg === undefined || item.netWeightKg === null) return "0.250 kg";
    const val = Number(item.netWeightKg);
    return `${val % 1 === 0 ? val.toFixed(1) : val.toFixed(3)} kg`;
  };

  return (
    <div
      onClick={() => onClick && onClick(item)}
      className={`relative transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between rounded-2xl p-4 sm:p-5 border text-left ${
        isSelected
          ? "bg-slate-100/90 border-slate-300 shadow-sm"
          : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
      }`}
    >
      <div>
        {/* CARD HEADER */}
        <div
          className={`rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 mb-3.5 transition-all duration-200 border ${
            isSelected
              ? "bg-white text-[#0A4B6E] border-slate-200/80 shadow-2xs"
              : "bg-[#F4F8FA] text-[#0A4B6E] border-slate-200/80"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold shadow-xs bg-[#0A4B6E] text-[#FFDF2C]">
              {getItemIcon()}
            </div>
            <h3 className="font-bold text-base sm:text-lg tracking-wide truncate">
              {item.name || item.itemName || "Product Item"}
            </h3>
          </div>
          <Badge variant="roles" className="text-[10px] px-2 py-0.5 shrink-0 font-semibold">
            {item.category || "LPG"}
          </Badge>
        </div>

        {/* CARD BODY */}
        <div className="space-y-2 text-xs md:text-[13px] leading-relaxed mb-3 px-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#6D8AA2] font-medium">Category:</span>
            <span className="font-bold text-[#0A4B6E] truncate max-w-[60%] text-right">
              {item.category || "LPG Cylinder"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[#6D8AA2] font-medium">Container Type:</span>
            <span className="font-bold text-[#0A4B6E] truncate max-w-[60%] text-right uppercase">
              {item.containerType || (isCylinder ? "CYLINDER" : "CANISTER")}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[#6D8AA2] font-medium">Net Weight:</span>
            <span className="font-bold font-mono text-[#0A4B6E]">
              {formattedWeight()}
            </span>
          </div>
        </div>
      </div>

      {/* CARD FOOTER */}
      <div
        className={`flex items-center justify-between mt-auto pt-2.5 border-t px-0.5 ${
          isSelected ? "border-slate-200/80" : "border-slate-100"
        }`}
      >
        <Badge
          variant={isActive ? "success" : "deactivated"}
          className="px-3 py-0.5 text-[10.5px] font-bold shrink-0"
        >
          {statusLabel}
        </Badge>

        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 border shadow-2xs shrink-0 ml-2 ${
            isSelected
              ? "bg-[#0A4B6E] text-[#FFDF2C] border-slate-300"
              : "bg-[#F4F8FA] text-[#0A4B6E] border-slate-200"
          }`}
          title="View Item Details"
        >
          <List size={14} className="stroke-[2.2]" />
        </div>
      </div>
    </div>
  );
}

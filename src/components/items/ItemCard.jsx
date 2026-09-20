// src/components/items/ItemCard.jsx
import { List, Package, Flame } from "lucide-react";
import Badge from "../ui/Badge";

export default function ItemCard({ item, onClick }) {
  const isActive = item.isActive !== undefined ? item.isActive : item.status === "ACTIVE";
  const statusLabel = isActive ? "ACTIVE" : "INACTIVE";

  const getItemIcon = (containerType, category) => {
    const type = (containerType || category || "").toUpperCase();
    if (type.includes("CYLINDER") || type.includes("TANK")) {
      return <Flame size={16} />;
    }
    return <Package size={16} />;
  };

  return (
    <div
      onClick={() => onClick && onClick(item)}
      className="group bg-[#E8F3F8] hover:bg-[#FEF6D1] transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between rounded-2xl p-5 border border-[#BCE1F1] hover:border-[#F6C445]/60 shadow-xs"
    >
      {/* CARD HEADER PILL */}
      <div className="bg-[#BAE6FD]/60 group-hover:bg-[#FEECA5] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2.5 mb-3.5 text-[#0A4B6E] group-hover:text-[#854D0E] transition-all duration-200 border border-[#BCE1F1]/50 group-hover:border-[#F6C445]/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#0A4B6E] group-hover:bg-[#854D0E] text-[#FFDF2C] flex items-center justify-center shrink-0 font-bold shadow-xs transition-colors">
            {getItemIcon(item.containerType, item.category)}
          </div>
          <h3 className="font-bold text-base sm:text-lg tracking-wide truncate">
            {item.name || item.itemName || item.itemCode || "Product Item"}
          </h3>
        </div>
        <Badge variant="roles" className="text-[10px] px-2 py-0.5 shrink-0">
          {item.category || "LPG"}
        </Badge>
      </div>

      {/* CARD BODY */}
      <div className="space-y-2 text-xs md:text-[13px] leading-relaxed mb-4 px-0.5 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[#5B8399] group-hover:text-[#A88B3D] transition-colors font-medium">Category:</span>
          <span className="font-bold text-[#0A4B6E] group-hover:text-[#854D0E] transition-colors">{item.category || "Canister"}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[#5B8399] group-hover:text-[#A88B3D] transition-colors font-medium">Container Type:</span>
          <span className="font-bold text-[#0A4B6E] group-hover:text-[#854D0E] transition-colors">{item.containerType || "CANISTER"}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[#5B8399] group-hover:text-[#A88B3D] transition-colors font-medium">Net Weight (kg):</span>
          <span className="font-bold text-[#0A4B6E] group-hover:text-[#854D0E] transition-colors">
            {item.netWeightKg !== undefined ? `${Number(item.netWeightKg).toFixed(3)} kg` : "0.250 kg"}
          </span>
        </div>
      </div>

      {/* CARD FOOTER */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#BCE1F1]/40 group-hover:border-[#F6C445]/30 transition-colors px-0.5">
        <Badge
          variant={isActive ? "success" : "deactivated"}
          className="px-3.5 py-0.5 text-[10.5px]"
        >
          {statusLabel}
        </Badge>

        <div className="w-8 h-8 rounded-full bg-[#BAE6FD]/70 group-hover:bg-[#FFDF2C] text-[#0A4B6E] group-hover:text-[#0A4B6E] flex items-center justify-center transition-all duration-200 border border-[#BCE1F1]/60 group-hover:border-[#F6C445] shadow-2xs">
          <List size={15} className="stroke-[2.2]" />
        </div>
      </div>
    </div>
  );
}

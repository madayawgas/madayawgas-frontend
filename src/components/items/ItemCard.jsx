import { List, Package, Flame } from "lucide-react";

export default function ItemCard({ item, onClick }) {
  const isActive = item.isActive !== undefined ? item.isActive : item.status === "ACTIVE";
  const statusLabel = isActive ? "ACTIVE" : "INACTIVE";

  const getBadgeStyle = (active) => {
    return active ? "bg-[#10B981] text-white" : "bg-[#64748B] text-white";
  };

  const getItemIcon = (containerType, category) => {
    const type = (containerType || category || "").toUpperCase();
    if (type.includes("CYLINDER") || type.includes("TANK")) {
      return <Flame size={22} className="fill-[#0A4B6E] group-hover:fill-[#854D0E] stroke-[1.2] transition-colors flex-shrink-0" />;
    }
    return <Package size={22} className="fill-[#0A4B6E] group-hover:fill-[#854D0E] stroke-[1.2] transition-colors flex-shrink-0" />;
  };

  return (
    <div
      onClick={() => onClick && onClick(item)}
      className="group bg-[#DDF4FF] hover:bg-[#FEF6D1] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between rounded-2xl p-4 sm:p-5 border border-transparent hover:border-[#F6C445]/40"
    >
      {/* CARD HEADER PILL: Container for item icon + item name */}
      <div className="bg-[#BAE6FD]/70 group-hover:bg-[#FEECA5] rounded-xl px-4 py-2.5 flex items-center gap-2.5 mb-3 text-[#0A4B6E] group-hover:text-[#854D0E] transition-all duration-200">
        {getItemIcon(item.containerType, item.category)}
        <h3 className="font-bold text-base sm:text-lg tracking-wide truncate">
          {item.name || item.itemName || item.itemCode || "Product Item"}
        </h3>
      </div>

      {/* CARD BODY: Category, Container Type, Net Weight */}
      <div className="space-y-1.5 text-[12.5px] leading-relaxed mb-4 px-0.5 text-left">
        <p className="text-[#5B8399] group-hover:text-[#A88B3D] transition-colors truncate">
          Category:{" "}
          <span className="font-bold text-[#0A4B6E] group-hover:text-[#854D0E] transition-colors">
            {item.category || "Canister"}
          </span>
        </p>

        <p className="text-[#5B8399] group-hover:text-[#A88B3D] transition-colors truncate">
          Container Type:{" "}
          <span className="font-bold text-[#0A4B6E] group-hover:text-[#854D0E] transition-colors">
            {item.containerType || "CANISTER"}
          </span>
        </p>

        <p className="text-[#5B8399] group-hover:text-[#A88B3D] transition-colors truncate">
          Net Weight (kg):{" "}
          <span className="font-bold text-[#0A4B6E] group-hover:text-[#854D0E] transition-colors">
            {item.netWeightKg !== undefined ? `${Number(item.netWeightKg).toFixed(3)} kg` : "0.250 kg"}
          </span>
        </p>
      </div>

      {/* CARD FOOTER: Status Badge Pill + List Action Icon */}
      <div className="flex items-center justify-between mt-auto pt-1 px-0.5">
        <span
          className={`px-4 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-xs ${getBadgeStyle(
            isActive
          )}`}
        >
          {statusLabel}
        </span>

        {/* Action / Detail squircle button */}
        <div className="w-8 h-8 rounded-lg bg-[#BAE6FD]/70 group-hover:bg-[#FEECA5] flex items-center justify-center text-[#0A4B6E] group-hover:text-[#854D0E] transition-all duration-200">
          <List size={16} className="stroke-[2.2]" />
        </div>
      </div>
    </div>
  );
}

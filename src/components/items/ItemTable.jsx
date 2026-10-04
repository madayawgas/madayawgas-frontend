// src/components/items/ItemTable.jsx
import { Package, Flame, ArrowRight, Layers } from "lucide-react";
import Badge from "../ui/Badge";

export default function ItemTable({
  items = [],
  selectedItem,
  onSelectItem,
  sortConfig = { key: "name", direction: "asc" },
  onSort,
}) {
  const getItemIcon = (containerType, category) => {
    const type = (containerType || category || "").toUpperCase();
    if (type.includes("CYLINDER") || type.includes("TANK")) {
      return <Flame size={15} className="text-[#FFDF2C]" />;
    }
    return <Package size={15} className="text-[#FFDF2C]" />;
  };

  const formattedWeight = (netWeightKg) => {
    if (netWeightKg === undefined || netWeightKg === null) return "0.250 kg";
    const val = Number(netWeightKg);
    return `${val % 1 === 0 ? val.toFixed(1) : val.toFixed(3)} kg`;
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead className="bg-[#0D4B6E] text-white text-xs md:text-sm sticky top-0 z-10 shadow-xs select-none">
            <tr>
              <th
                className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[32%] min-w-[180px]"
                onClick={() => onSort && onSort("name")}
              >
                Product Name{" "}
                {sortConfig.key === "name" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th
                className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[20%] min-w-[130px]"
                onClick={() => onSort && onSort("category")}
              >
                Category{" "}
                {sortConfig.key === "category" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th
                className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[18%] min-w-[120px]"
                onClick={() => onSort && onSort("containerType")}
              >
                Container Type{" "}
                {sortConfig.key === "containerType" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th
                className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[16%] min-w-[110px]"
                onClick={() => onSort && onSort("netWeightKg")}
              >
                Net Weight{" "}
                {sortConfig.key === "netWeightKg" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th
                className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] text-center cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[10%] min-w-[90px]"
                onClick={() => onSort && onSort("isActive")}
              >
                Status{" "}
                {sortConfig.key === "isActive" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] text-center whitespace-nowrap w-[4%] min-w-[50px]">
                {/* Action arrow */}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
            {items.length > 0 ? (
              items.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const isActive =
                  item.isActive !== undefined
                    ? Boolean(item.isActive)
                    : (item.status || "").toUpperCase() === "ACTIVE";

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem && onSelectItem(item)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? "bg-[#E2EDF3] border-l-4 border-l-[#0A4B6E] font-medium"
                        : "hover:bg-[#F4F8FA]"
                    }`}
                  >
                    {/* PRODUCT NAME & ICON */}
                    <td className="py-3 px-3 md:px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 shadow-2xs">
                          {getItemIcon(item.containerType, item.category)}
                        </div>
                        <span className="font-bold text-[#0A4B6E] truncate max-w-[200px] sm:max-w-xs">
                          {item.name || item.itemName || "Product"}
                        </span>
                      </div>
                    </td>

                    {/* CATEGORY */}
                    <td className="py-3 px-3 md:px-4">
                      <span className="text-slate-700 font-medium">
                        {item.category || "LPG"}
                      </span>
                    </td>

                    {/* CONTAINER TYPE */}
                    <td className="py-3 px-3 md:px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.containerType || "CYLINDER"}
                      </span>
                    </td>

                    {/* NET WEIGHT */}
                    <td className="py-3 px-3 md:px-4">
                      <span className="font-mono font-bold text-[#0A4B6E]">
                        {formattedWeight(item.netWeightKg)}
                      </span>
                    </td>

                    {/* STATUS BADGE */}
                    <td className="py-3 px-3 md:px-4 text-center">
                      <Badge
                        variant={isActive ? "success" : "deactivated"}
                        className="px-2.5 py-0.5 text-[10.5px] font-bold"
                      >
                        {isActive ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </td>

                    {/* ROW ACTION */}
                    <td className="py-3 px-3 md:px-4 text-center">
                      <div className="w-6 h-6 rounded-full bg-slate-100 hover:bg-[#0A4B6E] text-slate-500 hover:text-white flex items-center justify-center transition-colors mx-auto">
                        <ArrowRight size={12} />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Layers size={24} className="text-slate-300" />
                    <span>No product records available</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

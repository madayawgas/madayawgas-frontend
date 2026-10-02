// src/components/dashboard/FleetStatusCards.jsx
import { useNavigate } from "react-router-dom";
import { Truck, Wrench } from "lucide-react";

export default function FleetStatusCards({
  counts = { available: 0, inUse: 0, maintenance: 0, underRepair: 0 },
}) {
  const navigate = useNavigate();

  const {
    available = 0,
    inUse = 0,
    maintenance = 0,
    underRepair = 0,
  } = counts;

  const cards = [
    {
      id: "available",
      label: "Available",
      count: available,
      icon: Truck,
      bg: "bg-[#FFF9D6] border-[#FFE866]/60 hover:border-[#FFE866]",
      textColor: "text-[#0A4B6E]",
      iconBg: "bg-[#FFE866] text-[#0A4B6E]",
    },
    {
      id: "in-use",
      label: "In Use",
      count: inUse,
      icon: Truck,
      bg: "bg-[#E6F4FA] border-[#BCE1F1]/80 hover:border-[#0A4B6E]/30",
      textColor: "text-[#0A4B6E]",
      iconBg: "bg-[#FFE866] text-[#0A4B6E]",
    },
    {
      id: "maintenance",
      label: "Maintenance",
      count: maintenance,
      icon: Wrench,
      bg: "bg-[#E6F4FA] border-[#BCE1F1]/80 hover:border-[#0A4B6E]/30",
      textColor: "text-[#0A4B6E]",
      iconBg: "bg-[#FFE866] text-[#0A4B6E]",
    },
    {
      id: "under-repair",
      label: "Under Repair",
      count: underRepair,
      icon: Wrench,
      bg: "bg-[#FFF9D6] border-[#FFE866]/60 hover:border-[#FFE866]",
      textColor: "text-[#0A4B6E]",
      iconBg: "bg-[#FFE866] text-[#0A4B6E]",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 w-full h-full">
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            onClick={() => navigate("/fleet")}
            className={`group ${item.bg} border p-5 sm:p-6 rounded-3xl flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer min-h-[125px] sm:min-h-[140px]`}
          >
            {/* Top Row: Category Label + Brand Yellow Icon Badge */}
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${item.textColor} truncate`}>
                {item.label}
              </span>
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${item.iconBg} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
            </div>

            {/* Bottom Row: Big Bold Metric Number */}
            <div className="mt-3">
              <span className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold font-mono ${item.textColor} tracking-tight leading-none`}>
                {item.count}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

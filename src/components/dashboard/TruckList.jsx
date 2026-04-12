import { Truck } from "lucide-react";
import Card from "../ui/Card";

export default function TruckList({ title, trucks, status }) {
  // Determine styles based on whether it's 'available' or 'maintenance'
  const isAvailable = status === "available";
  const containerBg = isAvailable ? "bg-[#E2F4E9]" : "bg-[#E2EAF4]";
  const textColor = isAvailable ? "text-[#1C7351]" : "text-[#1B4B75]";

  return (
    <Card className="flex-1 flex flex-col max-h-[350px]">
      {/* shrink-0 keeps the title from shrinking when the list is long */}
      <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-800 mb-4 shrink-0">
        {title}
      </h3>
      
      {/* overflow-y-auto adds the vertical scrollbar. pr-2 adds padding so the scrollbar doesn't overlap the items */}
      <div className="flex flex-col gap-3 overflow-y-auto pr-2">
        {trucks.map((truck, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold shrink-0 ${containerBg} ${textColor}`}
          >
            <Truck size={20} />
            <span>{truck}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
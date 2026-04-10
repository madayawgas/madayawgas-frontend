import { Truck } from "lucide-react";
import TruckStatus from "./TruckStatus";

export default function TruckCard({ truck, onClick }) {
  return (
    <div 
      onClick={() => onClick(truck)}
      className="bg-[#F8FBFC] border border-[#E2EAF4] rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col"
    >
      {/* Header: Icon and Plate/ID */}
      <div className="flex items-center gap-3 text-[#1B4B75] mb-2">
        <Truck size={24} />
        <h3 className="font-bold text-lg">{truck.plate || `Truck #${truck.id}`}</h3>
      </div>
      
      {/* Blue Separator Line */}
      <hr className="border-[#1B4B75] border-t-2 opacity-20 mb-4" />

      {/* Details */}
      <div className="text-sm text-gray-800 space-y-2 mb-6 flex-1">
        <p>Driver Name: <span className="font-medium">{truck.driver}</span></p>
        <p>Current Odometer Value: <span className="font-medium">{truck.odometer || "0 KM"}</span></p>
        <p>Capacity: <span className="font-medium">{truck.capacity}</span></p>
      </div>

      {/* Footer Status Pill */}
      <div className="mt-auto">
        <TruckStatus status={truck.status} />
      </div>
    </div>
  );
}
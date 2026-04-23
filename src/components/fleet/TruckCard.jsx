// src/components/fleet/TruckCard.jsx
import { Truck } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";

export default function TruckCard({ truck, onClick }) {
  const getBadgeVariant = (status) => {
    switch(status) {
      case "AVAILABLE": return "success";
      case "UNDER_MAINTENANCE": return "maintenance";
      case "IN_SHOP": return "neutral";
      case "IN_USE": return "info";
      default: return "warning";
    }
  };

  return (
    <Card onClick={() => onClick(truck)} className="flex flex-col h-full bg-[#F1F5F9]! hover:-translate-y-1 transition-transform duration-200">
      <div className="flex items-center gap-3 text-[#1B4B75] mb-2">
        <Truck size={24} />
        <h3 className="font-bold text-lg">{truck.plateNumber || `Truck #${truck.truckId}`}</h3>
      </div>
      
      <hr className="border-[#1B4B75] border-t-2 opacity-20 mb-4" />

      <div className="text-sm text-gray-800 space-y-2 mb-6 flex-1">
        <p>Driver Name: <span className="font-medium">{truck.driverName}</span></p>
        <p>Truck Model: <span className="font-medium">{truck.yearModel} {truck.model}</span></p>
        <p>Odometer: <span className="font-medium">{truck.currentOdometer?.toLocaleString() || 0} KM</span></p>
      </div>

      <div className="mt-auto">
        <Badge variant={getBadgeVariant(truck.status)}>
          {truck.status.replace("_", " ")}
        </Badge>
      </div>
    </Card>
  );
}
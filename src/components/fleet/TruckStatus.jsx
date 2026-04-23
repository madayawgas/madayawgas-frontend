// src/components/ui/TruckStatus.jsx
export default function TruckStatus({ status }) {
  // 1. Default Style: Gray scales are used if the status is unknown or undefined
  let colors = "bg-gray-100 text-gray-600 border-gray-300"; 
  
  // 2. Normalization: Ensures the comparison works regardless of casing from the API
  const normalized = status?.toUpperCase() || "";

  // 3. Status Mapping: Assigns a color identity to each operational state
  // Blue for active use, Green for ready to go, Purple for service, etc.
  if (normalized === "IN USE") colors = "bg-[#E3F2FD] text-[#1E88E5] border-[#90CAF9]";
  if (normalized === "AVAILABLE") colors = "bg-[#E8F5E9] text-[#43A047] border-[#A5D6A7]";
  if (normalized === "UNDER MAINTENANCE") colors = "bg-[#F3E5F5] text-[#8E24AA] border-[#CE93D8]";
  if (normalized === "IN SHOP") colors = "bg-[#ECEFF1] text-[#546E7A] border-[#B0BEC5]";

  return (
    // 4. Styling: "Rounded-full" creates the pill/capsule shape common in modern dashboards
    <span className={`px-3 py-0.5 text-[10px] font-bold rounded-full border uppercase ${colors}`}>
      {status}
    </span>
  );
}
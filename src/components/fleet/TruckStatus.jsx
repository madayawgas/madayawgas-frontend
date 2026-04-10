export default function TruckStatus({ status }) {
  // Determine styles based on the exact text of the status
  let colors = "bg-gray-100 text-gray-600 border-gray-300"; // Default
  
  const normalized = status?.toUpperCase() || "";
  if (normalized === "IN USE") colors = "bg-[#E3F2FD] text-[#1E88E5] border-[#90CAF9]";
  if (normalized === "AVAILABLE") colors = "bg-[#E8F5E9] text-[#43A047] border-[#A5D6A7]";
  if (normalized === "UNDER REPAIR") colors = "bg-[#F3E5F5] text-[#8E24AA] border-[#CE93D8]";
  if (normalized === "IN SHOP") colors = "bg-[#ECEFF1] text-[#546E7A] border-[#B0BEC5]";

  return (
    <span className={`px-3 py-0.5 text-[10px] font-bold rounded-full border uppercase ${colors}`}>
      {status}
    </span>
  );
}
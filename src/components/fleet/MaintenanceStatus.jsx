export default function MaintenanceStatus({ status }) {
  let colors = "bg-gray-100 text-gray-600 border-gray-300"; // Default
  
  const normalized = status?.toUpperCase() || "";
  if (normalized === "CRITICAL") colors = "bg-[#FFEBEE] text-[#D32F2F] border-[#EF9A9A]";
  if (normalized === "MAJOR") colors = "bg-[#F9C5A0] text-[#B45207] border-[#D37B38]";
  if (normalized === "MINOR") colors = "bg-[#FFED96] text-[#8B6C05] border-[#AA8E30]";

  return (
    <span className={`px-3 py-0.5 text-[10px] font-bold rounded-full border uppercase shadow-sm ${colors}`}>
      {status}
    </span>
  );
}
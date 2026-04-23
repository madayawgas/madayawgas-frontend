// src/components/ui/MaintenanceStatus.jsx
export default function MaintenanceStatus({ status }) {
  // Set a fallback style in case the status is missing or unrecognized
  let colors = "bg-gray-100 text-gray-600 border-gray-300"; 
  
  // Normalize input: Convert to uppercase to prevent "Critical" vs "CRITICAL" bugs
  const normalized = status?.toUpperCase() || "";

  // Conditional Logic: Assign different color palettes based on the severity level
  // Logic follows a "Traffic Light" system: Red for Critical, Orange for Major, Yellow for Minor
  if (normalized === "CRITICAL") colors = "bg-[#FFEBEE] text-[#D32F2F] border-[#EF9A9A]";
  if (normalized === "MAJOR") colors = "bg-[#F9C5A0] text-[#B45207] border-[#D37B38]";
  if (normalized === "MINOR") colors = "bg-[#FFED96] text-[#8B6C05] border-[#AA8E30]";

  return (
    // Dynamic Class Name: We combine "static" styles (padding/font) with our "dynamic" color variable
    <span className={`px-3 py-0.5 text-[10px] font-bold rounded-full border uppercase shadow-sm ${colors}`}>
      {status}
    </span>
  );
}
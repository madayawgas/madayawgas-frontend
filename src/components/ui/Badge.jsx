export default function Badge({ 
  children, 
  variant = "neutral", 
  className = "" 
}) {
  const variants = {
    success: "bg-[#E6F4EA] text-[#1E8E3E] border-[#CEEAD6]", // Green
    warning: "bg-[#FEF7E0] text-[#B06000] border-[#FCE8B2]", // Yellow
    danger: "bg-[#FCE8E6] text-[#D93025] border-[#FAD2CF]",   // Red
    info: "bg-[#E8F0FE] text-[#1967D2] border-[#D2E3FC]",     // Blue
    neutral: "bg-gray-100 text-gray-700 border-gray-200",     // Gray
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
export default function Badge({
  children,
  variant = "neutral",
  className = "",
}) {
  const variants = {
    success: "bg-[#E8F5E9] text-[#43A047] border-[#A5D6A7]", // green - available
    warning: "bg-[#FEF7E0] text-[#B06000] border-[#FCE8B2]", // yellow
    danger:"bg-[#FCE8E6] text-[#D93025] border-[#FAD2CF]", // red - suspended
    info:"bg-[#E3F2FD] text-[#1E88E5] border-[#90CAF9]", // blue - in use
    maintenance: "bg-[#F3E5F5] text-[#8E24AA] border-[#CE93D8]", // purple - under maintenance
    neutral: "bg-[#ECEFF1] text-[#546E7A] border-[#B0BEC5]", // gray - in shop
    deactivated: "bg-[#5B6B78] text-white border-[#4B535A]", // dark gray - deactivated
    roles: "bg-white text-[#0A4B6E] border-[#0A4B6E]" //white bg, blue border roles
  };

  return (
    <span
      className={`px-3 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider transition-all duration-200 ${
        variants[variant] || variants.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}
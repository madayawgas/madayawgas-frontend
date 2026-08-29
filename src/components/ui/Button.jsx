export default function Button({ 
  children, 
  variant = "primary", 
  className = "", 
  ...props 
}) {
  const baseStyles = "px-4 py-2 rounded-full font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  
  const variants = {
    primary: "bg-[#0F7AB2] text-white hover:bg-[#0c628f] shadow-sm border border-[#0A4B6E]",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-400",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    outline: "bg-transparent border-2 border-[#0F7AB2] text-[#0F7AB2] hover:bg-[#F8FBFC]",
    yellow: "w-full bg-[#FFDF2D] text-[#0B4A6E] px-4 py-1.5 text-sm hover:bg-white hover:text-[#0B4A6E] shadow-sm",
    blue: "bg-white text-[#0B4A6E] px-4 py-1.5 text-sm border border-[#0B4A6E] whitespace-nowrap hover:bg-[#0c628f] hover:text-white shadow-sm",
    red: "w-full bg-[#C83733] hover:bg-[#A82B28] text-white font-semibold py-3 px-6 rounded-full tracking-wider text-sm transition-all shadow-md mb-3",
    cancel: "text-[#0B4A6E] font-semibold tracking-wider text-sm hover:underline py-2",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
}
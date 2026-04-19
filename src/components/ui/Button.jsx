export default function Button({ 
  children, 
  variant = "primary", 
  className = "", 
  ...props 
}) {
  const baseStyles = "px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#0F7AB2] text-white hover:bg-[#0c628f] shadow-sm",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    outline: "bg-transparent border-2 border-[#0F7AB2] text-[#0F7AB2] hover:bg-[#F8FBFC]",
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
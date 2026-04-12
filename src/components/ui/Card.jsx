export default function Card({ 
  children, 
  className = "", 
  onClick 
}) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 
        ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} 
        ${className}`}
    >
      {children}
    </div>
  );
}
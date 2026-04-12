export default function Input({ 
  label, 
  id, 
  className = "", 
  error,
  ...props 
}) {
  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={id} className="text-gray-800 font-medium text-sm">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full bg-gray-50 border rounded-lg p-2.5 text-sm text-gray-800 outline-none transition-all
          ${error 
            ? "border-red-400 focus:ring-2 focus:ring-red-400/20" 
            : "border-gray-300 focus:ring-2 focus:ring-[#0F7AB2]/30 focus:border-[#0F7AB2]"}
          ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
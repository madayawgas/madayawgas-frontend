import { Search } from "lucide-react";

export default function SearchBar({
  placeholder = "Search...",
  value,
  onChange,
  className = ""
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search size={18} className="absolute left-3 text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#EEF2F6] border border-[#D1D9E2] rounded-lg py-2 pl-10 pr-4 text-sm text-[#1B4B75] placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#0F7AB2]/30 focus:border-[#0F7AB2] transition-all"
      />
    </div>
  );
}
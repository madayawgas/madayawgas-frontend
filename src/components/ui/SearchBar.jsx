// src/components/ui/SearchBar.jsx
import { useState } from "react";
import { Search, X } from "lucide-react";

/**
 * Standardized SearchBar component for MadayawGas.
 * Supports:
 * - Strategy A (in-memory reactive): Pass `value` and `onChange`.
 * - Strategy B (Search on Enter / Click): Pass `onSearch` (and optionally `onClear`, `defaultValue` or initial `value`).
 */
export default function SearchBar({
  placeholder = "Search...",
  value = "",
  onChange,
  onSearch,
  onClear,
  className = "",
}) {
  const isExplicitSearch = typeof onSearch === "function";
  const [localValue, setLocalValue] = useState(value || "");
  const [prevValue, setPrevValue] = useState(value || "");

  // Synchronize internal draft during render if parent resets or updates value externally
  if (value !== prevValue) {
    setPrevValue(value || "");
    setLocalValue(value || "");
  }

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    if (!isExplicitSearch && onChange) {
      onChange(e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isExplicitSearch) {
        onSearch(localValue.trim());
      }
    }
  };

  const handleSearchClick = () => {
    if (isExplicitSearch) {
      onSearch(localValue.trim());
    }
  };

  const handleClear = () => {
    setLocalValue("");
    if (isExplicitSearch) {
      onSearch("");
      if (onClear) onClear();
    } else {
      if (onChange) {
        onChange({ target: { value: "" } });
      }
      if (onClear) onClear();
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Search Icon / Button */}
      <button
        type="button"
        onClick={handleSearchClick}
        title={isExplicitSearch ? "Click or press Enter to search" : "Search"}
        className={`absolute left-2.5 text-[#0A4B6E] flex items-center justify-center transition-colors ${
          isExplicitSearch
            ? "cursor-pointer hover:text-[#0F7AB2] active:scale-95"
            : "pointer-events-none"
        }`}
      >
        <Search size={14} />
      </button>

      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full h-[30px] bg-white border border-[#0A4B6E]/30 hover:border-[#0A4B6E]/60 rounded-full pl-8 pr-7 text-xs text-[#1B4B75] placeholder-[#6D8AA2]/70 outline-none focus:ring-2 focus:ring-[#0F7AB2]/20 focus:border-[#0F7AB2] transition-all shadow-2xs"
      />

      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          title="Clear search"
          className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
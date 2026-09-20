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
        className={`absolute left-3 text-[#0A4B6E] flex items-center justify-center transition-colors ${
          isExplicitSearch
            ? "cursor-pointer hover:text-[#0F7AB2] active:scale-95"
            : "pointer-events-none"
        }`}
      >
        <Search size={18} />
      </button>

      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-white border border-[#0B4A6E] rounded-full py-2 pl-10 pr-9 text-sm text-[#1B4B75] placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#0F7AB2]/30 focus:border-[#0F7AB2] transition-all"
      />

      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          title="Clear search"
          className="absolute right-3 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { Funnel } from "lucide-react";

const getOptionLabel = (opt) => {
  if (!opt) return "";
  if (typeof opt === "object" && opt !== null) {
    return opt.label ?? opt.name ?? opt.value ?? "";
  }
  return typeof opt === "string" ? opt.replace(/_/g, " ") : String(opt);
};

const getOptionValue = (opt) => {
  if (!opt) return "";
  if (typeof opt === "object" && opt !== null) {
    return opt.value !== undefined ? opt.value : opt.id !== undefined ? opt.id : opt.label;
  }
  return opt;
};

export default function FilterDropdown({
  label = "Filter",
  options = [],
  value,
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSelect = (option) => {
    setIsOpen(false);
    if (onChange) onChange(option);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Determine trigger button label
  const selectedOption = options.find((opt) => getOptionValue(opt) === value);
  const displayLabel = selectedOption
    ? getOptionLabel(selectedOption)
    : typeof value === "string" && value
    ? value.replace(/_/g, " ")
    : label;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          bg-[#FCFEFE]
          hover:bg-[#F3F8FB]
          text-[#0A4B6E]
          px-3
          py-1.5
          rounded-full
          text-xs
          font-semibold
          border
          border-[#0A4B6E]/30
          hover:border-[#0A4B6E]/60
          flex
          items-center
          gap-1.5
          transition-all
          duration-150
          h-[30px]
          min-w-[110px]
          justify-between
          cursor-pointer
          shadow-2xs
        "
      >
        <span className="truncate max-w-[140px]">
          {displayLabel}
        </span>

        <Funnel
          size={12}
          className="text-[#0A4B6E] shrink-0" 
        />
      </button>

      <div
        className={`
          absolute
          right-0
          mt-1.5
          w-52
          max-h-60
          overflow-y-auto
          custom-scrollbar
          bg-white
          border
          border-[#0A4B6E]/20
          rounded-xl
          shadow-lg
          z-20
          py-1
          origin-top-right
          transition-all
          duration-150
          ease-out
          ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
          }
        `}
      >
        {options.map((option, index) => {
          const optValue = getOptionValue(option);
          const optLabel = getOptionLabel(option);
          const isSelected = value === optValue;

          return (
            <button
              key={optValue || index}
              type="button"
              onClick={() => handleSelect(option)}
              className={`
                w-full
                text-left
                px-3
                py-1.5
                text-xs
                transition-colors
                duration-150
                hover:bg-gray-50
                cursor-pointer
                truncate
                ${
                  isSelected
                    ? "text-[#0F7AB2] font-semibold bg-[#F8FBFC]"
                    : "text-gray-700"
                }
              `}
              title={optLabel}
            >
              {optLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

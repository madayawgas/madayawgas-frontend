import { useState, useEffect, useRef } from "react";
import { Funnel } from "lucide-react";

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
        <span className="truncate">
          {value ? value.replace(/_/g, " ") : label}
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
          w-44
          bg-white
          border
          border-[#0A4B6E]/20
          rounded-xl
          shadow-lg
          z-20
          py-1
          overflow-hidden
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
        {options.map((option) => (
          <button
            key={option}
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
              ${
                value === option
                  ? "text-[#0F7AB2] font-semibold bg-[#F8FBFC]"
                  : "text-gray-700"
              }
            `}
          >
            {option.replace(/_/g, " ")}
          </button>
        ))}
      </div>
    </div>
  );
}
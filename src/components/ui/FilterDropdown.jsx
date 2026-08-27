import { useState } from "react";
import { Funnel } from "lucide-react";

export default function FilterDropdown({
  label = "Filter",
  options = [],
  value,
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    setIsOpen(false);
    if (onChange) onChange(option);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          bg-[#FCFEFE]
          text-[#0A4B6E]
          px-4
          py-2
          rounded-full
          text-sm
          border
          border-[#0A4B6E]
          flex
          items-center
          gap-2
          hover:bg-gray-100
          transition-all
          duration-200
          h-[38px]
          min-w-[140px]
          justify-between
        "
      >
        <span>
          {value ? value.replace(/_/g, " ") : label}
        </span>

        <Funnel
          size={16}
          className={` text-[#0A4B6E] `}/>
      </button>

      <div
        className={`
          absolute
          right-0
          mt-2
          w-48
          bg-white
          border
          border-[#0A4B6E]
          rounded-xl
          shadow-lg
          z-20
          py-2
          overflow-hidden
          origin-top-right
          transition-all
          duration-200
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
              px-4
              py-2
              text-sm
              transition-colors
              duration-150
              hover:bg-gray-50
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

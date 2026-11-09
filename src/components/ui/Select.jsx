// src/components/ui/Select.jsx
import React from "react";
import { ChevronDown } from "lucide-react";

export default function Select({
  label,
  id,
  options = [],
  className = "",
  error,
  placeholder,
  required = false,
  disabled = false,
  helperText,
  ...props
}) {
  return (
    <div className="w-full flex flex-col gap-1 text-left">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-[#0A4B6E] flex items-center gap-1 select-none"
        >
          <span>{label}</span>
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}
      <div className="relative w-full">
        <select
          id={id}
          disabled={disabled}
          className={`w-full h-10 pl-3 pr-8 py-2 text-xs text-slate-800 bg-white border rounded-lg transition-all shadow-2xs outline-hidden appearance-none cursor-pointer
            ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-400/20"
                : "border-[#CBD5E1] hover:border-slate-400 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/20"
            }
            ${disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200" : ""}
            ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const val = typeof opt === "object" ? opt.value : opt;
            const lbl = typeof opt === "object" ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {lbl}
              </option>
            );
          })}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6D8AA2] pointer-events-none"
        />
      </div>
      {error && <span className="text-[11px] font-medium text-red-600 mt-0.5">{error}</span>}
      {!error && helperText && (
        <span className="text-[11px] text-[#6D8AA2] mt-0.5">{helperText}</span>
      )}
    </div>
  );
}

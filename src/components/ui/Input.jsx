// src/components/ui/Input.jsx
import React from "react";

export default function Input({
  label,
  id,
  className = "",
  error,
  helperText,
  required = false,
  disabled = false,
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
      <input
        id={id}
        disabled={disabled}
        className={`w-full h-10 px-3 py-2 text-xs text-slate-800 bg-white border rounded-lg transition-all shadow-2xs outline-hidden
          ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-400/20"
              : "border-[#CBD5E1] hover:border-slate-400 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/20"
          }
          ${disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200" : ""}
          ${className}`}
        {...props}
      />
      {error && <span className="text-[11px] font-medium text-red-600 mt-0.5">{error}</span>}
      {!error && helperText && (
        <span className="text-[11px] text-[#6D8AA2] mt-0.5">{helperText}</span>
      )}
    </div>
  );
}

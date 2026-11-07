// src/components/ui/Badge.jsx
import React from "react";

export default function Badge({
  children,
  variant = "neutral",
  className = "",
}) {
  const variants = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200", // green - active/available
    warning: "bg-amber-50 text-amber-700 border-amber-200", // yellow/amber - pending/needs attention
    danger: "bg-rose-50 text-[#C93B32] border-rose-200", // red - suspended/quarantined
    info: "bg-[#E8F3F8] text-[#0A4B6E] border-[#BCE1F1]", // blue - info/roles
    maintenance: "bg-purple-50 text-purple-700 border-purple-200", // purple - in maintenance
    neutral: "bg-slate-100 text-slate-600 border-slate-200", // gray - neutral/inactive
    deactivated: "bg-slate-100 text-slate-600 border-slate-300", // clean gray - deactivated
    roles: "bg-white text-[#0A4B6E] border-[#0A4B6E]/30 font-semibold", // white bg, subtle blue border
  };

  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider transition-all duration-150 select-none ${
        variants[variant] || variants.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}

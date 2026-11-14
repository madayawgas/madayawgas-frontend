// src/components/ui/Button.jsx
import React from "react";

/**
 * Standardized enterprise Button component for MadayawGas.
 * Supports semantic variants with 8dp rhythm, brand colors, and accessible focus states.
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled = false,
  isLoading = false,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-4 py-2 text-xs rounded-lg gap-2",
    lg: "px-5 py-2.5 text-sm rounded-lg gap-2",
    pill: "px-4 py-1.5 text-xs rounded-full gap-1.5",
  };

  const variants = {
    // Primary Action (Yellow brand CTA)
    primary:
      "bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold uppercase tracking-wider shadow-2xs focus-visible:ring-[#0A4B6E]/50",
    // Secondary Action (Clean white with subtle border)
    secondary:
      "bg-white hover:bg-slate-50 text-[#0A4B6E] border border-[#D5E3EC] shadow-2xs focus-visible:ring-[#0A4B6E]/40",
    // Destructive / Danger
    destructive:
      "bg-[#C93B32] hover:bg-[#a82e26] text-white font-bold uppercase tracking-wider shadow-2xs focus-visible:ring-[#C93B32]/50",
    danger:
      "bg-[#C93B32] hover:bg-[#a82e26] text-white font-bold uppercase tracking-wider shadow-2xs focus-visible:ring-[#C93B32]/50",
    // Navy Action
    navy:
      "bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] font-bold shadow-2xs focus-visible:ring-[#0A4B6E]/50",
    // Outline
    outline:
      "bg-transparent border border-[#0A4B6E] text-[#0A4B6E] hover:bg-[#E8F3F8]/60 focus-visible:ring-[#0A4B6E]/40",
    // Ghost
    ghost:
      "bg-transparent text-[#0A4B6E] hover:bg-slate-100 focus-visible:ring-[#0A4B6E]/40",
    
    // Legacy compatibility aliases
    yellow:
      "bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold uppercase tracking-wider shadow-2xs focus-visible:ring-[#0A4B6E]/50",
    blue:
      "bg-white hover:bg-slate-50 text-[#0A4B6E] border border-[#0A4B6E] shadow-2xs focus-visible:ring-[#0A4B6E]/40",
    red:
      "bg-[#C93B32] hover:bg-[#a82e26] text-white font-bold uppercase tracking-wider shadow-2xs focus-visible:ring-[#C93B32]/50",
    cancel:
      "bg-transparent text-[#6D8AA2] hover:text-[#0A4B6E] hover:bg-slate-100 font-semibold focus-visible:ring-[#0A4B6E]/40",
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;
  const currentVariant = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${currentSize} ${currentVariant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

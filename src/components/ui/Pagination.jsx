// src/components/ui/Pagination.jsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Standardized Pagination component for MadayawGas application.
 * Pinned at the bottom of data tables with entry counter, page size selector,
 * boundary controls, and windowed page numbers matching the Navy/Yellow brand identity.
 */
export default function Pagination({
  page = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 20,
  limitOptions = [10, 20, 50, 100],
  onPageChange,
  onLimitChange,
  isLoading = false,
  itemLabel = "entries",
  className = "",
}) {
  if (totalItems === 0 && totalPages <= 1) {
    return null;
  }

  const start = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalItems);

  // Generate page numbers with dynamic ellipses
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (page >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  return (
    <div
      className={`shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 bg-white border-t border-slate-200 rounded-b-2xl select-none ${className}`}
    >
      {/* Left: Entry counter & Page Size Selector */}
      <div className="flex items-center gap-3 text-xs text-[#6D8AA2]">
        <div>
          Showing <span className="font-bold text-[#0A4B6E]">{start}</span> to{" "}
          <span className="font-bold text-[#0A4B6E]">{end}</span> of{" "}
          <span className="font-bold text-[#0A4B6E]">{totalItems}</span> {itemLabel}
        </div>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-[11px] font-medium text-slate-500">Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              disabled={isLoading}
              className="bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-xs text-[#0A4B6E] font-semibold focus:outline-none focus:border-[#0A4B6E] cursor-pointer"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange && onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0A4B6E] disabled:text-slate-300 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ChevronLeft size={15} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {getPageNumbers().map((p, idx) =>
          p === "..." ? (
            <span key={`dots-${idx}`} className="px-1 text-xs text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={`page-${p}`}
              type="button"
              onClick={() => onPageChange && onPageChange(p)}
              disabled={isLoading}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                page === p
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs"
                  : "text-[#1B4B75] hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange && onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0A4B6E] disabled:text-slate-300 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

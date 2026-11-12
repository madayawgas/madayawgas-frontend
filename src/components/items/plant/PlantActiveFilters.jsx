// src/components/items/plant/PlantActiveFilters.jsx
import { Funnel, X } from "lucide-react";

/**
 * PlantActiveFilters — Removable active filter chips for Plant Warehouse page.
 * Follows ActiveItemFilters and CustomerActiveFilters specifications.
 */
export default function PlantActiveFilters({
  selectedContainerType = "ALL",
  selectedStockLevel = "ALL",
  onClearContainerType,
  onClearStockLevel,
}) {
  const stockLabels = {
    IN_STOCK: "In Stock (> 0)",
    LOW_STOCK: "Low Stock (< 100)",
    HAS_DEFECTIVE: "Has Defective",
    HAS_EMPTY: "Has Empty Returns",
  };

  const hasContainerFilter = selectedContainerType && selectedContainerType !== "ALL";
  const hasStockLevelFilter = selectedStockLevel && selectedStockLevel !== "ALL";

  if (!hasContainerFilter && !hasStockLevelFilter) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Active Container Type Filter Chip */}
      {hasContainerFilter && (
        <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs">
          <Funnel size={11} className="text-[#0A4B6E]/70 shrink-0" />
          <span>
            Container:{" "}
            <strong className="font-semibold">
              {selectedContainerType === "CANISTER" ? "Canisters" : "Cylinders"}
            </strong>
          </span>
          <button
            type="button"
            onClick={onClearContainerType}
            className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-[#0A4B6E]"
            title="Remove container filter"
            aria-label="Remove container filter"
          >
            <X size={11} />
          </button>
        </span>
      )}

      {/* Active Stock Level Filter Chip */}
      {hasStockLevelFilter && (
        <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] text-[11px] font-medium transition-all shadow-2xs">
          <Funnel size={11} className="text-[#0A4B6E]/70 shrink-0" />
          <span>
            Stock:{" "}
            <strong className="font-semibold">
              {stockLabels[selectedStockLevel] || selectedStockLevel}
            </strong>
          </span>
          <button
            type="button"
            onClick={onClearStockLevel}
            className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-[#0A4B6E]"
            title="Remove stock level filter"
            aria-label="Remove stock level filter"
          >
            <X size={11} />
          </button>
        </span>
      )}
    </div>
  );
}

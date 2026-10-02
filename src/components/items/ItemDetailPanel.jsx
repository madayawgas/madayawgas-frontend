// src/components/items/ItemDetailPanel.jsx
import { useState } from "react";
import {
  Package,
  Flame,
  Pencil,
  Trash2,
  RotateCcw,
  Layers,
  Weight,
  Calendar,
  Clock,
  Fingerprint,
  Check,
  Copy,
} from "lucide-react";
import Badge from "../ui/Badge";

export default function ItemDetailPanel({
  item,
  onClose,
  onEdit,
  onDelete,
  onReactivate,
  canManage = true,
}) {
  const [copiedId, setCopiedId] = useState(false);

  if (!item) return null;

  const isActive =
    item.isActive !== undefined
      ? Boolean(item.isActive)
      : (item.status || "").toUpperCase() === "ACTIVE";

  const isCylinder =
    (item.containerType || item.category || "").toUpperCase().includes("CYLINDER") ||
    (item.category || "").toUpperCase().includes("TANK");

  const getItemIcon = () => {
    if (isCylinder) {
      return <Flame size={20} className="text-[#FFDF2C]" />;
    }
    return <Package size={20} className="text-[#FFDF2C]" />;
  };

  const formattedWeight = () => {
    if (item.netWeightKg === undefined || item.netWeightKg === null) return "0.250 kg";
    const val = Number(item.netWeightKg);
    return `${val % 1 === 0 ? val.toFixed(1) : val.toFixed(3)} kg`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleCopyId = () => {
    if (!item.id) return;
    navigator.clipboard.writeText(String(item.id));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 h-full flex flex-col overflow-hidden bg-white rounded-2xl border border-[#0A4B6E]/20 shadow-sm p-4 animate-slide-fade-in text-left">
      {/* 1. TOP HEADER BANNER */}
      <div className="shrink-0 rounded-xl p-3.5 bg-[#F4F8FA] border border-[#BCE1F1]/70 mb-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 shadow-sm">
              {getItemIcon()}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#0A4B6E] truncate leading-tight">
                {item.name || item.itemName || "Product Item"}
              </h2>
              <p className="text-xs text-[#6D8AA2] font-medium mt-0.5 truncate">
                {item.category || "General Inventory"}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          {canManage && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEdit && onEdit(item)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-[#0A4B6E] transition-colors cursor-pointer"
                title="Edit Product"
              >
                <Pencil size={15} />
              </button>

              {isActive ? (
                <button
                  type="button"
                  onClick={() => onDelete && onDelete(item)}
                  className="p-1.5 rounded-full hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                  title="Deactivate Product"
                >
                  <Trash2 size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onReactivate && onReactivate(item)}
                  className="p-1.5 rounded-full hover:bg-emerald-100 text-emerald-600 transition-colors cursor-pointer"
                  title="Reactivate Product"
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Status & Badge Row */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#BCE1F1]/50">
          <Badge
            variant={isActive ? "success" : "deactivated"}
            className="px-3 py-0.5 text-xs font-bold"
          >
            {isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>
          <span className="text-[11px] font-semibold text-[#0A4B6E] bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
            {item.containerType || (isCylinder ? "CYLINDER" : "CANISTER")}
          </span>
        </div>
      </div>

      {/* 2. SCROLLABLE SPECIFICATIONS BODY */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 pr-0.5">
        {/* SECTION: PRODUCT SPECIFICATIONS */}
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
            <Layers size={13} className="text-[#0A4B6E]" />
            <span>Product Specifications</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Package size={13} className="text-slate-400" />
                <span>Container Type</span>
              </span>
              <span className="font-bold text-[#0A4B6E] uppercase">
                {item.containerType || (isCylinder ? "CYLINDER" : "CANISTER")}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Weight size={13} className="text-slate-400" />
                <span>Net Weight</span>
              </span>
              <span className="font-bold font-mono text-[#0A4B6E]">
                {formattedWeight()}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Layers size={13} className="text-slate-400" />
                <span>Category</span>
              </span>
              <span className="font-bold text-[#0A4B6E]">
                {item.category || "LPG"}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION: SYSTEM METADATA */}
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
            <Fingerprint size={13} className="text-[#0A4B6E]" />
            <span>System Metadata</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Fingerprint size={13} className="text-slate-400" />
                <span>Product ID</span>
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="font-mono text-[11px] text-[#0A4B6E] hover:text-[#083b57] flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 cursor-pointer"
                title="Click to copy ID"
              >
                <span className="truncate max-w-[120px]">
                  {item.id ? `${String(item.id).substring(0, 8)}...` : "N/A"}
                </span>
                {copiedId ? (
                  <Check size={11} className="text-emerald-600" />
                ) : (
                  <Copy size={11} className="text-slate-400" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                <span>Registered On</span>
              </span>
              <span className="font-medium text-slate-700">
                {formatDate(item.createdAt)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock size={13} className="text-slate-400" />
                <span>Last Updated</span>
              </span>
              <span className="font-medium text-slate-700">
                {formatDate(item.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PINNED BOTTOM CLOSE BUTTON */}
      <div className="shrink-0 pt-3 border-t border-slate-200 mt-2">
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider py-2.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

// src/components/zones/ZoneDetailPanel.jsx
import React from "react";
import {
  MapPin,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import { formatPhilippineDateTime } from "../../utils/date.js";

export default function ZoneDetailPanel({
  zone,
  onClose,
  onEdit,
  onToggleActive,
  canManage = true,
}) {
  if (!zone) return null;

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Scrollable Content Body */}
      <div className="space-y-4 text-xs text-[#0A4B6E] flex-1 overflow-y-auto custom-scrollbar pr-1">
        {/* Header overview badge */}
        <div className="bg-[#E8F3F8] rounded-xl p-4 border border-[#0A4B6E]/15 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-white text-[#0A4B6E] flex items-center justify-center font-mono font-bold text-sm shadow-xs shrink-0 border border-[#BCE1F1]">
              {zone.code?.slice(0, 3)}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-[#0A4B6E] truncate">
                {zone.name}
              </h3>
              <p className="font-mono text-[11px] text-[#6D8AA2] truncate">
                Code: {zone.code}
              </p>
            </div>
          </div>
          <Badge variant={zone.isActive ? "success" : "deactivated"}>
            {zone.isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>
        </div>

        {/* Description / Territory Coverage */}
        <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 space-y-2">
          <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#6D8AA2]">
            Territory Coverage & Notes
          </h4>
          <p className="text-xs text-[#0A4B6E] leading-relaxed bg-[#F8FAFC] p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
            {zone.description || "No specific territory description or landmarks provided."}
          </p>
        </div>

        {/* Operational Dispatch Status */}
        <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 space-y-3">
          <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#6D8AA2]">
            Operational Dispatch Status
          </h4>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-slate-100">
              <span className="text-[11px] text-[#6D8AA2] block">Dispatch Status</span>
              <span className="font-semibold text-[#0A4B6E] inline-flex items-center gap-1.5 mt-0.5">
                {zone.isActive ? (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Eligible for Trips</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={13} className="text-amber-600" />
                    <span>Gated (Inactive)</span>
                  </>
                )}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-slate-100">
              <span className="text-[11px] text-[#6D8AA2] block">Zone Classification</span>
              <span className="font-semibold text-[#0A4B6E] block mt-0.5">
                Standard Route
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-slate-100 col-span-2">
              <span className="text-[11px] text-[#6D8AA2] block flex items-center gap-1">
                <Calendar size={11} />
                <span>Date Added (PHT)</span>
              </span>
              <span className="font-medium text-[#0A4B6E] mt-0.5 block">
                {formatPhilippineDateTime(zone.createdAt) || "—"}
              </span>
            </div>

            {zone.updatedAt && zone.updatedAt !== zone.createdAt && (
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-slate-100 col-span-2">
                <span className="text-[11px] text-[#6D8AA2] block flex items-center gap-1">
                  <Calendar size={11} />
                  <span>Last Updated (PHT)</span>
                </span>
                <span className="font-medium text-[#0A4B6E] mt-0.5 block">
                  {formatPhilippineDateTime(zone.updatedAt)}
                </span>
              </div>
            )}

            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-slate-100 col-span-2">
              <span className="text-[11px] text-[#6D8AA2] block">System Zone ID</span>
              <span className="font-mono text-[10px] text-slate-500 break-all select-all block mt-0.5">
                {zone.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Action Footer */}
      <div className="flex items-center justify-between w-full pt-4 mt-3 border-t border-slate-200 shrink-0">
        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit && onEdit(zone)}
            >
              <Edit2 size={13} className="mr-1" />
              Edit
            </Button>
            <Button
              variant={zone.isActive ? "destructive" : "secondary"}
              size="sm"
              onClick={() => onToggleActive && onToggleActive(zone)}
            >
              {zone.isActive ? (
                <>
                  <ToggleRight size={13} className="mr-1" />
                  Deactivate
                </>
              ) : (
                <>
                  <ToggleLeft size={13} className="mr-1" />
                  Activate
                </>
              )}
            </Button>
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto px-5 py-2 text-xs font-bold text-[#0A4B6E] bg-[#FFDF2C] hover:bg-[#ebd024] rounded-lg cursor-pointer transition-colors uppercase tracking-wider shadow-2xs active:scale-95"
        >
          Close
        </button>
      </div>
    </div>
  );
}

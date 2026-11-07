// src/components/customers/CustomerDetailPanel.jsx
import React from "react";
import {
  Pencil,
  Trash2,
  RotateCcw,
  MapPin,
  Building2,
  Phone,
  Calendar,
  Clock,
  ShieldCheck,
} from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { formatPhilippinePhone } from "../../utils/phone.js";
import { formatPhilippineDate } from "../../utils/date.js";

export default function CustomerDetailPanel({
  customer,
  onClose,
  onEdit,
  onDelete,
  onReactivate,
  canManage = true,
}) {
  if (!customer) return null;

  const isActive =
    customer.isActive !== undefined
      ? Boolean(customer.isActive)
      : (customer.status || "").toUpperCase() === "ACTIVE";

  return (
    <div className="flex flex-col gap-4 text-left font-sans">
      {/* SECTION 1: CUSTOMER PROFILE & CLASSIFICATION */}
      <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
          <Building2 size={14} className="text-[#0A4B6E]" />
          <span>Profile & Classification</span>
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-500 flex items-center gap-1.5 shrink-0 pt-0.5 font-medium">
              <MapPin size={13} className="text-slate-400" />
              <span>Full Address</span>
            </span>
            <span className="font-semibold text-[#0A4B6E] text-right">
              {customer.address || "N/A"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Building2 size={13} className="text-slate-400" />
              <span>Account Type</span>
            </span>
            <span>
              <Badge variant="roles">{customer.customerType || "RETAIL"}</Badge>
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <ShieldCheck size={13} className="text-slate-400" />
              <span>Account Status</span>
            </span>
            <Badge
              variant={isActive ? "success" : "deactivated"}
              className="px-2.5 py-0.5 text-[10px] font-bold"
            >
              {isActive ? "ACTIVE" : "INACTIVE"}
            </Badge>
          </div>
        </div>
      </div>

      {/* SECTION 2: CONTACT & REGISTRATION DETAILS */}
      <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
          <Phone size={14} className="text-[#0A4B6E]" />
          <span>Contact & Audit History</span>
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Phone size={13} className="text-slate-400" />
              <span>Contact Number</span>
            </span>
            <span className="font-mono font-bold text-[#0A4B6E]">
              {customer.contactNumber
                ? formatPhilippinePhone(customer.contactNumber)
                : "N/A"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Calendar size={13} className="text-slate-400" />
              <span>Registration Date</span>
            </span>
            <span className="font-medium text-slate-700">
              {formatPhilippineDate(customer.createdAt)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Clock size={13} className="text-slate-400" />
              <span>Last Modified</span>
            </span>
            <span className="font-medium text-slate-700">
              {formatPhilippineDate(customer.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* ACTIONS ROW */}
      {canManage && (
        <div className="pt-2 flex items-center justify-between gap-2.5 border-t border-slate-200">
          <div>
            {isActive ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete && onDelete(customer)}
                className="gap-1.5"
              >
                <Trash2 size={13} />
                <span>Deactivate</span>
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onReactivate && onReactivate(customer)}
                className="gap-1.5 text-emerald-700 hover:text-emerald-800"
              >
                <RotateCcw size={13} />
                <span>Reactivate</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onEdit && onEdit(customer)}
              className="gap-1.5"
            >
              <Pencil size={13} />
              <span>Edit Details</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

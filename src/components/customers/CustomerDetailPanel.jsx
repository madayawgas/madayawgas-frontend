// src/components/customers/CustomerDetailPanel.jsx
import {
  Pencil,
  Trash2,
  RotateCcw,
  UserRound,
  MapPin,
  Building2,
  Phone,
  Calendar,
  Clock,
  ShieldCheck,
} from "lucide-react";
import Badge from "../ui/Badge";
import { formatPhilippinePhone } from "../../utils/phone.js";

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

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
    <div className="w-full h-full bg-white border border-[#0A4B6E]/20 rounded-2xl shadow-sm p-4 flex flex-col overflow-hidden text-left font-sans">
      {/* 1. TOP HEADER BANNER */}
      <div className="shrink-0 rounded-xl p-3.5 bg-[#F4F8FA] border border-[#BCE1F1]/70 mb-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 shadow-sm font-bold">
              <UserRound size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#0A4B6E] truncate leading-tight">
                {customer.name || "Customer"}
              </h2>
              <p className="text-xs text-[#6D8AA2] font-medium mt-0.5 truncate">
                {customer.address || "Customer Account"}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          {canManage && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEdit && onEdit(customer)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-[#0A4B6E] transition-colors cursor-pointer"
                title="Edit Customer"
              >
                <Pencil size={15} />
              </button>

              {isActive ? (
                <button
                  type="button"
                  onClick={() => onDelete && onDelete(customer)}
                  className="p-1.5 rounded-full hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                  title="Deactivate Customer"
                >
                  <Trash2 size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onReactivate && onReactivate(customer)}
                  className="p-1.5 rounded-full hover:bg-emerald-100 text-emerald-600 transition-colors cursor-pointer"
                  title="Reactivate Customer"
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Status & Badge Row */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#BCE1F1]/50 flex-wrap">
          <Badge
            variant={isActive ? "success" : "deactivated"}
            className="px-3 py-0.5 text-xs font-bold"
          >
            {isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>

          {customer.customerType && (
            <span className="text-[11px] font-semibold text-[#0A4B6E] bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
              {customer.customerType}
            </span>
          )}
        </div>
      </div>

      {/* 2. SCROLLABLE CONTENT BODY */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 pr-0.5">
        {/* SECTION: CUSTOMER PROFILE & ADDRESS */}
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
            <Building2 size={13} className="text-[#0A4B6E]" />
            <span>Customer Profile</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5 shrink-0 pt-0.5">
                <MapPin size={13} className="text-slate-400" />
                <span>Address</span>
              </span>
              <span className="font-bold text-[#0A4B6E] text-right">
                {customer.address || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building2 size={13} className="text-slate-400" />
                <span>Customer Type</span>
              </span>
              <span className="font-bold text-[#0A4B6E]">
                <Badge variant="roles">{customer.customerType || "RETAIL"}</Badge>
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-slate-400" />
                <span>Account Status</span>
              </span>
              <Badge
                variant={isActive ? "success" : "deactivated"}
                className="px-2.5 py-0.5 text-[10.5px] font-bold"
              >
                {isActive ? "ACTIVE" : "INACTIVE"}
              </Badge>
            </div>
          </div>
        </div>

        {/* SECTION: CONTACT & REGISTRATION DETAILS */}
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A4B6E] flex items-center gap-1.5 pb-2 border-b border-slate-200">
            <Phone size={13} className="text-[#0A4B6E]" />
            <span>Contact & Registration</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Phone size={13} className="text-slate-400" />
                <span>Contact Number</span>
              </span>
              <span className="font-mono font-bold text-[#0A4B6E]">
                {customer.contactNumber
                  ? formatPhilippinePhone(customer.contactNumber)
                  : "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                <span>Date Registered</span>
              </span>
              <span className="font-medium text-slate-700">
                {formatDate(customer.createdAt)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock size={13} className="text-slate-400" />
                <span>Last Updated</span>
              </span>
              <span className="font-medium text-slate-700">
                {formatDate(customer.updatedAt)}
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


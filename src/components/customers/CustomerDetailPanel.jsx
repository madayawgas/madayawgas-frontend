import { Pencil, Trash2, UserRound } from "lucide-react";
import Badge from "../ui/Badge";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  } catch {
    return dateStr;
  }
}

export default function CustomerDetailPanel({
  customer,
  onClose,
  onEdit,
  onDelete,
  canManage = true,
}) {
  if (!customer) return null;

  return (
    <div className="w-full h-full bg-white border border-[#0A4B6E]/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between overflow-hidden">
      {/* Scrollable Inner Body (Scrolls independently only if content overflows) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
        {/* Sub-Header Title */}
        <p className="text-center text-xs md:text-sm font-semibold text-[#6D8AA2] mb-4 tracking-wide">
          Customer Profile
        </p>

        {/* 1. Header Card: Avatar, Name & Action Icons */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-11 h-11 rounded-full bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-sm">
              <UserRound size={26} />
            </div>
            <h3 className="text-base md:text-lg font-bold text-[#0A4B6E] truncate">
              {customer.name}
            </h3>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {canManage && (
              <>
                <button
                  type="button"
                  title="Edit Customer"
                  onClick={() => onEdit && onEdit(customer)}
                  className="text-[#0A4B6E] hover:opacity-75 transition-opacity cursor-pointer p-1"
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  title="Deactivate Customer"
                  onClick={() => onDelete && onDelete(customer)}
                  className="text-[#0A4B6E] hover:text-red-500 transition-colors cursor-pointer p-1"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2. Address & Type Card */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4 space-y-2.5 mb-4 text-sm">
          <div>
            <span className="text-[#6D8AA2] font-medium">Address:</span>
            <span className="text-[#0A4B6E] font-bold ml-2">
              {customer.address || "N/A"}
            </span>
          </div>

          <div className="flex items-center">
            <span className="text-[#6D8AA2] font-medium">Customer Type:</span>
            <span className="text-[#0A4B6E] font-bold ml-2">
              <Badge variant="roles">{customer.customerType}</Badge>
            </span>
          </div>

          <div className="flex items-center">
            <span className="text-[#6D8AA2] font-medium mr-2">Status:</span>
            <Badge variant={customer.isActive ? "success" : "deactivated"}>
              {customer.isActive ? "ACTIVE" : "INACTIVE"}
            </Badge>
          </div>
        </div>

        {/* 3. Contact Details Card */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4 space-y-2.5 mb-2 text-sm">
          <div>
            <span className="text-[#6D8AA2] font-medium">Contact No.:</span>
            <span className="text-[#0A4B6E] font-bold ml-2">
              {customer.contactNumber || "N/A"}
            </span>
          </div>

          <div>
            <span className="text-[#6D8AA2] font-medium">Date Registered:</span>
            <span className="text-[#0A4B6E] font-bold ml-2">
              {formatDate(customer.createdAt)}
            </span>
          </div>

          <div>
            <span className="text-[#6D8AA2] font-medium">Last Updated:</span>
            <span className="text-[#0A4B6E] font-bold ml-2">
              {formatDate(customer.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Locked Bottom Action Button */}
      <div className="shrink-0 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-[#FFDF2C] hover:bg-[#ebd024] active:scale-[0.98] text-[#0A4B6E] font-bold py-3.5 px-6 rounded-full text-sm uppercase tracking-wider transition-all duration-150 shadow-sm cursor-pointer"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

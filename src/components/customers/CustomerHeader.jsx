import { Plus, UserRound } from "lucide-react";

export default function CustomerHeader({
  onAddCustomer,
  canCreate = true,
  customerSummary = null,
}) {
  const total = customerSummary?.total ?? 0;
  const active = customerSummary?.active ?? 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#6D8AA2]/20 mb-4 gap-3">
      {/* Left side: Live Metric Summary Pills */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs h-[30px]">
          <UserRound size={13} className="text-[#0A4B6E]" />
          <span>{total} Registered Customers</span>
        </span>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs shadow-2xs h-[30px]">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>{active} Active</span>
        </span>
      </div>

      {/* Right side: Add New Customer Action */}
      <div className="flex items-center gap-2.5 shrink-0">
        {canCreate && (
          <button
            type="button"
            onClick={onAddCustomer}
            className="flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer h-[30px]"
          >
            <Plus size={14} />
            <span>Add New Customer</span>
          </button>
        )}
      </div>
    </div>
  );
}


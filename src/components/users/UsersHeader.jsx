import { Settings, Plus, Users } from "lucide-react";

export default function UsersHeader({
  onOpenPermissions,
  onAddUser,
  userSummary = null,
}) {
  const total = userSummary?.total ?? 0;
  const active = userSummary?.active ?? 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#6D8AA2]/20 mb-4 gap-3">
      {/* Left side: Live Metric Summary Pills */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs h-[30px]">
          <Users size={13} className="text-[#0A4B6E]" />
          <span>{total} Staff Accounts</span>
        </span>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs shadow-2xs h-[30px]">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>{active} Active</span>
        </span>
      </div>

      {/* Right side: Manage Roles and Add User Actions */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onOpenPermissions}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-[#0A4B6E] font-semibold text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer shadow-2xs active:scale-95 h-[30px]"
        >
          <Settings size={13} />
          <span>Manage Roles and Permissions</span>
        </button>

        <button
          type="button"
          onClick={onAddUser}
          className="flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer h-[30px]"
        >
          <Plus size={14} />
          <span>Add New User</span>
        </button>
      </div>
    </div>
  );
}
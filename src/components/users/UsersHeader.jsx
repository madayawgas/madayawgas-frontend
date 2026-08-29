import { Settings, Plus } from "lucide-react";

export default function UsersHeader({ onOpenPermissions, onAddUser }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#6D8AA2] mb-6">
      <h1 className="text-2xl md:text-[32px] font-bold text-[#1B4B75]">
        User Management
      </h1>

      <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
        <button
          type="button"
          onClick={onOpenPermissions}
          className="flex items-center gap-2 bg-[#F6C445] hover:bg-[#e2b23b] text-[#0B4A6E] font-semibold text-xs px-4 py-2.5 rounded-full shadow-sm transition-colors cursor-pointer"
        >
          <Settings size={16} />
          <span>Manage Roles and Permissions</span>
        </button>

        <button
          type="button"
          onClick={onAddUser}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-[#0A4B6E] text-[#0A4B6E] font-semibold text-xs px-4 py-2.5 rounded-full transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>Add New User</span>
        </button>
      </div>
    </div>
  );
}
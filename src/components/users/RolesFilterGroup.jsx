import Badge from "../ui/Badge";

export default function RolesFilterGroup({ rolesList, selectedRole, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-[#0A4B6E] mb-2">
        Roles:
      </label>
      <div className="flex flex-wrap gap-2">
        {rolesList.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => onChange(role)}
            className="cursor-pointer transition-transform active:scale-95"
          >
            <Badge
              variant="roles"
              className={
                selectedRole === role
                  ? "!bg-[#0A4B6E] !text-white"
                  : "hover:bg-gray-50"
              }
            >
              {role}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
import Badge from "../ui/Badge";

export default function StatusFilterGroup({ selectedStatus, onChange }) {
  const statuses = [
    { key: "ACTIVE", variant: "success", activeBorder: "border-green-700" },
    { key: "SUSPENDED", variant: "danger", activeBorder: "border-red-700" },
    { key: "DEACTIVATED", variant: "deactivated", activeBorder: "border-gray-700" },
  ];

  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-[#0A4B6E] mb-2">
        Status:
      </label>
      <div className="flex flex-wrap gap-2">
        {statuses.map(({ key, variant, activeBorder }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className="cursor-pointer transition-all active:scale-95"
          >
            <Badge
              variant={variant}
              className={`border-2 transition-all ${
                selectedStatus === key
                  ? `${activeBorder} opacity-100`
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {key}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
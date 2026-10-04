export default function CustomerStatusFilterGroup({ selectedStatus, onChange }) {
  const statuses = [
    { key: "ACTIVE", label: "ACTIVE", activeBg: "bg-emerald-600 text-white border-emerald-600", inactiveBg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { key: "INACTIVE", label: "INACTIVE", activeBg: "bg-gray-600 text-white border-gray-600", inactiveBg: "bg-gray-100 text-gray-600 border-gray-200" },
  ];

  return (
    <div className="mb-3 text-left">
      <label className="block text-[11px] font-bold text-[#0A4B6E] mb-1.5 uppercase tracking-wide">
        Status:
      </label>
      <div className="flex flex-wrap gap-1.5">
        {statuses.map(({ key, label, activeBg, inactiveBg }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(selectedStatus === key ? "" : key)}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer active:scale-95 ${
              selectedStatus === key ? activeBg : `${inactiveBg} opacity-80 hover:opacity-100`
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

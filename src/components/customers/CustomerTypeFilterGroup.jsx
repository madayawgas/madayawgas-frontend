export default function CustomerTypeFilterGroup({
  typesList = ["All Types", "COMMERCIAL", "RETAIL", "WHOLESALE"],
  selectedType,
  onChange,
}) {
  return (
    <div className="mb-3 text-left">
      <label className="block text-[11px] font-bold text-[#0A4B6E] mb-1.5 uppercase tracking-wide">
        Customer Type:
      </label>
      <div className="flex flex-wrap gap-1.5">
        {typesList.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer active:scale-95 ${
              selectedType === type
                ? "bg-[#0A4B6E] text-white border-[#0A4B6E] font-semibold shadow-2xs"
                : "bg-[#F3F5F5] text-gray-700 border-gray-200 hover:bg-gray-100"
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}

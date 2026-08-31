import Badge from "../ui/Badge";

export default function CustomerTypeFilterGroup({
  typesList = ["All Types", "COMMERCIAL", "RETAIL", "WHOLESALE"],
  selectedType,
  onChange,
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-[#0A4B6E] mb-2">
        Customer Type:
      </label>
      <div className="flex flex-wrap gap-2">
        {typesList.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className="cursor-pointer transition-transform active:scale-95"
          >
            <Badge
              variant="roles"
              className={
                selectedType === type
                  ? "!bg-[#0A4B6E] !text-white"
                  : "hover:bg-gray-50"
              }
            >
              {type}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}

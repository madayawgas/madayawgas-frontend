export default function DateFilterGroup({
  dateFrom,
  dateTo,
  onFromChange,
  onToChange,
}) {
  return (
    <div className="mb-6">
      <label className="block text-xs font-bold text-[#0A4B6E] mb-2">
        Date Added:
      </label>
      <div className="flex items-center gap-2">
        <input
          type="date"
          id="dateFrom"
          value={dateFrom}
          onChange={onFromChange}
          className="py-1.5 px-3 text-xs rounded-full border border-[#0A4B6E] bg-white text-gray-700 outline-none cursor-pointer"
        />
        <span className="text-xs text-gray-400">-</span>
        <input
          type="date"
          id="dateTo"
          value={dateTo}
          onChange={onToChange}
          className="py-1.5 px-3 text-xs rounded-full border border-[#0A4B6E] bg-white text-gray-700 outline-none cursor-pointer"
        />
      </div>
    </div>
  );
}
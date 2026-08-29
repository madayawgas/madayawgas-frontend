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
      <div className="flex items-center gap-2 w-full">
        {/* From Input Container */}
        <div className="flex-1 min-w-0 flex items-center px-2.5 py-1.5 rounded-full border border-[#0A4B6E] bg-white text-xs text-[#0A4B6E]">
          <span className="font-semibold mr-1 shrink-0 select-none">From:</span>
          <input
            type="date"
            id="dateFrom"
            value={dateFrom}
            onChange={onFromChange}
            className="w-full min-w-0 bg-transparent text-[11px] text-gray-700 outline-none border-none p-0 cursor-pointer focus:ring-0"
          />
        </div>

        {/* To Input Container */}
        <div className="flex-1 min-w-0 flex items-center px-2.5 py-1.5 rounded-full border border-[#0A4B6E] bg-white text-xs text-[#0A4B6E]">
          <span className="font-semibold mr-1 shrink-0 select-none">To:</span>
          <input
            type="date"
            id="dateTo"
            value={dateTo}
            onChange={onToChange}
            className="w-full min-w-0 bg-transparent text-[11px] text-gray-700 outline-none border-none p-0 cursor-pointer focus:ring-0"
          />
        </div>
      </div>
    </div>
  );
}
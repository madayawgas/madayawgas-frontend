export default function DateFilterGroup({
  dateFrom,
  dateTo,
  onFromChange,
  onToChange,
}) {
  return (
    <div className="mb-3 text-left">
      <label className="block text-[11px] font-bold text-[#0A4B6E] mb-1.5 uppercase tracking-wide">
        Date Added:
      </label>
      <div className="flex items-center gap-1.5 w-full">
        {/* From Input Container */}
        <div className="flex-1 min-w-0 flex items-center px-2 py-1 rounded-full border border-[#0A4B6E]/40 bg-white text-[11px] text-[#0A4B6E] h-[28px]">
          <span className="font-semibold mr-1 shrink-0 select-none text-[10px]">From:</span>
          <input
            type="date"
            id="dateFrom"
            value={dateFrom}
            onChange={onFromChange}
            className="w-full min-w-0 bg-transparent text-[10px] text-gray-700 outline-none border-none p-0 cursor-pointer focus:ring-0"
          />
        </div>

        {/* To Input Container */}
        <div className="flex-1 min-w-0 flex items-center px-2 py-1 rounded-full border border-[#0A4B6E]/40 bg-white text-[11px] text-[#0A4B6E] h-[28px]">
          <span className="font-semibold mr-1 shrink-0 select-none text-[10px]">To:</span>
          <input
            type="date"
            id="dateTo"
            value={dateTo}
            onChange={onToChange}
            className="w-full min-w-0 bg-transparent text-[10px] text-gray-700 outline-none border-none p-0 cursor-pointer focus:ring-0"
          />
        </div>
      </div>
    </div>
  );
}
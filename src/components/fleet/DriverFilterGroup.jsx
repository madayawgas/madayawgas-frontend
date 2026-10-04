export default function DriverFilterGroup({
  driversList = [],
  selectedDriver = "All Drivers",
  onChange,
}) {
  return (
    <div className="mb-3 text-left">
      <label className="block text-[11px] font-bold text-[#0A4B6E] mb-1.5 uppercase tracking-wide">
        Driver Assignment:
      </label>
      <select
        value={selectedDriver}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="w-full bg-[#F3F5F5] text-gray-700 text-xs px-2.5 py-1.5 rounded-xl outline-none focus:ring-2 focus:ring-[#0A4B6E]/20 cursor-pointer border border-transparent font-medium h-[30px]"
      >
        <option value="All Drivers">All Drivers (Assigned & Unassigned)</option>
        <option value="Assigned">Assigned (With Driver)</option>
        <option value="Unassigned">Unassigned (No Driver)</option>
        {driversList && driversList.length > 0 && (
          <optgroup label="Specific Assigned Driver">
            {driversList.map((driver, idx) => {
              const name =
                typeof driver === "string"
                  ? driver
                  : `${driver.firstName || ""} ${driver.lastName || ""}`.trim() ||
                    driver.username;
              return (
                <option key={driver.id || idx} value={name}>
                  {name}
                </option>
              );
            })}
          </optgroup>
        )}
      </select>
    </div>
  );
}

import { useMemo } from "react";
import { Calendar, Trash2, Plus, Info } from "lucide-react";
import { getPhilippineDayOfWeek } from "../../utils/date.js";

const DAYS = [
  { num: 1, label: "Mon", full: "Monday" },
  { num: 2, label: "Tue", full: "Tuesday" },
  { num: 3, label: "Wed", full: "Wednesday" },
  { num: 4, label: "Thu", full: "Thursday" },
  { num: 5, label: "Fri", full: "Friday" },
  { num: 6, label: "Sat", full: "Saturday" },
  { num: 7, label: "Sun", full: "Sunday" },
];

export default function MasterTemplateMatrix({
  templates = [],
  vehicles = [],
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  canManage = true,
}) {
  const currentIsoDay = useMemo(() => getPhilippineDayOfWeek(new Date()), []);

  // Map templates by truckId and dayOfWeek, with plateNumber fallback
  const templateMap = {};
  templates.forEach((t) => {
    if (t.truckId) {
      templateMap[`${t.truckId}_${t.dayOfWeek}`] = t;
    }
    if (t.truckPlate) {
      templateMap[`plate_${String(t.truckPlate).toUpperCase()}_${t.dayOfWeek}`] = t;
    }
  });

  return (
    <div className="bg-white rounded-2xl border border-[#D5E3EC] p-4 sm:p-5 shadow-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#0A4B6E] flex items-center gap-1.5">
              <Calendar size={15} />
              <span>Weekly Route Schedules</span>
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1]">
              {templates.length} Active Schedules
            </span>
          </div>
          <p className="text-xs text-[#6D8AA2] mt-0.5">
            Click any cell to assign or edit a vehicle's route schedule for the week
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] text-[#486581] bg-[#EDF3F7] px-3 py-1 rounded-full font-semibold hidden md:inline-block">
            1 Route Schedule per Truck per Day
          </span>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-[#EDF3F7] text-[#0A4B6E] font-bold border-b border-[#D5E3EC]">
              <th className="p-3 rounded-l-xl w-48">Vehicle</th>
              {DAYS.map((d) => {
                const isToday = d.num === currentIsoDay;
                return (
                  <th
                    key={d.num}
                    className={`p-3 text-center transition-colors ${
                      isToday ? "bg-[#0A4B6E]/10" : ""
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{d.label}</span>
                      {isToday && (
                        <span className="text-[9px] bg-[#FFDF2C] text-[#0A4B6E] px-1.5 py-0.2 rounded-full font-bold shadow-2xs">
                          Today
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                  No vehicles found matching your criteria.
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-[#F8FAFC]">
                  <td className="p-3 font-bold text-[#0A4B6E]">
                    <div>{v.plateNumber}</div>
                    <div className="text-[11px] text-[#6D8AA2] font-normal">{v.model}</div>
                  </td>

                  {DAYS.map((d) => {
                    const isToday = d.num === currentIsoDay;
                    const t = templateMap[`${v.id}_${d.num}`] || (v.plateNumber ? templateMap[`plate_${String(v.plateNumber).toUpperCase()}_${d.num}`] : null);
                    return (
                      <td
                        key={d.num}
                        className={`p-2 text-center transition-colors ${
                          isToday ? "bg-amber-50/40" : ""
                        }`}
                      >
                        {t ? (
                          <div className="group relative inline-flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => onEditTemplate && onEditTemplate(t)}
                              title={`Click to edit route schedule for ${v.plateNumber} on ${d.full}${
                                t.salesName ? ` (Assigned: ${t.salesName})` : ""
                              }`}
                              className="bg-[#E8F3F8] hover:bg-[#D5EAF4] text-[#0A4B6E] border border-[#BCE1F1] px-2 py-1 rounded-md font-bold text-[11px] block min-w-[68px] text-center shadow-2xs cursor-pointer transition-all active:scale-95"
                            >
                              <span>{t.zoneCode || "Zone"}</span>
                              {t.salesName && (
                                <span className="block text-[9px] font-normal text-[#6D8AA2] truncate max-w-[65px]">
                                  {t.salesName.split(" ")[0]}
                                </span>
                              )}
                            </button>
                            {canManage && onDeleteTemplate && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTemplate(t.id);
                                }}
                                className="hidden group-hover:flex absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full items-center justify-center text-[10px] cursor-pointer shadow-xs transition-colors"
                                title="Delete route schedule"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ) : canManage && onAddTemplate ? (
                          <button
                            type="button"
                            onClick={() => onAddTemplate(v.id, d.num)}
                            title={`Click to add route schedule for ${v.plateNumber} on ${d.full}`}
                            className="w-full py-1.5 px-1 rounded-lg text-slate-300 hover:text-[#0A4B6E] hover:bg-[#E8F3F8]/80 hover:border hover:border-dashed hover:border-[#BCE1F1] transition-all text-xs font-semibold group flex items-center justify-center cursor-pointer min-h-[30px]"
                          >
                            <span className="group-hover:hidden">—</span>
                            <span className="hidden group-hover:inline-flex items-center gap-0.5 text-[11px] font-bold text-[#0A4B6E]">
                              <Plus size={11} /> Add
                            </span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[11px] italic">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#6D8AA2]">
        <span className="flex items-center gap-1">
          <Info size={12} className="text-[#0A4B6E]" />
          <span>Click any day slot on a vehicle to assign or customize its recurring route zone</span>
        </span>
        <span>Assigned route schedules are automatically ready for dispatch on their scheduled days</span>
      </div>
    </div>
  );
}


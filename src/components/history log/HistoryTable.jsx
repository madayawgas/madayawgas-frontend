import React from "react";
import ActionTypePill from "./ActionTypePill";
import Badge from "../ui/Badge";
import { Clock } from "lucide-react";

export default function HistoryTable({ logs }) {
  return (
    <div className="w-full overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed text-xs md:text-sm">
          <thead className="bg-[#0D4B6E] text-white sticky top-0 z-10 shadow-xs">
            <tr>
              <th scope="col" className="py-3.5 px-6 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[20%]">Timestamp</th>
              <th scope="col" className="py-3.5 px-6 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[20%]">User & Role</th>
              <th scope="col" className="py-3.5 px-6 font-semibold uppercase tracking-wider text-[11px] text-center whitespace-nowrap w-[15%]">Action Type</th>
              <th scope="col" className="py-3.5 px-6 font-semibold uppercase tracking-wider text-[11px] text-center whitespace-nowrap w-[18%]">Module</th>
              <th scope="col" className="py-3.5 px-6 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[27%]">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <tr 
                  key={log.id || index} 
                  className="bg-white hover:bg-[#FEF6D1] transition-colors duration-150 cursor-pointer"
                >
                  <td className="py-3.5 px-6 whitespace-nowrap">
                    <div className="text-gray-900 font-bold text-xs md:text-sm">{log.date}</div>
                    <div className="text-[#6D8AA2] text-[11px] flex items-center gap-1 mt-0.5">
                      <Clock size={11} className="shrink-0" />
                      <span>{log.time}</span>
                    </div>
                  </td>
                  
                  <td className="py-3.5 px-6">
                    <div className="font-bold text-[#0A4B6E] text-xs md:text-sm">{log.userName}</div>
                    <div className="text-[#6D8AA2] text-[11px] font-normal">({log.userRole})</div>
                  </td>
                  
                  <td className="py-3.5 px-6 text-center whitespace-nowrap">
                    <ActionTypePill action={log.actionType} />
                  </td>
                  
                  <td className="py-3.5 px-6 text-center whitespace-nowrap">
                    <Badge variant="roles" className="text-[10px] px-2.5 py-0.5 truncate max-w-full inline-block">
                      {log.module}
                    </Badge>
                  </td>
                  
                  <td className="py-3.5 px-6 text-gray-800 text-xs md:text-sm leading-relaxed">
                    {log.details}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-12 text-center text-gray-400 italic">
                  No history logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
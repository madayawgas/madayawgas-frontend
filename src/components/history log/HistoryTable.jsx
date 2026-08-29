import React from "react";
import ActionTypePill from "./ActionTypePill";

export default function HistoryTable({ logs }) {
  return (
    <div className="w-full bg-white rounded-lg shadow border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-white bg-[#0A4B6E]">
            <tr>
              <th scope="col" className="px-6 py-4 rounded-tl-lg font-semibold">Timestamp</th>
              <th scope="col" className="px-6 py-4 font-semibold text-center">User & Role</th>
              <th scope="col" className="px-6 py-4 font-semibold text-center">Action Type</th>
              <th scope="col" className="px-6 py-4 font-semibold text-center">Module</th>
              <th scope="col" className="px-6 py-4 rounded-tr-lg font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <tr 
                  key={log.id || index} 
                  className={`bg-white ${index !== logs.length - 1 ? 'border-b border-gray-200' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900 font-medium">{log.date}</div>
                    <div className="text-gray-500 text-xs">• {log.time}</div>
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <div className="font-medium text-gray-900">{log.userName}</div>
                    <div className="text-gray-500 text-xs">({log.userRole})</div>
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <ActionTypePill action={log.actionType} />
                  </td>
                  
                  <td className="px-6 py-4 text-center italic text-[#0A4B6F] font-medium">
                    {log.module}
                  </td>
                  
                  <td className="px-6 py-4 text-gray-900 max-w-sm">
                    {log.details}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
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
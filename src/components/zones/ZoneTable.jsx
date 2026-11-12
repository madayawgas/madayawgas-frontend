// src/components/zones/ZoneTable.jsx
import React from "react";
import {
  MapPin,
  Eye,
  Edit2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
} from "lucide-react";
import Badge from "../ui/Badge.jsx";
import Pagination from "../ui/Pagination.jsx";
import { formatPhilippineDateShort } from "../../utils/date.js";

export default function ZoneTable({
  zones = [],
  selectedZone,
  onSelectZone,
  sortConfig = { key: "code", direction: "asc" },
  onSort,
  pagination,
  onEdit,
  onToggleActive,
  canManage = true,
  isLoading = false,
  searchTerm = "",
}) {
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead className="bg-[#0D4B6E] text-white text-xs md:text-sm sticky top-0 z-10 shadow-xs select-none">
            <tr>
              <th
                className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap cursor-pointer hover:bg-[#0b3e5b] transition-colors w-[18%] min-w-[130px]"
                onClick={() => onSort && onSort("code")}
              >
                Zone Code{getSortIndicator("code")}
              </th>
              <th
                className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap cursor-pointer hover:bg-[#0b3e5b] transition-colors w-[26%] min-w-[180px]"
                onClick={() => onSort && onSort("name")}
              >
                Zone Name{getSortIndicator("name")}
              </th>
              <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[26%] min-w-[180px]">
                Description / Coverage
              </th>
              <th
                className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap cursor-pointer hover:bg-[#0b3e5b] transition-colors w-[14%] min-w-[110px]"
                onClick={() => onSort && onSort("createdAt")}
              >
                Date Added{getSortIndicator("createdAt")}
              </th>
              <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap text-center w-[16%] min-w-[95px]">
                Status
              </th>
              <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap text-center min-w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
            {isLoading && zones.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-[#6D8AA2]">
                  <RefreshCw
                    size={22}
                    className="animate-spin mx-auto mb-2 text-[#0A4B6E]"
                  />
                  Loading service delivery zones...
                </td>
              </tr>
            ) : zones.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-[#6D8AA2]">
                  <MapPin size={28} className="mx-auto mb-2 text-[#CBD5E1]" />
                  <p className="font-semibold text-[#0A4B6E] text-sm">
                    No Service Zones Found
                  </p>
                  <p className="text-[11px] mt-0.5">
                    {searchTerm
                      ? "No zones match your search or filter criteria."
                      : "No delivery zones defined yet."}
                  </p>
                </td>
              </tr>
            ) : (
              zones.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;

                return (
                  <tr
                    key={zone.id}
                    onClick={() => onSelectZone && onSelectZone(zone)}
                    className={`transition-colors duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-[#E2EDF3] text-[#0A4B6E] font-semibold"
                        : "bg-white hover:bg-[#F4F9FC]"
                    }`}
                  >
                    {/* Zone Code */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-[#0A4B6E]">
                      <span className="font-mono bg-[#E8F3F8] border border-[#BCE1F1] px-2.5 py-1 rounded-md text-xs text-[#0A4B6E] font-bold inline-flex items-center">
                        {zone.code}
                      </span>
                    </td>

                    {/* Zone Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin size={13} className="text-[#0A4B6E]/70 shrink-0" />
                        <span className="font-bold text-[#0A4B6E] truncate text-xs md:text-sm">
                          {zone.name}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 text-[#6D8AA2]">
                      <span className="line-clamp-2" title={zone.description || ""}>
                        {zone.description || "—"}
                      </span>
                    </td>

                    {/* Date Added */}
                    <td className="py-3.5 px-4 text-[#6D8AA2] whitespace-nowrap">
                      {formatPhilippineDateShort(zone.createdAt)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <Badge variant={zone.isActive ? "success" : "deactivated"}>
                        {zone.isActive ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3.5 px-4 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onSelectZone && onSelectZone(zone)}
                          title="Inspect zone details"
                          className="p-1.5 text-[#0A4B6E] hover:bg-[#E8F3F8] rounded-md transition-colors cursor-pointer"
                        >
                          <Eye size={14} />
                        </button>

                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => onEdit && onEdit(zone)}
                              title="Edit zone"
                              className="p-1.5 text-[#0A4B6E] hover:bg-[#E8F3F8] rounded-md transition-colors cursor-pointer"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => onToggleActive && onToggleActive(zone)}
                              title={
                                zone.isActive
                                  ? "Deactivate zone"
                                  : "Activate zone"
                              }
                              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                zone.isActive
                                  ? "text-slate-400 hover:text-[#C93B32] hover:bg-rose-50"
                                  : "text-emerald-700 hover:bg-emerald-50"
                              }`}
                            >
                              {zone.isActive ? (
                                <ToggleRight size={18} />
                              ) : (
                                <ToggleLeft size={18} />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pinned Pagination Footer */}
      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          limit={pagination.limit}
          onPageChange={pagination.onPageChange}
          onLimitChange={pagination.onLimitChange}
          isLoading={pagination.isLoading}
          itemLabel="service zones"
        />
      )}
    </div>
  );
}

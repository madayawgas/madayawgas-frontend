// src/components/fleet/work-orders/WorkOrderTable.jsx
import {
  Wrench,
  Calendar,
  Eye,
  Building2,
  Truck,
  Play,
  CheckCheck,
  Clock,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../../utils/permissions.js";
import Badge from "../../ui/Badge";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  } catch {
    return dateStr;
  }
}

function formatCurrency(val) {
  const num = Number(val) || 0;
  return `₱${num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const STATUS_BADGES = {
  PENDING: { label: "PENDING", variant: "warning" },
  APPROVED: { label: "APPROVED", variant: "roles" },
  SCHEDULED: { label: "SCHEDULED", variant: "roles" },
  IN_PROGRESS: { label: "IN PROGRESS", variant: "warning" },
  COMPLETED: { label: "COMPLETED", variant: "success" },
  CANCELLED: { label: "CANCELLED", variant: "danger" },
};

function getServiceTypeBadgeVariant(typeName) {
  const lower = (typeName || "").toLowerCase();
  if (lower.includes("preventive")) return "roles";
  if (lower.includes("corrective")) return "maintenance";
  if (lower.includes("emergency")) return "danger";
  if (lower.includes("accident")) return "neutral";
  return "roles";
}

/**
 * WorkOrderTable
 * Professional, high-finish master table for fleet maintenance work orders matching CustomerTable & UsersTable design.
 */
export default function WorkOrderTable({
  workOrders = [],
  isLoading = false,
  onOpenApproval,
  onOpenFinalize,
  onOpenDetail,
  onAdvanceStatus,
}) {
  const { currentUser, can } = useAuth();

  const canManageFleet = can && can(PERMISSIONS?.FLEET_MANAGE || "fleet.manage");
  const isManager =
    currentUser?.role === "Super Admin" ||
    currentUser?.role === "Admin" ||
    (can && can(PERMISSIONS?.USERS_MANAGE || "users.manage"));

  return (
    <div className="w-full h-full flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[980px]">
          <thead className="bg-[#0D4B6E] text-white text-xs md:text-sm sticky top-0 z-10 shadow-xs">
            <tr>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[15%]">
                WO Number
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[18%]">
                Vehicle Asset
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[13%]">
                Service Type
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap w-[16%]">
                Service Facility
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap w-[11%]">
                Est. Cost
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-center whitespace-nowrap w-[13%]">
                Status
              </th>
              <th className="py-3.5 px-4 md:px-5 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap w-[14%]">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-14 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="w-7 h-7 border-2 border-[#0B4A6E] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-[#0B4A6E]">Loading work orders...</span>
                  </div>
                </td>
              </tr>
            ) : workOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center text-gray-400 italic">
                  <div className="flex flex-col items-center gap-1">
                    <Wrench className="w-8 h-8 text-gray-300 stroke-1 mb-1" />
                    <p className="text-sm font-semibold text-gray-500">No work orders found</p>
                    <p className="text-xs text-gray-400">Try adjusting your search criteria or status filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              workOrders.map((wo) => {
                const statusInfo = STATUS_BADGES[wo.status] || {
                  label: wo.status,
                  variant: "neutral",
                };
                const estimatedCost = Number(wo.estimatedCost) || 0;
                const plate = wo.truck?.plateNumber || wo.plateNumber || "N/A";
                const model = wo.truck?.model || wo.truckModel || "";
                const typeName =
                  wo.maintenanceType?.name || wo.maintenanceTypeName || "General Service";
                const shop = wo.shopName || "Bunawan Heavy Repair Center";
                const woNumber =
                  wo.workOrderNumber ||
                  (wo.id?.startsWith("wo-")
                    ? wo.id.toUpperCase()
                    : `WO #${wo.id?.slice(0, 8)?.toUpperCase() || "N/A"}`);

                return (
                  <tr
                    key={wo.id}
                    onClick={() => onOpenDetail && onOpenDetail(wo)}
                    className="bg-white hover:bg-[#F4F9FC] transition-colors duration-150 cursor-pointer group"
                  >
                    {/* WO Number & Scheduled Date */}
                    <td className="py-3.5 px-4 md:px-5">
                      <div className="font-mono font-bold text-[#0A4B6E] text-xs md:text-sm truncate">
                        {woNumber}
                      </div>
                      <div className="text-[11px] text-[#6D8AA2] flex items-center gap-1 mt-0.5 truncate">
                        <Calendar size={11} className="shrink-0" />
                        <span>{formatDate(wo.scheduledDate || wo.createdAt)}</span>
                      </div>
                    </td>

                    {/* Vehicle */}
                    <td className="py-3.5 px-4 md:px-5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#0A4B6E] flex items-center justify-center text-[#FFDF2C] shrink-0 shadow-2xs">
                          <Truck size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 truncate">{plate}</div>
                          {model && (
                            <div className="text-[11px] text-[#6D8AA2] font-medium truncate">
                              {model}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Maintenance Type */}
                    <td className="py-3.5 px-4 md:px-5">
                      <Badge
                        variant={getServiceTypeBadgeVariant(typeName)}
                        className="text-[10px] px-2.5 py-0.5 truncate max-w-full inline-block"
                      >
                        {typeName}
                      </Badge>
                    </td>

                    {/* Facility */}
                    <td className="py-3.5 px-4 md:px-5 text-gray-800">
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 size={13} className="text-[#6D8AA2] shrink-0" />
                        <span className="font-medium text-xs truncate" title={shop}>
                          {shop}
                        </span>
                      </div>
                    </td>

                    {/* Estimated Cost */}
                    <td className="py-3.5 px-4 md:px-5 text-right font-bold text-gray-900 whitespace-nowrap">
                      {formatCurrency(estimatedCost)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 md:px-5 text-center whitespace-nowrap">
                      <Badge variant={statusInfo.variant} className="text-[10px] px-2.5 py-0.5">
                        {statusInfo.label}
                      </Badge>
                    </td>

                    {/* Contextual Action Button */}
                    <td className="py-3.5 px-4 md:px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {wo.status === "PENDING" && onOpenApproval && (
                          <button
                            type="button"
                            onClick={() => onOpenApproval(wo)}
                            className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 transition-all cursor-pointer active:scale-95 shadow-2xs"
                          >
                            {isManager ? "Review" : "Approval"}
                          </button>
                        )}

                        {(wo.status === "APPROVED" || wo.status === "SCHEDULED") && canManageFleet && onAdvanceStatus && (
                          <button
                            type="button"
                            onClick={() => onAdvanceStatus(wo.id, "IN_PROGRESS")}
                            className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-[#0A4B6E] text-[#FFDF2C] hover:bg-[#07324A] transition-all cursor-pointer active:scale-95 shadow-2xs flex items-center gap-1"
                          >
                            <Play size={10} className="fill-current text-[#FFDF2C]" />
                            <span>Start</span>
                          </button>
                        )}

                        {wo.status === "IN_PROGRESS" && canManageFleet && onOpenFinalize && (
                          <button
                            type="button"
                            onClick={() => onOpenFinalize(wo)}
                            className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1"
                          >
                            <CheckCheck size={11} />
                            <span>Finalize</span>
                          </button>
                        )}

                        {/* Details Eye trigger */}
                        <button
                          type="button"
                          onClick={() => onOpenDetail && onOpenDetail(wo)}
                          title="View Details"
                          className="p-1.5 text-gray-400 hover:text-[#0A4B6E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

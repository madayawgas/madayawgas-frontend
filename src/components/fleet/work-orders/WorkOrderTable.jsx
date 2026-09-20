// src/components/fleet/work-orders/WorkOrderTable.jsx
import {
  Wrench,
  Clock,
  Calendar,
  Play,
  CheckCheck,
  Eye,
  AlertTriangle,
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

/**
 * WorkOrderTable
 * Clean, simplified master table for fleet maintenance work orders matching CustomerTable & UsersTable design.
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
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-[#0D4B6E] text-white text-xs md:text-sm sticky top-0 z-10 shadow-xs">
            <tr>
              <th className="py-3 px-4 md:px-5 font-medium whitespace-nowrap w-[16%]">WO Number</th>
              <th className="py-3 px-4 md:px-5 font-medium whitespace-nowrap w-[17%]">Vehicle Asset</th>
              <th className="py-3 px-4 md:px-5 font-medium whitespace-nowrap w-[15%]">Service Type</th>
              <th className="py-3 px-4 md:px-5 font-medium whitespace-nowrap w-[20%]">Service Facility</th>
              <th className="py-3 px-4 md:px-5 font-medium text-right whitespace-nowrap w-[11%]">Est. Cost</th>
              <th className="py-3 px-4 md:px-5 font-medium text-center whitespace-nowrap w-[11%]">Status</th>
              <th className="py-3 px-4 md:px-5 font-medium text-right whitespace-nowrap w-[10%]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-[#0B4A6E] border-t-transparent rounded-full animate-spin" />
                    <span>Loading work orders...</span>
                  </div>
                </td>
              </tr>
            ) : workOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                  No work orders match your search or filter.
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
                  wo.maintenanceType?.name || wo.maintenanceTypeName || "General";
                const shop = wo.shopName || "External Facility";
                const woNumber =
                  wo.workOrderNumber ||
                  (wo.id?.startsWith("wo-")
                    ? wo.id.toUpperCase()
                    : wo.id?.slice(0, 10)?.toUpperCase() || "WO-N/A");

                return (
                  <tr
                    key={wo.id}
                    onClick={() => onOpenDetail && onOpenDetail(wo)}
                    className="hover:bg-[#E8F3F8]/70 transition-colors duration-150 cursor-pointer bg-white"
                  >
                    {/* WO Number & Scheduled Date */}
                    <td className="py-3.5 px-4 md:px-5">
                      <div className="font-mono font-bold text-[#0B4A6E] truncate">{woNumber}</div>
                      <div className="text-[11px] text-[#6D8AA2] italic truncate">
                        {formatDate(wo.scheduledDate || wo.createdAt)}
                      </div>
                    </td>

                    {/* Vehicle */}
                    <td className="py-3.5 px-4 md:px-5">
                      <div className="font-bold text-gray-800 truncate">{plate}</div>
                      {model && <div className="text-[11px] text-[#6D8AA2] font-normal truncate">{model}</div>}
                    </td>

                    {/* Maintenance Type */}
                    <td className="py-3.5 px-4 md:px-5">
                      <Badge variant="roles" className="text-[10px] px-2 py-0.5 truncate max-w-full inline-block">
                        {typeName}
                      </Badge>
                    </td>

                    {/* Facility */}
                    <td className="py-3.5 px-4 md:px-5 text-gray-700 font-medium">
                      <div className="truncate" title={shop}>
                        {shop}
                      </div>
                    </td>

                    {/* Estimated Cost */}
                    <td className="py-3.5 px-4 md:px-5 text-right font-semibold text-gray-800 whitespace-nowrap">
                      {formatCurrency(estimatedCost)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 md:px-5 text-center whitespace-nowrap">
                      <Badge variant={statusInfo.variant} className="text-[10px] px-2 py-0.5">
                        {statusInfo.label}
                      </Badge>
                    </td>

                    {/* Contextual Action Button */}
                    <td className="py-3.5 px-4 md:px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {wo.status === "PENDING" && onOpenApproval && (
                          <button
                            type="button"
                            onClick={() => onOpenApproval(wo)}
                            className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 transition cursor-pointer"
                          >
                            {isManager ? "Review" : "Approval"}
                          </button>
                        )}

                        {wo.status === "SCHEDULED" && canManageFleet && onAdvanceStatus && (
                          <button
                            type="button"
                            onClick={() => onAdvanceStatus(wo.id, "IN_PROGRESS")}
                            className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-300 transition cursor-pointer"
                          >
                            Start
                          </button>
                        )}

                        {wo.status === "IN_PROGRESS" && canManageFleet && onOpenFinalize && (
                          <button
                            type="button"
                            onClick={() => onOpenFinalize(wo)}
                            className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                          >
                            Finalize
                          </button>
                        )}

                        {/* Details Eye trigger */}
                        <button
                          type="button"
                          onClick={() => onOpenDetail && onOpenDetail(wo)}
                          title="View Details"
                          className="p-1 text-gray-400 hover:text-[#0B4A6E] hover:bg-gray-100 rounded-lg transition cursor-pointer"
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

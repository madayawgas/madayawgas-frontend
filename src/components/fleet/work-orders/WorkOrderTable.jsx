// src/components/fleet/work-orders/WorkOrderTable.jsx
import { useState, useMemo } from "react";
import {
  Wrench,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  Play,
  CheckCheck,
  Eye,
  XCircle,
  AlertTriangle,
  Building2,
  Truck,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../../utils/permissions.js";
import Button from "../../ui/Button";

const STATUS_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending Approval" },
  { key: "APPROVED", label: "Approved" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

const STATUS_PILLS = {
  PENDING: { label: "Pending", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "Approved", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  SCHEDULED: { label: "Scheduled", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  IN_PROGRESS: { label: "In Progress", bg: "bg-orange-50 text-orange-700 border-orange-200" },
  COMPLETED: { label: "Completed", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "Cancelled", bg: "bg-rose-50 text-rose-700 border-rose-200" },
};

/**
 * WorkOrderTable
 * Main interactive data table for fleet maintenance work orders.
 * Supports status tabs, keyword search, lifecycle transitions, and modal triggers.
 */
export default function WorkOrderTable({
  workOrders = [],
  isLoading = false,
  onCreateWorkOrder,
  onOpenApproval,
  onOpenFinalize,
  onOpenDetail,
  onAdvanceStatus,
}) {
  const { currentUser, can } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const canManageFleet = can && can(PERMISSIONS?.FLEET_MANAGE || "fleet.manage");
  const isManager =
    currentUser?.role === "Super Admin" ||
    currentUser?.role === "Admin" ||
    (can && can(PERMISSIONS?.USERS_MANAGE || "users.manage"));

  // Pending approval counter for the filter badge
  const pendingCount = useMemo(() => {
    return workOrders.filter((wo) => wo.status === "PENDING").length;
  }, [workOrders]);

  // Filter & search work orders
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      // Status filter
      if (selectedStatus !== "ALL" && wo.status !== selectedStatus) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const woNumber = (wo.workOrderNumber || "").toLowerCase();
        const plate = (wo.truck?.plateNumber || "").toLowerCase();
        const model = (wo.truck?.model || "").toLowerCase();
        const shop = (wo.shopName || "").toLowerCase();
        const type = (wo.maintenanceType?.name || wo.maintenanceTypeName || "").toLowerCase();

        return (
          woNumber.includes(query) ||
          plate.includes(query) ||
          model.includes(query) ||
          shop.includes(query) ||
          type.includes(query)
        );
      }

      return true;
    });
  }, [workOrders, selectedStatus, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      {/* Top Header & Controls */}
      <div className="shrink-0 p-4 border-b border-slate-200/70 bg-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#1B4B75] flex items-center gap-2">
              <Wrench className="w-5 h-5 text-[#0B4A6E]" />
              <span>Fleet Work Orders</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Track lifecycle, enforce ₱5,000 cost approvals, and finalize repairs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canManageFleet && (
              <Button
                type="button"
                onClick={onCreateWorkOrder}
                className="rounded-full bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0B4A6E] font-bold text-xs uppercase tracking-wider px-4 py-2 shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Work Order</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter Pills & Search Input */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Segmented Status Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.map((filter) => {
              const isSelected = selectedStatus === filter.key;
              const hasBadge = filter.key === "PENDING" && pendingCount > 0;

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setSelectedStatus(filter.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#0B4A6E] text-white shadow-sm"
                      : "bg-[#F3F5F5] text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  <span>{filter.label}</span>
                  {hasBadge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isSelected ? "bg-[#FFDF2C] text-[#0B4A6E]" : "bg-amber-500 text-white"
                      }`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search WO#, truck, shop..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F3F5F5] rounded-full border border-slate-200 focus:outline-none focus:border-[#0B4A6E] focus:bg-white text-slate-800 transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Table Container - Independent Scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-[#0B4A6E] text-white shadow-sm">
            <tr>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">WO Number</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Vehicle</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Type</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Repair Facility</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Est. Cost</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Scheduled</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Status</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-[#0B4A6E] border-t-transparent rounded-full animate-spin" />
                    <span>Loading work orders...</span>
                  </div>
                </td>
              </tr>
            ) : filteredWorkOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Wrench className="w-8 h-8 text-slate-300" />
                    <span className="font-medium">No work orders found matching criteria.</span>
                    {canManageFleet && (
                      <button
                        type="button"
                        onClick={onCreateWorkOrder}
                        className="text-xs font-bold text-[#0B4A6E] hover:underline mt-1"
                      >
                        Create a new work order
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredWorkOrders.map((wo) => {
                const statusStyle = STATUS_PILLS[wo.status] || {
                  label: wo.status,
                  bg: "bg-slate-50 text-slate-700 border-slate-200",
                };
                const estimatedCost = Number(wo.estimatedCost) || 0;
                const exceedsThreshold = estimatedCost >= 5000.0;
                const plate = wo.truck?.plateNumber || "N/A";
                const model = wo.truck?.model || "";
                const typeName = wo.maintenanceType?.name || wo.maintenanceTypeName || "General";

                return (
                  <tr
                    key={wo.id}
                    className="hover:bg-[#E8F3F8]/40 transition-colors border-b border-slate-100/80"
                  >
                    {/* WO Number */}
                    <td className="py-3 px-4 font-mono font-bold text-[#0B4A6E]">
                      {wo.workOrderNumber || wo.id?.slice(0, 8)}
                    </td>

                    {/* Vehicle */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{plate}</div>
                      {model && <div className="text-[11px] text-slate-400">{model}</div>}
                    </td>

                    {/* Maintenance Type */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3F8] text-[#1B4B75] border border-[#BCE1F1]">
                        {typeName}
                      </span>
                    </td>

                    {/* Facility */}
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {wo.shopName || "External Facility"}
                    </td>

                    {/* Estimated Cost */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <span>₱{estimatedCost.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                        {exceedsThreshold && (
                          <span
                            title="Exceeds ₱5,000 threshold (Managerial Approval Required)"
                            className="inline-flex items-center text-amber-600"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Scheduled Date */}
                    <td className="py-3 px-4 text-slate-600">
                      {wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString() : "Pending"}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${statusStyle.bg}`}
                      >
                        {statusStyle.label}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Pending Approval -> Review Action */}
                        {wo.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => onOpenApproval(wo)}
                            title={isManager ? "Authorize or Reject Cost" : "View Approval Details"}
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 transition-all flex items-center gap-1"
                          >
                            <Clock className="w-3 h-3" />
                            <span>{isManager ? "Review" : "Approval"}</span>
                          </button>
                        )}

                        {/* Approved -> Schedule Action */}
                        {wo.status === "APPROVED" && canManageFleet && (
                          <button
                            type="button"
                            onClick={() => onAdvanceStatus(wo.id, "SCHEDULED")}
                            title="Schedule Work Order"
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-300 transition-all flex items-center gap-1"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>Schedule</span>
                          </button>
                        )}

                        {/* Scheduled -> Start Repair (IN_PROGRESS) */}
                        {wo.status === "SCHEDULED" && canManageFleet && (
                          <button
                            type="button"
                            onClick={() => onAdvanceStatus(wo.id, "IN_PROGRESS")}
                            title="Start In-Repair Execution"
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-300 transition-all flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Start Repair</span>
                          </button>
                        )}

                        {/* In Progress -> Finalize Action (Triggers FinalizeMaintenanceModal) */}
                        {wo.status === "IN_PROGRESS" && canManageFleet && (
                          <button
                            type="button"
                            onClick={() => onOpenFinalize(wo)}
                            title="Finalize Maintenance Log & Release Truck"
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Finalize</span>
                          </button>
                        )}

                        {/* Cancel Action (only for PENDING, APPROVED, SCHEDULED) */}
                        {["PENDING", "APPROVED", "SCHEDULED"].includes(wo.status) && canManageFleet && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to cancel work order ${wo.workOrderNumber || wo.id}?`)) {
                                onAdvanceStatus(wo.id, "CANCELLED");
                              }
                            }}
                            title="Cancel Work Order"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Details Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => onOpenDetail(wo)}
                          title="View Details & Timeline"
                          className="p-1 rounded-lg text-slate-400 hover:text-[#0B4A6E] hover:bg-slate-100 transition-all"
                        >
                          <Eye className="w-4 h-4" />
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

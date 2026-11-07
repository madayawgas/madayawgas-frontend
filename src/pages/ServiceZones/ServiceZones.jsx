// src/pages/ServiceZones/ServiceZones.jsx
import { useState, useEffect, useMemo, useCallback, useId } from "react";
import {
  MapPin,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  CheckCircle2,
  X,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Eye,
  Info,
} from "lucide-react";
import { schedulesApi } from "../../api/schedules.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";
import ToastNotification from "../../components/ui/ToastNotifications.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import SideDrawer from "../../components/ui/SideDrawer.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";

export default function ServiceZones() {
  const searchInputId = useId();
  const zoneCodeInputId = useId();
  const zoneNameInputId = useId();
  const zoneDescriptionInputId = useId();
  const { can } = useAuth();
  const canManage = can
    ? can(PERMISSIONS?.ROUTE_MANAGE || "route.manage")
    : true;

  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // SideDrawer selected zone
  const [selectedZone, setSelectedZone] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null); // null = creating
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    isActive: true,
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToastMessage = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
  }, []);

  const fetchZones = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await schedulesApi.getZones();
      setZones(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to fetch zones:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // Filtered zones
  const filteredZones = useMemo(() => {
    return zones.filter((z) => {
      if (statusFilter === "ACTIVE" && !z.isActive) return false;
      if (statusFilter === "INACTIVE" && z.isActive) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCode = (z.code || "").toLowerCase().includes(q);
        const matchName = (z.name || "").toLowerCase().includes(q);
        const matchDesc = (z.description || "").toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [zones, statusFilter, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  // Paginated slice
  const paginatedZones = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredZones.slice(start, start + limit);
  }, [filteredZones, page, limit]);

  const totalPages = Math.ceil(filteredZones.length / limit) || 1;

  // Open Create
  const handleOpenCreate = () => {
    setEditingZone(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      isActive: true,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (zone) => {
    setEditingZone(zone);
    setFormData({
      code: zone.code || "",
      name: zone.name || "",
      description: zone.description || "",
      isActive: zone.isActive !== false,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  // Save Zone
  const handleSaveZone = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Zone name is required.");
      return;
    }
    if (!editingZone && !formData.code.trim()) {
      setFormError("Zone code is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");

      if (editingZone) {
        await schedulesApi.updateZone(editingZone.id, {
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          isActive: formData.isActive,
        });
        showToastMessage("Service zone updated successfully.");
        if (selectedZone?.id === editingZone.id) {
          setSelectedZone((prev) => ({
            ...prev,
            name: formData.name.trim(),
            description: formData.description?.trim() || null,
            isActive: formData.isActive,
          }));
        }
      } else {
        await schedulesApi.createZone({
          code: formData.code.toUpperCase().trim(),
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          isActive: formData.isActive,
        });
        showToastMessage("New service zone created successfully.");
      }

      setIsModalOpen(false);
      await fetchZones();
    } catch (err) {
      setFormError(err?.message || "Failed to save service zone.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active status directly
  const handleToggleActive = async (zone) => {
    if (!canManage) return;
    try {
      await schedulesApi.updateZone(zone.id, {
        isActive: !zone.isActive,
      });
      showToastMessage(
        `Zone ${zone.code} ${!zone.isActive ? "activated" : "deactivated"}.`
      );
      if (selectedZone?.id === zone.id) {
        setSelectedZone((prev) => ({ ...prev, isActive: !zone.isActive }));
      }
      await fetchZones();
    } catch (err) {
      showToastMessage(err?.message || "Failed to update zone status.", "error");
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#F8FAFC]">
      {/* Header Banner */}
      <header className="shrink-0 bg-white border-b border-[#E2E8F0] px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              <h1 className="text-xl font-bold text-[#0A4B6E]">Service Delivery Zones</h1>
            </div>
            <p className="text-xs text-[#6D8AA2] mt-0.5">
              Manage geographic route delivery districts and territory coverage
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canManage && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-[#FFDF2C] text-[#0A4B6E] hover:bg-[#ebd024] shadow-xs transition-all cursor-pointer uppercase tracking-wider text-[11px]"
              >
                <Plus size={14} />
                <span>Add Zone</span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchZones}
              disabled={isLoading}
              title="Refresh service zones"
              className="p-2 text-[#6D8AA2] hover:text-[#0A4B6E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-[#F1F5F9]">
          <div className="flex items-center bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-0.5 text-xs">
            {["ALL", "ACTIVE", "INACTIVE"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-white text-[#0A4B6E] shadow-2xs font-bold"
                    : "text-[#6D8AA2] hover:text-[#0A4B6E]"
                }`}
              >
                {st === "ALL" ? "All" : st === "ACTIVE" ? "Active" : "Inactive"}
              </button>
            ))}
          </div>

          <div className="relative sm:w-64">
            <label htmlFor={searchInputId} className="sr-only">Search zones by code, name, or description</label>
            <input
              id={searchInputId}
              type="text"
              placeholder="Search zones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0A4B6E] placeholder-[#6D8AA2]/70 focus:outline-hidden focus:border-[#0A4B6E] focus:bg-white transition-all"
            />
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6D8AA2]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Table */}
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col p-6">
        <div className="flex-1 min-h-0 bg-white border border-[#CBD5E1] rounded-2xl flex flex-col overflow-hidden shadow-2xs">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#0D4B6E] text-white text-xs md:text-sm z-10 shadow-xs select-none">
                <tr>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">Zone Code</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">Zone Name</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">Description / Coverage</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap text-center">Status</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[#0A4B6E] text-xs md:text-sm">
                {isLoading && zones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-[#6D8AA2]">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#0A4B6E]" />
                      Loading service delivery zones...
                    </td>
                  </tr>
                ) : paginatedZones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-[#6D8AA2]">
                      <MapPin size={24} className="mx-auto mb-2 text-[#CBD5E1]" />
                      <p className="font-semibold text-[#0A4B6E]">No Service Zones Found</p>
                      <p className="text-[11px] mt-0.5">
                        {searchTerm
                          ? "No zones match your search query."
                          : "No delivery zones defined yet."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedZones.map((z) => {
                    const isSelected = selectedZone?.id === z.id;
                    return (
                      <tr
                        key={z.id}
                        onClick={() => setSelectedZone(z)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#E2EDF3] hover:bg-[#E2EDF3]"
                            : "hover:bg-[#F8FAFC]"
                        }`}
                      >
                        {/* Code */}
                        <td className="py-3 px-4 font-bold text-[#0A4B6E]">
                          <span className="font-mono bg-[#E8F3F8] px-2.5 py-1 rounded text-xs text-[#0A4B6E] font-bold">
                            {z.code}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4 font-semibold text-[#0A4B6E]">
                          {z.name}
                        </td>

                        {/* Description */}
                        <td className="py-3 px-4 text-[#6D8AA2]">
                          {z.description || "—"}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <Badge variant={z.isActive ? "active" : "deactivated"}>
                            {z.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedZone(z)}
                              title="Inspect zone"
                              className="p-1.5 text-[#0A4B6E] hover:bg-[#E8F3F8] rounded-md transition-colors cursor-pointer"
                            >
                              <Eye size={14} />
                            </button>

                            {canManage && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(z)}
                                  title="Edit zone"
                                  className="p-1.5 text-[#0A4B6E] hover:bg-[#E8F3F8] rounded-md transition-colors cursor-pointer"
                                >
                                  <Edit2 size={13} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(z)}
                                  title={z.isActive ? "Deactivate zone" : "Activate zone"}
                                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                    z.isActive
                                      ? "text-slate-400 hover:text-[#C93B32] hover:bg-rose-50"
                                      : "text-emerald-700 hover:bg-emerald-50"
                                  }`}
                                >
                                  {z.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
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

          {/* Standard Pagination Footer */}
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filteredZones.length}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            itemLabel="delivery zones"
          />
        </div>
      </main>

      {/* SideDrawer for Zone Inspection */}
      <SideDrawer
        isOpen={Boolean(selectedZone)}
        onClose={() => setSelectedZone(null)}
        title={selectedZone ? `${selectedZone.code}: ${selectedZone.name}` : "Service Zone"}
        subtitle="Geographic Delivery Zone"
        icon={MapPin}
        footer={
          <div className="flex items-center justify-between w-full">
            {canManage && selectedZone && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(selectedZone)}
                >
                  <Edit2 size={13} className="mr-1" />
                  Edit
                </Button>
                <Button
                  variant={selectedZone.isActive ? "destructive" : "secondary"}
                  size="sm"
                  onClick={() => handleToggleActive(selectedZone)}
                >
                  {selectedZone.isActive ? (
                    <>
                      <ToggleRight size={13} className="mr-1" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={13} className="mr-1" />
                      Activate
                    </>
                  )}
                </Button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSelectedZone(null)}
              className="ml-auto px-5 py-2 text-xs font-bold text-[#0A4B6E] bg-[#FFDF2C] hover:bg-[#ebd024] rounded-lg cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedZone && (
          <div className="space-y-5 text-xs text-[#0A4B6E]">
            {/* Header info badge */}
            <div className="bg-[#E8F3F8] rounded-xl p-4 border border-[#0A4B6E]/15 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white text-[#0A4B6E] flex items-center justify-center font-mono font-bold text-sm shadow-xs">
                  {selectedZone.code?.slice(0, 3)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0A4B6E]">
                    {selectedZone.name}
                  </h3>
                  <p className="font-mono text-[11px] text-[#6D8AA2]">
                    Code: {selectedZone.code}
                  </p>
                </div>
              </div>
              <Badge variant={selectedZone.isActive ? "active" : "deactivated"}>
                {selectedZone.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            {/* Description / Coverage Area */}
            <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#6D8AA2]">
                Territory Coverage & Notes
              </h4>
              <p className="text-xs text-[#0A4B6E] leading-relaxed bg-[#F8FAFC] p-3 rounded-lg border border-slate-100">
                {selectedZone.description || "No specific territory description provided."}
              </p>
            </div>

            {/* Operations Summary */}
            <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#6D8AA2]">
                Operational Dispatch Status
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-slate-100">
                  <span className="text-[11px] text-[#6D8AA2] block">Dispatch Eligibility</span>
                  <span className="font-semibold text-[#0A4B6E]">
                    {selectedZone.isActive ? "Available for Trips" : "Gated (Inactive)"}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-slate-100">
                  <span className="text-[11px] text-[#6D8AA2] block">Zone Type</span>
                  <span className="font-semibold text-[#0A4B6E]">
                    Standard Route
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-slate-100 col-span-2">
                  <span className="text-[11px] text-[#6D8AA2] block">Zone ID</span>
                  <span className="font-mono text-[10px] text-slate-500 break-all">
                    {selectedZone.id}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </SideDrawer>

      {/* Add / Edit Zone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#E8F3F8] text-[#0A4B6E]">
                  <MapPin size={16} />
                </div>
                <h2 className="text-sm font-bold text-[#0A4B6E]">
                  {editingZone ? `Edit Zone: ${editingZone.code}` : "Add Service Zone"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-[#C93B32] flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveZone} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor={zoneCodeInputId} className="block font-semibold text-[#0A4B6E] mb-1">
                  Zone Code <span className="text-[#C93B32]">*</span>
                </label>
                <input
                  id={zoneCodeInputId}
                  type="text"
                  placeholder="e.g. ZN-DVO-01"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  disabled={Boolean(editingZone)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#0A4B6E] font-mono focus:outline-hidden focus:border-[#0A4B6E] focus:bg-white disabled:opacity-60"
                  required
                />
              </div>

              <div>
                <label htmlFor={zoneNameInputId} className="block font-semibold text-[#0A4B6E] mb-1">
                  Zone Name <span className="text-[#C93B32]">*</span>
                </label>
                <input
                  id={zoneNameInputId}
                  type="text"
                  placeholder="e.g. Davao Central District"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#0A4B6E] focus:outline-hidden focus:border-[#0A4B6E] focus:bg-white"
                  required
                />
              </div>

              <div>
                <label htmlFor={zoneDescriptionInputId} className="block font-semibold text-[#0A4B6E] mb-1">
                  Description / Coverage
                </label>
                <textarea
                  id={zoneDescriptionInputId}
                  rows={3}
                  placeholder="e.g. Downtown commercial clients and restaurants"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#0A4B6E] focus:outline-hidden focus:border-[#0A4B6E] focus:bg-white"
                />
              </div>

              <div className="pt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveZone"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-[#0A4B6E] focus:ring-[#0A4B6E]"
                />
                <label htmlFor="isActiveZone" className="text-xs text-[#0A4B6E] font-medium cursor-pointer">
                  Zone is active for trip dispatch and route planning
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-[#6D8AA2] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-[#0A4B6E] bg-[#FFDF2C] hover:bg-[#ebd024] rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingZone ? "Save Changes" : "Create Zone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toast.show && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}

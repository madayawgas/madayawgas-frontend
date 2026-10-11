// src/pages/RoutePlanner/RoutePlanner.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, Plus, RefreshCw, Layers } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";

import { schedulesApi } from "../../api/schedules.js";
import { fleetApi } from "../../api/fleet.js";
import { usersApi } from "../../api/users.js";

import MasterTemplateMatrix from "../../components/route-dispatch/MasterTemplateMatrix";
import TemplateModal from "../../components/route-dispatch/TemplateModal";
import BatchGenerateModal from "../../components/route-dispatch/BatchGenerateModal";
import ToastNotification from "../../components/ui/ToastNotifications";

export default function RoutePlanner() {
  const { can } = useAuth();
  const canManage = can ? can(PERMISSIONS.ROUTE_MANAGE || "route.manage") : false;

  const [templates, setTemplates] = useState(() => {
    try {
      const cached = localStorage.getItem("app_templates_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [vehicles, setVehicles] = useState(() => {
    try {
      const cached = localStorage.getItem("app_fleet_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [zones, setZones] = useState(() => {
    try {
      const cached = localStorage.getItem("app_zones_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [users, setUsers] = useState([]);
  const salesUsers = useMemo(() => {
    return users.filter((u) => {
      const role = (u.role || u.roleNames?.join(" ") || "").toLowerCase();
      return role.includes("sales");
    });
  }, [users]);

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Modals state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState(null);
  const [prefillTruckId, setPrefillTruckId] = useState("");
  const [prefillDayOfWeek, setPrefillDayOfWeek] = useState(1);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [tplData, vData, zData, uData] = await Promise.all([
        schedulesApi.getTemplates().catch((err) => {
          console.warn("Error fetching templates:", err);
          return [];
        }),
        fleetApi.getVehicles().catch((err) => {
          console.warn("Error fetching fleet:", err);
          return [];
        }),
        schedulesApi.getZones().catch((err) => {
          console.warn("Error fetching zones:", err);
          return [];
        }),
        usersApi.getUsers().catch(() => []),
      ]);

      if (Array.isArray(tplData)) setTemplates(tplData);
      if (Array.isArray(vData)) setVehicles(vData);
      if (Array.isArray(zData)) setZones(zData);
      if (Array.isArray(uData)) setUsers(uData);
    } catch (err) {
      console.warn("Failed to load route planner data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAddTemplate = (truckId = "", dayOfWeek = 1) => {
    setTemplateToEdit(null);
    setPrefillTruckId(truckId);
    setPrefillDayOfWeek(dayOfWeek);
    setShowTemplateModal(true);
  };

  const handleOpenEditTemplate = (tpl) => {
    setTemplateToEdit(tpl);
    setPrefillTruckId(tpl.truckId);
    setPrefillDayOfWeek(tpl.dayOfWeek);
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async (payload) => {
    try {
      if (payload.id) {
        await schedulesApi.updateTemplate(payload.id, payload);
        showToast("success", "Weekly route template updated successfully");
      } else {
        await schedulesApi.createTemplate(payload);
        showToast("success", "Weekly route template created successfully");
      }
      loadData();
    } catch (err) {
      showToast("error", err.message || "Failed to save route template");
    }
  };

  const handleDeleteTemplate = async (id) => {
    try {
      await schedulesApi.deleteTemplate(id);
      showToast("success", "Weekly route template deleted successfully");
      loadData();
    } catch (err) {
      showToast("error", err.message || "Failed to delete template");
    }
  };

  const handleBatchGenerate = async (payload) => {
    try {
      const res = await schedulesApi.generateSchedules(payload);
      showToast("success", res.message || "Daily truck schedules generated successfully");
      return res;
    } catch (err) {
      showToast("error", err.message || "Failed to generate schedules");
      throw err;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Controls Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D5E3EC]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs">
            <Calendar size={13} className="text-[#0A4B6E]" />
            <span>{templates.length} Active Weekly Templates</span>
          </span>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleOpenAddTemplate()}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-[#D5E3EC] text-[#0A4B6E] font-bold text-xs px-3.5 py-2 rounded-full transition-all cursor-pointer shadow-2xs"
            >
              <Plus size={14} />
              <span>Add Route Template</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBatchModal(true)}
              className="flex items-center gap-1.5 bg-[#0A4B6E] hover:bg-[#0E384E] text-[#FFDF2C] font-bold text-xs px-4 py-2 rounded-full transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <RefreshCw size={14} />
              <span>Create Daily Schedules</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              title="Refresh weekly route planner"
              className="p-2 text-[#6D8AA2] hover:text-[#0A4B6E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        )}
      </div>

      {/* 7-Day Grid View */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <MasterTemplateMatrix
          templates={templates}
          vehicles={vehicles}
          canManage={canManage}
          onAddTemplate={handleOpenAddTemplate}
          onEditTemplate={handleOpenEditTemplate}
          onDeleteTemplate={handleDeleteTemplate}
        />
      </div>

      {/* Modals */}
      <BatchGenerateModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onGenerate={handleBatchGenerate}
      />

      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setTemplateToEdit(null);
        }}
        template={templateToEdit}
        initialTruckId={prefillTruckId}
        initialDayOfWeek={prefillDayOfWeek}
        vehicles={vehicles}
        zones={zones}
        salesUsers={salesUsers}
        onSaveTemplate={handleSaveTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />
    </div>
  );
}

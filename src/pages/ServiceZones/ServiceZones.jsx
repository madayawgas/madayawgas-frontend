// src/pages/ServiceZones/ServiceZones.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MapPin } from "lucide-react";
import { schedulesApi } from "../../api/schedules.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";
import { isPhilippineDateInRange } from "../../utils/date.js";
import ToastNotification from "../../components/ui/ToastNotifications.jsx";
import SideDrawer from "../../components/ui/SideDrawer.jsx";
import Badge from "../../components/ui/Badge.jsx";

// Modular Zone Components
import ZoneHeader from "../../components/zones/ZoneHeader.jsx";
import ZoneControls from "../../components/zones/ZoneControls.jsx";
import ZoneTable from "../../components/zones/ZoneTable.jsx";
import ZoneDetailPanel from "../../components/zones/ZoneDetailPanel.jsx";
import ZoneModal from "../../components/zones/ZoneModal.jsx";

export default function ServiceZones() {
  const { can } = useAuth();
  const canManage = can
    ? can(PERMISSIONS?.ROUTE_MANAGE || "route.manage")
    : true;

  // Data & Loading States
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    status: "ALL",
    dateFrom: "",
    dateTo: "",
  });

  // Sorting State
  const [sortConfig, setSortConfig] = useState({
    key: "code",
    direction: "asc",
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // SideDrawer Inspection State
  const [selectedZone, setSelectedZone] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null); // null = creating

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToastMessage = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
  }, []);

  // Fetch Service Delivery Zones
  const fetchZones = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await schedulesApi.getZones();
      const list = Array.isArray(res) ? res : [];
      setZones(list);

      // Keep selectedZone in sync if already selected
      if (selectedZone) {
        const updatedSelected = list.find((z) => z.id === selectedZone.id);
        if (updatedSelected) {
          setSelectedZone(updatedSelected);
        }
      }
    } catch (err) {
      console.error("Failed to fetch zones:", err);
      showToastMessage(err?.message || "Failed to load service zones.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [selectedZone, showToastMessage]);

  useEffect(() => {
    fetchZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute Live Metrics Summary for Header Pills
  const summary = useMemo(() => {
    const total = zones.length;
    let active = 0;
    let inactive = 0;

    for (const z of zones) {
      if (z.isActive) {
        active++;
      } else {
        inactive++;
      }
    }

    return { total, active, inactive };
  }, [zones]);

  // Filtered & Sorted Zones List
  const filteredZones = useMemo(() => {
    let result = zones.filter((z) => {
      // Status Filter
      if (activeFilters.status === "ACTIVE" && !z.isActive) return false;
      if (activeFilters.status === "INACTIVE" && z.isActive) return false;

      // Date Range Filter (Philippine Time)
      if (activeFilters.dateFrom || activeFilters.dateTo) {
        if (!isPhilippineDateInRange(z.createdAt, activeFilters.dateFrom, activeFilters.dateTo)) {
          return false;
        }
      }

      // Search Query Match (Code, Name, or Description)
      const query = committedSearch.trim().toLowerCase();
      if (query) {
        const matchCode = (z.code || "").toLowerCase().includes(query);
        const matchName = (z.name || "").toLowerCase().includes(query);
        const matchDesc = (z.description || "").toLowerCase().includes(query);
        if (!matchCode && !matchName && !matchDesc) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortConfig.key] || "";
      let valB = b[sortConfig.key] || "";

      if (sortConfig.key === "createdAt") {
        const timeA = new Date(valA).getTime() || 0;
        const timeB = new Date(valB).getTime() || 0;
        return sortConfig.direction === "asc" ? timeA - timeB : timeB - timeA;
      }

      const cmp = String(valA).localeCompare(String(valB), undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sortConfig.direction === "asc" ? cmp : -cmp;
    });

    return result;
  }, [zones, activeFilters, committedSearch, sortConfig]);

  // Total pages based on filtered set
  const totalPages = Math.ceil(filteredZones.length / limit) || 1;

  // Paginated Slice
  const paginatedZones = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredZones.slice(start, start + limit);
  }, [filteredZones, page, limit]);

  // Search Handlers
  const handleSearchSubmit = (query) => {
    setCommittedSearch(query);
    setSearchTerm(query);
    setPage(1);
  };

  const handleClearSearch = () => {
    setCommittedSearch("");
    setSearchTerm("");
    setPage(1);
  };

  // Filter Handlers
  const handleApplyFilters = (newFilters) => {
    setActiveFilters(newFilters);
    setPage(1);
  };

  const handleClearStatus = () => {
    setActiveFilters((prev) => ({ ...prev, status: "ALL" }));
    setPage(1);
  };

  const handleClearDate = () => {
    setActiveFilters((prev) => ({ ...prev, dateFrom: "", dateTo: "" }));
    setPage(1);
  };

  // Sort Handler
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingZone(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (zone) => {
    setEditingZone(zone);
    setIsModalOpen(true);
  };

  // Save Zone (Create or Update)
  const handleSaveZone = async (payload) => {
    if (editingZone) {
      await schedulesApi.updateZone(editingZone.id, {
        name: payload.name,
        description: payload.description,
        isActive: payload.isActive,
      });
      showToastMessage(`Service zone "${payload.name}" updated successfully.`);
      if (selectedZone?.id === editingZone.id) {
        setSelectedZone((prev) => ({
          ...prev,
          name: payload.name,
          description: payload.description,
          isActive: payload.isActive,
        }));
      }
    } else {
      await schedulesApi.createZone({
        code: payload.code,
        name: payload.name,
        description: payload.description,
        isActive: payload.isActive,
      });
      showToastMessage(`New service zone "${payload.code}" created successfully.`);
    }

    setIsModalOpen(false);
    await fetchZones();
  };

  // Toggle Active / Deactivate Status
  const handleToggleActive = async (zone) => {
    if (!canManage) return;
    try {
      const nextActive = !zone.isActive;
      await schedulesApi.updateZone(zone.id, {
        isActive: nextActive,
      });
      showToastMessage(
        `Zone ${zone.code} ${nextActive ? "activated" : "deactivated"} successfully.`
      );
      if (selectedZone?.id === zone.id) {
        setSelectedZone((prev) => ({ ...prev, isActive: nextActive }));
      }
      await fetchZones();
    } catch (err) {
      showToastMessage(err?.message || "Failed to update zone status.", "error");
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden min-w-0">
      {/* 1. Standard Header with Live Metric Summary Pills (Pinned at Top) */}
      <div className="shrink-0">
        <ZoneHeader
          summary={summary}
          isLoading={isLoading}
          canManage={canManage}
          onRefresh={fetchZones}
          onAddZone={handleOpenCreate}
        />
      </div>

      {/* 2. Standard Search & Filter Controls (Pinned at Top) */}
      <div className="shrink-0">
        <ZoneControls
          searchTerm={searchTerm}
          onSearchChange={(e) => {
            setSearchTerm(e.target.value);
            // Reactive search if user clears input completely
            if (!e.target.value) {
              setCommittedSearch("");
              setPage(1);
            }
          }}
          onSearch={handleSearchSubmit}
          onClearSearch={handleClearSearch}
          activeFilters={activeFilters}
          onApplyFilters={handleApplyFilters}
          onClearStatus={handleClearStatus}
          onClearDate={handleClearDate}
        />
      </div>

      {/* 3. Main Master Table Area with Independent SlideDrawer Inspection */}
      <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden">
        <ZoneTable
          zones={paginatedZones}
          selectedZone={selectedZone}
          onSelectZone={setSelectedZone}
          sortConfig={sortConfig}
          onSort={handleSort}
          pagination={{
            page,
            limit,
            totalItems: filteredZones.length,
            totalPages,
            onPageChange: setPage,
            onLimitChange: (newLimit) => {
              setLimit(newLimit);
              setPage(1);
            },
            isLoading,
          }}
          onEdit={handleOpenEdit}
          onToggleActive={handleToggleActive}
          canManage={canManage}
          isLoading={isLoading}
          searchTerm={committedSearch}
        />

        {/* Slide-Over Inspection Drawer */}
        <SideDrawer
          isOpen={Boolean(selectedZone)}
          onClose={() => setSelectedZone(null)}
          title={selectedZone ? `${selectedZone.code}: ${selectedZone.name}` : "Service Zone"}
          subtitle="Geographic Delivery Zone"
          icon={MapPin}
          badge={
            selectedZone && (
              <Badge
                variant={selectedZone.isActive ? "success" : "deactivated"}
                className="px-2.5 py-0.5 text-[10px] font-bold"
              >
                {selectedZone.isActive ? "ACTIVE" : "INACTIVE"}
              </Badge>
            )
          }
          width="max-w-md sm:max-w-lg"
        >
          {selectedZone && (
            <ZoneDetailPanel
              zone={selectedZone}
              onClose={() => setSelectedZone(null)}
              onEdit={(z) => {
                setSelectedZone(null);
                handleOpenEdit(z);
              }}
              onToggleActive={handleToggleActive}
              canManage={canManage}
            />
          )}
        </SideDrawer>
      </div>

      {/* 4. Add / Edit Service Zone Modal */}
      <ZoneModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveZone}
        zone={editingZone}
      />

      {/* 5. Standard Toast Feedback */}
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

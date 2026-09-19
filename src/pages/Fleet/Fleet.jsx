// src/pages/Fleet/Fleet.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { fleetApi } from "../../api/fleet.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";
import initialMockFleet from "../../mocks/fleet.json";

import FleetHeader from "../../components/fleet/FleetHeader";
import FleetControls from "../../components/fleet/FleetControls";
import TruckCard from "../../components/fleet/TruckCard";
import TruckModal from "../../components/fleet/TruckModal";
import OdometerCheckInModal from "../../components/fleet/OdometerCheckInModal";
import OdometerHistoryModal from "../../components/fleet/OdometerHistoryModal";
import SetAvailabilityModal from "../../components/fleet/SetAvailabilityModal";
import InspectionModal from "../../components/fleet/InspectionModal";
import InspectionHistoryModal from "../../components/fleet/InspectionHistoryModal";
import IncidentReportModal from "../../components/fleet/IncidentReportModal";
import IncidentHistoryModal from "../../components/fleet/IncidentHistoryModal";
import DeleteConfirmationModal from "../../components/fleet/DeleteConfirmationModal";
import AdminPasswordModal from "../../components/users/AdminPasswordModal";
import ToastNotification from "../../components/ui/ToastNotifications";

import CreateWorkOrderModal from "../../components/fleet/work-orders/CreateWorkOrderModal";
import CostApprovalModal from "../../components/fleet/work-orders/CostApprovalModal";
import FinalizeMaintenanceModal from "../../components/fleet/work-orders/FinalizeMaintenanceModal";
import WorkOrderDetailModal from "../../components/fleet/work-orders/WorkOrderDetailModal";
import WorkOrderControls from "../../components/fleet/work-orders/WorkOrderControls";
import WorkOrderTable from "../../components/fleet/work-orders/WorkOrderTable";
import MaintenanceLogsControls from "../../components/fleet/logs/MaintenanceLogsControls";
import MaintenanceLogsTable from "../../components/fleet/logs/MaintenanceLogsTable";
import RecurringIssuesAnalytics from "../../components/fleet/analytics/RecurringIssuesAnalytics";
import { Truck as TruckIcon, Wrench, FileText, AlertOctagon } from "lucide-react";

const LOCAL_STORAGE_KEY = "app_fleet_cache";

export default function Fleet() {
  const { can } = useAuth();

  // RBAC Permission Guard
  const canManage = can
    ? can(PERMISSIONS?.FLEET_MANAGE || "fleet.manage")
    : true;

  // Initialize from cache or fallback to initialMockFleet
  const [trucks, setTrucks] = useState(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error reading cached fleet items:", e);
    }
    return initialMockFleet?.data?.trucks || [];
  });

  const [isLoading, setIsLoading] = useState(trucks.length === 0);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);

  // Operational Modals States
  const [truckForCheckIn, setTruckForCheckIn] = useState(null);
  const [truckForHistory, setTruckForHistory] = useState(null);
  const [truckForAvailability, setTruckForAvailability] = useState(null);

  // Part 2 Safety Inspections & Incident Management States
  const [truckForInspection, setTruckForInspection] = useState(null);
  const [truckForInspectionHistory, setTruckForInspectionHistory] = useState(null);
  const [isReportingIncident, setIsReportingIncident] = useState(false);
  const [truckForIncident, setTruckForIncident] = useState(null);
  const [showIncidentHistoryModal, setShowIncidentHistoryModal] = useState(false);
  const [truckForIncidentHistory, setTruckForIncidentHistory] = useState(null);

  // Deactivation States
  const [truckToDelete, setTruckToDelete] = useState(null);
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);

  // Reactivation States
  const [pendingReactivation, setPendingReactivation] = useState(null);
  const [showReactivatePasswordModal, setShowReactivatePasswordModal] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    driver: "All Drivers",
    pmStatus: "",
    dateFrom: "",
    dateTo: "",
  });

  // Sub-Navigation Tab State ('vehicles' | 'work-orders' | 'logs' | 'analytics')
  const [activeSubTab, setActiveSubTab] = useState("vehicles");

  // Part 3 Work Orders & Maintenance Logs States
  const [workOrders, setWorkOrders] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [isLoadingWorkOrders, setIsLoadingWorkOrders] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Work Orders Search & Status States
  const [workOrderSearch, setWorkOrderSearch] = useState("");
  const [workOrderStatus, setWorkOrderStatus] = useState("ALL");

  // Maintenance Logs Search & Type States
  const [logsSearch, setLogsSearch] = useState("");
  const [logsType, setLogsType] = useState("ALL");

  // Work Order Modals State
  const [isCreatingWorkOrder, setIsCreatingWorkOrder] = useState(false);
  const [truckForWorkOrder, setTruckForWorkOrder] = useState(null);
  const [workOrderForApproval, setWorkOrderForApproval] = useState(null);
  const [workOrderForFinalize, setWorkOrderForFinalize] = useState(null);
  const [workOrderForDetail, setWorkOrderForDetail] = useState(null);

  // Modal & Toast States
  const [isAddingTruck, setIsAddingTruck] = useState(false);
  const [toast, setToast] = useState(null); // { type: "success" | "error" | "info" | "warning", message: string }

  // Helper to sync local state changes with localStorage
  const updateFleetState = (updater) => {
    setTrucks((prev) => {
      const updated = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to write to fleet cache:", e);
      }
      return updated;
    });
  };

  const refreshDrivers = useCallback(async () => {
    try {
      const [availRes, allRes] = await Promise.all([
        fleetApi.getAvailableDrivers(),
        fleetApi.getDrivers(),
      ]);
      setAvailableDrivers(Array.isArray(availRes) ? availRes : availRes?.drivers || []);
      setAllDrivers(Array.isArray(allRes?.drivers) ? allRes.drivers : []);
    } catch (err) {
      console.error("Failed to load driver directory:", err);
    }
  }, []);

  const refreshWorkOrders = useCallback(async () => {
    try {
      setIsLoadingWorkOrders(true);
      const res = await fleetApi.getWorkOrders();
      setWorkOrders(res?.data?.workOrders || []);
    } catch (err) {
      console.error("Failed to load work orders:", err);
    } finally {
      setIsLoadingWorkOrders(false);
    }
  }, []);

  const refreshMaintenanceLogs = useCallback(async () => {
    try {
      setIsLoadingLogs(true);
      const res = await fleetApi.getMaintenanceLogs();
      setMaintenanceLogs(res?.data?.logs || []);
    } catch (err) {
      console.error("Failed to load maintenance logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  const refreshTrucks = useCallback(async () => {
    try {
      const trucksData = await fleetApi.getTrucks();
      if (trucksData && Array.isArray(trucksData)) {
        updateFleetState(trucksData);
      }
    } catch (err) {
      console.error("Failed to refresh trucks:", err);
    }
  }, []);

  useEffect(() => {
    async function loadFleet() {
      try {
        setIsLoading(true);
        const [trucksData] = await Promise.all([
          fleetApi.getTrucks(),
          refreshDrivers(),
          refreshWorkOrders(),
          refreshMaintenanceLogs(),
        ]);

        if (trucksData && Array.isArray(trucksData) && trucksData.length > 0) {
          updateFleetState(trucksData);
        }
      } catch (err) {
        console.error("Failed to load fleet data:", err);
        setToast({
          type: "error",
          message: "Failed to load fleet records. Please refresh the page.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadFleet();
  }, [refreshDrivers, refreshWorkOrders, refreshMaintenanceLogs]);

  // Pending cost approval counter for tab badge
  const pendingApprovalCount = useMemo(() => {
    return workOrders.filter((wo) => wo.status === "PENDING").length;
  }, [workOrders]);

  // PM Overview summary calculations
  const pmSummary = useMemo(() => {
    const totalVehicles = trucks.length;
    const operationalVehicles = trucks.filter((t) => t.status === "ACTIVE").length;
    const pmDueTotal = trucks.filter((t) => {
      const cur = Number(t.currentOdometer) || 0;
      const last = Number(t.lastPmOdometer !== undefined ? t.lastPmOdometer : t.lastPMOdometer || 0);
      return t.isPmDue !== undefined ? Boolean(t.isPmDue) : cur - last >= 5000;
    }).length;
    const underMaintenanceVehicles = trucks.filter(
      (t) => t.status === "UNDER_MAINTENANCE"
    ).length;

    return {
      totalVehicles,
      operationalVehicles,
      pmDueTotal,
      underMaintenanceVehicles,
    };
  }, [trucks]);

  const handleTogglePmDueFilter = () => {
    setFilters((prev) => ({
      ...prev,
      pmStatus: prev.pmStatus === "PM_DUE" ? "" : "PM_DUE",
    }));
  };

  const handleAddNewTruck = () => {
    setIsAddingTruck(true);
  };

  const handleAddTruck = async (newTruckData) => {
    try {
      const result = await fleetApi.createTruck(newTruckData);
      const created = result?.truck || {
        id: `trk-${Date.now()}`,
        status: "ACTIVE",
        operationalStatus: "ACTIVE",
        isAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...newTruckData,
      };

      updateFleetState((prev) => [created, ...prev]);
      setIsAddingTruck(false);
      await refreshDrivers();
      setToast({
        type: "success",
        message: `Vehicle ${created.plateNumber || ""} added successfully`,
      });
    } catch (err) {
      console.error("Failed to create vehicle:", err);
      setToast({
        type: "error",
        message: err.message || "Failed to add vehicle. Please try again.",
      });
    }
  };

  const applyTruckUpdate = async (truckId, updatedData) => {
    try {
      const result = await fleetApi.updateTruck(truckId, updatedData);
      const updated = result?.truck || {
        ...updatedData,
        id: truckId,
        updatedAt: new Date().toISOString(),
      };

      updateFleetState((prev) =>
        prev.map((t) => (t.id === truckId ? { ...t, ...updated } : t))
      );

      setSelectedTruck(updated);
      await refreshDrivers();

      setToast({
        type: "success",
        message: `Vehicle ${updated.plateNumber || ""} updated successfully`,
      });
      return updated;
    } catch (err) {
      console.error("Failed to update vehicle:", err);
      setToast({
        type: "error",
        message: err.message || "Failed to update vehicle. Please try again.",
      });
      throw err;
    }
  };

  const handleUpdateTruck = async (truckId, updatedData) => {
    const existing = trucks.find((t) => t.id === truckId);
    const wasInactive =
      existing &&
      (existing.status === "INACTIVE" || existing.status === "RETIRED");
    const isBecomingActive =
      updatedData.status === "ACTIVE" || updatedData.status === "AVAILABLE";

    if (wasInactive && isBecomingActive) {
      setPendingReactivation({ truckId, updatedData });
      setShowReactivatePasswordModal(true);
      return null;
    }

    return await applyTruckUpdate(truckId, updatedData);
  };

  // Record Return Odometer Check-In Handler
  const handleRecordOdometer = async ({ truckId, odometerReading, source, notes }) => {
    const targetTruck = trucks.find((t) => t.id === truckId);
    try {
      const res = await fleetApi.recordReturnOdometer({
        truckId,
        odometerReading,
        source,
        notes,
      });

      const updatedTruck = res.data?.truck || {
        ...targetTruck,
        currentOdometer: odometerReading,
        distanceSinceLastPm: res.data?.distanceSinceLastPm,
        isPmDue: res.data?.isPmDue,
        remainingKmBeforePm: res.data?.remainingKmBeforePm,
        updatedAt: new Date().toISOString(),
      };

      updateFleetState((prev) =>
        prev.map((t) => (t.id === truckId ? { ...t, ...updatedTruck } : t))
      );

      // Keep selectedTruck synced if open
      if (selectedTruck && selectedTruck.id === truckId) {
        setSelectedTruck(updatedTruck);
      }

      setToast({
        type: "success",
        message: `Odometer checked in for ${updatedTruck.plateNumber || "vehicle"} (+${res.data?.distanceDrivenThisTrip || 0} KM).${
          res.data?.isPmDue ? " Preventive Maintenance is now DUE." : ""
        }`,
      });
    } catch (err) {
      console.error("Failed to record return odometer:", err);
      throw err;
    }
  };

  // Set Availability Status Handler
  const handleSetAvailability = async ({ status, reason }) => {
    if (!truckForAvailability) return;
    const targetId = truckForAvailability.id;

    try {
      const res = await fleetApi.setVehicleAvailabilityStatus(targetId, { status, reason });
      const updatedTruck = res?.data?.truck || res?.truck || {
        ...truckForAvailability,
        status,
        operationalStatus: status,
        isAvailable: status === "ACTIVE",
        driverId: (status === "INACTIVE" || status === "RETIRED") ? null : truckForAvailability.driverId,
        driver: (status === "INACTIVE" || status === "RETIRED") ? null : truckForAvailability.driver,
        driverName: (status === "INACTIVE" || status === "RETIRED") ? "No Assigned" : truckForAvailability.driverName,
        updatedAt: new Date().toISOString(),
      };

      updateFleetState((prev) =>
        prev.map((t) => (t.id === targetId ? { ...t, ...updatedTruck } : t))
      );

      if (selectedTruck && selectedTruck.id === targetId) {
        setSelectedTruck(updatedTruck);
      }

      await refreshDrivers();
      setToast({
        type: "success",
        message: `Vehicle ${truckForAvailability.plateNumber || ""} operational status updated to ${status.replace("_", " ")}`,
      });
    } catch (err) {
      console.error("Failed to update availability status:", err);
      throw err;
    }
  };

  /**
   * Handle Daily Safety Inspection Submission
   * Auto-grounds truck to UNDER_MAINTENANCE on failure or dispatch denial while retaining soft-bound driver
   */
  const handleRecordInspection = async (inspectionData) => {
    try {
      const res = await fleetApi.createInspection(inspectionData);
      const { truck: updatedTruckInfo, inspection } = res?.data || {};

      if (updatedTruckInfo && updatedTruckInfo.currentStatus) {
        updateFleetState((prev) =>
          prev.map((t) => {
            if (t.id === updatedTruckInfo.id || t.truckId === updatedTruckInfo.id) {
              const updated = {
                ...t,
                status: updatedTruckInfo.currentStatus,
                operationalStatus: updatedTruckInfo.currentStatus,
                isAvailable: updatedTruckInfo.currentStatus === "ACTIVE",
                activeRepair: updatedTruckInfo.isGrounded
                  ? `Safety Inspection: ${inspectionData.findings.slice(0, 45)}...`
                  : t.activeRepair,
                updatedAt: new Date().toISOString(),
              };
              if (selectedTruck && (selectedTruck.id === t.id || selectedTruck.truckId === t.id)) {
                setSelectedTruck(updated);
              }
              return updated;
            }
            return t;
          })
        );
      }

      setToast({
        type: updatedTruckInfo?.isGrounded ? "warning" : "success",
        message: updatedTruckInfo?.isGrounded
          ? `Vehicle ${updatedTruckInfo.plateNumber} grounded under maintenance (driver retained)`
          : `Safety inspection recorded for ${inspection?.plateNumber || "vehicle"}`,
      });
    } catch (err) {
      console.error("Failed to record safety inspection:", err);
      setToast({
        type: "error",
        message: err?.message || "Failed to record safety inspection",
      });
      throw err;
    }
  };

  /**
   * Handle Mid-Route Incident / Breakdown Submission
   * Auto-grounds truck to UNDER_MAINTENANCE if severity === 'CRITICAL' while retaining soft-bound driver
   */
  const handleReportIncident = async (incidentData) => {
    try {
      const res = await fleetApi.createIncident(incidentData);
      const { truck: updatedTruckInfo, incident } = res?.data || {};

      if (updatedTruckInfo && updatedTruckInfo.currentStatus) {
        updateFleetState((prev) =>
          prev.map((t) => {
            if (t.id === updatedTruckInfo.id || t.truckId === updatedTruckInfo.id) {
              const updated = {
                ...t,
                status: updatedTruckInfo.currentStatus,
                operationalStatus: updatedTruckInfo.currentStatus,
                isAvailable: updatedTruckInfo.currentStatus === "ACTIVE",
                activeRepair: updatedTruckInfo.isGrounded
                  ? `Critical Incident: ${incidentData.description.slice(0, 45)}...`
                  : t.activeRepair,
                updatedAt: new Date().toISOString(),
              };
              if (selectedTruck && (selectedTruck.id === t.id || selectedTruck.truckId === t.id)) {
                setSelectedTruck(updated);
              }
              return updated;
            }
            return t;
          })
        );
      }

      setToast({
        type: updatedTruckInfo?.isGrounded ? "warning" : "success",
        message: updatedTruckInfo?.isGrounded
          ? `Critical incident logged — ${updatedTruckInfo.plateNumber} grounded under maintenance (driver retained)`
          : `Incident report logged for ${incident?.plateNumber || "vehicle"}`,
      });
    } catch (err) {
      console.error("Failed to report incident:", err);
      setToast({
        type: "error",
        message: err?.message || "Failed to submit incident report",
      });
      throw err;
    }
  };

  /**
   * Part 3 Work Order Handlers
   */
  const handleOpenCreateWorkOrder = (truck = null) => {
    setTruckForWorkOrder(truck);
    setIsCreatingWorkOrder(true);
  };

  const handleCreateWorkOrder = async (payload) => {
    try {
      const res = await fleetApi.createWorkOrder(payload);
      await Promise.all([refreshWorkOrders(), refreshTrucks()]);
      setIsCreatingWorkOrder(false);
      setTruckForWorkOrder(null);
      setToast({
        type: res?.data?.requiresApproval ? "warning" : "success",
        message: res?.data?.requiresApproval
          ? `Work Order created: Requires managerial approval (₱${Number(res.data?.workOrder?.estimatedCost || payload.estimatedCost).toLocaleString()} >= ₱5,000 threshold)`
          : `Work Order created successfully (${res?.data?.workOrder?.status || "APPROVED"})`,
      });
    } catch (err) {
      console.error("Failed to create work order:", err);
      setToast({
        type: "error",
        message: err?.message || "Failed to create work order",
      });
      throw err;
    }
  };

  const handleAdvanceWorkOrderStatus = async (workOrderId, newStatus) => {
    try {
      const res = await fleetApi.updateWorkOrderStatus(workOrderId, { status: newStatus });
      await refreshWorkOrders();
      setToast({
        type: "success",
        message: res?.message || `Work order updated to ${newStatus}`,
      });
    } catch (err) {
      console.error("Failed to update work order status:", err);
      setToast({
        type: "error",
        message: err?.message || "Failed to advance work order status",
      });
    }
  };

  const handleApproveCost = async (workOrderId, { isApproved, remarks }) => {
    try {
      const res = await fleetApi.decideWorkOrderApproval(workOrderId, { isApproved, remarks });
      await refreshWorkOrders();
      setWorkOrderForApproval(null);
      setToast({
        type: isApproved ? "success" : "info",
        message: res?.message || `Work order ${isApproved ? "approved" : "rejected"}`,
      });
    } catch (err) {
      console.error("Failed to decide cost approval:", err);
      throw err;
    }
  };

  const handleFinalizeMaintenance = async (workOrderId, payload) => {
    try {
      const res = await fleetApi.finalizeWorkOrder(workOrderId, payload);
      await Promise.all([refreshWorkOrders(), refreshMaintenanceLogs(), refreshTrucks()]);
      setWorkOrderForFinalize(null);
      setToast({
        type: "success",
        message: res?.message || "Maintenance log finalized and vehicle operational status restored",
      });
    } catch (err) {
      console.error("Failed to finalize maintenance:", err);
      throw err;
    }
  };

  const handleExecuteReactivate = async (adminPassword) => {
    if (!pendingReactivation) return;
    try {
      await fleetApi.verifyAdminPassword(adminPassword);
      await applyTruckUpdate(pendingReactivation.truckId, {
        ...pendingReactivation.updatedData,
        status: "ACTIVE",
        operationalStatus: "ACTIVE",
        isAvailable: true,
      });
      setShowReactivatePasswordModal(false);
      setPendingReactivation(null);
      setToast({
        type: "success",
        message: "Vehicle reactivated successfully",
      });
    } catch (err) {
      console.error("Failed to reactivate vehicle:", err);
      throw err;
    }
  };

  const handleInitiateReactivate = (truck) => {
    setSelectedTruck(null);
    setPendingReactivation({
      truckId: truck.id,
      updatedData: { ...truck, status: "ACTIVE" },
    });
    setShowReactivatePasswordModal(true);
  };

  const handleInitiateDelete = (truck) => {
    setSelectedTruck(null);
    setTruckToDelete(truck);
  };

  const handleConfirmDeletePrompt = () => {
    setShowDeletePasswordModal(true);
  };

  const handleExecuteDelete = async (adminPassword) => {
    if (!truckToDelete) return;
    const targetId = truckToDelete.id;

    const result = await fleetApi.deactivateTruck(targetId, {
      confirmPassword: adminPassword,
    });

    const updated = result?.truck || {
      ...truckToDelete,
      status: "INACTIVE",
      operationalStatus: "INACTIVE",
      isAvailable: false,
      driverId: null,
      driver: null,
      driverName: "No Assigned",
      updatedAt: new Date().toISOString(),
    };

    updateFleetState((prev) =>
      prev.map((t) => (t.id === targetId ? { ...t, ...updated } : t))
    );

    setShowDeletePasswordModal(false);
    setTruckToDelete(null);
    await refreshDrivers();
    setToast({
      type: "success",
      message: `Vehicle ${truckToDelete.plateNumber || ""} deactivated successfully`,
    });
  };

  // Processed search & multi-field filter rules
  const filteredTrucks = useMemo(() => {
    return trucks.filter((truck) => {
      // 1. Search filter (plate, driver, route, status, model)
      const q = searchTerm.toLowerCase().trim();
      const driverName = truck.driver
        ? `${truck.driver.firstName || ""} ${truck.driver.lastName || ""}`.trim() || truck.driver.username
        : truck.driverName && truck.driverName !== "No Assigned" && truck.driverName !== "Unassigned"
        ? truck.driverName
        : "";

      const matchesSearch =
        !q ||
        (truck.plateNumber || "").toLowerCase().includes(q) ||
        driverName.toLowerCase().includes(q) ||
        (truck.designatedRoute || "").toLowerCase().includes(q) ||
        (truck.model || "").toLowerCase().includes(q) ||
        (truck.status || "").toLowerCase().includes(q);

      // 2. Status filter
      const normTruckStatus = (truck.status || truck.operationalStatus || "").toUpperCase().replace("_", " ");
      const normFilterStatus = (filters.status || "").toUpperCase().replace("_", " ");
      const matchesStatus =
        !filters.status ||
        filters.status === "All" ||
        normTruckStatus === normFilterStatus;

      // 3. Driver Assignment filter
      let matchesDriver = true;
      if (filters.driver && filters.driver !== "All Drivers") {
        const hasAssignedDriver = Boolean(
          truck.driverId ||
          (truck.driver && truck.driver.id) ||
          (driverName && driverName !== "No Assigned" && driverName !== "Unassigned")
        );

        if (filters.driver === "Assigned") {
          matchesDriver = hasAssignedDriver;
        } else if (filters.driver === "Unassigned") {
          matchesDriver = !hasAssignedDriver;
        } else {
          matchesDriver = driverName.toLowerCase() === filters.driver.toLowerCase();
        }
      }

      // 4. PM Condition filter
      let matchesPm = true;
      if (filters.pmStatus) {
        const cur = Number(truck.currentOdometer) || 0;
        const last = Number(truck.lastPmOdometer !== undefined ? truck.lastPmOdometer : truck.lastPMOdometer || 0);
        const isDue = truck.isPmDue !== undefined ? Boolean(truck.isPmDue) : cur - last >= 5000;

        if (filters.pmStatus === "PM_DUE") {
          matchesPm = isDue;
        } else if (filters.pmStatus === "NORMAL") {
          matchesPm = !isDue;
        }
      }

      // 5. Date Range filter
      let matchesDate = true;
      if (filters.dateFrom || filters.dateTo) {
        const truckDate = truck.createdAt ? new Date(truck.createdAt).setHours(0, 0, 0, 0) : null;
        if (truckDate) {
          if (filters.dateFrom) {
            const from = new Date(filters.dateFrom).setHours(0, 0, 0, 0);
            if (truckDate < from) matchesDate = false;
          }
          if (filters.dateTo) {
            const to = new Date(filters.dateTo).setHours(23, 59, 59, 999);
            if (truckDate > to) matchesDate = false;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesDriver && matchesPm && matchesDate;
    });
  }, [trucks, searchTerm, filters]);

  // Filtered Work Orders (Search + Status)
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      if (workOrderStatus !== "ALL" && wo.status !== workOrderStatus) {
        return false;
      }
      if (workOrderSearch.trim()) {
        const query = workOrderSearch.toLowerCase().trim();
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
  }, [workOrders, workOrderStatus, workOrderSearch]);

  // Filtered Maintenance Logs (Search + Type)
  const filteredMaintenanceLogs = useMemo(() => {
    return maintenanceLogs.filter((log) => {
      const type = (log.maintenanceTypeName || "").toUpperCase();
      if (logsType !== "ALL" && type !== logsType) {
        return false;
      }
      if (logsSearch.trim()) {
        const q = logsSearch.toLowerCase().trim();
        const receipt = (log.officialReceiptNumber || "").toLowerCase();
        const plate = (log.plateNumber || log.truck?.plateNumber || "").toLowerCase();
        const shop = (log.workOrder?.shopName || log.shopName || "").toLowerCase();
        const desc = (log.workOrder?.description || log.description || "").toLowerCase();
        return (
          receipt.includes(q) ||
          plate.includes(q) ||
          shop.includes(q) ||
          desc.includes(q)
        );
      }
      return true;
    });
  }, [maintenanceLogs, logsType, logsSearch]);

  return (
    <div className="p-8">
        {/* Header with Title, PM Health Overview, Incident Logs & Add New Fleet */}
        <FleetHeader
          canCreate={canManage}
          onAddTruck={handleAddNewTruck}
          pmSummary={pmSummary}
          onTogglePmDueFilter={handleTogglePmDueFilter}
          isPmDueFilterActive={filters.pmStatus === "PM_DUE"}
          onReportIncident={() => {
            setTruckForIncident(null);
            setIsReportingIncident(true);
          }}
          onOpenIncidentsLog={() => {
            setTruckForIncidentHistory(null);
            setShowIncidentHistoryModal(true);
          }}
        />

        {/* Sub-Navigation Tabs: Unified Segmented Control */}
        <div className="flex items-center mb-6">
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-full border border-slate-200/80 gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveSubTab("vehicles")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === "vehicles"
                  ? "bg-[#0B4A6E] text-[#FFDF2C] shadow-xs"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              <TruckIcon className="w-4 h-4" />
              <span>Vehicles & Fleets</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  activeSubTab === "vehicles" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                {trucks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("work-orders")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === "work-orders"
                  ? "bg-[#0B4A6E] text-[#FFDF2C] shadow-xs"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Work Orders</span>
              {pendingApprovalCount > 0 && (
                <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                  {pendingApprovalCount} pending
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("logs")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === "logs"
                  ? "bg-[#0B4A6E] text-[#FFDF2C] shadow-xs"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Maintenance Logs</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  activeSubTab === "logs" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                {maintenanceLogs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("analytics")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === "analytics"
                  ? "bg-[#0B4A6E] text-[#FFDF2C] shadow-xs"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Recurring Defect Intelligence</span>
            </button>
          </div>
        </div>

        {/* Tab View 1: Vehicles & Fleets */}
        {activeSubTab === "vehicles" && (
          <>
            {/* Controls: Search Bar, Active Filter Chips, Filter Dropdown */}
            <FleetControls
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              activeFilters={filters}
              onApplyFilters={setFilters}
              onClearDriver={() => setFilters((prev) => ({ ...prev, driver: "All Drivers" }))}
              onClearStatus={() => setFilters((prev) => ({ ...prev, status: "" }))}
              onClearPmStatus={() => setFilters((prev) => ({ ...prev, pmStatus: "" }))}
              onClearDates={() => setFilters((prev) => ({ ...prev, dateFrom: "", dateTo: "" }))}
              driversList={allDrivers && allDrivers.length > 0 ? allDrivers : availableDrivers}
            />

            {/* Fleet Cards Grid */}
            {isLoading && trucks.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-gray-500 font-medium">
                Loading fleet vehicles...
              </div>
            ) : filteredTrucks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {filteredTrucks.map((truck) => (
                  <TruckCard
                    key={truck.id}
                    truck={truck}
                    onClick={() => setSelectedTruck(truck)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-gray-400 font-medium text-lg mb-2">
                  No fleets found matching your criteria
                </p>
                <p className="text-gray-400 text-sm">
                  Try adjusting your search query or active filters.
                </p>
              </div>
            )}
          </>
        )}

        {/* Tab View 2: Work Orders */}
        {activeSubTab === "work-orders" && (
          <>
            <WorkOrderControls
              searchQuery={workOrderSearch}
              onSearchChange={setWorkOrderSearch}
              selectedStatus={workOrderStatus}
              onStatusChange={setWorkOrderStatus}
              pendingCount={pendingApprovalCount}
              onCreateWorkOrder={() => handleOpenCreateWorkOrder(null)}
              canCreate={canManage}
            />

            <div className="h-[calc(100vh-340px)] min-h-[460px] w-full min-w-0">
              <WorkOrderTable
                workOrders={filteredWorkOrders}
                isLoading={isLoadingWorkOrders}
                onOpenApproval={(wo) => setWorkOrderForApproval(wo)}
                onOpenFinalize={(wo) => setWorkOrderForFinalize(wo)}
                onOpenDetail={(wo) => setWorkOrderForDetail(wo)}
                onAdvanceStatus={handleAdvanceWorkOrderStatus}
              />
            </div>
          </>
        )}

        {/* Tab View 3: Maintenance Logs */}
        {activeSubTab === "logs" && (
          <>
            <MaintenanceLogsControls
              searchQuery={logsSearch}
              onSearchChange={setLogsSearch}
              selectedType={logsType}
              onTypeChange={setLogsType}
            />

            <div className="h-[calc(100vh-340px)] min-h-[460px] w-full min-w-0">
              <MaintenanceLogsTable
                logs={filteredMaintenanceLogs}
                isLoading={isLoadingLogs}
                onRefresh={refreshMaintenanceLogs}
              />
            </div>
          </>
        )}

        {/* Tab View 4: Recurring Issues Analytics */}
        {activeSubTab === "analytics" && (
          <div className="h-[calc(100vh-280px)] min-h-[500px] w-full min-w-0">
            <RecurringIssuesAnalytics
              trucks={trucks}
              onCreateWorkOrderForTruck={(truck) => handleOpenCreateWorkOrder(truck)}
            />
          </div>
        )}

        {/* View / Edit Truck Modal (Returns automatically when sub-modals are closed/cancelled) */}
        {selectedTruck && !(
          truckForInspection ||
          truckForInspectionHistory ||
          isReportingIncident ||
          showIncidentHistoryModal ||
          truckForCheckIn ||
          truckForHistory ||
          truckForAvailability ||
          isCreatingWorkOrder ||
          truckToDelete ||
          showDeletePasswordModal ||
          showReactivatePasswordModal
        ) && (
          <TruckModal
            truck={selectedTruck}
            trucks={trucks}
            availableDrivers={availableDrivers}
            allDrivers={allDrivers}
            canManage={canManage}
            onClose={() => setSelectedTruck(null)}
            onUpdate={handleUpdateTruck}
            onDeleteClick={handleInitiateDelete}
            onReactivateClick={handleInitiateReactivate}
            onOpenCheckIn={(truck) => setTruckForCheckIn(truck)}
            onOpenHistory={(truck) => setTruckForHistory(truck)}
            onOpenAvailability={(truck) => setTruckForAvailability(truck)}
            onOpenInspect={(truck) => setTruckForInspection(truck)}
            onOpenIncident={(truck) => {
              setTruckForIncident(truck);
              setIsReportingIncident(true);
            }}
            onOpenInspectionHistory={(truck) => setTruckForInspectionHistory(truck)}
            onOpenIncidentHistory={(truck) => {
              setTruckForIncidentHistory(truck);
              setShowIncidentHistoryModal(true);
            }}
            onCreateWorkOrder={(truck) => handleOpenCreateWorkOrder(truck)}
          />
        )}

        {/* Daily Safety Inspection Modal (Findings-Only) */}
        {truckForInspection && (
          <InspectionModal
            isOpen={!!truckForInspection}
            truck={truckForInspection}
            onClose={() => setTruckForInspection(null)}
            onSubmit={handleRecordInspection}
          />
        )}

        {/* Truck Safety Inspection History Modal */}
        {truckForInspectionHistory && (
          <InspectionHistoryModal
            isOpen={!!truckForInspectionHistory}
            truck={truckForInspectionHistory}
            onClose={() => setTruckForInspectionHistory(null)}
            onOpenInspect={(truck) => setTruckForInspection(truck)}
          />
        )}

        {/* Mid-Route Incident / Breakdown Reporting Modal */}
        {isReportingIncident && (
          <IncidentReportModal
            isOpen={isReportingIncident}
            truck={truckForIncident}
            trucks={trucks}
            onClose={() => {
              setIsReportingIncident(false);
              setTruckForIncident(null);
            }}
            onSubmit={handleReportIncident}
          />
        )}

        {/* Fleet & Truck Incident History Logs Modal */}
        {showIncidentHistoryModal && (
          <IncidentHistoryModal
            isOpen={showIncidentHistoryModal}
            truck={truckForIncidentHistory}
            onClose={() => {
              setShowIncidentHistoryModal(false);
              setTruckForIncidentHistory(null);
            }}
            onOpenReport={(truck) => {
              setShowIncidentHistoryModal(false);
              setTruckForIncident(truck || null);
              setIsReportingIncident(true);
            }}
          />
        )}

        {/* Post-Dispatch Odometer Return Check-In Modal */}
        {truckForCheckIn && (
          <OdometerCheckInModal
            isOpen={!!truckForCheckIn}
            truck={truckForCheckIn}
            onClose={() => setTruckForCheckIn(null)}
            onSubmit={handleRecordOdometer}
          />
        )}

        {/* Mileage & Odometer Logs History Modal */}
        {truckForHistory && (
          <OdometerHistoryModal
            isOpen={!!truckForHistory}
            truck={truckForHistory}
            onClose={() => setTruckForHistory(null)}
            onOpenCheckIn={(truck) => setTruckForCheckIn(truck)}
          />
        )}

        {/* Set Availability / Mark Unavailable Modal */}
        {truckForAvailability && (
          <SetAvailabilityModal
            isOpen={!!truckForAvailability}
            truck={truckForAvailability}
            onClose={() => setTruckForAvailability(null)}
            onSubmit={handleSetAvailability}
          />
        )}

        {/* Add New Fleet Multi-step Wizard Modal */}
        {isAddingTruck && (
          <TruckModal
            isAdding={true}
            trucks={trucks}
            availableDrivers={availableDrivers}
            allDrivers={allDrivers}
            canManage={canManage}
            onClose={() => setIsAddingTruck(false)}
            onAdd={handleAddTruck}
          />
        )}

        {/* Delete Confirmation Step 1 */}
        {truckToDelete && !showDeletePasswordModal && (
          <DeleteConfirmationModal
            truck={truckToDelete}
            onConfirm={handleConfirmDeletePrompt}
            onClose={() => setTruckToDelete(null)}
          />
        )}

        {/* Delete Password Verification Step 2 */}
        <AdminPasswordModal
          isOpen={showDeletePasswordModal}
          onClose={() => {
            setShowDeletePasswordModal(false);
            setTruckToDelete(null);
          }}
          onSubmit={handleExecuteDelete}
        />

        {/* Reactivate Password Verification Modal */}
        <AdminPasswordModal
          isOpen={showReactivatePasswordModal}
          onClose={() => {
            setShowReactivatePasswordModal(false);
            setPendingReactivation(null);
          }}
          onSubmit={handleExecuteReactivate}
        />

        {/* Part 3 Work Order Modals */}
        {isCreatingWorkOrder && (
          <CreateWorkOrderModal
            isOpen={isCreatingWorkOrder}
            truck={truckForWorkOrder}
            trucks={trucks}
            onClose={() => {
              setIsCreatingWorkOrder(false);
              setTruckForWorkOrder(null);
            }}
            onSubmit={handleCreateWorkOrder}
          />
        )}

        {workOrderForApproval && (
          <CostApprovalModal
            isOpen={!!workOrderForApproval}
            workOrder={workOrderForApproval}
            onClose={() => setWorkOrderForApproval(null)}
            onDecide={handleApproveCost}
          />
        )}

        {workOrderForFinalize && (
          <FinalizeMaintenanceModal
            isOpen={!!workOrderForFinalize}
            workOrder={workOrderForFinalize}
            truck={trucks.find(
              (t) =>
                t.id === workOrderForFinalize.truckId ||
                t.id === workOrderForFinalize.truck?.id
            )}
            onClose={() => setWorkOrderForFinalize(null)}
            onFinalize={handleFinalizeMaintenance}
          />
        )}

        {workOrderForDetail && (
          <WorkOrderDetailModal
            isOpen={!!workOrderForDetail}
            workOrder={workOrderForDetail}
            onClose={() => setWorkOrderForDetail(null)}
            onOpenApproval={(wo) => setWorkOrderForApproval(wo)}
            onOpenFinalize={(wo) => setWorkOrderForFinalize(wo)}
            onAdvanceStatus={handleAdvanceWorkOrderStatus}
          />
        )}

        {/* Dynamic Toast Notifications (Success, Error, Info, Warning) */}
        {toast && (
          <ToastNotification
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </div>
  );
}
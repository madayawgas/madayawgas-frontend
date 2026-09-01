// src/pages/Fleet/Fleet.jsx
import { useState, useEffect, useMemo } from "react";
import { fleetApi } from "../../api/fleet.js";
import { usersApi } from "../../api/users.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";
import initialMockFleet from "../../mocks/fleet.json";

import FleetHeader from "../../components/fleet/FleetHeader";
import FleetControls from "../../components/fleet/FleetControls";
import TruckCard from "../../components/fleet/TruckCard";
import TruckModal from "../../components/fleet/TruckModal";
import DeleteConfirmationModal from "../../components/fleet/DeleteConfirmationModal";
import AdminPasswordModal from "../../components/users/AdminPasswordModal";
import ToastNotification from "../../components/ui/ToastNotifications";

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
  const [driverOptions, setDriverOptions] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);

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
    role: "All Roles",
    dateFrom: "",
    dateTo: "",
  });

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

  useEffect(() => {
    async function loadFleet() {
      try {
        setIsLoading(true);
        const [trucksData, usersData] = await Promise.all([
          fleetApi.getTrucks(),
          usersApi.getAllUsers(),
        ]);

        if (trucksData && Array.isArray(trucksData) && trucksData.length > 0) {
          updateFleetState(trucksData);
        }

        if (usersData && Array.isArray(usersData)) {
          // STRICT: Only users with role "Driver" and active accounts
          const eligibleDrivers = usersData
            .filter((u) => {
              const r = (u.role || "").toLowerCase().trim();
              return r === "driver" && u.isActive !== false && !u.isBlocked;
            })
            .map((u) => ({
              value: u.id || u.userId,
              label: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username,
              firstName: u.firstName || "",
              lastName: u.lastName || "",
              phone: u.phone || "",
              username: u.username || "",
              role: u.role || "Driver",
            }));

          setDriverOptions(eligibleDrivers);
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
  }, []);

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

      // Keep detail modal open with updated data
      setSelectedTruck(updated);

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

    // Require password confirmation when making a deactivated fleet active again
    if (wasInactive && isBecomingActive) {
      setPendingReactivation({ truckId, updatedData });
      setShowReactivatePasswordModal(true);
      return null;
    }

    return await applyTruckUpdate(truckId, updatedData);
  };

  const handleExecuteReactivate = async (adminPassword) => {
    if (!pendingReactivation) return;
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
  };

  // Step 1 of Deactivate: Prompt confirmation modal
  const handleInitiateDelete = (truck) => {
    setSelectedTruck(null);
    setTruckToDelete(truck);
  };

  // Step 2 of Deactivate: Advance from DeleteConfirmationModal to AdminPasswordModal
  const handleConfirmDeletePrompt = () => {
    setShowDeletePasswordModal(true);
  };

  // Step 3 of Deactivate: Execute deactivation with confirmPassword
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
        : truck.driverName || "";

      const matchesSearch =
        !q ||
        (truck.plateNumber || "").toLowerCase().includes(q) ||
        driverName.toLowerCase().includes(q) ||
        (truck.designatedRoute || "").toLowerCase().includes(q) ||
        (truck.model || "").toLowerCase().includes(q) ||
        (truck.status || "").toLowerCase().includes(q);

      // 2. Status filter
      const normTruckStatus = (truck.status || "").toUpperCase().replace("_", " ");
      const normFilterStatus = (filters.status || "").toUpperCase().replace("_", " ");
      const matchesStatus =
        !filters.status ||
        filters.status === "All" ||
        normTruckStatus === normFilterStatus;

      // 3. Role / Driver filter
      let matchesRole = true;
      if (filters.role && filters.role !== "All Roles") {
        const matchedDriver = driverOptions.find(
          (d) => d.label?.toLowerCase() === driverName.toLowerCase()
        );
        matchesRole =
          matchedDriver?.role?.toLowerCase() === filters.role.toLowerCase() ||
          (filters.role.toLowerCase() === "driver" && driverName && driverName !== "No Assigned");
      }

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [trucks, searchTerm, filters, driverOptions]);

  return (
    <div className="p-6 md:p-8">
      <div className="w-full max-w-[1400px] mx-auto">
        {/* Header with Title & Add New Fleet button */}
        <FleetHeader
          canCreate={canManage}
          onAddTruck={handleAddNewTruck}
        />

        {/* Controls: Search Bar, Active Filter Chips, Filter Dropdown */}
        <FleetControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeFilters={filters}
          onApplyFilters={setFilters}
          onClearRole={() => setFilters((prev) => ({ ...prev, role: "All Roles" }))}
          onClearStatus={() => setFilters((prev) => ({ ...prev, status: "" }))}
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

        {/* View / Edit Truck Modal */}
        {selectedTruck && (
          <TruckModal
            truck={selectedTruck}
            trucks={trucks}
            driverOptions={driverOptions}
            canManage={canManage}
            onClose={() => setSelectedTruck(null)}
            onUpdate={handleUpdateTruck}
            onDeleteClick={handleInitiateDelete}
          />
        )}

        {/* Add New Fleet Multi-step Wizard Modal */}
        {isAddingTruck && (
          <TruckModal
            isAdding={true}
            trucks={trucks}
            driverOptions={driverOptions}
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

        {/* Dynamic Toast Notifications (Success, Error, Info, Warning) */}
        {toast && (
          <ToastNotification
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}
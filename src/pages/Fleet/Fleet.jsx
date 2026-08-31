// src/pages/Fleet/Fleet.jsx
import { useState, useEffect, useMemo } from "react";
import { fleetApi } from "../../api/fleet.js";
import { usersApi } from "../../api/users.js";
import { useAuth } from "../../context/AuthContext.jsx";

import FleetHeader from "../../components/fleet/FleetHeader";
import FleetControls from "../../components/fleet/FleetControls";
import TruckCard from "../../components/fleet/TruckCard";
import TruckModal from "../../components/fleet/TruckModal";
import DeleteConfirmationModal from "../../components/fleet/DeleteConfirmationModal";
import AdminPasswordModal from "../../components/users/AdminPasswordModal";
import SavedChangesToast from "../../components/ui/SavedChangesToast";

export default function Fleet() {
  const { user: currentUser } = useAuth();

  const [trucks, setTrucks] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);

  // Deletion States
  const [truckToDelete, setTruckToDelete] = useState(null);
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);

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
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    async function loadFleet() {
      try {
        const [trucksData, usersData] = await Promise.all([
          fleetApi.getTrucks(),
          usersApi.getAllUsers(),
        ]);
        if (trucksData) setTrucks(trucksData);
        if (usersData) {
          const drivers = usersData.map((u) => ({
            value: u.id || u.userId,
            label: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username,
            role: u.role || "Driver",
          }));
          setDriverOptions(drivers);
        }
      } catch {
        // Retain current state
      }
    }
    loadFleet();
  }, []);

  const handleAddNewTruck = () => {
    setIsAddingTruck(true);
  };

  const handleAddTruck = async (newTruckData) => {
    try {
      const created = await fleetApi.createTruck(newTruckData);
      setTrucks((prev) => [...prev, created]);
    } catch {
      setTrucks((prev) => [...prev, { id: `trk-${Date.now()}`, ...newTruckData }]);
    }
    setIsAddingTruck(false);
    setShowToast(true);
  };

  const handleUpdateTruck = async (truckId, updatedData) => {
    try {
      await fleetApi.updateTruck(truckId, updatedData);
      setTrucks((prev) =>
        prev.map((t) => (t.id === truckId || t.truckId === truckId ? { ...t, ...updatedData } : t))
      );
    } catch {
      setTrucks((prev) =>
        prev.map((t) => (t.id === truckId || t.truckId === truckId ? { ...t, ...updatedData } : t))
      );
    }
    setSelectedTruck(null);
    setShowToast(true);
  };

  // Step 1 of Delete: Prompt confirmation modal
  const handleInitiateDelete = (truck) => {
    setSelectedTruck(null);
    setTruckToDelete(truck);
  };

  // Step 2 of Delete: Advance from DeleteConfirmationModal to AdminPasswordModal
  const handleConfirmDeletePrompt = () => {
    setShowDeletePasswordModal(true);
  };

  // Step 3 of Delete: Execute deletion after admin password verification
  const handleExecuteDelete = async (adminPassword) => {
    if (!truckToDelete) return;
    const targetId = truckToDelete.id || truckToDelete.truckId;

    await usersApi.verifyAdminPassword(adminPassword, currentUser?.username);
    await fleetApi.deleteTruck(targetId);

    setTrucks((prev) => prev.filter((t) => t.id !== targetId && t.truckId !== targetId));
    setShowDeletePasswordModal(false);
    setTruckToDelete(null);
    setShowToast(true);
  };

  // Processed search & multi-field filter rules
  const filteredTrucks = useMemo(() => {
    return trucks.filter((truck) => {
      // 1. Search filter (plate, driver, route, status, model)
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (truck.plateNumber || "").toLowerCase().includes(q) ||
        (truck.driverName || "").toLowerCase().includes(q) ||
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
          (d) => d.label?.toLowerCase() === truck.driverName?.toLowerCase()
        );
        matchesRole =
          matchedDriver?.role?.toLowerCase() === filters.role.toLowerCase() ||
          (filters.role.toLowerCase() === "driver" && truck.driverName && truck.driverName !== "No Assigned");
      }

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [trucks, searchTerm, filters, driverOptions]);

  return (
    <div className="p-6 md:p-8">
      <div className="w-full max-w-[1400px] mx-auto">
        {/* Header with Title & Add New Fleet button */}
        <FleetHeader onAddTruck={handleAddNewTruck} />

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
        {filteredTrucks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filteredTrucks.map((truck) => (
              <TruckCard
                key={truck.id || truck.truckId}
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

        {/* Saved Changes Toast Notification */}
        {showToast && (
          <SavedChangesToast onClose={() => setShowToast(false)} />
        )}
      </div>
    </div>
  );
}
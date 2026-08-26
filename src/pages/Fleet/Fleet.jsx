// src/pages/Fleet/Fleet.jsx
import { useState, useEffect } from "react";
import { fleetApi } from "../../api/fleet.js";
import { usersApi } from "../../api/users.js";

import FleetHeader from "../../components/fleet/FleetHeader";
import TruckCard from "../../components/fleet/TruckCard";
import TruckModal from "../../components/fleet/TruckModal";
import DeleteConfirmationModal from "../../components/fleet/DeleteConfirmationModal";

export default function Fleet() {
  const [trucks, setTrucks] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [truckToDelete, setTruckToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isAddingTruck, setIsAddingTruck] = useState(false);

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
            value: u.id,
            label: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username,
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
  };

  const handleDeleteTruck = async (truckId) => {
    try {
      await fleetApi.deleteTruck(truckId);
      setTrucks((prev) => prev.filter((t) => t.id !== truckId && t.truckId !== truckId));
    } catch {
      setTrucks((prev) => prev.filter((t) => t.id !== truckId && t.truckId !== truckId));
    }
    setTruckToDelete(null);
    setSelectedTruck(null);
  };

  const filteredTrucks = trucks.filter((truck) => {
    const matchesSearch =
      (truck.plateNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (truck.driverName && truck.driverName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "All" || truck.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-white p-8 rounded-[12px] shadow-sm overflow-hidden min-h-[85vh]">
      <div className="w-full max-w-[1400px] mx-auto">
        <div className="border-b border-gray-200">
          <FleetHeader
            onAddTruck={handleAddNewTruck}
            searchTerm={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            selectedStatus={statusFilter}
            onFilterChange={setStatusFilter}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-10">
          {filteredTrucks.map((truck) => (
            <TruckCard
              key={truck.id || truck.truckId}
              truck={truck}
              onClick={() => setSelectedTruck(truck)}
            />
          ))}
        </div>

        {selectedTruck && (
          <TruckModal
            truck={selectedTruck}
            trucks={trucks}
            driverOptions={driverOptions}
            onClose={() => setSelectedTruck(null)}
            onUpdate={handleUpdateTruck}
            onDeleteClick={(truck) => setTruckToDelete(truck)}
          />
        )}

        {isAddingTruck && (
          <TruckModal
            isAdding={true}
            trucks={trucks}
            driverOptions={driverOptions}
            onClose={() => setIsAddingTruck(false)}
            onAdd={handleAddTruck}
          />
        )}

        {truckToDelete && (
          <DeleteConfirmationModal
            truck={truckToDelete}
            onConfirm={() => handleDeleteTruck(truckToDelete.id || truckToDelete.truckId)}
            onClose={() => setTruckToDelete(null)}
          />
        )}
      </div>
    </div>
  );
}
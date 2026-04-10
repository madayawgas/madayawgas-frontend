// src/pages/Fleet/Fleet.jsx
import { useContext, useState } from "react";
import { DataContext } from "../../context/DataContext";
import FleetHeader from "../../components/fleet/FleetHeader";
import TruckCard from "../../components/fleet/TruckCard";
import TruckModal from "../../components/fleet/TruckModal";
import DeleteConfirmationModal from "../../components/fleet/DeleteConfirmationModal";

export default function Fleet() {
  const { trucks, addTruck, deleteTruck, updateTruck } = useContext(DataContext);
  
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [truckToDelete, setTruckToDelete] = useState(null);

  // Mock Data
  const handleAddNewTruck = () => {
    addTruck({
      plate: `Truck #${Math.floor(100 + Math.random() * 900)}`,
      driver: "Pending", 
      status: "Available", 
      capacity: "1000L",
      currentOdometer: "0 KM",
      lastOdometer: "0 KM",
      maintenanceStatus: "Minor", 
      lastInspectionDate: new Date().toISOString().split('T')[0], 
      lastUpdated: new Date().toISOString().split('T')[0],
    });
  };

  const handleUpdateTruck = (truckId, updatedData) => {
    updateTruck(truckId, updatedData);
    setSelectedTruck(null); 
  };

  const handleDeleteTruck = (truckId) => {
    deleteTruck(truckId);
    setTruckToDelete(null);
    setSelectedTruck(null);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto relative h-screen">
      
      {/* 1. Header */}
      <FleetHeader onAddTruck={handleAddNewTruck} />

      {/* 2. Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trucks.map((truck) => (
          <TruckCard 
            key={truck.id} 
            truck={truck} 
            onClick={() => setSelectedTruck(truck)} 
          />
        ))}
      </div>

      {/* 3. Modals */}
      {selectedTruck && (
        <TruckModal 
          truck={selectedTruck} 
          onClose={() => setSelectedTruck(null)} 
          onUpdate={handleUpdateTruck}
          onDeleteClick={(truck) => setTruckToDelete(truck)}
        />
      )}

      {truckToDelete && (
        <DeleteConfirmationModal
          truck={truckToDelete}
          onConfirm={() => handleDeleteTruck(truckToDelete.id)}
          onClose={() => setTruckToDelete(null)}
        />
      )}
    </div>  
  );
}
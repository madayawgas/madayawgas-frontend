// src/pages/Fleet/Fleet.jsx
import { useState } from "react";
import { useData } from "../../context/DataContext";

import FleetHeader from "../../components/fleet/FleetHeader";
import TruckCard from "../../components/fleet/TruckCard";
import TruckModal from "../../components/fleet/TruckModal";
import DeleteConfirmationModal from "../../components/fleet/DeleteConfirmationModal";

export default function Fleet() {
  const { trucks, addTruck, deleteTruck, updateTruck } = useData(); 
  
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [truckToDelete, setTruckToDelete] = useState(null);


  const handleAddNewTruck = () => {
    // Generates a mock truck matching your new schema
    addTruck({
      truckId: Math.floor(1000 + Math.random() * 9000),
      plateNumber: `NEW-${Math.floor(1000 + Math.random() * 9000)}`,
      model: "Unknown Model",
      yearModel: new Date().getFullYear(),
      currentOdometer: 0,
      lastPMOdometer: 0,
      status: "AVAILABLE",
      assignedDriverId: null, // Unassigned by default
      driverName: "Unassigned",
      activeRepair: "",
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
      <FleetHeader onAddTruck={handleAddNewTruck} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trucks.map((truck) => (
          <TruckCard 
            key={truck.truckId} // Updated to truckId
            truck={truck} 
            onClick={() => setSelectedTruck(truck)} 
          />
        ))}
      </div>

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
          onConfirm={() => handleDeleteTruck(truckToDelete.truckId)} // Updated to truckId
          onClose={() => setTruckToDelete(null)}
        />
      )}
    </div>  
  );
}
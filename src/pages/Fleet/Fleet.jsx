
import { useContext } from "react";
import { DataContext } from "../../context/DataContext";

export default function Fleet() {
  const { trucks, addTruck, updateTruck, deleteTruck } =
    useContext(DataContext);

  const handleAddNewTruck = () => {
    addTruck({
      plate: `MDY-${Math.floor(100 + Math.random() * 900)}`,
      driver: "Pending",
      status: "Available",
      capacity: "1000L",
    });
  };

  const handleToggleStatus = (truck) => {
    const newStatus = truck.status === "Active" ? "Maintenance" : "Active";
    updateTruck(truck.id, { status: newStatus });
  };

  return (
    <div className="border-2 border-slate-300 rounded-lg p-6 m-4 bg-white">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold">Fleet Board</h2>
        <button
          onClick={handleAddNewTruck}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add Truck
        </button>
      </div>

      {/* THE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trucks.map((truck) => (
          // INDIVIDUAL TRUCK CONTAINER (Box with a border)
          <div key={truck.id} className="border border-slate-400 rounded p-4">
            <h3 className="font-bold text-lg border-b border-slate-200 mb-2 pb-1">
              {truck.plate}
            </h3>

            <div className="text-sm mb-4 space-y-1">
              <p>
                <strong>Status:</strong> {truck.status}
              </p>
              <p>
                <strong>Driver:</strong> {truck.driver}
              </p>
              <p>
                <strong>Capacity:</strong> {truck.capacity}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleToggleStatus(truck)}
                className="flex-1 bg-slate-200 text-slate-800 py-1 rounded text-sm hover:bg-slate-300"
              >
                Toggle Status
              </button>
              <button
                onClick={() => deleteTruck(truck.id)}
                className="flex-1 bg-red-500 text-white py-1 rounded text-sm hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>  
  );
}

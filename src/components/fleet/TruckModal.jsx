// src/components/fleet/TruckModal.jsx
import { useState } from "react";
import TruckStatus from "./TruckStatus";

// Mock drivers
const availableDrivers = [
  { id: 3, name: "Andres Bonifacio" },
  { id: 4, name: "Jose Rizal" },
  { id: 5, name: "Apolinario Mabini" },
  { id: 6, name: "Emilio Aguinaldo" },
  { id: 7, name: "Antonio Luna" },
];

const TruckStatusSelector = ({ currentStatus, onSelect }) => {
  const statuses = ["AVAILABLE", "UNDER_MAINTENANCE", "IN_USE", "IN_SHOP"];
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onSelect(status)}
          className={`inline-block p-0 border-none bg-transparent outline-none transition-opacity ${
            currentStatus === status ? "opacity-100" : "opacity-40 hover:opacity-70 grayscale"
          }`}
        >
          <div className="pointer-events-none">
            <TruckStatus status={status.replace("_", " ")} />
          </div>
        </button>
      ))}
    </div>
  );
};

// --- Edit Form Component ---
const TruckEditForm = ({ truck, onSave, onCancel }) => {
  const [formData, setFormData] = useState({ ...truck });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = (name === "currentOdometer" || name === "lastPMOdometer" || name === "assignedDriverId") 
      ? Number(value) 
      : value;
    
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const submitSave = () => {
    const selectedDriver = availableDrivers.find(d => d.id === formData.assignedDriverId);
    
    // Automatically generate a formatted date string for the lastUpdated field
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}-${currentDate.getFullYear()} ${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}:${String(currentDate.getSeconds()).padStart(2, '0')}`;

    onSave({
      ...formData,
      driverName: selectedDriver ? selectedDriver.name : "Unassigned",
      lastUpdated: formattedDate
    });
  };

  return (
    <div className="space-y-5 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label className="text-gray-800 font-medium sm:w-44 shrink-0">Assign Driver:</label>
        <select name="assignedDriverId" value={formData.assignedDriverId || ""} onChange={handleInputChange} className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-[#0F7AB2] outline-none">
          <option value="">Unassigned</option>
          {availableDrivers.map((driver) => (
            <option key={driver.id} value={driver.id}>{driver.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label className="text-gray-800 font-medium sm:w-44 shrink-0">Truck Model:</label>
        <input type="text" name="model" value={formData.model || ""} onChange={handleInputChange} className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-[#0F7AB2] outline-none" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label className="text-gray-800 font-medium sm:w-44 shrink-0">Current Odometer:</label>
        <input type="number" name="currentOdometer" value={formData.currentOdometer || ""} onChange={handleInputChange} className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-[#0F7AB2] outline-none" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label className="text-gray-800 font-medium sm:w-44 shrink-0">Last PM Odometer:</label>
        <input type="number" name="lastPMOdometer" value={formData.lastPMOdometer || ""} onChange={handleInputChange} className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-[#0F7AB2] outline-none" />
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label className="text-gray-800 font-medium sm:w-44 shrink-0">Truck Status:</label>
        <div className="flex-1">
          <TruckStatusSelector currentStatus={formData.status} onSelect={(status) => setFormData((prev) => ({ ...prev, status: status }))} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start gap-2">
        <label className="text-gray-800 font-medium sm:w-44 shrink-0 pt-2">Active Repair Notes:</label>
        <textarea name="activeRepair" rows={2} value={formData.activeRepair || ""} onChange={handleInputChange} className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-[#0F7AB2] outline-none resize-none" placeholder="Enter maintenance details if applicable..." />
      </div>

      {/* Added Last Updated Text below the form inputs */}
      <div className="text-gray-600 text-sm mt-4">
        <p>Last updated: <span className="font-medium">{truck.lastUpdated || "N/A"}</span></p>
      </div>

      <div className="flex justify-center sm:justify-end gap-4 pt-4 border-t border-gray-100">
        <button onClick={onCancel} className="bg-gray-100 text-gray-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 transition">CANCEL</button>
        <button onClick={submitSave} className="bg-[#0F7AB2] text-white font-semibold px-8 py-2 rounded-lg hover:bg-[#0c628f] transition shadow-md">SAVE</button>
      </div>
    </div>
  );
};

// --- View Details Component ---
const TruckViewDetails = ({ truck, onEditClick, onDeleteClick, onClose }) => (
  <>
    <div className="space-y-4 text-gray-800 mb-8">
      <p>Assigned Driver : <span className="font-medium">{truck.driverName}</span></p>
      <p>Truck Model: <span className="font-medium">{truck.yearModel} {truck.model}</span></p>
      <p>Current Odometer: <span className="font-medium">{truck.currentOdometer?.toLocaleString()} KM</span></p>
      <p>Last PM Odometer: <span className="font-medium">{truck.lastPMOdometer?.toLocaleString()} KM</span></p>
      
      <div className="flex items-center gap-2">
        <p>Truck Status:</p>
        <TruckStatus status={truck.status.replace("_", " ")} />
      </div>

      {truck.activeRepair && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm border border-red-100">
          <p className="font-bold mb-1">Active Repair:</p>
          <p>{truck.activeRepair}</p>
        </div>
      )}

      <p>Last updated: <span className="font-medium">{truck.lastUpdated || "N/A"}</span></p>
    </div>

    <div className="flex justify-center gap-4">
      <button onClick={onEditClick} className="bg-[#0F7AB2] text-white font-semibold px-8 py-2 rounded-lg hover:bg-[#0c628f] shadow-md transition">EDIT</button>
      <button onClick={() => onDeleteClick(truck)} className="bg-red-50 text-red-600 font-semibold px-6 py-2 rounded-lg hover:bg-red-100 transition">DELETE</button>
      <button onClick={onClose} className="bg-gray-100 text-gray-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 transition">CLOSE</button>
    </div>
  </>
);

// --- Main Modal Wrapper ---
export default function TruckModal({ truck, onClose, onUpdate, onDeleteClick }) {
  const [isEditing, setIsEditing] = useState(false);

  if (!truck) return null;

  const handleSave = (updatedData) => {
    onUpdate(truck.truckId, updatedData);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center p-4 transition-all">
      <div className={`bg-white rounded-2xl p-8 w-full shadow-2xl relative transition-all duration-300 ${isEditing ? "max-w-2xl" : "max-w-md"}`}>
        <h2 className="text-[#1B4B75] text-2xl font-bold mb-6 border-b pb-4">
          {truck.plateNumber || `Truck #${truck.truckId}`}
        </h2>

        {isEditing ? (
          <TruckEditForm truck={truck} onSave={handleSave} onCancel={() => setIsEditing(false)} />
        ) : (
          <TruckViewDetails truck={truck} onEditClick={() => setIsEditing(true)} onDeleteClick={onDeleteClick} onClose={onClose} />
        )}
      </div>
    </div>
  );
}
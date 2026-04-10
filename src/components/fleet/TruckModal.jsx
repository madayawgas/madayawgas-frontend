// src/components/fleet/TruckModal.jsx
import { useState, useEffect } from "react";
import TruckStatus from "./TruckStatus";
import MaintenanceStatus from "./MaintenanceStatus";

const drivers = ["Driver 1", "Driver 2", "Driver 3", "Driver 4"];

// --- 1. Status Selectors ---
const MaintenanceStatusSelector = ({ currentStatus, onSelect }) => {
  const statuses = ["Minor", "Major", "Critical"]; 
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onSelect(status)}
          className={`inline-block p-0 border-none bg-transparent outline-none transition-opacity ${
            currentStatus === status 
              ? "opacity-100" 
              : "opacity-40 hover:opacity-70 grayscale"
          }`}
        >
          <div className="pointer-events-none">
            <MaintenanceStatus status={status} />
          </div>
        </button>
      ))}
    </div>
  );
};

const TruckStatusSelector = ({ currentStatus, onSelect }) => {
  const statuses = ["Available", "In Use", "In Shop", "Under Repair"];
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onSelect(status)}
          className={`inline-block p-0 border-none bg-transparent outline-none transition-opacity ${
            currentStatus === status 
              ? "opacity-100" 
              : "opacity-40 hover:opacity-70 grayscale"
          }`}
        >
          <div className="pointer-events-none">
            <TruckStatus status={status} />
          </div>
        </button>
      ))}
    </div>
  );
};

// --- 2. Edit Form Component ---
const TruckEditForm = ({ truck, onSave, onCancel }) => {
  const [formData, setFormData] = useState({ ...truck });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const submitSave = () => {
    onSave({
      ...formData,
      lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });
  };

  return (
    <div className="space-y-5 mb-8">
      {/* rresponsive rows: stacks on mobile (flex-col), inline on tablet/desktop (sm:flex-row) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label className="text-gray-800 font-medium sm:w-44 shrink-0">Assign Driver:</label>
        <select name="driver" value={formData.driver} onChange={handleInputChange} className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-[#0F7AB2] outline-none">
          <option value="Pending">Pending</option>
          {drivers.map((driver) => (<option key={driver} value={driver}>{driver}</option>))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label className="text-gray-800 font-medium sm:w-44 shrink-0">Current Odometer:</label>
        <input type="text" name="currentOdometer" value={formData.currentOdometer || ""} onChange={handleInputChange} className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-[#0F7AB2] outline-none" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label className="text-gray-800 font-medium sm:w-44 shrink-0">Last Odometer:</label>
        <input type="text" name="lastOdometer" value={formData.lastOdometer || ""} onChange={handleInputChange} className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-[#0F7AB2] outline-none" />
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label className="text-gray-800 font-medium sm:w-44 shrink-0">Maintenance Status:</label>
        <div className="flex-1">
          <MaintenanceStatusSelector currentStatus={formData.maintenanceStatus} onSelect={(status) => setFormData((prev) => ({ ...prev, maintenanceStatus: status }))} />
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label className="text-gray-800 font-medium sm:w-44 shrink-0">Truck Status:</label>
        <div className="flex-1">
          <TruckStatusSelector currentStatus={formData.status} onSelect={(status) => setFormData((prev) => ({ ...prev, status: status }))} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label className="text-gray-800 font-medium sm:w-44 shrink-0">Last Inspection Date:</label>
        <input type="date" name="lastInspectionDate" value={formData.lastInspectionDate || ""} onChange={handleInputChange} className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-[#0F7AB2] outline-none" />
      </div>

      <div className="text-gray-600 text-sm mt-4">
        <p>Last updated: <span className="font-medium">{truck.lastUpdated}</span></p>
      </div>

      <div className="flex justify-center sm:justify-end gap-4 pt-4 border-t border-gray-100">
        <button onClick={onCancel} className="bg-gray-100 text-gray-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 transition">CANCEL</button>
        <button onClick={submitSave} className="bg-[#0F7AB2] text-white font-semibold px-8 py-2 rounded-lg hover:bg-[#0c628f] transition shadow-md">SAVE</button>
      </div>
    </div>
  );
};

// --- 3. View Details Component ---
const TruckViewDetails = ({ truck, onEditClick, onDeleteClick, onClose }) => (
  <>
    <div className="space-y-4 text-gray-800 mb-8">
      <p>Assigned Driver : <span className="font-medium">{truck.driver}</span></p>
      <p>Current Odometer: <span className="font-medium">{truck.currentOdometer || "N/A"}</span></p>
      <p>Last Odometer: <span className="font-medium">{truck.lastOdometer || "N/A"}</span></p>
      
      <div className="flex items-center gap-2">
        <p>Maintenance Status:</p>
        <MaintenanceStatus status={truck.maintenanceStatus || "Minor"} />
      </div>
      
      <div className="flex items-center gap-2">
        <p>Truck Status:</p>
        <TruckStatus status={truck.status} />
      </div>

      <p>Last Inspection Date: <span className="font-medium">{truck.lastInspectionDate || "N/A"}</span></p>
      <p>Last updated: <span className="font-medium">{truck.lastUpdated || "N/A"}</span></p>
    </div>

    <div className="flex justify-center gap-4">
      <button onClick={onEditClick} className="bg-[#0F7AB2] text-white font-semibold px-8 py-2 rounded-lg hover:bg-[#0c628f] shadow-md transition">EDIT</button>
      <button onClick={() => onDeleteClick(truck)} className="bg-red-50 text-red-600 font-semibold px-6 py-2 rounded-lg hover:bg-red-100 transition">DELETE</button>
      <button onClick={onClose} className="bg-gray-100 text-gray-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 transition">CLOSE</button>
    </div>
  </>
);

// --- 4. Main Modal Component ---
export default function TruckModal({ truck, onClose, onUpdate, onDeleteClick }) {
  const [isEditing, setIsEditing] = useState(false);

  if (!truck) return null;

  const handleSave = (updatedData) => {
    onUpdate(truck.id, updatedData);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center p-4 transition-all">
      {/*  max-w-2xl for Edit mode (wider), max-w-md for View mode (compact) */}
      <div className={`bg-white rounded-2xl p-8 w-full shadow-2xl relative transition-all duration-300 ${isEditing ? "max-w-2xl" : "max-w-md"}`}>
        <h2 className="text-[#1B4B75] text-2xl font-bold mb-6 border-b pb-4">
          {truck.plate || `Truck #${truck.id}`}
        </h2>

        {isEditing ? (
          <TruckEditForm 
            truck={truck} 
            onSave={handleSave} 
            onCancel={() => setIsEditing(false)} 
          />
        ) : (
          <TruckViewDetails 
            truck={truck} 
            onEditClick={() => setIsEditing(true)} 
            onDeleteClick={onDeleteClick} 
            onClose={onClose} 
          />
        )}
      </div>
    </div>
  );
}
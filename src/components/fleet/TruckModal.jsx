import { useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import TruckStatus from "./TruckStatus";

const availableDrivers = [
  { id: 3, name: "Andres Bonifacio" },
  { id: 4, name: "Jose Rizal" },
  { id: 5, name: "Apolinario Mabini" },
  { id: 6, name: "Emilio Aguinaldo" },
  { id: 7, name: "Antonio Luna" },
];

const getBadgeVariant = (status) => {
  switch(status) {
    case "AVAILABLE": return "success";
    case "UNDER_MAINTENANCE": return "danger";
    case "IN_SHOP": return "danger";
    case "IN_USE": return "info";
    default: return "warning";
  }
};

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
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}-${currentDate.getFullYear()} ${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}:${String(currentDate.getSeconds()).padStart(2, '0')}`;

    onSave({
      ...formData,
      driverName: selectedDriver ? selectedDriver.name : "Unassigned",
      lastUpdated: formattedDate
    });
  };

  const driverOptions = availableDrivers.map(d => ({ value: d.id, label: d.name }));

  return (
    <div className="space-y-4 mb-4 text-left">
      <Select label="Assign Driver" name="assignedDriverId" value={formData.assignedDriverId || ""} onChange={handleInputChange} options={driverOptions} />
      <Input label="Truck Model" name="model" value={formData.model || ""} onChange={handleInputChange} />
      
      <div className="flex gap-4">
        <Input label="Current Odometer" type="number" name="currentOdometer" value={formData.currentOdometer || ""} onChange={handleInputChange} />
        <Input label="Last PM Odometer" type="number" name="lastPMOdometer" value={formData.lastPMOdometer || ""} onChange={handleInputChange} />
      </div>
      
      <div className="w-full flex flex-col gap-1.5 mt-2">
        <label className="text-gray-800 font-medium text-sm">Truck Status</label>
        <TruckStatusSelector 
          currentStatus={formData.status} 
          onSelect={(status) => setFormData((prev) => ({ ...prev, status: status }))} 
        />
      </div>
      
      <div className="w-full flex flex-col gap-1.5 mt-2">
        <label className="text-gray-800 font-medium text-sm">Active Repair Notes</label>
        <textarea name="activeRepair" rows={2} value={formData.activeRepair || ""} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-[#0F7AB2]/30 outline-none resize-none" placeholder="Enter maintenance details if applicable..." />
      </div>

      <div className="text-gray-600 text-sm mt-4">
        <p>Last updated: <span className="font-medium">{truck.lastUpdated || "N/A"}</span></p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel}>CANCEL</Button>
        <Button variant="primary" onClick={submitSave}>SAVE</Button>
      </div>
    </div>
  );
};

const TruckViewDetails = ({ truck, onEditClick, onDeleteClick, onClose }) => (
  <div className="text-left">
    <div className="space-y-4 text-gray-800 mb-8">
      <p>Assigned Driver: <span className="font-medium">{truck.driverName}</span></p>
      <p>Truck Model: <span className="font-medium">{truck.yearModel} {truck.model}</span></p>
      <p>Current Odometer: <span className="font-medium">{truck.currentOdometer?.toLocaleString()} KM</span></p>
      <p>Last PM Odometer: <span className="font-medium">{truck.lastPMOdometer?.toLocaleString()} KM</span></p>
      
      <div className="flex items-center gap-2">
        <p>Truck Status:</p>
        <Badge variant={getBadgeVariant(truck.status)}>
          {truck.status.replace("_", " ")}
        </Badge>
      </div>

      {truck.activeRepair && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm border border-red-100 mt-2">
          <p className="font-bold mb-1">Active Repair:</p>
          <p>{truck.activeRepair}</p>
        </div>
      )}

      <p className="pt-2 text-gray-600 text-sm">Last updated: <span className="font-medium">{truck.lastUpdated || "N/A"}</span></p>
    </div>

    <div className="flex justify-center gap-3">
      <Button variant="primary" className="px-8" onClick={onEditClick}>EDIT</Button>
      <Button variant="danger" onClick={() => onDeleteClick(truck)}>DELETE</Button>
      <Button variant="secondary" onClick={onClose}>CLOSE</Button>
    </div>
  </div>
);

export default function TruckModal({ truck, onClose, onUpdate, onDeleteClick }) {
  const [isEditing, setIsEditing] = useState(false);

  if (!truck) return null;

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={truck.plateNumber || `Truck #${truck.truckId}`}
      maxWidth={isEditing ? "max-w-xl" : "max-w-md"}
    >
      {isEditing ? (
        <TruckEditForm 
          truck={truck} 
          onSave={(data) => { onUpdate(truck.truckId, data); setIsEditing(false); }} 
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
    </Modal>
  );
}
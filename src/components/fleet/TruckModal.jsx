import { useState } from "react";
import { useData } from "../../context/DataContext";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import TruckStatus from "./TruckStatus";

const getBadgeVariant = (status) => {
  switch(status) {
    case "AVAILABLE": return "success";
    case "UNDER_MAINTENANCE": return "maintenance";
    case "IN_SHOP": return "neutral";
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

export default function TruckModal({ truck, onClose, onUpdate, onDeleteClick, onAdd, isAdding = false }) {
  const { getDriverOptions, trucks } = useData();
  const availableDrivers = getDriverOptions(truck?.assignedDriverId);
  
  const [isEditing, setIsEditing] = useState(isAdding);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ 
    status: "AVAILABLE",
    plateNumber: "",
    yearModel: "",
    assignedDriverId: "",
    model: "",
    currentOdometer: "",
    lastPMOdometer: "",
    capacity: "",
    activeRepair: "",
    ...(truck || {}) 
  });

  if (!truck && !isAdding) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Handle numeric fields
    if (["currentOdometer", "lastPMOdometer", "yearModel", "capacity"].includes(name)) {
      // Prevent negative numbers on change
      if (value !== "" && Number(value) < 0) return;
      parsedValue = value === "" ? "" : Number(value);
    }

    if (name === "assignedDriverId") {
      parsedValue = value === "" ? "" : Number(value);
    }

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    // 1. Unique Plate Handling
    if (!formData.plateNumber) {
      newErrors.plateNumber = "Plate number is required";
    } else {
      const plateExists = trucks.find(t => 
        t.plateNumber.toString().toLowerCase() === formData.plateNumber.toString().toLowerCase() && 
        t.truckId !== truck?.truckId
      );
      if (plateExists) {
        newErrors.plateNumber = "This plate number already exists";
      }
    }

    // 2. Capacity and Odometer inputs should not accept negative number inputs
    if (formData.currentOdometer < 0) {
      newErrors.currentOdometer = "Cannot be negative";
    }
    if (formData.lastPMOdometer < 0) {
      newErrors.lastPMOdometer = "Cannot be negative";
    }
    if (formData.capacity < 0) {
      newErrors.capacity = "Cannot be negative";
    }
    if (formData.yearModel < 0) {
      newErrors.yearModel = "Invalid year";
    }

    // 3. Status Check: A truck cannot be saved as "Active" if the driver is "Unassigned"
    // "AVAILABLE" and "IN_USE" are considered active statuses
    if ((formData.status === "AVAILABLE" || formData.status === "IN_USE") && !formData.assignedDriverId) {
      newErrors.assignedDriverId = "Active trucks must have an assigned driver";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitSave = () => {
    if (!validate()) return;

    // Use users list for driver name lookup if needed, or get it from availableDrivers
    const selectedDriver = [...availableDrivers, ...(truck?.assignedDriverId ? [{ userId: truck.assignedDriverId, firstName: truck.driverName.split(' ')[0], lastName: truck.driverName.split(' ').slice(1).join(' ') }] : [])].find(d => d.userId === formData.assignedDriverId);
    
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}-${currentDate.getFullYear()} ${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}:${String(currentDate.getSeconds()).padStart(2, '0')}`;

    const finalData = {
      ...formData,
      driverName: selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName}`.trim() : "Unassigned",
      assignedDriverId: formData.assignedDriverId || null,
      lastUpdated: formattedDate
    };

    if (isAdding) {
      onAdd(finalData);
    } else {
      onUpdate(truck.truckId, finalData); 
    }
    setIsEditing(false);
  };

  // Prepare driver options with "Unassigned" option
  const driverOptions = [
    { value: "", label: "Unassigned" },
    ...availableDrivers.map(d => ({ value: d.userId, label: `${d.firstName} ${d.lastName}`.trim() }))
  ];

  // If editing and has a current driver, ensure they are in the options if not already
  if (formData.assignedDriverId && !driverOptions.some(opt => opt.value === formData.assignedDriverId)) {
    // This case happens when the current driver is not in "availableDrivers" (which is correct as they are already assigned to THIS truck)
    // We already passed truck?.assignedDriverId to getDriverOptions, so they should be there.
    // But just in case:
    const currentDriver = trucks.find(t => t.truckId === truck?.truckId)?.driverName;
    if (currentDriver && currentDriver !== "Unassigned") {
       // Driver should be in the list because of getDriverOptions(truck?.assignedDriverId)
    }
  }

  const displayTruck = truck || {};

  const editFooter = (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose}>CANCEL</Button>
      <Button variant="primary" onClick={submitSave}>{isAdding ? "ADD TRUCK" : "SAVE"}</Button>
    </div>
  );

  const viewFooter = (
    <div className="flex justify-center gap-3">
      <Button variant="primary" className="px-8" onClick={() => setIsEditing(true)}>EDIT</Button>
      <Button variant="danger" onClick={() => onDeleteClick(displayTruck)}>DELETE</Button>
      <Button variant="secondary" onClick={onClose}>CLOSE</Button>
    </div>
  );

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={isAdding ? "Add New Truck" : (isEditing ? "Edit Truck" : (displayTruck.plateNumber || `Truck #${displayTruck.truckId}`))}
      maxWidth={(isEditing || isAdding) ? "max-w-xl" : "max-w-md"}
      footer={isEditing || isAdding ? editFooter : viewFooter}
    >
      {isEditing || isAdding ? (
        <div className="space-y-4 text-left py-2">
          <div className="flex gap-4">
            <Input label="Plate Number" name="plateNumber" value={formData.plateNumber || ""} onChange={handleInputChange} placeholder="e.g. ABC-1234" error={errors.plateNumber} />
            <Input label="Year Model" type="number" name="yearModel" value={formData.yearModel || ""} onChange={handleInputChange} placeholder="e.g. 2023" error={errors.yearModel} />
          </div>
          
          <Select label="Assign Driver" name="assignedDriverId" value={formData.assignedDriverId || ""} onChange={handleInputChange} options={driverOptions} error={errors.assignedDriverId} />
          
          <div className="flex gap-4">
            <Input label="Truck Model" name="model" value={formData.model || ""} onChange={handleInputChange} placeholder="e.g. Isuzu Elf 250" error={errors.model} />
            <Input label="Capacity (L/T)" type="number" name="capacity" value={formData.capacity || ""} onChange={handleInputChange} placeholder="e.g. 500" error={errors.capacity} />
          </div>
          
          <div className="flex gap-4">
            <Input label="Current Odometer" type="number" name="currentOdometer" value={formData.currentOdometer || ""} onChange={handleInputChange} error={errors.currentOdometer} />
            <Input label="Last PM Odometer" type="number" name="lastPMOdometer" value={formData.lastPMOdometer || ""} onChange={handleInputChange} error={errors.lastPMOdometer} />
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
            <textarea 
              name="activeRepair" 
              rows={2} 
              value={formData.activeRepair || ""} 
              onChange={handleInputChange} 
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-[#0F7AB2]/30 outline-none resize-none" 
              placeholder="Enter maintenance details if applicable..." 
            />
          </div>

          {!isAdding && (
            <div className="text-gray-600 text-sm mt-4">
              <p>Last updated: <span className="font-medium">{displayTruck.lastUpdated || "N/A"}</span></p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-left space-y-4 text-gray-800 py-2">
          <p>Assigned Driver: <span className="font-medium">{displayTruck.driverName}</span></p>
          <p>Truck Model: <span className="font-medium">{displayTruck.yearModel} {displayTruck.model}</span></p>
          <p>Capacity: <span className="font-medium">{displayTruck.capacity} L/T</span></p>
          <p>Current Odometer: <span className="font-medium">{displayTruck.currentOdometer?.toLocaleString()} KM</span></p>
          <p>Last PM Odometer: <span className="font-medium">{displayTruck.lastPMOdometer?.toLocaleString()} KM</span></p>
          
          <div className="flex items-center gap-2">
            <p>Truck Status:</p>
            <Badge variant={getBadgeVariant(displayTruck.status)}>
              {displayTruck.status.replace("_", " ")}
            </Badge>
          </div>

          {displayTruck.activeRepair && (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm border border-red-100 mt-2">
              <p className="font-bold mb-1">Active Repair:</p>
              <p>{displayTruck.activeRepair}</p>
            </div>
          )}

          <p className="pt-2 text-gray-600 text-sm">Last updated: <span className="font-medium">{displayTruck.lastUpdated || "N/A"}</span></p>
        </div>
      )}
    </Modal>
  );
}

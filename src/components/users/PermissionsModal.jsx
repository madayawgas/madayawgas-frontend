import React, { useState } from 'react';
import Select from '../ui/Select'; 
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function PermissionsModal({ isOpen, onClose }) {
  const [selectedRole, setSelectedRole] = useState('Driver');
  
  const [permissions, setPermissions] = useState({
    dashboard: true,
    fleetAndMaintenance: false,
    routeDispatch: false,
    inventory: false,
    salesAndDelivery: false,
    manageUsers: false,
  });

  const roleOptions = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Driver', label: 'Driver' }
  ];

  const handleToggle = (key) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const footer = (
    <div className="flex justify-between items-center w-full">
      <p className="text-gray-400 text-xs italic">Unsaved changes will be lost</p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose}>
          CANCEL
        </Button>
        <Button 
          variant="primary"
          onClick={onClose}
        >
          SAVE CHANGES
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Role and Permissions"
      maxWidth="max-w-2xl"
      footer={footer}
    >
      <div className="py-2">
        <p className="text-gray-400 text-sm mb-6">Manage user access and permissions</p>
        
        {/* Select Role Dropdown */}
        <div className="mb-8">
          <Select 
            label="Select Role" 
            name="role"
            value={selectedRole}
            options={roleOptions}
            onChange={(e) => setSelectedRole(e.target.value)}
          />
          <p className="text-gray-400 text-xs mt-2">Choose a role to modify its permissions and access</p>
        </div>

        <hr className="border-gray-100 mb-6" />

        {/* Permissions Section (Can View) */}
        <div className="mb-4">
          <h3 className="text-[#104e7a] font-bold text-lg mb-4">Can View</h3>
          
          <div className="space-y-4">
            {[
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'fleetAndMaintenance', label: 'Fleet & Maintenance' },
              { key: 'routeDispatch', label: 'Route Dispatch' },
              { key: 'inventory', label: 'Inventory' },
              { key: 'salesAndDelivery', label: 'Sales & Delivery' },
              { key: 'manageUsers', label: 'Manage Users' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-[#104e7a] text-sm font-semibold">{item.label}</span>
                
                {/* Custom Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleToggle(item.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 transition-colors focus:outline-none ${
                    permissions[item.key] 
                      ? 'bg-[#0F7AB2] border-[#0F7AB2]' 
                      : 'bg-white border-gray-300' 
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                      permissions[item.key]
                        ? 'translate-x-5'
                        : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

import React, { useState } from 'react';
import Select from '../ui/Select'; 
import { useData } from '../../context/DataContext'; // 1. Import the hook

export default function PermissionsModal({ isOpen, onClose }) {
  // 2. Consume the new state and method from DataContext
  const { rolePermissions, updateRolePermissions } = useData();
  
  // Keep selectedRole as local state so we know which role the user is looking at
  const [selectedRole, setSelectedRole] = useState('DRIVER');

  const roleOptions = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'FLEET_MANAGER', label: 'Manager' },
    { value: 'DRIVER', label: 'Driver' }
  ];

  // 3. Helper to check if a toggle should be "ON"
  // We check if the key exists in the array for the selected role
  const isEnabled = (key) => {
    return rolePermissions[selectedRole]?.includes(key);
  };

  // 4. Update the toggle handler to call the "Backend" logic
  const handleToggle = (key) => {
    updateRolePermissions(selectedRole, key);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col relative border-[3px] border-[#6D8AA2]">
        <div className="p-8">
          
          {/* Header Section */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-[#104e7a] text-2xl font-bold mb-1">Role and Permissions</h2>
              <p className="text-gray-400 text-sm">Manage user access and permissions</p>
            </div>
            <button 
              onClick={onClose}
              className="bg-[#7d8b99] hover:bg-[#6b7785] text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              BACK TO USERS
            </button>
          </div>

          <hr className="border-gray-200 mb-6" />

          {/* Select Role Dropdown */}
          <div className="mb-8 max-w-lg">
            <Select 
              label="Select Role" 
              name="role"
              value={selectedRole}
              options={roleOptions}
              onChange={(e) => setSelectedRole(e.target.value)}
            />
            <p className="text-gray-400 text-xs mt-2">Choose a role to modify its permissions and access</p>
          </div>

          <hr className="border-gray-200 mb-6" />

          {/* Permissions Section */}
          <div className="mb-12">
            <h3 className="text-[#104e7a] font-bold text-lg mb-4">Can View</h3>
            
            <div className="space-y-3 max-w-lg">
              {[
                { key: 'dashboard', label: 'Dashboard' },
                { key: 'fleet', label: 'Fleet & Maintenance' },
                { key: 'route-dispatch', label: 'Route Dispatch' },
                { key: 'inventory', label: 'Inventory' },
                { key: 'sales-delivery', label: 'Sales & Delivery' },
                { key: 'users', label: 'Manage Users' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-[#104e7a] text-sm font-medium">{item.label}</span>
                  
                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggle(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 transition-colors focus:outline-none ${
                      isEnabled(item.key) 
                        ? 'bg-[#6D8AA2] border-[#6D8AA2]' 
                        : 'bg-white border-[#6D8AA2]'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-[#DCE5EC] transition-transform duration-200 ease-in-out ${
                        isEnabled(item.key)
                          ? 'translate-x-5'
                          : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end mt-4">
            <button 
              onClick={onClose}
              className="bg-[#127ebc] hover:bg-[#0f6b9e] text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors"
            >
              SAVE CHANGES
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
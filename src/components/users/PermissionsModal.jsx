import React, { useState, useEffect } from "react";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useData } from "../../context/DataContext";

export default function PermissionsModal({ isOpen, onClose }) {
  const { permissions: allPermissions, updateRolePermissions } = useData();
  const [selectedRole, setSelectedRole] = useState("DRIVER");

  // Internal mapping of UI keys to DataContext keys
  const permissionMapping = [
    // { key: "dashboard", label: "Dashboard", dataKey: "dashboard" },
    {
      key: "fleetAndMaintenance",
      label: "Fleet & Maintenance",
      dataKey: "fleet",
    },
    {
      key: "routeDispatch",
      label: "Route Dispatch",
      dataKey: "route-dispatch",
    },
    { key: "inventory", label: "Inventory", dataKey: "inventory" },
    {
      key: "salesAndDelivery",
      label: "Sales & Delivery",
      dataKey: "sales-delivery",
    },
    { key: "manageUsers", label: "Manage Users", dataKey: "users" },
  ];

  const [localPermissions, setLocalPermissions] = useState({
    dashboard: false,
    fleetAndMaintenance: false,
    routeDispatch: false,
    inventory: false,
    salesAndDelivery: false,
    manageUsers: false,
  });

  // Load permissions when role changes or modal opens
  useEffect(() => {
    if (isOpen && allPermissions[selectedRole]) {
      const rolePerms = allPermissions[selectedRole];
      const newLocalPerms = {};
      permissionMapping.forEach((item) => {
        newLocalPerms[item.key] = rolePerms.includes(item.dataKey);
      });
      setLocalPermissions(newLocalPerms);
    }
  }, [selectedRole, isOpen, allPermissions]);

  const roleOptions = [
    // { value: "ADMIN", label: "Admin" },
    { value: "FLEET_MANAGER", label: "Manager" },
    { value: "DRIVER", label: "Driver" },
  ];

  const handleToggle = (key) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    // Convert back to array of dataKeys
    const updatedPermsArray = permissionMapping
      .filter((item) => localPermissions[item.key])
      .map((item) => item.dataKey);

    updateRolePermissions(selectedRole, updatedPermsArray);
    onClose();
  };

  const footer = (
    <div className="flex justify-between items-center w-full">
      <p className="text-gray-400 text-xs italic">
        Unsaved changes will be lost
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose}>
          CANCEL
        </Button>
        <Button variant="primary" onClick={handleSave}>
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
        <p className="text-gray-400 text-sm mb-6">
          Manage user access and permissions
        </p>

        {/* Select Role Dropdown */}
        <div className="mb-8">
          <Select
            label="Select Role"
            name="role"
            value={selectedRole}
            options={roleOptions}
            onChange={(e) => setSelectedRole(e.target.value)}
          />
          <p className="text-gray-400 text-xs mt-2">
            Choose a role to modify its permissions and access
          </p>
        </div>

        <hr className="border-gray-100 mb-6" />

        {/* Permissions Section (Can View) */}
        <div className="mb-4">
          <h3 className="text-[#104e7a] font-bold text-lg mb-4">Can View</h3>

          <div className="space-y-4">
            {permissionMapping.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100"
              >
                <span className="text-[#104e7a] text-sm font-semibold">
                  {item.label}
                </span>

                {/* Custom Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleToggle(item.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 transition-colors focus:outline-none ${
                    localPermissions[item.key]
                      ? "bg-[#0F7AB2] border-[#0F7AB2]"
                      : "bg-gray-200 border-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                      localPermissions[item.key]
                        ? "translate-x-5"
                        : "translate-x-0.5"
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

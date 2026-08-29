import React, { useState } from "react";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { PERMISSIONS } from "../../utils/permissions.js";

const DEFAULT_PERMISSION_MAPPING = [
  {
    key: "fleetAndMaintenance",
    label: "Fleet & Maintenance",
    dataKey: PERMISSIONS.FLEET_VIEW,
  },
  {
    key: "routeDispatch",
    label: "Route Dispatch",
    dataKey: PERMISSIONS.ROUTE_VIEW,
  },
  {
    key: "inventory",
    label: "Inventory",
    dataKey: PERMISSIONS.INVENTORY_VIEW,
  },
  {
    key: "salesAndDelivery",
    label: "Sales & Delivery",
    dataKey: PERMISSIONS.SALES_VIEW,
  },
  {
    key: "manageUsers",
    label: "Manage Users",
    dataKey: PERMISSIONS.USERS_VIEW,
  },
];

export default function PermissionsModal({
  isOpen,
  onClose,
  roles = [],
  permissionsMap = {},
  onSavePermissions,
}) {
  const [selectedRole, setSelectedRole] = useState(
    roles[0]?.name || "Super Admin"
  );
  const [prevSyncKey, setPrevSyncKey] = useState("");
  const [localPermissions, setLocalPermissions] = useState({
    fleetAndMaintenance: false,
    routeDispatch: false,
    inventory: false,
    salesAndDelivery: false,
    manageUsers: false,
  });

  const syncKey = `${isOpen}-${selectedRole}`;
  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    if (isOpen) {
      const rolePerms = permissionsMap[selectedRole] || [];
      const newLocalPerms = {};
      DEFAULT_PERMISSION_MAPPING.forEach((item) => {
        newLocalPerms[item.key] = rolePerms.includes(item.dataKey);
      });
      setLocalPermissions(newLocalPerms);
    }
  }

  const roleOptions = roles.map((r) => ({
    value: r.name,
    label: r.name,
  }));

  const handleToggle = (key) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    const updatedPermsArray = DEFAULT_PERMISSION_MAPPING.filter(
      (item) => localPermissions[item.key]
    ).map((item) => item.dataKey);

    if (onSavePermissions) {
      onSavePermissions(selectedRole, updatedPermsArray);
    }
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
            options={
              roleOptions.length > 0
                ? roleOptions
                : [
                    { value: "Super Admin", label: "Super Admin" },
                    { value: "Admin", label: "Admin" },
                    { value: "Fleet Manager", label: "Fleet Manager" },
                    { value: "Driver", label: "Driver" },
                    { value: "Sales Manager", label: "Sales Manager" },
                    { value: "Sales Person", label: "Sales Person" },
                  ]
            }
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
            {DEFAULT_PERMISSION_MAPPING.map((item) => (
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

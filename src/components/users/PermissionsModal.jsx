import React, { useState, useEffect, useRef } from "react";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { PERMISSIONS } from "../../utils/permissions.js";

const DEFAULT_ROLES = [
  "Super Admin",
  "Admin",
  "Fleet Manager",
  "Driver",
  "Sales Manager",
  "Sales Person",
];

const DEFAULT_PERMISSION_MAPPING = [
  {
    key: "fleetAndMaintenance",
    label: "Fleet & Maintenance",
    dataKey: PERMISSIONS?.FLEET_VIEW || "fleet.view",
  },
  {
    key: "routeDispatch",
    label: "Route Dispatch",
    dataKey: PERMISSIONS?.ROUTE_VIEW || "route.view",
  },
  {
    key: "inventory",
    label: "Inventory",
    dataKey: PERMISSIONS?.INVENTORY_VIEW || "inventory.view",
  },
  {
    key: "salesAndDelivery",
    label: "Sales & Delivery",
    dataKey: PERMISSIONS?.SALES_VIEW || "sales.view",
  },
  {
    key: "manageUsers",
    label: "Manage Users",
    dataKey: PERMISSIONS?.USERS_VIEW || "users.view",
  },
];

export default function PermissionsModal({
  isOpen,
  onClose,
  roles = [],
  permissionsMap = {},
  onSavePermissions,
}) {
  const getRoleName = (r) => (typeof r === "string" ? r : r?.name);

  // Combine fetched API roles with missing system roles to guarantee all exist
  const fetchedNames = roles.map(getRoleName).filter(Boolean);
  const combinedRoleNames = Array.from(
    new Set([...fetchedNames, ...DEFAULT_ROLES])
  );

  const [selectedRole, setSelectedRole] = useState("Super Admin");
  const [localPermissions, setLocalPermissions] = useState({
    fleetAndMaintenance: true,
    routeDispatch: true,
    inventory: true,
    salesAndDelivery: true,
    manageUsers: true,
  });

  const syncKey = `${isOpen}-${selectedRole}`;
  const lastSyncedKey = useRef("");

  // Sync state ONLY when modal opens or when role selection changes
  useEffect(() => {
    if (isOpen && lastSyncedKey.current !== syncKey) {
      lastSyncedKey.current = syncKey;

      const activeRoleObj = roles.find((r) => getRoleName(r) === selectedRole);
      const rolePerms =
        permissionsMap[selectedRole] || activeRoleObj?.permissions;

      const newLocalPerms = {};
      DEFAULT_PERMISSION_MAPPING.forEach((item) => {
        if (rolePerms === undefined && selectedRole === "Super Admin") {
          newLocalPerms[item.key] = true;
        } else {
          newLocalPerms[item.key] = Array.isArray(rolePerms)
            ? rolePerms.includes(item.dataKey)
            : false;
        }
      });

      setLocalPermissions(newLocalPerms);
    }

    if (!isOpen) {
      lastSyncedKey.current = "";
    }
  }, [isOpen, selectedRole, roles, permissionsMap, syncKey]);

  const roleOptions = combinedRoleNames.map((name) => ({
    value: name,
    label: name,
  }));

  const handleToggle = (key) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleRoleChange = (e) => {
    const val = e?.target ? e.target.value : e;
    if (val) setSelectedRole(val);
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
            options={roleOptions}
            onChange={handleRoleChange}
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
            {DEFAULT_PERMISSION_MAPPING.map((item) => {
              const isChecked = !!localPermissions[item.key];
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100"
                >
                  <span className="text-[#104e7a] text-sm font-semibold">
                    {item.label}
                  </span>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggle(item.key)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer ${
                      isChecked
                        ? "bg-[#0F7AB2] border-[#0F7AB2]"
                        : "bg-gray-200 border-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                        isChecked ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
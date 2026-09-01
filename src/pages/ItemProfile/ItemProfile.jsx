// src/pages/ItemProfile/ItemProfile.jsx
import { useState, useEffect, useMemo } from "react";
import { inventoryApi } from "../../api/inventory.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";
import initialMockItems from "../../mocks/items.json";

import ItemHeader from "../../components/items/ItemHeader";
import ItemControls from "../../components/items/ItemControls";
import ItemCard from "../../components/items/ItemCard";
import ItemModal from "../../components/items/ItemModal";
import DeactivateItemModal from "../../components/items/DeactivateItemModal";
import AdminPasswordModal from "../../components/users/AdminPasswordModal";
import ToastNotification from "../../components/ui/ToastNotifications";

const LOCAL_STORAGE_KEY = "app_items_cache";

export default function ItemProfile() {
  const { can } = useAuth();

  // RBAC Permission Guard
  const canManage = can
    ? can(PERMISSIONS?.INVENTORY_MANAGE || "inventory.manage")
    : true;

  // Initialize from cache or fallback to initialMockItems
  const [items, setItems] = useState(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error reading cached inventory items:", e);
    }
    return Array.isArray(initialMockItems) ? initialMockItems : [];
  });

  const [isLoading, setIsLoading] = useState(items.length === 0);
  const [selectedItem, setSelectedItem] = useState(null);

  // Deactivate States
  const [itemToDeactivate, setItemToDeactivate] = useState(null);
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);

  // Reactivation States
  const [pendingReactivation, setPendingReactivation] = useState(null);
  const [showReactivatePasswordModal, setShowReactivatePasswordModal] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    category: "All Categories",
    dateFrom: "",
    dateTo: "",
  });

  // Modal & Toast States
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [toast, setToast] = useState(null); // { type: "success" | "error" | "info" | "warning", message: string }

  // Helper to sync local state changes with localStorage
  const updateItemsState = (updater) => {
    setItems((prev) => {
      const updated = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to write to items cache:", e);
      }
      return updated;
    });
  };

  useEffect(() => {
    async function loadItems() {
      try {
        setIsLoading(true);
        const data = await inventoryApi.getInventoryItems();
        if (data && Array.isArray(data) && data.length > 0) {
          updateItemsState(data);
        }
      } catch (err) {
        console.error("Failed to load inventory items:", err);
        setToast({
          type: "error",
          message: "Failed to load product items. Please refresh.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadItems();
  }, []);

  const handleAddNewItem = () => {
    setIsAddingItem(true);
  };

  const handleAddItem = async (newItemData) => {
    try {
      const result = await inventoryApi.createProduct(newItemData);
      const created = result?.product || {
        id: `itm-${Date.now()}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...newItemData,
      };

      updateItemsState((prev) => [created, ...prev]);
      setIsAddingItem(false);
      setToast({
        type: "success",
        message: `Product ${created.name || created.itemName || ""} added successfully`,
      });
    } catch (err) {
      console.error("Failed to create product item:", err);
      setToast({
        type: "error",
        message: err.message || "Failed to add product. Please try again.",
      });
    }
  };

  const applyItemUpdate = async (itemId, updatedData) => {
    try {
      const result = await inventoryApi.updateProduct(itemId, updatedData);
      const updated = result?.product || {
        ...updatedData,
        id: itemId,
        updatedAt: new Date().toISOString(),
      };

      updateItemsState((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, ...updated } : i))
      );

      setSelectedItem(null);
      setToast({
        type: "success",
        message: `Product ${updated.name || updated.itemName || ""} updated successfully`,
      });
    } catch (err) {
      console.error("Failed to update product item:", err);
      setToast({
        type: "error",
        message: err.message || "Failed to update product. Please try again.",
      });
    }
  };

  const handleUpdateItem = async (itemId, updatedData) => {
    const existing = items.find((i) => i.id === itemId);
    const wasInactive =
      existing && (existing.isActive === false || existing.status === "INACTIVE");
    const isBecomingActive =
      updatedData.isActive === true || updatedData.status === "ACTIVE";

    // Require password confirmation when making a deactivated item active again
    if (wasInactive && isBecomingActive) {
      setPendingReactivation({ itemId, updatedData });
      setShowReactivatePasswordModal(true);
      return;
    }

    await applyItemUpdate(itemId, updatedData);
  };

  const handleExecuteReactivate = async (adminPassword) => {
    if (!pendingReactivation) return;
    await inventoryApi.verifyAdminPassword(adminPassword);
    await applyItemUpdate(pendingReactivation.itemId, {
      ...pendingReactivation.updatedData,
      isActive: true,
    });
    setShowReactivatePasswordModal(false);
    setPendingReactivation(null);
    setToast({
      type: "success",
      message: "Product reactivated successfully",
    });
  };

  // Step 1 of Deactivate: Prompt confirmation modal
  const handleInitiateDeactivate = (item) => {
    setSelectedItem(null);
    setItemToDeactivate(item);
  };

  // Step 2 of Deactivate: Advance from DeactivateItemModal to AdminPasswordModal
  const handleConfirmDeactivatePrompt = () => {
    setShowDeletePasswordModal(true);
  };

  // Step 3 of Deactivate: Execute deactivation with confirmPassword
  const handleExecuteDeactivate = async (adminPassword) => {
    if (!itemToDeactivate) return;
    const targetId = itemToDeactivate.id;

    const result = await inventoryApi.deactivateProduct(targetId, {
      confirmPassword: adminPassword,
    });

    const updated = result?.product || {
      ...itemToDeactivate,
      isActive: false,
      status: "INACTIVE",
      updatedAt: new Date().toISOString(),
    };

    updateItemsState((prev) =>
      prev.map((i) => (i.id === targetId ? { ...i, ...updated } : i))
    );

    setShowDeletePasswordModal(false);
    setItemToDeactivate(null);
    setToast({
      type: "success",
      message: `Product ${itemToDeactivate.name || itemToDeactivate.itemName || ""} deactivated successfully`,
    });
  };

  // Processed search & multi-field filter rules
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Search filter (name, category, containerType)
      const q = searchTerm.toLowerCase().trim();
      const itemName = (item.name || item.itemName || "").toLowerCase();
      const itemCategory = (item.category || "").toLowerCase();
      const itemContainer = (item.containerType || "").toLowerCase();
      const matchesSearch =
        !q ||
        itemName.includes(q) ||
        itemCategory.includes(q) ||
        itemContainer.includes(q);

      // 2. Status filter
      const isItemActive =
        item.isActive !== undefined ? item.isActive : item.status === "ACTIVE";
      let matchesStatus = true;
      if (filters.status && filters.status !== "All") {
        if (filters.status === "Active") matchesStatus = isItemActive === true;
        if (filters.status === "Inactive") matchesStatus = isItemActive === false;
      }

      // 3. Category filter
      let matchesCategory = true;
      if (filters.category && filters.category !== "All Categories") {
        matchesCategory =
          itemCategory === filters.category.toLowerCase() ||
          itemContainer === filters.category.toLowerCase();
      }

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, searchTerm, filters]);

  return (
    <div className="p-6 md:p-8">
      <div className="w-full max-w-[1400px] mx-auto">
        {/* Header with Title & Add Item button */}
        <ItemHeader
          canCreate={canManage}
          onAddItem={handleAddNewItem}
        />

        {/* Controls: Search Bar, Active Filter Chips, Filter Dropdown */}
        <ItemControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeFilters={filters}
          onApplyFilters={setFilters}
          onClearCategory={() =>
            setFilters((prev) => ({ ...prev, category: "All Categories" }))
          }
          onClearStatus={() => setFilters((prev) => ({ ...prev, status: "" }))}
        />

        {/* Items Cards Grid */}
        {isLoading && items.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-500 font-medium">
            Loading products...
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-400 font-medium text-lg mb-2">
              No products found matching your criteria
            </p>
            <p className="text-gray-400 text-sm">
              Try adjusting your search query or active filters.
            </p>
          </div>
        )}

        {/* View / Edit Item Modal */}
        {selectedItem && (
          <ItemModal
            item={selectedItem}
            items={items}
            canManage={canManage}
            onClose={() => setSelectedItem(null)}
            onUpdate={handleUpdateItem}
            onDeleteClick={handleInitiateDeactivate}
          />
        )}

        {/* Add New Item Multi-step Wizard Modal */}
        {isAddingItem && (
          <ItemModal
            isAdding={true}
            items={items}
            canManage={canManage}
            onClose={() => setIsAddingItem(false)}
            onAdd={handleAddItem}
          />
        )}

        {/* Deactivate Confirmation Step 1 */}
        {itemToDeactivate && !showDeletePasswordModal && (
          <DeactivateItemModal
            item={itemToDeactivate}
            onConfirm={handleConfirmDeactivatePrompt}
            onClose={() => setItemToDeactivate(null)}
          />
        )}

        {/* Deactivate Password Verification Step 2 */}
        <AdminPasswordModal
          isOpen={showDeletePasswordModal}
          onClose={() => {
            setShowDeletePasswordModal(false);
            setItemToDeactivate(null);
          }}
          onSubmit={handleExecuteDeactivate}
        />

        {/* Reactivate Password Verification Modal */}
        <AdminPasswordModal
          isOpen={showReactivatePasswordModal}
          onClose={() => {
            setShowReactivatePasswordModal(false);
            setPendingReactivation(null);
          }}
          onSubmit={handleExecuteReactivate}
        />

        {/* Dynamic Toast Notifications */}
        {toast && (
          <ToastNotification
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}

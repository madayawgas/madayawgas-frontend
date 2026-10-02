// src/pages/ItemProfile/ItemProfile.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { Package, Layers } from "lucide-react";
import { inventoryApi } from "../../api/inventory.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";
import initialMockItems from "../../mocks/items.json";

import ItemHeader from "../../components/items/ItemHeader";
import ItemControls from "../../components/items/ItemControls";
import ItemCard from "../../components/items/ItemCard";
import ItemTable from "../../components/items/ItemTable";
import ItemDetailPanel from "../../components/items/ItemDetailPanel";
import ItemModal from "../../components/items/ItemModal";
import DeactivateItemModal from "../../components/items/DeactivateItemModal";
import AdminPasswordModal from "../../components/users/AdminPasswordModal";
import ToastNotification from "../../components/ui/ToastNotifications";

const LOCAL_STORAGE_KEY = "app_items_cache";
const VIEW_MODE_KEY = "app_items_view_mode";

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
    return Array.isArray(initialMockItems)
      ? initialMockItems
      : initialMockItems?.data?.products || [];
  });

  const [isLoading, setIsLoading] = useState(items.length === 0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Dual View Mode ('grid' | 'table')
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem(VIEW_MODE_KEY) || "grid";
    } catch {
      return "grid";
    }
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // ignore
    }
  };

  // Sorting state for table and grid
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  // Deactivation States
  const [itemToDeactivate, setItemToDeactivate] = useState(null);
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);

  // Reactivation States
  const [itemToReactivate, setItemToReactivate] = useState(null);
  const [showReactivatePasswordModal, setShowReactivatePasswordModal] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    category: "All Categories",
    containerType: "All",
  });

  // Toast Notification state
  const [toast, setToast] = useState(null);

  // Helper to sync state changes with localStorage
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

  const loadItems = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Keep selectedItem synced when items list updates
  useEffect(() => {
    if (selectedItem) {
      const fresh = items.find((i) => i.id === selectedItem.id);
      if (fresh) {
        setSelectedItem(fresh);
      }
    }
  }, [items, selectedItem]);

  // Add Item Handler
  const handleAddItem = async (newItemData) => {
    const result = await inventoryApi.createProduct(newItemData);
    const created = result?.product || {
      id: `itm-${Date.now()}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...newItemData,
    };

    updateItemsState((prev) => [created, ...prev]);
    setSelectedItem(created);
    setToast({
      type: "success",
      message: `Product ${created.name || created.itemName || ""} registered successfully`,
    });
  };

  // Update Item Handler
  const handleUpdateItem = async (itemId, updatedData) => {
    const result = await inventoryApi.updateProduct(itemId, updatedData);
    const updated = result?.product || {
      ...updatedData,
      id: itemId,
      updatedAt: new Date().toISOString(),
    };

    updateItemsState((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, ...updated } : i))
    );

    setSelectedItem(updated);
    setToast({
      type: "success",
      message: `Product ${updated.name || updated.itemName || ""} updated successfully`,
    });
  };

  // Deactivate Item Flow
  const handleInitiateDeactivate = (item) => {
    setItemToDeactivate(item);
  };

  const handleConfirmDeactivatePrompt = () => {
    setShowDeletePasswordModal(true);
  };

  const handleExecuteDeactivate = async (adminPassword) => {
    if (!itemToDeactivate) return;
    const targetId = itemToDeactivate.id;

    const result = await inventoryApi.deactivateProduct(targetId, {
      confirmPassword: adminPassword,
    });

    const updated = result?.product || {
      ...itemToDeactivate,
      isActive: false,
      updatedAt: new Date().toISOString(),
    };

    updateItemsState((prev) =>
      prev.map((i) => (i.id === targetId ? { ...i, ...updated } : i))
    );

    if (selectedItem?.id === targetId) {
      setSelectedItem(updated);
    }

    setShowDeletePasswordModal(false);
    setItemToDeactivate(null);
    setToast({
      type: "success",
      message: `Product ${itemToDeactivate.name || itemToDeactivate.itemName || ""} deactivated successfully`,
    });
  };

  // Reactivate Item Flow
  const handleInitiateReactivate = (item) => {
    setItemToReactivate(item);
    setShowReactivatePasswordModal(true);
  };

  const handleExecuteReactivate = async (adminPassword) => {
    if (!itemToReactivate) return;
    const targetId = itemToReactivate.id;

    await inventoryApi.verifyAdminPassword(adminPassword);
    const result = await inventoryApi.updateProduct(targetId, {
      isActive: true,
    });

    const updated = result?.product || {
      ...itemToReactivate,
      isActive: true,
      updatedAt: new Date().toISOString(),
    };

    updateItemsState((prev) =>
      prev.map((i) => (i.id === targetId ? { ...i, ...updated } : i))
    );

    if (selectedItem?.id === targetId) {
      setSelectedItem(updated);
    }

    setShowReactivatePasswordModal(false);
    setItemToReactivate(null);
    setToast({
      type: "success",
      message: `Product ${itemToReactivate.name || itemToReactivate.itemName || ""} reactivated successfully`,
    });
  };

  // Header Summary metrics
  const itemSummary = useMemo(() => {
    const total = items.length;
    const active = items.filter(
      (i) => (i.isActive !== undefined ? Boolean(i.isActive) : i.status === "ACTIVE")
    ).length;
    const inactive = total - active;
    const cylinders = items.filter((i) => {
      const type = (i.containerType || i.category || "").toUpperCase();
      return type.includes("CYLINDER") || type.includes("TANK");
    }).length;
    const canisters = items.filter((i) => {
      const type = (i.containerType || i.category || "").toUpperCase();
      return type.includes("CANISTER");
    }).length;

    return { total, active, inactive, cylinders, canisters };
  }, [items]);

  // Processed search, filter, and sorting
  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter((item) => {
      // 1. Search query
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
        item.isActive !== undefined
          ? Boolean(item.isActive)
          : (item.status || "").toUpperCase() === "ACTIVE";
      let matchesStatus = true;
      if (filters.status && filters.status !== "All") {
        if (filters.status.toUpperCase() === "ACTIVE") matchesStatus = isItemActive === true;
        if (filters.status.toUpperCase() === "INACTIVE") matchesStatus = isItemActive === false;
      }

      // 3. Container type filter
      let matchesContainer = true;
      if (filters.containerType && filters.containerType !== "All") {
        matchesContainer =
          (item.containerType || "").toUpperCase() === filters.containerType.toUpperCase();
      }

      // 4. Category filter
      let matchesCategory = true;
      if (filters.category && filters.category !== "All Categories") {
        const catQuery = filters.category.toLowerCase().trim();
        matchesCategory =
          itemCategory === catQuery ||
          itemContainer === catQuery ||
          (catQuery.includes("cylinder") &&
            (itemCategory.includes("cylinder") || itemContainer.includes("cylinder"))) ||
          (catQuery.includes("canister") &&
            (itemCategory.includes("canister") || itemContainer.includes("canister")));
      }

      return matchesSearch && matchesStatus && matchesContainer && matchesCategory;
    });

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === "name") {
          aVal = (a.name || a.itemName || "").toLowerCase();
          bVal = (b.name || b.itemName || "").toLowerCase();
        } else if (sortConfig.key === "category") {
          aVal = (a.category || "").toLowerCase();
          bVal = (b.category || "").toLowerCase();
        } else if (sortConfig.key === "containerType") {
          aVal = (a.containerType || "").toLowerCase();
          bVal = (b.containerType || "").toLowerCase();
        } else if (sortConfig.key === "netWeightKg") {
          aVal = Number(a.netWeightKg) || 0;
          bVal = Number(b.netWeightKg) || 0;
        } else if (sortConfig.key === "isActive") {
          aVal = a.isActive !== undefined ? Boolean(a.isActive) : a.status === "ACTIVE";
          bVal = b.isActive !== undefined ? Boolean(b.isActive) : b.status === "ACTIVE";
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [items, searchTerm, filters, sortConfig]);

  const hasActiveFilters = Boolean(
    searchTerm ||
    (filters.status && filters.status !== "All") ||
    (filters.containerType && filters.containerType !== "All") ||
    (filters.category && filters.category !== "All Categories")
  );

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilters({
      status: "",
      category: "All Categories",
      containerType: "All",
    });
  };

  return (
    <div className="h-[calc(100vh-112px)] md:h-[calc(100vh-128px)] flex flex-col overflow-hidden w-full max-w-[1600px] mx-auto text-left font-sans">
      {/* 1. STICKY TOP HEADER WITH SUMMARY BADGES */}
      <div className="shrink-0">
        <ItemHeader
          canCreate={canManage}
          onAddItem={() => setIsAddingItem(true)}
          itemSummary={itemSummary}
        />

        {/* 2. CONTROLS (SEARCH, FILTERS, VIEW MODE SWITCHER) */}
        <ItemControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClearSearch={() => setSearchTerm("")}
          activeFilters={filters}
          onApplyFilters={setFilters}
          onClearCategory={() =>
            setFilters((prev) => ({ ...prev, category: "All Categories" }))
          }
          onClearContainerType={() =>
            setFilters((prev) => ({ ...prev, containerType: "All" }))
          }
          onClearStatus={() => setFilters((prev) => ({ ...prev, status: "" }))}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
      </div>

      {/* 3. MAIN WORKSPACE (MASTER LIST/GRID + RIGHT DETAIL PANEL) */}
      <div className="flex-1 min-h-0 flex gap-4 overflow-hidden relative">
        {/* Left Side: Master Content (Cards or Table) */}
        <div className="flex-1 min-w-0 min-h-0 h-full flex flex-col overflow-hidden">
          {isLoading && items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 font-medium">
              Loading inventory products...
            </div>
          ) : filteredAndSortedItems.length > 0 ? (
            viewMode === "table" ? (
              <ItemTable
                items={filteredAndSortedItems}
                selectedItem={selectedItem}
                onSelectItem={setSelectedItem}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredAndSortedItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      isSelected={selectedItem?.id === item.id}
                      onClick={setSelectedItem}
                    />
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center bg-[#E8F3F8]/40 border border-dashed border-[#BCE1F1] rounded-2xl p-8">
              <div className="w-12 h-12 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center mb-3">
                <Package size={24} />
              </div>
              <p className="text-[#0A4B6E] font-bold text-base mb-1">
                No products found
              </p>
              <p className="text-[#6D8AA2] text-xs max-w-sm mb-4">
                {hasActiveFilters
                  ? "No products match your current search query or active filter criteria."
                  : "There are no catalog products registered in the system yet."}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="bg-[#0A4B6E] text-white hover:bg-[#083b57] text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer shadow-xs"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Slide-in Detail Panel */}
        {selectedItem && (
          <ItemDetailPanel
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onEdit={() => setEditingItem(selectedItem)}
            onDelete={handleInitiateDeactivate}
            onReactivate={handleInitiateReactivate}
            canManage={canManage}
          />
        )}
      </div>

      {/* ================= MODALS ================= */}

      {/* Add Item Modal (3-step Wizard) */}
      {isAddingItem && (
        <ItemModal
          isOpen={isAddingItem}
          isAdding={true}
          items={items}
          onClose={() => setIsAddingItem(false)}
          onAdd={handleAddItem}
        />
      )}

      {/* Edit Item Modal (3-step Wizard) */}
      {editingItem && (
        <ItemModal
          isOpen={Boolean(editingItem)}
          item={editingItem}
          isAdding={false}
          items={items}
          onClose={() => setEditingItem(null)}
          onUpdate={handleUpdateItem}
        />
      )}

      {/* Deactivate Step 1: Warning Modal */}
      {itemToDeactivate && !showDeletePasswordModal && (
        <DeactivateItemModal
          item={itemToDeactivate}
          onConfirm={handleConfirmDeactivatePrompt}
          onClose={() => setItemToDeactivate(null)}
        />
      )}

      {/* Deactivate Step 2: Password Verification Modal */}
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
          setItemToReactivate(null);
        }}
        onSubmit={handleExecuteReactivate}
      />

      {/* Toast Notifications */}
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

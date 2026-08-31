// src/pages/ItemProfile/ItemProfile.jsx
import { useState, useEffect, useMemo } from "react";
import { inventoryApi } from "../../api/inventory.js";
import { usersApi } from "../../api/users.js";
import { useAuth } from "../../context/AuthContext.jsx";
import initialMockItems from "../../mocks/items.json";

import ItemHeader from "../../components/items/ItemHeader";
import ItemControls from "../../components/items/ItemControls";
import ItemCard from "../../components/items/ItemCard";
import ItemModal from "../../components/items/ItemModal";
import DeactivateItemModal from "../../components/items/DeactivateItemModal";
import AdminPasswordModal from "../../components/users/AdminPasswordModal";
import SavedChangesToast from "../../components/ui/SavedChangesToast";

export default function ItemProfile() {
  const { user: currentUser } = useAuth();

  const [items, setItems] = useState(initialMockItems);
  const [selectedItem, setSelectedItem] = useState(null);

  // Deactivate States
  const [itemToDeactivate, setItemToDeactivate] = useState(null);
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);

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
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    async function loadItems() {
      try {
        const data = await inventoryApi.getInventoryItems();
        if (data && Array.isArray(data) && data.length > 0) {
          setItems(data);
        } else {
          setItems(initialMockItems);
        }
      } catch {
        setItems(initialMockItems);
      }
    }
    loadItems();
  }, []);

  const handleAddNewItem = () => {
    setIsAddingItem(true);
  };

  const handleAddItem = async (newItemData) => {
    const newItem = {
      id: `itm-${Date.now()}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...newItemData,
    };
    setItems((prev) => [newItem, ...prev]);
    setIsAddingItem(false);
    setShowToast(true);
  };

  const handleUpdateItem = async (itemId, updatedData) => {
    try {
      if (inventoryApi.updateStock) {
        await inventoryApi.updateStock(itemId, updatedData);
      }
    } catch {
      // Retain state update
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, ...updatedData, updatedAt: new Date().toISOString() } : i
      )
    );
    setSelectedItem(null);
    setShowToast(true);
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

  // Step 3 of Deactivate: Execute deactivation after admin password verification
  const handleExecuteDeactivate = async (adminPassword) => {
    if (!itemToDeactivate) return;
    const targetId = itemToDeactivate.id;

    await usersApi.verifyAdminPassword(adminPassword, currentUser?.username);

    setItems((prev) =>
      prev.map((i) =>
        i.id === targetId
          ? { ...i, isActive: false, status: "INACTIVE", updatedAt: new Date().toISOString() }
          : i
      )
    );

    setShowDeletePasswordModal(false);
    setItemToDeactivate(null);
    setShowToast(true);
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
      const isItemActive = item.isActive !== undefined ? item.isActive : item.status === "ACTIVE";
      let matchesStatus = true;
      if (filters.status && filters.status !== "All") {
        if (filters.status === "ACTIVE") matchesStatus = isItemActive === true;
        if (filters.status === "INACTIVE") matchesStatus = isItemActive === false;
      }

      // 3. Category filter
      let matchesCategory = true;
      if (filters.category && filters.category !== "All Categories") {
        matchesCategory =
          (item.category || "").toLowerCase() === filters.category.toLowerCase();
      }

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, searchTerm, filters]);


  return (
    <div className="p-6 md:p-8">
      <div className="w-full max-w-[1400px] mx-auto">
        {/* Header with Title & Add New Item button */}
        <ItemHeader onAddItem={handleAddNewItem} />

        {/* Controls: Search Bar, Active Filter Chips, Filter Dropdown in a single row */}
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
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id || item.itemCode}
                item={item}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-400 font-medium text-lg mb-2">
              No items found matching your criteria
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

        {/* Saved Changes Toast Notification */}
        {showToast && (
          <SavedChangesToast onClose={() => setShowToast(false)} />
        )}
      </div>
    </div>
  );
}


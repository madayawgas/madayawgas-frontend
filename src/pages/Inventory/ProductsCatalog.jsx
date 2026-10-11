// src/pages/Inventory/ProductsCatalog.jsx
import { useState, useEffect, useMemo, useCallback, useId } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  RotateCcw,
  Flame,
  CheckCircle2,
  X,
  AlertCircle,
} from "lucide-react";
import { inventoryApi } from "../../api/inventory.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";
import initialMockItems from "../../mocks/items.json";
import AdminPasswordModal from "../../components/users/AdminPasswordModal.jsx";
import ToastNotification from "../../components/ui/ToastNotifications.jsx";

const LOCAL_STORAGE_KEY = "app_items_cache";

export default function ProductsCatalog() {
  const searchInputId = useId();
  const productNameInputId = useId();
  const categoryInputId = useId();
  const netWeightInputId = useId();
  const { can } = useAuth();
  const canManage = can
    ? can(PERMISSIONS?.INVENTORY_MANAGE || "inventory.manage")
    : true;

  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return Array.isArray(initialMockItems)
      ? initialMockItems
      : initialMockItems?.data?.products || [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = creating
  const [formData, setFormData] = useState({
    name: "",
    category: "LPG Cylinder",
    containerType: "CYLINDER",
    netWeightKg: 11.0,
    isActive: true,
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deactivate / Reactivate with admin password
  const [pendingAction, setPendingAction] = useState(null); // { type: 'deactivate'|'reactivate', product }
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToastMessage = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await inventoryApi.getInventoryItems();
      const list = Array.isArray(res) ? res : res?.data?.products || [];
      if (list.length > 0) {
        setProducts(list);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Unique categories for filter
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set)];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
      if (statusFilter === "ACTIVE" && !p.isActive) return false;
      if (statusFilter === "INACTIVE" && p.isActive) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (p.name || "").toLowerCase().includes(q);
        const matchCat = (p.category || "").toLowerCase().includes(q);
        const matchType = (p.containerType || "").toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchType) return false;
      }
      return true;
    });
  }, [products, categoryFilter, statusFilter, searchTerm]);

  // Open Form Modal for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: "LPG Cylinder",
      containerType: "CYLINDER",
      netWeightKg: 11.0,
      isActive: true,
    });
    setFormError("");
    setFormModalOpen(true);
  };

  // Open Form Modal for Edit
  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name || "",
      category: p.category || "LPG Cylinder",
      containerType: p.containerType || "CYLINDER",
      netWeightKg: p.netWeightKg !== undefined ? p.netWeightKg : 11.0,
      isActive: p.isActive !== undefined ? p.isActive : true,
    });
    setFormError("");
    setFormModalOpen(true);
  };

  // Submit Product Form (Create or Edit)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Product name is required.");
      return;
    }
    if (Number(formData.netWeightKg) <= 0) {
      setFormError("Net weight must be greater than zero.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");

      if (editingProduct) {
        await inventoryApi.updateProduct(editingProduct.id, {
          name: formData.name.trim(),
          category: formData.category,
          containerType: formData.containerType,
          netWeightKg: Number(formData.netWeightKg),
          isActive: formData.isActive,
        });
        showToastMessage("Product updated successfully.");
      } else {
        await inventoryApi.createProduct({
          name: formData.name.trim(),
          category: formData.category,
          containerType: formData.containerType,
          netWeightKg: Number(formData.netWeightKg),
          isActive: formData.isActive,
        });
        showToastMessage("New product created successfully.");
      }

      setFormModalOpen(false);
      await fetchProducts();
    } catch (err) {
      setFormError(err?.message || "Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deactivate / Reactivate Trigger
  const handleTriggerDeactivate = (product) => {
    setPendingAction({ type: "deactivate", product });
    setShowPasswordModal(true);
  };

  const handleTriggerReactivate = (product) => {
    setPendingAction({ type: "reactivate", product });
    setShowPasswordModal(true);
  };

  // Execute Password Confirmation
  const handleConfirmPassword = async (adminPassword) => {
    if (!pendingAction) return;
    const { type, product } = pendingAction;

    if (type === "deactivate") {
      await inventoryApi.deactivateProduct(product.id, { confirmPassword: adminPassword });
      showToastMessage(`Product "${product.name}" deactivated.`);
    } else {
      await inventoryApi.reactivateProduct(product.id, { confirmPassword: adminPassword });
      showToastMessage(`Product "${product.name}" reactivated.`);
    }

    setShowPasswordModal(false);
    setPendingAction(null);
    await fetchProducts();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#F8FAFC]">
      {/* Header Banner */}
      <header className="shrink-0 bg-white border-b border-[#E2E8F0] px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏷️</span>
              <h1 className="text-xl font-bold text-[#0A4B6E]">Products Catalog</h1>
            </div>
            <p className="text-xs text-[#6D8AA2] mt-0.5">
              Manage LPG cylinders, butane canisters, and product specifications
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canManage && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-[#FFDF2C] text-[#0A4B6E] hover:bg-[#ebd024] shadow-xs transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Product</span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchProducts}
              disabled={isLoading}
              title="Refresh products list"
              className="p-2 text-[#6D8AA2] hover:text-[#0A4B6E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-[#F1F5F9]">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Tabs */}
            <div className="flex items-center bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-0.5 text-xs">
              {["ALL", "ACTIVE", "INACTIVE"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-white text-[#0A4B6E] shadow-2xs"
                      : "text-[#6D8AA2] hover:text-[#0A4B6E]"
                  }`}
                >
                  {st === "ALL" ? "All" : st === "ACTIVE" ? "Active" : "Inactive"}
                </button>
              ))}
            </div>

            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#0A4B6E] font-medium"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative sm:w-64">
            <label htmlFor={searchInputId} className="sr-only">Search products by name or category</label>
            <input
              id={searchInputId}
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0A4B6E] placeholder-[#6D8AA2]/70 focus:outline-hidden focus:border-[#0A4B6E] focus:bg-white transition-all"
            />
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6D8AA2]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Table */}
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col p-6">
        <div className="flex-1 min-h-0 bg-white border border-[#E2E8F0] rounded-xl flex flex-col overflow-hidden shadow-2xs">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#F8FAFC] border-b border-[#E2E8F0] z-10 text-[#6D8AA2] font-semibold select-none">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Container Type</th>
                  <th className="py-3 px-4 text-right">Net Weight</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {canManage && <th className="py-3 px-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[#0A4B6E]">
                {isLoading && products.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="py-16 text-center text-[#6D8AA2]">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#0A4B6E]" />
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="py-16 text-center text-[#6D8AA2]">
                      <Package size={24} className="mx-auto mb-2 text-[#CBD5E1]" />
                      <p className="font-semibold text-[#0A4B6E]">No Products Found</p>
                      <p className="text-[11px] mt-0.5">
                        {searchTerm
                          ? "No items match your search filter."
                          : "No product catalog items registered."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isCylinder = p.containerType === "CYLINDER";
                    return (
                      <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                        {/* Name */}
                        <td className="py-3 px-4 font-bold text-[#0A4B6E]">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center shrink-0">
                              {isCylinder ? <Flame size={13} /> : <Package size={13} />}
                            </div>
                            <span>{p.name}</span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 text-[#6D8AA2] font-medium">
                          {p.category || "Uncategorized"}
                        </td>

                        {/* Container Type */}
                        <td className="py-3 px-4 text-[#0A4B6E]">
                          {isCylinder ? "Cylinder" : "Canister"}
                        </td>

                        {/* Net Weight */}
                        <td className="py-3 px-4 text-right font-medium">
                          {p.netWeightKg} kg
                        </td>

                        {/* Status (Clean, subtle presentation - no AI slop) */}
                        <td className="py-3 px-4 text-center">
                          {p.isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        {canManage && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(p)}
                                title="Edit product"
                                className="p-1.5 text-[#0A4B6E] hover:bg-[#E8F3F8] rounded-md transition-colors cursor-pointer"
                              >
                                <Edit2 size={13} />
                              </button>

                              {p.isActive ? (
                                <button
                                  type="button"
                                  onClick={() => handleTriggerDeactivate(p)}
                                  title="Deactivate product"
                                  className="p-1.5 text-[#C93B32] hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleTriggerReactivate(p)}
                                  title="Reactivate product"
                                  className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                                >
                                  <RotateCcw size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Minimal footer count */}
          <div className="shrink-0 px-4 py-2.5 bg-[#F8FBFC] border-t border-[#E2E8F0] text-xs text-[#6D8AA2] flex justify-between">
            <span>Showing {filteredProducts.length} of {products.length} products</span>
          </div>
        </div>
      </main>

      {/* Single-Step Add/Edit Product Modal */}
      {formModalOpen && (
        <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#CBD5E1] max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#E8F3F8] text-[#0A4B6E]">
                  <Package size={16} />
                </div>
                <h2 className="text-sm font-bold text-[#0A4B6E]">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-[#C93B32] flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor={productNameInputId} className="block font-semibold text-[#0A4B6E] mb-1">
                  Product Name <span className="text-[#C93B32]">*</span>
                </label>
                <input
                  id={productNameInputId}
                  type="text"
                  placeholder="e.g. Butane Canister 250g or LPG 11kg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#0A4B6E] focus:outline-hidden focus:border-[#0A4B6E] focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={categoryInputId} className="block font-semibold text-[#0A4B6E] mb-1">
                    Category
                  </label>
                  <input
                    id={categoryInputId}
                    type="text"
                    placeholder="e.g. LPG Cylinder"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#0A4B6E] focus:outline-hidden focus:border-[#0A4B6E] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#0A4B6E] mb-1">
                    Container Type
                  </label>
                  <select
                    value={formData.containerType}
                    onChange={(e) =>
                      setFormData({ ...formData, containerType: e.target.value })
                    }
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#0A4B6E] focus:outline-hidden focus:border-[#0A4B6E]"
                  >
                    <option value="CYLINDER">Cylinder</option>
                    <option value="CANISTER">Canister</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor={netWeightInputId} className="block font-semibold text-[#0A4B6E] mb-1">
                  Net Weight (kg) <span className="text-[#C93B32]">*</span>
                </label>
                <input
                  id={netWeightInputId}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.netWeightKg}
                  onChange={(e) => setFormData({ ...formData, netWeightKg: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#0A4B6E] focus:outline-hidden focus:border-[#0A4B6E] focus:bg-white"
                  required
                />
              </div>

              {editingProduct && (
                <div className="pt-1 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActiveProduct"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-[#0A4B6E] focus:ring-[#0A4B6E]"
                  />
                  <label htmlFor="isActiveProduct" className="text-xs text-[#0A4B6E] font-medium cursor-pointer">
                    Product is active for distribution
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-[#6D8AA2] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-[#0A4B6E] bg-[#FFDF2C] hover:bg-[#ebd024] rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Password Modal for Deactivate / Reactivate */}
      <AdminPasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPendingAction(null);
        }}
        onSubmit={handleConfirmPassword}
      />

      {/* Toast Feedback */}
      {toast.show && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}

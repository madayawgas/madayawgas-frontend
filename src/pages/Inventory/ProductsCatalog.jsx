// src/pages/Inventory/ProductsCatalog.jsx
import { useState, useEffect, useMemo, useCallback, useId } from "react";
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  RotateCcw,
  Flame,
  CheckCircle2,
  X,
  AlertCircle,
  Eye,
  Info,
  Calendar,
  Layers,
} from "lucide-react";
import { inventoryApi } from "../../api/inventory.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";
import AdminPasswordModal from "../../components/users/AdminPasswordModal.jsx";
import ToastNotification from "../../components/ui/ToastNotifications.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import SideDrawer from "../../components/ui/SideDrawer.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";

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
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // SideDrawer selected product
  const [selectedProduct, setSelectedProduct] = useState(null);

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
      if (Array.isArray(list)) {
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

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  // Paginated slice
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredProducts.slice(start, start + limit);
  }, [filteredProducts, page, limit]);

  const totalPages = Math.ceil(filteredProducts.length / limit) || 1;

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
        if (selectedProduct?.id === editingProduct.id) {
          setSelectedProduct((prev) => ({
            ...prev,
            name: formData.name.trim(),
            category: formData.category,
            containerType: formData.containerType,
            netWeightKg: Number(formData.netWeightKg),
            isActive: formData.isActive,
          }));
        }
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
      try {
        localStorage.removeItem("app_plant_stock_cache");
      } catch {
        // ignore
      }
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
      if (selectedProduct?.id === product.id) {
        setSelectedProduct((prev) => ({ ...prev, isActive: false }));
      }
    } else {
      await inventoryApi.reactivateProduct(product.id, { confirmPassword: adminPassword });
      showToastMessage(`Product "${product.name}" reactivated.`);
      if (selectedProduct?.id === product.id) {
        setSelectedProduct((prev) => ({ ...prev, isActive: true }));
      }
    }

    try {
      localStorage.removeItem("app_plant_stock_cache");
    } catch {
      // ignore
    }

    setShowPasswordModal(false);
    setPendingAction(null);
    await fetchProducts();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#F8FAFC]">
      {/* Top Controls Header */}
      <header className="shrink-0 bg-white border-b border-[#E2E8F0] px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Tabs */}
            <div className="flex items-center bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-0.5 text-xs">
              {["ALL", "ACTIVE", "INACTIVE"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-white text-[#0A4B6E] shadow-2xs font-bold"
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
              className="text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-[#0A4B6E] font-medium focus:outline-hidden focus:border-[#0A4B6E]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Categories" : c}
                </option>
              ))}
            </select>

            {/* Search Box */}
            <div className="relative sm:w-60">
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManage && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-[#FFDF2C] text-[#0A4B6E] hover:bg-[#ebd024] shadow-2xs transition-all cursor-pointer tracking-wider uppercase text-[11px]"
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
      </header>

      {/* Main Table Area */}
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col p-6">
        <div className="flex-1 min-h-0 bg-white border border-[#CBD5E1] rounded-2xl flex flex-col overflow-hidden shadow-2xs">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#0D4B6E] text-white text-xs md:text-sm z-10 shadow-xs select-none">
                <tr>
                  <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">Product Name</th>
                  <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">Category</th>
                  <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">Container Type</th>
                  <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap text-right">Net Weight</th>
                  <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap text-center">Status</th>
                  <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
                {isLoading && products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-[#6D8AA2]">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#0A4B6E]" />
                      Loading products...
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-[#6D8AA2]">
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
                  paginatedProducts.map((p) => {
                    const isCylinder = p.containerType === "CYLINDER";
                    const isSelected = selectedProduct?.id === p.id;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#E2EDF3] hover:bg-[#E2EDF3]"
                            : "hover:bg-[#F4F9FC]"
                        }`}
                      >
                        {/* Name */}
                        <td className="py-3 px-4 font-bold text-[#0A4B6E]">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center shrink-0">
                              {isCylinder ? <Flame size={14} /> : <Package size={14} />}
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
                          <Badge variant="neutral">
                            {isCylinder ? "Cylinder" : "Canister"}
                          </Badge>
                        </td>

                        {/* Net Weight */}
                        <td className="py-3 px-4 text-right font-medium">
                          {p.netWeightKg} kg
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <Badge variant={p.isActive ? "active" : "deactivated"}>
                            {p.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedProduct(p)}
                              title="Inspect product"
                              className="p-1.5 text-[#0A4B6E] hover:bg-[#E8F3F8] rounded-md transition-colors cursor-pointer"
                            >
                              <Eye size={14} />
                            </button>

                            {canManage && (
                              <>
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
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Standard Pagination Footer */}
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            itemLabel="products"
          />
        </div>
      </main>

      {/* Universal SideDrawer for Product Inspection */}
      <SideDrawer
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name || "Product Details"}
        subtitle={selectedProduct?.category || "Inventory Product"}
        icon={Package}
        footer={
          <div className="flex items-center justify-between w-full">
            {canManage && selectedProduct && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(selectedProduct)}
                >
                  <Edit2 size={13} className="mr-1" />
                  Edit
                </Button>
                {selectedProduct.isActive ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleTriggerDeactivate(selectedProduct)}
                  >
                    <Trash2 size={13} className="mr-1" />
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleTriggerReactivate(selectedProduct)}
                  >
                    <RotateCcw size={13} className="mr-1" />
                    Reactivate
                  </Button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="ml-auto px-5 py-2 text-xs font-bold text-[#0A4B6E] bg-[#FFDF2C] hover:bg-[#ebd024] rounded-lg cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedProduct && (
          <div className="space-y-5 text-xs text-[#0A4B6E]">
            {/* Header info badge */}
            <div className="bg-[#E8F3F8] rounded-xl p-4 border border-[#0A4B6E]/15 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white text-[#0A4B6E] flex items-center justify-center font-bold shadow-xs">
                  {selectedProduct.containerType === "CYLINDER" ? (
                    <Flame size={20} />
                  ) : (
                    <Package size={20} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0A4B6E]">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-[11px] text-[#6D8AA2]">
                    {selectedProduct.category || "Uncategorized"}
                  </p>
                </div>
              </div>
              <Badge variant={selectedProduct.isActive ? "active" : "deactivated"}>
                {selectedProduct.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            {/* Specifications Card */}
            <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#6D8AA2]">
                Product Specifications
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-slate-100">
                  <span className="text-[11px] text-[#6D8AA2] block">Container Type</span>
                  <span className="font-semibold text-[#0A4B6E] capitalize">
                    {selectedProduct.containerType?.toLowerCase() || "—"}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-slate-100">
                  <span className="text-[11px] text-[#6D8AA2] block">Net Weight</span>
                  <span className="font-semibold text-[#0A4B6E]">
                    {selectedProduct.netWeightKg} kg
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-slate-100 col-span-2">
                  <span className="text-[11px] text-[#6D8AA2] block">System ID</span>
                  <span className="font-mono text-[10px] text-slate-500 break-all">
                    {selectedProduct.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            {(selectedProduct.createdAt || selectedProduct.updatedAt) && (
              <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 space-y-2 text-xs">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#6D8AA2]">
                  System Metadata
                </h4>
                {selectedProduct.createdAt && (
                  <div className="flex justify-between py-1 text-slate-500">
                    <span>Created</span>
                    <span className="font-medium text-[#0A4B6E]">
                      {new Date(selectedProduct.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {selectedProduct.updatedAt && (
                  <div className="flex justify-between py-1 text-slate-500">
                    <span>Last Updated</span>
                    <span className="font-medium text-[#0A4B6E]">
                      {new Date(selectedProduct.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </SideDrawer>

      {/* Single-Step Add/Edit Product Modal */}
      {formModalOpen && (
        <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
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

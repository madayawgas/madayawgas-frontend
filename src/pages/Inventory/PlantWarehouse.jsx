// src/pages/Inventory/PlantWarehouse.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { Package, Flame } from "lucide-react";
import { inventoryApi } from "../../api/inventory.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh.js";

// Components
import PlantWarehouseHeader from "../../components/items/plant/PlantWarehouseHeader.jsx";
import PlantWarehouseControls from "../../components/items/plant/PlantWarehouseControls.jsx";
import PlantWarehouseTable from "../../components/items/plant/PlantWarehouseTable.jsx";
import PlantWarehouseCards from "../../components/items/plant/PlantWarehouseCards.jsx";
import PlantStockDetailPanel from "../../components/items/plant/PlantStockDetailPanel.jsx";
import PlantStockAdjustmentModal from "../../components/items/plant/PlantStockAdjustmentModal.jsx";
import SideDrawer from "../../components/ui/SideDrawer.jsx";
import ToastNotification from "../../components/ui/ToastNotifications.jsx";

const PLANT_CACHE_KEY = "app_plant_stock_cache";
const VIEW_MODE_CACHE_KEY = "app_plant_view_mode";

/**
 * PlantWarehouse — Canonical Bunawan Terminal Bulk Yard Inventory Workspace.
 * 
 * Conforms to AGENTS.md and universal OMS standards:
 * - Pinned Header & Controls with operational metric summary pills.
 * - Search by product name/category & popover filter dropdown.
 * - Full-width layout with dual view modes: High-density Table vs Tactile Cards.
 * - Slide-over SideDrawer for detailed inspection (does not squish/shrink the table).
 * - Streamlined 3-Step Stock Adjustment Wizard.
 * - Real-time WebSocket synchronization via useRealtimeRefresh.
 */
export default function PlantWarehouse() {
  const { can } = useAuth();
  const canManage = can
    ? (can(PERMISSIONS?.INVENTORY_MANAGE || "inventory.manage"))
    : false;

  // Yard stock list state (initialized from localStorage cache)
  const [plantStock, setPlantStock] = useState(() => {
    try {
      const cached = localStorage.getItem(PLANT_CACHE_KEY);
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

  // Filters & View State
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    containerType: "ALL", // 'ALL' | 'CANISTER' | 'CYLINDER'
    stockLevel: "ALL",    // 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'HAS_DEFECTIVE' | 'HAS_EMPTY'
  });

  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem(VIEW_MODE_CACHE_KEY) || "cards";
    } catch {
      return "cards";
    }
  });

  // Selected Item for SideDrawer Inspection
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Modals State
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentTargetProduct, setAdjustmentTargetProduct] = useState(null);
  const [adjustmentInitialCondition, setAdjustmentInitialCondition] = useState("FILLED");

  // Toast notifications (null when not showing)
  const [toast, setToast] = useState(null); // { message: string, type: string }

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // Fetch yard stock from API
  const fetchStock = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await inventoryApi.getPlantInventory();
      const list = Array.isArray(res) ? res : res?.data?.inventory || [];
      if (Array.isArray(list)) {
        setPlantStock(list);
        try {
          localStorage.setItem(PLANT_CACHE_KEY, JSON.stringify(list));
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error("Failed to fetch plant stock:", err);
      showToast("Unable to load plant stock from server", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Real-time WebSocket synchronization
  useRealtimeRefresh({
    events: ["PLANT_STOCK_UPDATED", "TRIP_RECONCILIATION_UPDATED"],
    cacheKeysToInvalidate: [PLANT_CACHE_KEY],
    onRefresh: fetchStock,
  });

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  // Keep selectedProduct synchronized with fresh data from plantStock
  useEffect(() => {
    if (selectedProduct) {
      const sId = selectedProduct.productId || selectedProduct.product_id || selectedProduct.id;
      const fresh = plantStock.find(
        (p) => (p.productId || p.product_id || p.id) === sId
      );
      if (fresh) {
        setSelectedProduct(fresh);
      }
    }
  }, [plantStock]);

  // Metric aggregates for top header
  const metrics = useMemo(() => {
    let totalFilled = 0;
    let totalEmpty = 0;
    let totalDefective = 0;
    let cratesFilled = 0;
    let cratesEmpty = 0;

    plantStock.forEach((p) => {
      const qF = Number(p.quantityFilled ?? p.quantity_filled ?? 0);
      const qE = Number(p.quantityEmptyGood ?? p.quantity_empty_good ?? 0);
      const qD = Number(p.quantityDefective ?? p.quantity_defective ?? 0);
      const isCanister = (p.containerType || p.container_type) === "CANISTER";

      totalFilled += qF;
      totalEmpty += qE;
      totalDefective += qD;

      if (isCanister) {
        cratesFilled += Math.floor(qF / 24);
        cratesEmpty += Math.floor(qE / 24);
      }
    });

    return {
      totalFilled,
      totalEmpty,
      totalDefective,
      totalUnits: totalFilled + totalEmpty + totalDefective,
      cratesFilled,
      cratesEmpty,
    };
  }, [plantStock]);

  // Filtered product stock based on search, container type, and stock level
  const filteredStock = useMemo(() => {
    let list = plantStock;

    // 1. Container Type filter
    if (filters.containerType && filters.containerType !== "ALL") {
      list = list.filter((p) => {
        const cType = (p.containerType || p.container_type || "CYLINDER").toUpperCase();
        return cType === filters.containerType;
      });
    }

    // 2. Stock Level filter
    if (filters.stockLevel && filters.stockLevel !== "ALL") {
      list = list.filter((p) => {
        const qF = Number(p.quantityFilled ?? p.quantity_filled ?? 0);
        const qE = Number(p.quantityEmptyGood ?? p.quantity_empty_good ?? 0);
        const qD = Number(p.quantityDefective ?? p.quantity_defective ?? 0);
        const total = qF + qE + qD;

        switch (filters.stockLevel) {
          case "IN_STOCK":
            return total > 0;
          case "LOW_STOCK":
            return qF < 100;
          case "HAS_DEFECTIVE":
            return qD > 0;
          case "HAS_EMPTY":
            return qE > 0;
          default:
            return true;
        }
      });
    }

    // 3. Search query
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((p) => {
        const name = (p.productName || p.product_name || "").toLowerCase();
        const cat = (p.category || "").toLowerCase();
        return name.includes(term) || cat.includes(term);
      });
    }

    return list;
  }, [plantStock, filters, searchTerm]);

  // Selection toggle for SideDrawer
  const handleSelectProduct = useCallback((product) => {
    if (!product) {
      setSelectedProduct(null);
      return;
    }
    const currentId = selectedProduct
      ? selectedProduct.productId || selectedProduct.product_id || selectedProduct.id
      : null;
    const newId = product.productId || product.product_id || product.id;
    if (currentId === newId) {
      setSelectedProduct(null);
    } else {
      setSelectedProduct(product);
    }
  }, [selectedProduct]);

  // View mode switcher with persistence
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_CACHE_KEY, mode);
    } catch {
      // ignore
    }
  }, []);

  // Filter setters
  const handleApplyFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const handleClearContainerType = useCallback(() => {
    setFilters((prev) => ({ ...prev, containerType: "ALL" }));
  }, []);

  const handleClearStockLevel = useCallback(() => {
    setFilters((prev) => ({ ...prev, stockLevel: "ALL" }));
  }, []);

  // Modal opening helper
  const handleOpenAdjustment = useCallback((maybeItemOrCondition = null, maybeCondition = "FILLED") => {
    let targetId = null;
    let cond = "FILLED";

    if (maybeItemOrCondition && typeof maybeItemOrCondition === "object") {
      targetId = maybeItemOrCondition.productId || maybeItemOrCondition.product_id || maybeItemOrCondition.id;
      if (typeof maybeCondition === "string") cond = maybeCondition;
    } else if (typeof maybeItemOrCondition === "string") {
      cond = maybeItemOrCondition;
    }

    setAdjustmentTargetProduct(targetId);
    setAdjustmentInitialCondition(cond);
    setShowAdjustmentModal(true);
  }, []);

  // Success handler for stock adjustments
  const handleAdjustmentSuccess = useCallback((receipt) => {
    fetchStock();
    showToast(
      receipt?.message || "Plant stock adjustment processed successfully.",
      "success"
    );
  }, [fetchStock, showToast]);

  const selectedProductId = selectedProduct
    ? (selectedProduct.productId || selectedProduct.product_id || selectedProduct.id)
    : null;

  const isSelectedCanister = (selectedProduct?.containerType || selectedProduct?.container_type) === "CANISTER";
  const selectedWeight = selectedProduct?.netWeightKg !== undefined ? selectedProduct?.netWeightKg : selectedProduct?.net_weight_kg;

  return (
    <div className="h-full flex flex-col overflow-hidden min-w-0">
      {/* 1. PINNED TOP HEADER */}
      <div className="shrink-0">
        <PlantWarehouseHeader
          metrics={metrics}
          onOpenAdjustmentModal={() => handleOpenAdjustment()}
          canManage={canManage}
          onRefresh={fetchStock}
          isLoading={isLoading}
        />
      </div>

      {/* 2. PINNED CONTROLS BAR */}
      <div className="shrink-0">
        <PlantWarehouseControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClearSearch={() => setSearchTerm("")}
          filters={filters}
          onApplyFilters={handleApplyFilters}
          onClearContainerType={handleClearContainerType}
          onClearStockLevel={handleClearStockLevel}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
      </div>

      {/* 3. MAIN CONTENT: FULL-WIDTH TABLE OR CARDS (NO TABLE SQUISHING) */}
      <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden">
        {viewMode === "table" ? (
          <PlantWarehouseTable
            items={filteredStock}
            selectedProductId={selectedProductId}
            onSelectProduct={handleSelectProduct}
            onAdjustProduct={(item) => handleOpenAdjustment(item)}
            canManage={canManage}
          />
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
            <PlantWarehouseCards
              items={filteredStock}
              selectedProductId={selectedProductId}
              onSelectProduct={handleSelectProduct}
              onAdjustProduct={(item) => handleOpenAdjustment(item)}
              canManage={canManage}
            />
          </div>
        )}
      </div>

      {/* 4. UNIVERSAL SIDEDRAWER FOR PRODUCT INSPECTION */}
      <SideDrawer
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.productName || selectedProduct?.product_name || "Product Stock Details"}
        subtitle={`${isSelectedCanister ? "Butane Canister" : "LPG Cylinder"} · ${selectedWeight ?? 0} kg · Bunawan Yard`}
        icon={isSelectedCanister ? Package : Flame}
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1]">
            YARD BULK
          </span>
        }
        width="max-w-md sm:max-w-lg"
        footer={
          <button
            type="button"
            onClick={() => setSelectedProduct(null)}
            className="w-full py-2.5 px-4 rounded-full text-xs font-bold bg-[#FFDF2C] text-[#0A4B6E] hover:bg-[#ebd024] transition-all cursor-pointer shadow-2xs text-center uppercase tracking-wider active:scale-95"
          >
            CLOSE
          </button>
        }
      >
        {selectedProduct && (
          <PlantStockDetailPanel
            product={selectedProduct}
            onOpenAdjustment={(prod) => {
              setSelectedProduct(null);
              handleOpenAdjustment(prod);
            }}
            canManage={canManage}
          />
        )}
      </SideDrawer>

      {/* 5. MODALS & TOAST NOTIFICATIONS */}
      <PlantStockAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        plantStock={plantStock}
        defaultProductId={adjustmentTargetProduct}
        initialCondition={adjustmentInitialCondition}
        onAdjustmentSuccess={handleAdjustmentSuccess}
      />

      {/* Conditionally mounted ToastNotification with reliable dismiss */}
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

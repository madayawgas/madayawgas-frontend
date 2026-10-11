// src/pages/Inventory/PlantWarehouse.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Package,
  Layers,
  Download,
  AlertOctagon,
  Scale,
  RefreshCw,
  Flame,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { inventoryApi } from "../../api/inventory.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";
import initialMockPlantInventory from "../../mocks/plant-inventory.json";
import SupplierRestockModal from "../../components/items/plant/SupplierRestockModal.jsx";
import QuarantineDefectsModal from "../../components/items/plant/QuarantineDefectsModal.jsx";
import ToastNotification from "../../components/ui/ToastNotifications.jsx";

const PLANT_CACHE_KEY = "app_plant_stock_cache";

export default function PlantWarehouse() {
  const { can } = useAuth();
  const canManage = can
    ? can(PERMISSIONS?.INVENTORY_MANAGE || "inventory.manage")
    : true;

  const [plantStock, setPlantStock] = useState(() => {
    try {
      const cached = localStorage.getItem(PLANT_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return initialMockPlantInventory?.data?.inventory || [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [activeRestockProductId, setActiveRestockProductId] = useState(null);
  const [showQuarantineModal, setShowQuarantineModal] = useState(false);
  const [activeQuarantineProductId, setActiveQuarantineProductId] = useState(null);

  // Morning Loading Guide state
  const [showLoadingGuide, setShowLoadingGuide] = useState(false);
  const [guideTruckCount, setGuideTruckCount] = useState(3);
  const [guideProductId, setGuideProductId] = useState("");

  // Toast feedback
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToastMessage = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
  }, []);

  const fetchStock = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await inventoryApi.getPlantInventory();
      const list = Array.isArray(res) ? res : res?.data?.inventory || [];
      if (list.length > 0) {
        setPlantStock(list);
        try {
          localStorage.setItem(PLANT_CACHE_KEY, JSON.stringify(list));
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error("Failed to fetch plant stock:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  // Set default product for loading guide once stock loads
  useEffect(() => {
    if (plantStock.length > 0 && !guideProductId) {
      setGuideProductId(plantStock[0].productId);
    }
  }, [plantStock, guideProductId]);

  // Overall metrics
  const totals = useMemo(() => {
    return plantStock.reduce(
      (acc, p) => ({
        filled: acc.filled + (p.quantityFilled ?? p.quantity_filled ?? 0),
        empty: acc.empty + (p.quantityEmptyGood ?? p.quantity_empty_good ?? 0),
        defective: acc.defective + (p.quantityDefective ?? p.quantity_defective ?? 0),
      }),
      { filled: 0, empty: 0, defective: 0 }
    );
  }, [plantStock]);

  // Handle Restock submit
  const handleRestock = async (payload) => {
    await inventoryApi.restockPlant(payload);
    await fetchStock();
    showToastMessage("Supplier stock successfully received and logged.");
  };

  // Handle Quarantine submit
  const handleQuarantine = async (payload) => {
    await inventoryApi.quarantineDefects(payload);
    await fetchStock();
    showToastMessage("Defective items quarantined successfully.");
  };

  // Morning Loading Guide calculation
  const guideSelectedProduct = useMemo(() => {
    return (
      plantStock.find((p) => p.productId === guideProductId) ||
      plantStock[0] ||
      null
    );
  }, [plantStock, guideProductId]);

  const guideSplit = useMemo(() => {
    if (!guideSelectedProduct) return null;
    const available = guideSelectedProduct.quantityFilled || 0;
    const trucks = Math.max(1, Number(guideTruckCount) || 1);
    const unitsPerTruck = Math.floor(available / trucks);
    const cratesPerTruck =
      guideSelectedProduct.containerType === "CANISTER"
        ? Math.floor(unitsPerTruck / 24)
        : null;
    const remainder = available % trucks;
    return {
      available,
      trucks,
      unitsPerTruck,
      cratesPerTruck,
      remainder,
    };
  }, [guideSelectedProduct, guideTruckCount]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#F8FAFC]">
      {/* Header Banner */}
      <header className="shrink-0 bg-white border-b border-[#E2E8F0] px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏭</span>
              <h1 className="text-xl font-bold text-[#0A4B6E]">Plant Warehouse</h1>
            </div>
            <p className="text-xs text-[#6D8AA2] mt-0.5">
              Daily Bunawan yard inventory tracking across conditions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLoadingGuide(!showLoadingGuide)}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                showLoadingGuide
                  ? "bg-[#0A4B6E] text-white border-[#0A4B6E]"
                  : "bg-white text-[#0A4B6E] border-[#CBD5E1] hover:bg-slate-50"
              }`}
            >
              <Scale size={14} />
              <span>Morning Loading Guide</span>
            </button>

            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveQuarantineProductId(null);
                    setShowQuarantineModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-[#CBD5E1] text-[#C93B32] hover:bg-rose-50 transition-all cursor-pointer"
                >
                  <AlertOctagon size={14} />
                  <span>Mark Defective Stock</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveRestockProductId(null);
                    setShowRestockModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-[#FFDF2C] text-[#0A4B6E] hover:bg-[#ebd024] shadow-xs transition-all cursor-pointer"
                >
                  <Download size={14} />
                  <span>Receive Supplier Stock</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={fetchStock}
              disabled={isLoading}
              title="Refresh warehouse stock"
              className="p-2 text-[#6D8AA2] hover:text-[#0A4B6E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Minimal Summary Metrics Strip */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-[#F1F5F9]">
          <div className="bg-[#F8FAFC] rounded-lg p-2.5 border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#6D8AA2] uppercase tracking-wide block">
                Filled Stock (Sale-Ready)
              </span>
              <span className="text-base font-bold text-emerald-700">
                {totals.filled.toLocaleString()}{" "}
                <span className="text-xs font-normal text-emerald-600">units</span>
              </span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>

          <div className="bg-[#F8FAFC] rounded-lg p-2.5 border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#6D8AA2] uppercase tracking-wide block">
                Empty Good Returns
              </span>
              <span className="text-base font-bold text-[#0A4B6E]">
                {totals.empty.toLocaleString()}{" "}
                <span className="text-xs font-normal text-[#6D8AA2]">units</span>
              </span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#0A4B6E]" />
          </div>

          <div className="bg-[#F8FAFC] rounded-lg p-2.5 border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#6D8AA2] uppercase tracking-wide block">
                Quarantined Defective
              </span>
              <span className="text-base font-bold text-[#C93B32]">
                {totals.defective.toLocaleString()}{" "}
                <span className="text-xs font-normal text-rose-500">units</span>
              </span>
            </div>
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                totals.defective > 0 ? "bg-[#C93B32]" : "bg-slate-300"
              }`}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* Morning Loading Guide Card (Subtle, Collapsible) */}
        {showLoadingGuide && (
          <section className="bg-white rounded-xl border border-[#CBD5E1] p-5 shadow-xs animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#E8F3F8] text-[#0A4B6E]">
                  <Truck size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0A4B6E]">
                    Morning Loading Guide
                  </h2>
                  <p className="text-xs text-[#6D8AA2]">
                    Calculate equal cylinder distribution across active delivery trucks
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={guideProductId}
                  onChange={(e) => setGuideProductId(e.target.value)}
                  className="text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#0A4B6E] font-medium"
                >
                  {plantStock.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.productName}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5">
                  <span className="text-xs text-[#6D8AA2]">Active Trucks:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={guideTruckCount}
                    onChange={(e) => setGuideTruckCount(Math.max(1, Number(e.target.value)))}
                    className="w-12 text-xs font-bold text-[#0A4B6E] bg-transparent text-center focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {guideSplit && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[#6D8AA2] block">Available Sale-Ready</span>
                  <span className="text-base font-bold text-[#0A4B6E] mt-0.5 block">
                    {guideSplit.available.toLocaleString()} units
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-emerald-800 block font-medium">Per Truck Allocation</span>
                  <span className="text-base font-bold text-emerald-900 mt-0.5 block">
                    {guideSplit.unitsPerTruck.toLocaleString()} units
                    {guideSplit.cratesPerTruck !== null && (
                      <span className="text-xs font-normal text-emerald-700 ml-1.5">
                        ({guideSplit.cratesPerTruck} crates)
                      </span>
                    )}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[#6D8AA2] block">Active Trucks</span>
                  <span className="text-base font-bold text-[#0A4B6E] mt-0.5 block">
                    {guideSplit.trucks} vehicles
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[#6D8AA2] block">Yard Buffer Remainder</span>
                  <span className="text-base font-bold text-slate-700 mt-0.5 block">
                    {guideSplit.remainder} units
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Product Stock Cards Grid */}
        {plantStock.length === 0 ? (
          <div className="py-20 text-center bg-white border border-dashed border-[#CBD5E1] rounded-xl p-8">
            <Package size={32} className="mx-auto text-[#6D8AA2] mb-2" />
            <p className="text-sm font-semibold text-[#0A4B6E]">No Plant Stock Logged</p>
            <p className="text-xs text-[#6D8AA2] mt-1">
              No inventory entries found for Bunawan yard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plantStock.map((item) => {
              const pId = item.productId || item.product_id || item.id;
              const pName = item.productName || item.product_name || "Product";
              const cType = item.containerType || item.container_type || "CYLINDER";
              const weight =
                item.netWeightKg !== undefined ? item.netWeightKg : item.net_weight_kg;
              const qFilled = item.quantityFilled ?? item.quantity_filled ?? 0;
              const qEmpty = item.quantityEmptyGood ?? item.quantity_empty_good ?? 0;
              const qDefective = item.quantityDefective ?? item.quantity_defective ?? 0;

              const crFilled =
                item.cratesFilled !== undefined
                  ? item.cratesFilled
                  : cType === "CANISTER"
                  ? Math.floor(qFilled / 24)
                  : null;
              const crEmpty =
                item.cratesEmptyGood !== undefined
                  ? item.cratesEmptyGood
                  : cType === "CANISTER"
                  ? Math.floor(qEmpty / 24)
                  : null;
              const crDef =
                item.cratesDefective !== undefined
                  ? item.cratesDefective
                  : cType === "CANISTER"
                  ? Math.floor(qDefective / 24)
                  : null;

              return (
                <div
                  key={pId}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-sm text-[#0A4B6E]">{pName}</h3>
                        <p className="text-xs text-[#6D8AA2] mt-0.5">
                          {cType === "CANISTER" ? "Canister" : "Cylinder"} · {weight} kg
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center">
                        {cType === "CANISTER" ? <Package size={16} /> : <Flame size={16} />}
                      </div>
                    </div>

                    {/* Stock Breakdown */}
                    <div className="space-y-2 text-xs">
                      {/* Filled */}
                      <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-emerald-900 block">
                            Filled Stock
                          </span>
                          <span className="text-[11px] text-emerald-700">
                            Ready for dispatch
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-emerald-900 block">
                            {qFilled.toLocaleString()}
                          </span>
                          {crFilled !== null && (
                            <span className="text-[11px] text-emerald-700">
                              {crFilled} crates
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Empty Good */}
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-[#0A4B6E] block">
                            Empty Good
                          </span>
                          <span className="text-[11px] text-[#6D8AA2]">
                            Ready for refilling
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-[#0A4B6E] block">
                            {qEmpty.toLocaleString()}
                          </span>
                          {crEmpty !== null && (
                            <span className="text-[11px] text-[#6D8AA2]">
                              {crEmpty} crates
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Defective */}
                      <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-lg flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-rose-900 block">
                            Quarantined Defective
                          </span>
                          <span className="text-[11px] text-rose-600">
                            Leakers / damaged
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-rose-900 block">
                            {qDefective.toLocaleString()}
                          </span>
                          {crDef !== null && (
                            <span className="text-[11px] text-rose-700">
                              {crDef} crates
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Footer */}
                  <div className="pt-3 mt-4 border-t border-[#F1F5F9] flex items-center justify-between">
                    <span className="text-[11px] text-[#6D8AA2]">Bunawan Yard</span>
                    {canManage && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveQuarantineProductId(pId);
                            setShowQuarantineModal(true);
                          }}
                          className="text-[11px] font-semibold text-[#C93B32] hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          Defect
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRestockProductId(pId);
                            setShowRestockModal(true);
                          }}
                          className="text-[11px] font-semibold text-[#0A4B6E] hover:bg-[#E8F3F8] px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          + Restock
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Supplier Restock Modal (Single-step) */}
      <SupplierRestockModal
        isOpen={showRestockModal}
        onClose={() => setShowRestockModal(false)}
        plantStock={plantStock}
        defaultProductId={activeRestockProductId}
        onRestock={handleRestock}
      />

      {/* Quarantine Defects Modal (Single-step) */}
      <QuarantineDefectsModal
        isOpen={showQuarantineModal}
        onClose={() => setShowQuarantineModal(false)}
        plantStock={plantStock}
        defaultProductId={activeQuarantineProductId}
        onQuarantine={handleQuarantine}
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

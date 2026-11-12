// src/components/items/plant/PlantStockAdjustmentModal.jsx
import { useState, useEffect, useMemo } from "react";
import {
  SlidersHorizontal,
  Package,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Warehouse,
  RotateCcw,
  AlertOctagon,
} from "lucide-react";
import Modal from "../../ui/Modal.jsx";
import Button from "../../ui/Button.jsx";
import { inventoryApi } from "../../../api/inventory.js";

/**
 * PlantStockAdjustmentModal — Standardized 3-Step Stock Adjustment Wizard for Bunawan Yard.
 * Conforms to AGENTS.md Section 4: [Step 1: Input] -> [Step 2: Confirm] -> [Step 3: Success View].
 * Streamlined specifically for supervisors to adjust Filled, Empty, or Defective balances.
 */
export default function PlantStockAdjustmentModal({
  isOpen,
  onClose,
  plantStock = [],
  defaultProductId = null,
  initialCondition = "FILLED", // 'FILLED' | 'EMPTY_GOOD' | 'DEFECTIVE'
  onAdjustmentSuccess,
}) {
  const [step, setStep] = useState(1); // 1 = Form, 2 = Confirm, 3 = Success
  const [selectedProductId, setSelectedProductId] = useState("");
  const [targetCondition, setTargetCondition] = useState("FILLED");
  const [adjustMode, setAdjustMode] = useState("AUDIT"); // 'AUDIT' (Set Count) | 'ADD' (+ units) | 'DEDUCT' (- units)

  const [inputValue, setInputValue] = useState("");
  const [reasonPreset, setReasonPreset] = useState("Physical Count Verification");
  const [customNotes, setCustomNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successReceipt, setSuccessReceipt] = useState(null);

  // Initialize or reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setSuccessReceipt(null);
      setAdjustMode("AUDIT");
      setInputValue("");
      setReasonPreset("Physical Count Verification");
      setCustomNotes("");
      setTargetCondition(initialCondition || "FILLED");

      if (defaultProductId) {
        setSelectedProductId(defaultProductId);
      } else if (plantStock.length > 0) {
        const first = plantStock[0];
        setSelectedProductId(first.productId || first.product_id || first.id);
      }
    }
  }, [isOpen, defaultProductId, initialCondition, plantStock]);

  const selectedProduct = useMemo(() => {
    return (
      plantStock.find(
        (p) => (p.productId || p.product_id || p.id) === selectedProductId
      ) || plantStock[0] || null
    );
  }, [plantStock, selectedProductId]);

  const isCanister = (selectedProduct?.containerType || selectedProduct?.container_type) === "CANISTER";
  const weight = selectedProduct?.netWeightKg !== undefined ? selectedProduct?.netWeightKg : selectedProduct?.net_weight_kg;

  const currentFilled = Number(selectedProduct?.quantityFilled ?? selectedProduct?.quantity_filled ?? 0);
  const currentEmpty = Number(selectedProduct?.quantityEmptyGood ?? selectedProduct?.quantity_empty_good ?? 0);
  const currentDefective = Number(selectedProduct?.quantityDefective ?? selectedProduct?.quantity_defective ?? 0);

  let currentCountForTarget = currentFilled;
  if (targetCondition === "EMPTY_GOOD") currentCountForTarget = currentEmpty;
  if (targetCondition === "DEFECTIVE") currentCountForTarget = currentDefective;

  // Format loose vs crates helper
  const formatCratesText = (units) => {
    const u = Math.abs(Number(units) || 0);
    const crates = Math.floor(u / 24);
    const loose = u % 24;
    if (crates === 0) return `${loose} loose cans`;
    if (loose === 0) return `${crates} ${crates === 1 ? "crate" : "crates"}`;
    return `${crates} ${crates === 1 ? "crate" : "crates"} + ${loose} loose`;
  };

  // Calculation of delta and resulting count
  const calculation = useMemo(() => {
    const rawVal = parseInt(inputValue, 10);
    const validNum = isNaN(rawVal) ? 0 : rawVal;

    let delta = 0;
    let resultingCount = currentCountForTarget;

    if (adjustMode === "AUDIT") {
      if (inputValue === "") {
        delta = 0;
        resultingCount = currentCountForTarget;
      } else {
        resultingCount = Math.max(0, validNum);
        delta = resultingCount - currentCountForTarget;
      }
    } else if (adjustMode === "ADD") {
      delta = Math.max(0, validNum);
      resultingCount = currentCountForTarget + delta;
    } else if (adjustMode === "DEDUCT") {
      delta = -Math.max(0, validNum);
      resultingCount = Math.max(0, currentCountForTarget - Math.max(0, validNum));
    }

    return {
      delta,
      resultingCount,
      currentCount: currentCountForTarget,
    };
  }, [inputValue, adjustMode, currentCountForTarget]);

  // Validation before proceeding to step 2
  const handleProceedToConfirm = (e) => {
    if (e) e.preventDefault();
    setError(null);

    const val = parseInt(inputValue, 10);
    if (inputValue === "" || isNaN(val) || val < 0) {
      setError("Please enter a valid non-negative number of units.");
      return;
    }

    if (adjustMode === "AUDIT" && calculation.delta === 0) {
      setError("The verified count entered is identical to the current balance. No adjustment needed.");
      return;
    }

    if (adjustMode === "ADD" && val <= 0) {
      setError("Please enter a positive number of units to add.");
      return;
    }

    if (adjustMode === "DEDUCT") {
      if (val <= 0) {
        setError("Please enter a positive number of units to deduct.");
        return;
      }
      if (val > currentCountForTarget) {
        setError(
          `Cannot deduct ${val} units. Only ${currentCountForTarget} units are currently in ${targetCondition.replace("_", " ")}.`
        );
        return;
      }
    }

    setStep(2);
  };

  // Final submission to API
  const handleFinalSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const resolvedReason = customNotes.trim()
        ? `${reasonPreset}: ${customNotes.trim()}`
        : reasonPreset;

      const pId = selectedProduct.productId || selectedProduct.product_id || selectedProduct.id;

      const payload = {
        productId: pId,
        adjustmentType: adjustMode === "ADD" ? "SUPPLIER_PURCHASE" : "PHYSICAL_COUNT",
        targetCondition,
        newQuantity: adjustMode === "AUDIT" ? calculation.resultingCount : undefined,
        deltaQuantity: calculation.delta,
        reason: resolvedReason,
      };

      const result = await inventoryApi.adjustPlantStock(payload);

      // Invalidate caches
      localStorage.removeItem("app_plant_stock_cache");
      localStorage.removeItem("app_items_cache");

      setSuccessReceipt({
        productName: selectedProduct.productName || selectedProduct.product_name,
        targetCondition,
        previousCount: calculation.currentCount,
        delta: calculation.delta,
        resultingCount: calculation.resultingCount,
        reason: resolvedReason,
      });

      if (onAdjustmentSuccess) {
        onAdjustmentSuccess(result?.stock || result);
      }

      setStep(3); // Step 3: Success View
    } catch (err) {
      console.error("Adjustment failed:", err);
      setError(err.message || "Failed to record plant stock adjustment.");
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const conditionLabels = {
    FILLED: "Sale-Ready (Filled)",
    EMPTY_GOOD: "Empty Good (Returns)",
    DEFECTIVE: "Defective Units",
  };

  if (!isOpen) return null;

  // Title and subtitle per step
  let modalTitle = "Adjust Plant Stock";
  let modalSubtitle = "Step 1 of 3: Enter physical count details";
  if (step === 2) {
    modalTitle = "Confirm Adjustment";
    modalSubtitle = "Step 2 of 3: Review balance changes";
  } else if (step === 3) {
    modalTitle = "Stock Adjusted";
    modalSubtitle = "Step 3 of 3: Inventory balance updated";
  }

  // Footer per step
  const renderFooter = () => {
    if (step === 1) {
      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="cancel"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleProceedToConfirm}
          >
            <span>Review Adjustment</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </Button>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="cancel"
            onClick={() => setStep(1)}
            disabled={isSubmitting}
            className="flex items-center gap-1"
          >
            <ArrowLeft size={13} />
            <span>Back to Edit</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? "Recording..." : "Confirm Adjustment"}</span>
            <CheckCircle2 size={13} strokeWidth={2.5} />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          onClick={onClose}
          className="w-full sm:w-auto px-6"
        >
          Done
        </Button>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={SlidersHorizontal}
      onBack={step === 2 ? () => setStep(1) : null}
      maxWidth="max-w-lg"
      footer={renderFooter()}
    >
      <div className="space-y-4 text-xs text-left">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[#C93B32] text-xs flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-[#C93B32]" />
            <span>{error}</span>
          </div>
        )}

        {/* ================= STEP 1: FORM ================= */}
        {step === 1 && (
          <form onSubmit={handleProceedToConfirm} className="space-y-4">
            {/* Product Selector / Indicator */}
            <div>
              <label className="block text-[11px] font-bold text-[#6D8AA2] uppercase tracking-wider mb-1.5">
                Select Product
              </label>
              {plantStock.length > 1 && !defaultProductId ? (
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-[#0A4B6E] font-medium focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/30 bg-white"
                >
                  {plantStock.map((prod) => {
                    const id = prod.productId || prod.product_id || prod.id;
                    return (
                      <option key={id} value={id}>
                        {prod.productName || prod.product_name} ({prod.containerType || prod.container_type})
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isCanister ? "bg-[#E8F3F8] text-[#0A4B6E]" : "bg-[#FFF9D6] text-amber-700"
                      }`}
                    >
                      {isCanister ? <Package size={16} /> : <Flame size={16} />}
                    </div>
                    <div>
                      <p className="font-bold text-[#0A4B6E]">
                        {selectedProduct?.productName || selectedProduct?.product_name || "LPG Product"}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {isCanister ? "Canister" : "Cylinder"} · {weight} kg
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                    Selected
                  </span>
                </div>
              )}
            </div>

            {/* Target Condition Selector Tabs */}
            <div>
              <label className="block text-[11px] font-bold text-[#6D8AA2] uppercase tracking-wider mb-1.5">
                Target Stock Condition
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetCondition("FILLED")}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    targetCondition === "FILLED"
                      ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Warehouse size={14} className="mx-auto mb-1 text-emerald-700" />
                  <span className="block text-[11px]">Sale-Ready</span>
                  <span className="block text-[10px] text-emerald-800 font-semibold mt-0.5">
                    {currentFilled.toLocaleString()}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetCondition("EMPTY_GOOD")}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    targetCondition === "EMPTY_GOOD"
                      ? "bg-blue-50 border-blue-400 text-[#0A4B6E] font-bold shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <RotateCcw size={14} className="mx-auto mb-1 text-[#0A4B6E]" />
                  <span className="block text-[11px]">Empty Good</span>
                  <span className="block text-[10px] text-[#0A4B6E] font-semibold mt-0.5">
                    {currentEmpty.toLocaleString()}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetCondition("DEFECTIVE")}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    targetCondition === "DEFECTIVE"
                      ? "bg-rose-50 border-rose-400 text-rose-900 font-bold shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <AlertOctagon size={14} className="mx-auto mb-1 text-[#C93B32]" />
                  <span className="block text-[11px]">Defective</span>
                  <span className="block text-[10px] text-rose-800 font-semibold mt-0.5">
                    {currentDefective.toLocaleString()}
                  </span>
                </button>
              </div>
            </div>

            {/* Adjustment Mode Selector */}
            <div>
              <label className="block text-[11px] font-bold text-[#6D8AA2] uppercase tracking-wider mb-1.5">
                Adjustment Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustMode("AUDIT");
                    setInputValue("");
                  }}
                  className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                    adjustMode === "AUDIT"
                      ? "bg-[#0A4B6E] text-white border-[#0A4B6E] font-bold shadow-2xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="block text-xs">Count Audit</span>
                  <span className="block text-[9px] opacity-80 mt-0.5">Set exact count</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdjustMode("ADD");
                    setInputValue("");
                  }}
                  className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                    adjustMode === "ADD"
                      ? "bg-[#0A4B6E] text-white border-[#0A4B6E] font-bold shadow-2xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="block text-xs">Add Stock (+)</span>
                  <span className="block text-[9px] opacity-80 mt-0.5">Intake / receive</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdjustMode("DEDUCT");
                    setInputValue("");
                  }}
                  className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                    adjustMode === "DEDUCT"
                      ? "bg-[#0A4B6E] text-white border-[#0A4B6E] font-bold shadow-2xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="block text-xs">Deduct (-)</span>
                  <span className="block text-[9px] opacity-80 mt-0.5">Scrap / write-off</span>
                </button>
              </div>
            </div>

            {/* Value Input & Live Preview */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">
                  {adjustMode === "AUDIT" && "Verified Physical Count (Units)"}
                  {adjustMode === "ADD" && "Units to Add (+)"}
                  {adjustMode === "DEDUCT" && "Units to Deduct (-)"}
                </label>
                <span className="text-[10px] text-slate-500">
                  Current: <strong>{currentCountForTarget.toLocaleString()}</strong> units
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={adjustMode === "AUDIT" ? currentCountForTarget.toString() : "e.g. 120"}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm font-bold text-[#0A4B6E] focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/30"
                  autoFocus
                />
                {isCanister && (
                  <span className="absolute right-3 top-2.5 text-[10px] font-semibold text-slate-500">
                    {formatCratesText(inputValue || 0)}
                  </span>
                )}
              </div>

              {/* Dynamic Delta Calculation Feedback */}
              <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-200">
                <span className="text-slate-600">Resulting Balance:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-[#0A4B6E]">{calculation.resultingCount.toLocaleString()} units</span>
                  {calculation.delta !== 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        calculation.delta > 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {calculation.delta > 0 ? `+${calculation.delta}` : calculation.delta}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Reason Presets & Optional Notes */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[#6D8AA2] uppercase tracking-wider">
                Reason for Adjustment
              </label>
              <select
                value={reasonPreset}
                onChange={(e) => setReasonPreset(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/30 bg-white"
              >
                <option value="Physical Count Verification">Physical Count Verification (Routine)</option>
                <option value="Unrecorded Supplier Shipment">Unrecorded Supplier Delivery</option>
                <option value="Discovered Valve Leakage">Discovered Valve Leakage (Quarantine)</option>
                <option value="Dented Collar Defect">Dented Collar Defect (Quarantine)</option>
                <option value="Post-Dispatch Variance Adjustment">Post-Dispatch Variance Adjustment</option>
                <option value="Scrap Disposal Write-off">Scrap Disposal Write-off</option>
                <option value="Other / Special Reconciliation">Other / Special Reconciliation</option>
              </select>

              <input
                type="text"
                placeholder="Additional notes / reference ticket (optional)..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A4B6E]/30 bg-white"
              />
            </div>
          </form>
        )}

        {/* ================= STEP 2: CONFIRMATION ================= */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-[11px] text-[#6D8AA2] font-semibold">Product</span>
                <span className="text-xs font-bold text-[#0A4B6E]">
                  {selectedProduct?.productName || selectedProduct?.product_name}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-[11px] text-[#6D8AA2] font-semibold">Stock Condition</span>
                <span className="text-xs font-semibold text-slate-800">
                  {conditionLabels[targetCondition]}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-[11px] text-[#6D8AA2] font-semibold">Current Count</span>
                <span className="text-xs font-medium text-slate-700">
                  {calculation.currentCount.toLocaleString()} units
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-[11px] text-[#6D8AA2] font-semibold">Adjustment Delta</span>
                <span
                  className={`text-xs font-bold ${
                    calculation.delta > 0
                      ? "text-emerald-700"
                      : calculation.delta < 0
                      ? "text-rose-700"
                      : "text-slate-700"
                  }`}
                >
                  {calculation.delta > 0 ? `+${calculation.delta}` : calculation.delta} units
                  {isCanister && ` (${formatCratesText(calculation.delta)})`}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-[11px] text-[#6D8AA2] font-bold uppercase tracking-wider">
                  Resulting Balance
                </span>
                <span className="text-sm font-bold text-[#0A4B6E]">
                  {calculation.resultingCount.toLocaleString()} units
                </span>
              </div>

              <div className="pt-1">
                <span className="text-[11px] text-[#6D8AA2] font-semibold block">Reason</span>
                <p className="text-xs text-slate-800 italic mt-0.5">
                  {customNotes.trim() ? `${reasonPreset}: ${customNotes.trim()}` : reasonPreset}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              <strong>Notice:</strong> This adjustment will immediately update Bunawan plant
              inventory and be visible across dispatching and route operations.
            </div>
          </div>
        )}

        {/* ================= STEP 3: SUCCESS ================= */}
        {step === 3 && (
          <div className="py-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#0A4B6E]">
                Stock Adjustment Recorded
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Plant inventory balance has been updated successfully.
              </p>
            </div>

            {successReceipt && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product:</span>
                  <span className="font-bold text-[#0A4B6E]">{successReceipt.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Condition:</span>
                  <span className="font-semibold text-slate-800">
                    {conditionLabels[successReceipt.targetCondition]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Updated Balance:</span>
                  <span className="font-bold text-emerald-800">
                    {successReceipt.resultingCount.toLocaleString()} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reason:</span>
                  <span className="font-medium text-slate-700 italic truncate max-w-[200px]">
                    {successReceipt.reason}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

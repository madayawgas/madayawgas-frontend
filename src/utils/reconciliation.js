// src/utils/reconciliation.js

/**
 * Computes per-SKU and trip-level dual reconciliation breakdown:
 * - Full Gas Accountability:  fullDiscrepancy  = loadedFull - soldFull - returnedFull - returnedDefective
 * - Empty Cylinder Balance:   emptyDiscrepancy = soldFull - (returnedEmptyGood + netCustomerDebtCreated)
 *
 * Positive discrepancy = shortage / unaccounted units.
 * Negative discrepancy = overage / surplus units.
 */
export function computeTripReconciliation({
  loads = [],
  salesSummary = null,
  reconciliation = null,
  returnCountsOverride = null,
} = {}) {
  const byProductMap = new Map();

  const ensureRow = (productId, meta = {}) => {
    if (!productId) return null;
    if (!byProductMap.has(productId)) {
      byProductMap.set(productId, {
        productId,
        productName: meta.productName || "LPG Product",
        containerType: meta.containerType || "CYLINDER",
        netWeightKg: Number(meta.netWeightKg) || 0,
        loadedFull: 0,
        soldFull: 0,
        netCustomerDebtCreated: 0,
        returnedFull: 0,
        returnedEmptyGood: 0,
        returnedDefective: 0,
      });
    } else if (meta.productName && byProductMap.get(productId).productName === "LPG Product") {
      byProductMap.get(productId).productName = meta.productName;
    }
    return byProductMap.get(productId);
  };

  // 1. Aggregate Dispatch Loads, Midday Reloads, and Return Unloads from load slips
  (Array.isArray(loads) ? loads : []).forEach((load) => {
    const type = (load.transferType || load.transfer_type || "").toUpperCase();
    const items = Array.isArray(load.items) ? load.items : [];
    items.forEach((item) => {
      const pid = item.productId || item.product_id;
      const qty = parseInt(item.quantityUnits ?? item.quantity_units, 10) || 0;
      const cond = (item.condition || "FILLED").toUpperCase();
      const row = ensureRow(pid, {
        productName: item.productName || item.product_name || item.name,
        containerType: item.containerType || item.container_type,
        netWeightKg: item.netWeightKg ?? item.net_weight_kg,
      });
      if (!row) return;

      if (type === "DISPATCH_LOAD" || type === "MIDDAY_RELOAD") {
        if (cond === "FILLED") row.loadedFull += qty;
      } else if (type === "RETURN_UNLOAD" && !returnCountsOverride) {
        if (cond === "FILLED") row.returnedFull += qty;
        else if (cond === "EMPTY_GOOD") row.returnedEmptyGood += qty;
        else if (cond === "DEFECTIVE") row.returnedDefective += qty;
      }
    });
  });

  // 2. Apply live editable return counts if provided (Check-In mode)
  if (returnCountsOverride && typeof returnCountsOverride === "object") {
    Object.entries(returnCountsOverride).forEach(([pid, counts]) => {
      const row = ensureRow(pid);
      if (!row || !counts) return;
      row.returnedFull = Math.max(0, parseInt(counts.returnedFull, 10) || 0);
      row.returnedEmptyGood = Math.max(0, parseInt(counts.returnedEmptyGood, 10) || 0);
      row.returnedDefective = Math.max(0, parseInt(counts.returnedDefective, 10) || 0);
    });
  }

  // 3. Merge per-SKU synced sales and customer canister debt
  const salesProducts = Array.isArray(salesSummary?.byProduct) ? salesSummary.byProduct : [];
  const hasPerSkuSales = Boolean(salesSummary);
  salesProducts.forEach((sp) => {
    const pid = sp.productId || sp.product_id;
    const row = ensureRow(pid, { productName: sp.productName || sp.product_name });
    if (!row) return;
    row.soldFull = parseInt(sp.quantitySold ?? sp.quantity_sold, 10) || 0;
    row.netCustomerDebtCreated =
      parseInt(sp.netCustomerDebtCreated ?? sp.net_customer_debt_created, 10) || 0;
  });

  // 4. Compute per-SKU variances & aggregate totals
  const products = [];
  const totals = {
    loadedFull: 0,
    soldFull: 0,
    netCustomerDebtCreated: 0,
    returnedFull: 0,
    returnedEmptyGood: 0,
    returnedDefective: 0,
    totalReturned: 0,
    fullDiscrepancy: 0,
    emptyDiscrepancy: 0,
  };

  for (const row of byProductMap.values()) {
    const fullDiscrepancy =
      row.loadedFull - row.soldFull - row.returnedFull - row.returnedDefective;
    const emptyDiscrepancy =
      row.soldFull - (row.returnedEmptyGood + row.netCustomerDebtCreated);
    const totalReturned = row.returnedFull + row.returnedEmptyGood + row.returnedDefective;

    products.push({
      ...row,
      totalReturned,
      fullDiscrepancy,
      emptyDiscrepancy,
      hasVariance: fullDiscrepancy !== 0 || emptyDiscrepancy !== 0,
    });

    totals.loadedFull += row.loadedFull;
    totals.soldFull += row.soldFull;
    totals.netCustomerDebtCreated += row.netCustomerDebtCreated;
    totals.returnedFull += row.returnedFull;
    totals.returnedEmptyGood += row.returnedEmptyGood;
    totals.returnedDefective += row.returnedDefective;
    totals.totalReturned += totalReturned;
  }

  // If salesSummary wasn't hydrated (e.g. list view), fall back to stored reconciliation totals
  if (!hasPerSkuSales && reconciliation) {
    totals.soldFull = parseInt(reconciliation.totalSoldFull, 10) || 0;
    totals.netCustomerDebtCreated = parseInt(reconciliation.netCustomerDebtCreated, 10) || 0;
    if (totals.loadedFull === 0 && reconciliation.totalLoadedFull) {
      totals.loadedFull = parseInt(reconciliation.totalLoadedFull, 10) || 0;
    }
    if (totals.totalReturned === 0) {
      totals.returnedFull = parseInt(reconciliation.totalReturnedFull, 10) || 0;
      totals.returnedEmptyGood = parseInt(reconciliation.totalReturnedEmptyGood, 10) || 0;
      totals.returnedDefective = parseInt(reconciliation.totalReturnedDefective, 10) || 0;
      totals.totalReturned =
        totals.returnedFull + totals.returnedEmptyGood + totals.returnedDefective;
    }
  }

  totals.fullDiscrepancy =
    totals.loadedFull - totals.soldFull - totals.returnedFull - totals.returnedDefective;
  totals.emptyDiscrepancy =
    totals.soldFull - (totals.returnedEmptyGood + totals.netCustomerDebtCreated);

  const isAwaitingSync = reconciliation?.status === "AWAITING_SYNC" && !returnCountsOverride;
  const hasVariance =
    !isAwaitingSync && (totals.fullDiscrepancy !== 0 || totals.emptyDiscrepancy !== 0);

  return {
    products,
    totals,
    hasPerSkuSales,
    isAwaitingSync,
    hasVariance,
    isBalanced: !isAwaitingSync && !hasVariance,
  };
}

/**
 * Formats full & empty discrepancies into a concise, scannable string.
 * Positive = missing/short; Negative = overage.
 */
export function formatVarianceSummary(fullDiscrepancy, emptyDiscrepancy) {
  const full = Number(fullDiscrepancy) || 0;
  const empty = Number(emptyDiscrepancy) || 0;

  if (full === 0 && empty === 0) return "Balanced";

  const parts = [];
  if (full !== 0) {
    parts.push(`${Math.abs(full)} Full ${full > 0 ? "short" : "over"}`);
  }
  if (empty !== 0) {
    parts.push(`${Math.abs(empty)} Empty ${empty > 0 ? "short" : "over"}`);
  }
  return parts.join(" · ");
}

/**
 * Extracts initial editable return counts from existing RETURN_UNLOAD load items
 * (for re-reconciling a previously returned/completed trip) or defaults to all sold as empty.
 */
export function buildInitialReturnCounts(loads = []) {
  const counts = {};
  const loadedIds = new Set();
  let hasPriorReturnUnload = false;

  (Array.isArray(loads) ? loads : []).forEach((load) => {
    const type = (load.transferType || load.transfer_type || "").toUpperCase();
    const items = Array.isArray(load.items) ? load.items : [];
    items.forEach((item) => {
      const pid = item.productId || item.product_id;
      if (!pid) return;
      const qty = parseInt(item.quantityUnits ?? item.quantity_units, 10) || 0;
      const cond = (item.condition || "FILLED").toUpperCase();

      if (!counts[pid]) {
        counts[pid] = {
          returnedFull: 0,
          returnedEmptyGood: 0,
          returnedDefective: 0,
          loadedUnits: 0,
        };
      }

      if (type === "DISPATCH_LOAD" || type === "MIDDAY_RELOAD") {
        if (cond === "FILLED") {
          counts[pid].loadedUnits += qty;
          loadedIds.add(pid);
        }
      } else if (type === "RETURN_UNLOAD") {
        hasPriorReturnUnload = true;
        if (cond === "FILLED") counts[pid].returnedFull += qty;
        else if (cond === "EMPTY_GOOD") counts[pid].returnedEmptyGood += qty;
        else if (cond === "DEFECTIVE") counts[pid].returnedDefective += qty;
      }
    });
  });

  // For fresh RETURNED trips with no prior RETURN_UNLOAD, prefill Empty Good = loadedUnits
  if (!hasPriorReturnUnload) {
    loadedIds.forEach((pid) => {
      counts[pid].returnedEmptyGood = counts[pid].loadedUnits;
    });
  }

  return counts;
}

export function computeTripAccountability({
  loadedFull = 0,
  soldFull = 0,
  returnedFull = 0,
  returnedEmptyGood = 0,
  returnedDefective = 0,
  netCustomerDebtCreated = 0,
  hasSyncedSales = true,
}) {
  const loaded = Number(loadedFull) || 0;
  const sold = Number(soldFull) || 0;
  const retFull = Number(returnedFull) || 0;
  const retEmpty = Number(returnedEmptyGood) || 0;
  const retDefect = Number(returnedDefective) || 0;
  const debt = Number(netCustomerDebtCreated) || 0;

  const fullAccounted = sold + retFull + retDefect;
  const emptyAccounted = retEmpty + debt;

  const fullDiscrepancy = hasSyncedSales ? loaded - fullAccounted : null;
  const emptyDiscrepancy = hasSyncedSales ? sold - emptyAccounted : null;

  const hasVariance =
    hasSyncedSales && ((fullDiscrepancy ?? 0) !== 0 || (emptyDiscrepancy ?? 0) !== 0);

  return {
    loaded,
    sold,
    retFull,
    retEmpty,
    retDefect,
    debt,
    fullAccounted,
    emptyAccounted,
    fullDiscrepancy,
    emptyDiscrepancy,
    hasVariance,
  };
}

export function formatVarianceLabel(diff) {
  if (diff === null || diff === undefined) return "Pending Sales";
  const val = Number(diff) || 0;
  if (val === 0) return "All Accounted";
  if (val > 0) return `${val} Missing`;
  return `+${Math.abs(val)} Extra`;
}

/**
 * Formats full & empty discrepancies into natural language for the Check Status column.
 * Positive = missing/short; Negative = extra/overage.
 */
export function formatCheckStatusLabel(
  fullDiscrepancy,
  emptyDiscrepancy,
  { returnedDefective = 0 } = {}
) {
  if (fullDiscrepancy === null || fullDiscrepancy === undefined) {
    return "Pending Sales";
  }

  const full = Number(fullDiscrepancy) || 0;
  const empty = Number(emptyDiscrepancy) || 0;

  if (full === 0 && empty === 0) return "All Accounted";

  const parts = [];
  if (full > 0) {
    parts.push(`${full} Full Missing`);
  } else if (full < 0) {
    const extra = Math.abs(full);
    const defectCount = Math.max(0, Number(returnedDefective) || 0);
    const extraDamaged = Math.min(extra, defectCount);
    const extraFull = extra - extraDamaged;

    if (extraFull > 0) {
      parts.push(`+${extraFull} Extra Full`);
    }
    if (extraDamaged > 0) {
      parts.push(`+${extraDamaged} Extra Damaged`);
    }
  }

  if (empty > 0) {
    parts.push(`${empty} ${empty === 1 ? "Empty" : "Empties"} Missing`);
  } else if (empty < 0) {
    const abs = Math.abs(empty);
    parts.push(`+${abs} Extra ${abs === 1 ? "Empty" : "Empties"}`);
  }

  return parts.join(" · ");
}

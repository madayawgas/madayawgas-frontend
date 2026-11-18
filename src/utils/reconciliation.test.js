import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeTripReconciliation,
  formatVarianceSummary,
  buildInitialReturnCounts,
} from "./reconciliation.js";

test("reconciliation.js dual reconciliation math & QA scenario", async (t) => {
  await t.test("QA scenario: 25 loaded, 15 sold, 15 empty good, 5 defective => 5 Full short, 0 Empty", () => {
    const loads = [
      {
        transferType: "DISPATCH_LOAD",
        items: [{ productId: "p1", productName: "11kg LPG", condition: "FILLED", quantityUnits: 25 }],
      },
    ];
    const salesSummary = {
      byProduct: [{ productId: "p1", productName: "11kg LPG", quantitySold: 15, netCustomerDebtCreated: 0 }],
    };
    const returnCountsOverride = {
      p1: { returnedFull: 0, returnedEmptyGood: 15, returnedDefective: 5 },
    };

    const res = computeTripReconciliation({ loads, salesSummary, returnCountsOverride });
    assert.equal(res.totals.loadedFull, 25);
    assert.equal(res.totals.soldFull, 15);
    assert.equal(res.totals.totalReturned, 20);
    assert.equal(res.totals.fullDiscrepancy, 5);
    assert.equal(res.totals.emptyDiscrepancy, 0);
    assert.equal(res.hasVariance, true);
    assert.equal(formatVarianceSummary(res.totals.fullDiscrepancy, res.totals.emptyDiscrepancy), "5 Full short");
  });

  await t.test("Balanced scenario with midday reload and customer canister debt", () => {
    const loads = [
      {
        transferType: "DISPATCH_LOAD",
        items: [{ productId: "p1", productName: "11kg LPG", condition: "FILLED", quantityUnits: 20 }],
      },
      {
        transferType: "MIDDAY_RELOAD",
        items: [{ productId: "p1", productName: "11kg LPG", condition: "FILLED", quantityUnits: 5 }],
      },
      {
        transferType: "RETURN_UNLOAD",
        items: [
          { productId: "p1", productName: "11kg LPG", condition: "FILLED", quantityUnits: 8 },
          { productId: "p1", productName: "11kg LPG", condition: "EMPTY_GOOD", quantityUnits: 12 },
          { productId: "p1", productName: "11kg LPG", condition: "DEFECTIVE", quantityUnits: 2 },
        ],
      },
    ];
    const salesSummary = {
      byProduct: [{ productId: "p1", productName: "11kg LPG", quantitySold: 15, netCustomerDebtCreated: 3 }],
    };

    const res = computeTripReconciliation({ loads, salesSummary });
    assert.equal(res.totals.loadedFull, 25);
    assert.equal(res.totals.fullDiscrepancy, 0);
    assert.equal(res.totals.emptyDiscrepancy, 0);
    assert.equal(res.isBalanced, true);
    assert.equal(formatVarianceSummary(0, 0), "Balanced");
  });

  await t.test("buildInitialReturnCounts pre-fills prior RETURN_UNLOAD counts on re-reconciliation", () => {
    const loads = [
      {
        transferType: "DISPATCH_LOAD",
        items: [{ productId: "p1", condition: "FILLED", quantityUnits: 25 }],
      },
      {
        transferType: "RETURN_UNLOAD",
        items: [
          { productId: "p1", condition: "EMPTY_GOOD", quantityUnits: 15 },
          { productId: "p1", condition: "DEFECTIVE", quantityUnits: 5 },
        ],
      },
    ];
    const counts = buildInitialReturnCounts(loads);
    assert.deepEqual(counts.p1, {
      returnedFull: 0,
      returnedEmptyGood: 15,
      returnedDefective: 5,
      loadedUnits: 25,
    });
  });
});

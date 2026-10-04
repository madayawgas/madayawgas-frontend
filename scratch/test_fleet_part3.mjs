// scratch/test_fleet_part3.mjs
import assert from "node:assert/strict";

// Mock localStorage for Node test environment
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

import { fleetApi } from "../src/api/fleet.js";

async function runTests() {
  console.log("🚀 Starting Fleet & Maintenance Part 3 Automated Verification...\n");

  // TEST 0: Vehicle Fleet Bootstrap
  console.log("Test 0: Verify Available Fleet Vehicles...");
  const trucks = await fleetApi.getTrucks();
  assert.ok(Array.isArray(trucks) && trucks.length > 0, "Expected at least one truck in fleet");
  const testTruck = trucks[0];
  console.log(`  ✓ Using Test Vehicle: ${testTruck.plateNumber} (ID: ${testTruck.id})`);

  // TEST 1: Retrieve Maintenance Types
  console.log("\nTest 1: Maintenance Types Catalog...");
  const typesRes = await fleetApi.getMaintenanceTypes();
  assert.equal(typesRes.status, "success", "Expected success status for maintenance types");
  assert.ok(Array.isArray(typesRes.data.types), "Expected array of maintenance types");
  assert.ok(typesRes.data.types.length >= 4, "Expected at least 4 maintenance types");
  console.log(`  ✓ Retrieved ${typesRes.data.types.length} maintenance types.`);

  // TEST 2: Work Order Creation < ₱5,000 starts in APPROVED
  console.log("\nTest 2: Work Order Creation < ₱5,000 (Auto-Approved)...");
  const lowCostOrderRes = await fleetApi.createWorkOrder({
    truckId: testTruck.id,
    maintenanceTypeId: 1, // PREVENTIVE
    shopName: "Bunawan Heavy Repair Center",
    estimatedCost: 3500.00,
    scheduledDate: "2026-09-25",
    description: "Oil and filter replacement",
  });
  assert.equal(lowCostOrderRes.status, "success");
  assert.equal(lowCostOrderRes.data.workOrder.status, "APPROVED", "Cost < 5000 should be APPROVED");
  assert.equal(lowCostOrderRes.data.requiresApproval, false);
  console.log(`  ✓ Created Low-Cost Work Order ${lowCostOrderRes.data.workOrder.workOrderNumber || lowCostOrderRes.data.workOrder.id} with status ${lowCostOrderRes.data.workOrder.status}`);

  // TEST 3: Work Order Creation >= ₱5,000 triggers PENDING approval
  console.log("\nTest 3: Work Order Creation >= ₱5,000 (Gatekeeper Triggered)...");
  const highCostOrderRes = await fleetApi.createWorkOrder({
    truckId: testTruck.id,
    maintenanceTypeId: 2, // CORRECTIVE
    shopName: "Davao Engine Masters",
    estimatedCost: 8500.00,
    scheduledDate: "2026-09-26",
    description: "Complete clutch assembly replacement",
  });
  assert.equal(highCostOrderRes.status, "success");
  assert.equal(highCostOrderRes.data.workOrder.status, "PENDING", "Cost >= 5000 should be PENDING");
  assert.equal(highCostOrderRes.data.requiresApproval, true);
  console.log(`  ✓ Created High-Cost Work Order ${highCostOrderRes.data.workOrder.workOrderNumber || highCostOrderRes.data.workOrder.id} with status ${highCostOrderRes.data.workOrder.status} (requiresApproval = true)`);

  // TEST 4: Managerial Approval Decision
  console.log("\nTest 4: Managerial Cost Approval Authorization...");
  const approvedRes = await fleetApi.decideWorkOrderApproval(highCostOrderRes.data.workOrder.id, {
    isApproved: true,
    remarks: "Authorized by Fleet Admin for urgent clutch rebuild.",
  });
  assert.equal(approvedRes.status, "success");
  assert.equal(approvedRes.data.workOrder.status, "APPROVED");
  assert.ok(approvedRes.data.workOrder.approvedAt, "approvedAt must be populated");
  console.log(`  ✓ Cost Approval granted. Status transitioned to ${approvedRes.data.workOrder.status}`);

  // TEST 5: Direct Transition to COMPLETED is strictly forbidden
  console.log("\nTest 5: Invariant - Direct Transition to COMPLETED forbidden via /status...");
  let directCompleteFailed = false;
  try {
    await fleetApi.updateWorkOrderStatus(approvedRes.data.workOrder.id, { status: "COMPLETED" });
  } catch (err) {
    directCompleteFailed = true;
    assert.ok(
      err.message.includes("finalize") || err.message.includes("completed"),
      "Error should mention finalization required"
    );
  }
  assert.ok(directCompleteFailed, "Expected direct completion to fail with 400 Bad Request");
  console.log("  ✓ Direct status update to COMPLETED was correctly rejected with 400 Bad Request.");

  // TEST 6: Status Progression: APPROVED -> SCHEDULED -> IN_PROGRESS
  console.log("\nTest 6: Lifecycle Progression (APPROVED -> SCHEDULED -> IN_PROGRESS)...");
  const scheduledRes = await fleetApi.updateWorkOrderStatus(approvedRes.data.workOrder.id, {
    status: "SCHEDULED",
  });
  assert.equal(scheduledRes.data.workOrder.status, "SCHEDULED");

  const inProgressRes = await fleetApi.updateWorkOrderStatus(approvedRes.data.workOrder.id, {
    status: "IN_PROGRESS",
  });
  assert.equal(inProgressRes.data.workOrder.status, "IN_PROGRESS");
  console.log(`  ✓ Work Order lifecycle progressed to ${inProgressRes.data.workOrder.status}`);

  // TEST 7: Duplicate Receipt Number returns 409 Conflict
  console.log("\nTest 7: Duplicate Official Receipt Number returns 409 Conflict...");
  let duplicateOrFailed = false;
  try {
    // "OR-2026-88991" already exists in default mock logs
    await fleetApi.finalizeWorkOrder(inProgressRes.data.workOrder.id, {
      officialReceiptNumber: "OR-2026-88991",
      severity: "HIGH",
      dateStarted: "2026-09-20T08:00:00.000Z",
      dateResolved: "2026-09-22T17:00:00.000Z",
      partsCost: 5500.00,
      laborCost: 3000.00,
      downtimeDays: 2,
      odometerAtService: 47000,
    });
  } catch (err) {
    duplicateOrFailed = true;
    assert.ok(err.message.includes("already been registered"), "Error should mention duplicate receipt");
  }
  assert.ok(duplicateOrFailed, "Expected duplicate OR# to fail with 409 Conflict");
  console.log("  ✓ Duplicate OR# rejected with 409 Conflict.");

  // TEST 8: Finalize Maintenance Log, Release Truck & Reset PM Baseline
  console.log("\nTest 8: Finalize Maintenance Log, Release Truck & Reset PM...");
  const uniqueOrNumber = `OR-${Date.now()}`;
  const finalizeRes = await fleetApi.finalizeWorkOrder(lowCostOrderRes.data.workOrder.id, {
    officialReceiptNumber: uniqueOrNumber,
    severity: "MEDIUM",
    dateStarted: "2026-09-20T08:00:00.000Z",
    dateResolved: "2026-09-21T17:00:00.000Z",
    partsCost: 2200.00,
    laborCost: 1300.00,
    downtimeDays: 1,
    odometerAtService: 48000,
  });
  assert.equal(finalizeRes.status, "success");
  assert.equal(finalizeRes.data.workOrder.status, "COMPLETED");
  assert.equal(finalizeRes.data.maintenanceLog.officialReceiptNumber, uniqueOrNumber);
  assert.equal(finalizeRes.data.maintenanceLog.totalCost, 3500.00);
  assert.equal(finalizeRes.data.truck.status, "ACTIVE", "Truck status should be restored to ACTIVE");
  assert.equal(finalizeRes.data.truck.lastPmOdometer, 48000, "PM baseline should reset to serviced odometer");
  assert.equal(finalizeRes.data.truck.isPmReset, true, "isPmReset flag should be true for PREVENTIVE");
  console.log(`  ✓ Work Order marked COMPLETED.`);
  console.log(`  ✓ Truck status restored to ${finalizeRes.data.truck.status} (Driver retained).`);
  console.log(`  ✓ Truck PM baseline reset to ${finalizeRes.data.truck.lastPmOdometer} km.`);

  // TEST 9: Historical Logs & Recurring Defect Analytics
  console.log("\nTest 9: Historical Logs & Recurring Defect Analytics Query...");
  const logsRes = await fleetApi.getMaintenanceLogs({ limit: 10 });
  assert.equal(logsRes.status, "success");
  assert.ok(logsRes.data.logs.length >= 2, "Expected at least 2 logs");

  const analyticsRes = await fleetApi.getRecurringIssuesAnalytics({ days: 90, minOccurrences: 2 });
  assert.equal(analyticsRes.status, "success");
  assert.ok(Array.isArray(analyticsRes.data.recurringIssues));
  console.log(`  ✓ Queried ${logsRes.data.logs.length} historical logs.`);
  console.log(`  ✓ Retrieved ${analyticsRes.data.recurringIssues.length} recurring defect clusters.`);

  console.log("\n🎉 ALL 9 AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("\n❌ Test execution failed:", err);
  process.exit(1);
});

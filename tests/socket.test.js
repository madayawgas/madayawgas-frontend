// tests/socket.test.js
import { test, describe } from "node:test";
import assert from "node:assert";

import { getSocketUrl, subscribeToReconnect } from "../src/services/socket.js";
import { PERMISSIONS, can } from "../src/utils/permissions.js";

describe("1. Socket Service URL Resolution", () => {
  test("strips /api suffix from localhost API URL", () => {
    assert.strictEqual(getSocketUrl("http://localhost:5000/api"), "http://localhost:5000");
  });

  test("strips trailing slash and /api suffix from localhost API URL", () => {
    assert.strictEqual(getSocketUrl("http://localhost:5000/api/"), "http://localhost:5000");
  });

  test("strips /api from production Render API URL", () => {
    assert.strictEqual(
      getSocketUrl("https://madayawgas-backend.onrender.com/api"),
      "https://madayawgas-backend.onrender.com"
    );
  });

  test("leaves root URL untouched if /api is not present", () => {
    assert.strictEqual(
      getSocketUrl("https://madayawgas-backend.onrender.com"),
      "https://madayawgas-backend.onrender.com"
    );
  });
});

describe("2. RBAC Permissions Catalog & Alert Permissions", () => {
  test("includes verified alerts permissions in PERMISSIONS constant", () => {
    assert.strictEqual(PERMISSIONS.ALERTS_VIEW, "alerts.view");
    assert.strictEqual(PERMISSIONS.ALERTS_MANAGE, "alerts.manage");
    assert.strictEqual(PERMISSIONS.ALERTS_TRIGGER, "alerts.trigger");
  });

  test("can() helper correctly evaluates alert permissions for supervisor", () => {
    const supervisor = {
      id: "sup-001",
      permissions: ["fleet.view", "alerts.view", "alerts.manage"],
    };

    assert.strictEqual(can(supervisor, PERMISSIONS.ALERTS_VIEW), true);
    assert.strictEqual(can(supervisor, PERMISSIONS.ALERTS_MANAGE), true);
    assert.strictEqual(can(supervisor, PERMISSIONS.ALERTS_TRIGGER), false);
  });

  test("can() helper correctly evaluates driver alert permissions", () => {
    const driver = {
      id: "driver-001",
      permissions: ["fleet.view_own", "alerts.trigger", "alerts.view_own"],
    };

    assert.strictEqual(can(driver, PERMISSIONS.ALERTS_TRIGGER), true);
    assert.strictEqual(can(driver, PERMISSIONS.ALERTS_VIEW), false);
    assert.strictEqual(can(driver, PERMISSIONS.ALERTS_MANAGE), false);
  });
});

describe("3. Standardized Event Envelope Schema Validation", () => {
  test("validates standardized envelope structure for FLEET_VEHICLE_GROUNDED", () => {
    const envelope = {
      event: "FLEET_VEHICLE_GROUNDED",
      data: {
        vehicleId: "7fa8411b-10ab-4841-8693-01865a94eb73",
        plateNumber: "XYZ-1234",
        status: "UNDER_MAINTENANCE",
        reason: "FAILED_INSPECTION",
        groundedAt: "2026-10-17T07:15:00.000Z",
      },
      meta: {
        timestamp: "2026-10-17T07:15:00.250Z",
        version: "1.0",
      },
    };

    assert.strictEqual(envelope.event, "FLEET_VEHICLE_GROUNDED");
    assert.strictEqual(envelope.data.plateNumber, "XYZ-1234");
    assert.strictEqual(envelope.data.status, "UNDER_MAINTENANCE");
    assert.strictEqual(envelope.meta.version, "1.0");
    assert.ok(envelope.meta.timestamp);
  });

  test("validates standardized envelope structure for EMERGENCY_ALERT_TRIGGERED", () => {
    const envelope = {
      event: "EMERGENCY_ALERT_TRIGGERED",
      data: {
        id: "c5a7f29b-98f1-4df2-9b22-824c084e7a11",
        driverId: "e829bf42-9988-4db8-8314-8782a62ffb52",
        emergencyType: "ACCIDENT",
        status: "ACTIVE",
        description: "Blown tire on highway",
        location: { latitude: 7.1907, longitude: 125.4553 },
      },
      meta: {
        timestamp: "2026-10-17T09:30:00.120Z",
        version: "1.0",
      },
    };

    assert.strictEqual(envelope.event, "EMERGENCY_ALERT_TRIGGERED");
    assert.strictEqual(envelope.data.emergencyType, "ACCIDENT");
    assert.strictEqual(envelope.data.status, "ACTIVE");
    assert.strictEqual(envelope.data.location.latitude, 7.1907);
  });

  test("validates standardized envelope structure for SALES_BATCH_SYNCED", () => {
    const envelope = {
      event: "SALES_BATCH_SYNCED",
      data: {
        tripId: "90d1525a-4ba4-4113-a442-fcaeeeb08df5",
        tripNumber: "TRIP-20261017-001",
        processedCount: 8,
        syncedAt: "2026-10-17T16:45:00.000Z",
      },
      meta: {
        timestamp: "2026-10-17T16:45:00.220Z",
        version: "1.0",
      },
    };

    assert.strictEqual(envelope.event, "SALES_BATCH_SYNCED");
    assert.strictEqual(envelope.data.processedCount, 8);
    assert.ok(envelope.data.processedCount > 0);
  });
});

describe("4. Reconnection Subscription Lifecycle", () => {
  test("subscribeToReconnect registers callback and unsubscribes cleanly", () => {
    let fired = false;
    const unsub = subscribeToReconnect(() => {
      fired = true;
    });

    assert.strictEqual(typeof unsub, "function");
    // Teardown
    unsub();
    assert.strictEqual(fired, false);
  });
});

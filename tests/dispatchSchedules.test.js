// tests/dispatchSchedules.test.js
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  buildTodaySchedules,
  isTripActiveOrReturned,
  isTripCompleted,
} from "../src/utils/dispatchSchedules.js";

const TODAY_WED = "2026-11-18"; // Wednesday (ISO day 3)

const VEHICLES = [
  {
    id: "truck-1",
    plateNumber: "ABC-1002",
    model: "Isuzu Elf",
    status: "ACTIVE",
    driverId: "drv-1",
  },
  {
    id: "truck-2",
    plateNumber: "XYZ-2004",
    model: "Fuso Canter",
    status: "ACTIVE",
    driverId: "drv-2",
  },
];

const DRIVERS = [
  { id: "drv-1", firstName: "Juan", lastName: "Dela Cruz" },
  { id: "drv-2", firstName: "Pedro", lastName: "Santos" },
];

const SALES_USERS = [
  { id: "sales-1", firstName: "Maria", lastName: "Clara" },
];

const ZONES = [
  { id: "zone-1", code: "Z1", name: "Downtown" },
];

const WED_TEMPLATES = [
  {
    id: "tpl-1",
    truckId: "truck-1",
    truckPlate: "ABC-1002",
    truckModel: "Isuzu Elf",
    zoneId: "zone-1",
    zoneCode: "Z1",
    zoneName: "Downtown",
    dayOfWeek: 3, // Wednesday
    defaultSalesUserId: "sales-1",
    isActive: true,
  },
];

describe("buildTodaySchedules & Re-dispatch logic", () => {
  test("derives normal READY schedule from Wednesday template when no trips exist", () => {
    const result = buildTodaySchedules({
      schedules: [],
      templates: WED_TEMPLATES,
      trips: [],
      vehicles: VEHICLES,
      zones: ZONES,
      salesUsers: SALES_USERS,
      drivers: DRIVERS,
      todayPht: TODAY_WED,
    });

    assert.equal(result.length, 1);
    assert.equal(result[0].id, "tpl-tpl-1");
    assert.equal(result[0].truckPlate, "ABC-1002");
    assert.equal(result[0].isRedispatch, false);
    assert.equal(result[0].isTemplateDerived, true);
  });

  test("excludes vehicle from READY while its trip is IN_PROGRESS or RETURNED", () => {
    for (const status of ["IN_PROGRESS", "RETURNED"]) {
      const result = buildTodaySchedules({
        schedules: [
          {
            id: "sched-1",
            scheduledDate: TODAY_WED,
            truckId: "truck-1",
            status: "DISPATCHED",
          },
        ],
        templates: WED_TEMPLATES,
        trips: [
          {
            id: "trip-1",
            truckId: "truck-1",
            status,
            rawStatus: status,
            departureTime: `${TODAY_WED}T08:00:00+08:00`,
          },
        ],
        vehicles: VEHICLES,
        zones: ZONES,
        salesUsers: SALES_USERS,
        drivers: DRIVERS,
        todayPht: TODAY_WED,
      });

      assert.equal(result.length, 0, `Expected no READY entry when trip is ${status}`);
    }
  });

  test("keeps cancelled direct schedule suppressed when no trip was completed today", () => {
    const result = buildTodaySchedules({
      schedules: [
        {
          id: "sched-cancel",
          scheduledDate: TODAY_WED,
          truckId: "truck-1",
          status: "CANCELLED",
        },
      ],
      templates: WED_TEMPLATES,
      trips: [],
      vehicles: VEHICLES,
      zones: ZONES,
      salesUsers: SALES_USERS,
      drivers: DRIVERS,
      todayPht: TODAY_WED,
    });

    assert.equal(result.length, 0);
  });

  test("re-adds reconciled/completed vehicle as re-dispatchable READY entry on the same day", () => {
    for (const reconStatus of ["AWAITING_SYNC", "BALANCED", "DISCREPANCY_REVIEW", "SETTLED", "COMPLETED"]) {
      const result = buildTodaySchedules({
        schedules: [
          {
            id: "sched-1",
            scheduledDate: TODAY_WED,
            truckId: "truck-1",
            zoneId: "zone-1",
            salesUserId: "sales-1",
            status: "COMPLETED",
          },
        ],
        templates: WED_TEMPLATES,
        trips: [
          {
            id: "trip-1",
            tripNumber: "TRIP-001",
            truckId: "truck-1",
            truckPlate: "ABC-1002",
            zoneId: "zone-1",
            zoneCode: "Z1",
            zoneName: "Downtown",
            salesUserId: "sales-1",
            rawStatus: "COMPLETED",
            status: reconStatus,
            departureTime: `${TODAY_WED}T08:00:00+08:00`,
            returnTime: `${TODAY_WED}T11:30:00+08:00`,
          },
        ],
        vehicles: VEHICLES,
        zones: ZONES,
        salesUsers: SALES_USERS,
        drivers: DRIVERS,
        todayPht: TODAY_WED,
      });

      assert.equal(result.length, 1, `Expected re-dispatch entry for status ${reconStatus}`);
      assert.equal(result[0].id, "redispatch-truck-1");
      assert.equal(result[0].truckPlate, "ABC-1002");
      assert.equal(result[0].status, "SCHEDULED");
      assert.equal(result[0].isRedispatch, true);
      assert.equal(result[0].isTemplateDerived, true);
      assert.equal(result[0].completedTripsTodayCount, 1);
      assert.equal(result[0].lastCompletedTrip.id, "trip-1");
    }
  });

  test("handles ad-hoc vehicle completed today (no template or schedule) and tracks multiple trips", () => {
    const result = buildTodaySchedules({
      schedules: [],
      templates: [],
      trips: [
        {
          id: "trip-a",
          truckId: "truck-2",
          truckPlate: "XYZ-2004",
          zoneId: "zone-1",
          zoneCode: "Z1",
          zoneName: "Downtown",
          salesUserId: "sales-1",
          rawStatus: "COMPLETED",
          status: "SETTLED",
          departureTime: `${TODAY_WED}T07:00:00+08:00`,
          returnTime: `${TODAY_WED}T10:00:00+08:00`,
        },
        {
          id: "trip-b",
          truckId: "truck-2",
          truckPlate: "XYZ-2004",
          zoneId: "zone-1",
          zoneCode: "Z1",
          zoneName: "Downtown",
          salesUserId: "sales-1",
          rawStatus: "COMPLETED",
          status: "AWAITING_SYNC",
          departureTime: `${TODAY_WED}T12:00:00+08:00`,
          returnTime: `${TODAY_WED}T15:00:00+08:00`,
        },
      ],
      vehicles: VEHICLES,
      zones: ZONES,
      salesUsers: SALES_USERS,
      drivers: DRIVERS,
      todayPht: TODAY_WED,
    });

    assert.equal(result.length, 1);
    assert.equal(result[0].truckPlate, "XYZ-2004");
    assert.equal(result[0].isRedispatch, true);
    assert.equal(result[0].completedTripsTodayCount, 2);
    assert.equal(result[0].lastCompletedTrip.id, "trip-b");
  });

  test("excludes vehicle from re-dispatch if second trip is currently IN_PROGRESS", () => {
    const result = buildTodaySchedules({
      schedules: [],
      templates: WED_TEMPLATES,
      trips: [
        {
          id: "trip-1",
          truckId: "truck-1",
          rawStatus: "COMPLETED",
          status: "SETTLED",
          departureTime: `${TODAY_WED}T08:00:00+08:00`,
        },
        {
          id: "trip-2",
          truckId: "truck-1",
          rawStatus: "IN_PROGRESS",
          status: "IN_PROGRESS",
          departureTime: `${TODAY_WED}T13:00:00+08:00`,
        },
      ],
      vehicles: VEHICLES,
      zones: ZONES,
      salesUsers: SALES_USERS,
      drivers: DRIVERS,
      todayPht: TODAY_WED,
    });

    assert.equal(result.length, 0);
  });

  test("excludes direct SCHEDULED entry when vehicle already has an IN_PROGRESS or RETURNED trip", () => {
    for (const status of ["IN_PROGRESS", "RETURNED"]) {
      const result = buildTodaySchedules({
        schedules: [
          {
            id: "sched-direct-1",
            scheduledDate: TODAY_WED,
            truckId: "truck-1",
            status: "SCHEDULED",
          },
        ],
        templates: [],
        trips: [
          {
            id: "trip-active-1",
            truckId: "truck-1",
            status,
            rawStatus: status,
            departureTime: `${TODAY_WED}T08:00:00+08:00`,
          },
        ],
        vehicles: VEHICLES,
        zones: ZONES,
        salesUsers: SALES_USERS,
        drivers: DRIVERS,
        todayPht: TODAY_WED,
      });

      assert.equal(result.length, 0, `Expected direct SCHEDULED to be suppressed when trip is ${status}`);
    }
  });

  test("deduplicates multiple direct SCHEDULED entries for the same truckId", () => {
    const result = buildTodaySchedules({
      schedules: [
        {
          id: "sched-a",
          scheduledDate: TODAY_WED,
          truckId: "truck-1",
          status: "SCHEDULED",
        },
        {
          id: "sched-b",
          scheduledDate: TODAY_WED,
          truckId: "truck-1",
          status: "SCHEDULED",
        },
      ],
      templates: [],
      trips: [],
      vehicles: VEHICLES,
      zones: ZONES,
      salesUsers: SALES_USERS,
      drivers: DRIVERS,
      todayPht: TODAY_WED,
    });

    assert.equal(result.length, 1);
    assert.equal(result[0].id, "sched-a");
  });

  test("helper predicates classify trip states accurately", () => {
    assert.equal(isTripActiveOrReturned({ rawStatus: "IN_PROGRESS", status: "IN_PROGRESS" }), true);
    assert.equal(isTripActiveOrReturned({ rawStatus: "RETURNED", status: "RETURNED" }), true);
    assert.equal(isTripActiveOrReturned({ rawStatus: "COMPLETED", status: "SETTLED" }), false);

    assert.equal(isTripCompleted({ rawStatus: "COMPLETED", status: "SETTLED" }), true);
    assert.equal(isTripCompleted({ rawStatus: "COMPLETED", status: "AWAITING_SYNC" }), true);
    assert.equal(isTripCompleted({ rawStatus: "CANCELLED", status: "CANCELLED" }), false);
    assert.equal(isTripCompleted({ rawStatus: "IN_PROGRESS", status: "IN_PROGRESS" }), false);
  });
});

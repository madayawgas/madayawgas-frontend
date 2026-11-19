import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeSalesPeriodRange,
  buildSalesChartData,
} from "../src/utils/salesAnalytics.js";

describe("computeSalesPeriodRange", () => {
  const todayStr = "2026-11-20";

  it("computes PHT calendar day bounds for daily", () => {
    const res = computeSalesPeriodRange("daily", todayStr);
    assert.equal(res.timeframe, "daily");
    assert.equal(res.startDate, new Date("2026-11-20T00:00:00.000+08:00").toISOString());
    assert.equal(res.endDate, new Date("2026-11-20T23:59:59.999+08:00").toISOString());
  });

  it("computes 7 PHT calendar days ending today for weekly", () => {
    const res = computeSalesPeriodRange("weekly", todayStr);
    assert.equal(res.timeframe, "weekly");
    assert.equal(res.startDate, new Date("2026-11-14T00:00:00.000+08:00").toISOString());
    assert.equal(res.endDate, new Date("2026-11-20T23:59:59.999+08:00").toISOString());
  });

  it("computes Jan 1 to today PHT for monthly (actual calendar year)", () => {
    const res = computeSalesPeriodRange("monthly", todayStr);
    assert.equal(res.timeframe, "monthly");
    assert.equal(res.startDate, new Date("2026-01-01T00:00:00.000+08:00").toISOString());
    assert.equal(res.endDate, new Date("2026-11-20T23:59:59.999+08:00").toISOString());
  });

  it("returns null bounds and annually timeframe for yearly", () => {
    const res = computeSalesPeriodRange("yearly", todayStr);
    assert.deepEqual(res, {
      startDate: null,
      endDate: null,
      timeframe: "annually",
    });
  });
});

describe("buildSalesChartData", () => {
  it("builds 24 hourly buckets for daily", () => {
    const data = buildSalesChartData(
      {
        salesTrends: [
          { name: "8 AM", canisters: 5, cylinders: 2, totalRevenue: 2500 },
          { name: "14:00", butane: 3, lpg11kg: 1, lpg50kg: 1, grossSales: 4000 },
        ],
      },
      "daily"
    );
    assert.equal(data.length, 24);
    assert.deepEqual(data[8], {
      name: "8 AM",
      canisters: 5,
      cylinders: 2,
      totalRevenue: 2500,
    });
    assert.deepEqual(data[14], {
      name: "2 PM",
      canisters: 3,
      cylinders: 2,
      totalRevenue: 4000,
    });
  });

  it("builds 7 PHT calendar day buckets for weekly", () => {
    const data = buildSalesChartData(
      {
        salesTrends: [
          { date: "2026-11-20", canisters: 10, cylinders: 4, totalRevenue: 7500 },
        ],
      },
      "weekly",
      "2026-11-20"
    );
    assert.equal(data.length, 7);
    assert.equal(data[0].name, "Nov 14");
    assert.deepEqual(data[6], {
      name: "Nov 20",
      canisters: 10,
      cylinders: 4,
      totalRevenue: 7500,
    });
  });

  it("builds 12 Jan-Dec buckets for monthly", () => {
    const data = buildSalesChartData(
      {
        salesTrends: [
          { name: "2026-11", canisters: 20, cylinders: 15, totalRevenue: 30000 },
          { name: "Jan", canisters: 4, cylinders: 1, totalRevenue: 5000 },
        ],
      },
      "monthly"
    );
    assert.equal(data.length, 12);
    assert.deepEqual(data[0], {
      name: "Jan",
      canisters: 4,
      cylinders: 1,
      totalRevenue: 5000,
    });
    assert.deepEqual(data[10], {
      name: "Nov",
      canisters: 20,
      cylinders: 15,
      totalRevenue: 30000,
    });
  });

  it("filters empty years and sorts ascending for yearly", () => {
    const data = buildSalesChartData(
      {
        salesTrends: [
          { year: "2026", canisters: 12, cylinders: 8, totalRevenue: 18000 },
          { year: "2024", canisters: 0, cylinders: 0, totalRevenue: 0 },
          { year: "2025", canisters: 5, cylinders: 3, totalRevenue: 7000 },
        ],
      },
      "yearly"
    );
    assert.deepEqual(data, [
      { name: "2025", canisters: 5, cylinders: 3, totalRevenue: 7000 },
      { name: "2026", canisters: 12, cylinders: 8, totalRevenue: 18000 },
    ]);
  });
});

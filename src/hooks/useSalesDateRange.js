// src/hooks/useSalesDateRange.js
import { useMemo, useState } from "react";
import { getPhilippineTodayString } from "../utils/date.js";

export const SALES_DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "all", label: "All Time" },
];

/**
 * Computes exact Asia/Manila (+08:00) ISO date range boundaries for Sales & Delivery queries.
 * Avoids browser-local timezone drift and UTC-midnight mismatches.
 */
export function computePhilippineDateRange(preset) {
  const todayStr = getPhilippineTodayString(); // "YYYY-MM-DD" in Asia/Manila
  if (!todayStr || preset === "all") {
    return { startDate: null, endDate: null };
  }

  const endOfTodayPht = new Date(`${todayStr}T23:59:59.999+08:00`);
  if (preset === "today") {
    const startOfTodayPht = new Date(`${todayStr}T00:00:00.000+08:00`);
    return {
      startDate: startOfTodayPht.toISOString(),
      endDate: endOfTodayPht.toISOString(),
    };
  }

  if (preset === "last7" || preset === "last30") {
    const daysBack = preset === "last7" ? 6 : 29;
    const startPht = new Date(`${todayStr}T00:00:00.000+08:00`);
    startPht.setUTCDate(startPht.getUTCDate() - daysBack);
    return {
      startDate: startPht.toISOString(),
      endDate: endOfTodayPht.toISOString(),
    };
  }

  if (preset === "thisMonth") {
    const [year, month] = todayStr.split("-");
    const startOfMonthPht = new Date(`${year}-${month}-01T00:00:00.000+08:00`);
    return {
      startDate: startOfMonthPht.toISOString(),
      endDate: endOfTodayPht.toISOString(),
    };
  }

  return { startDate: null, endDate: null };
}

export function useSalesDateRange(initialPreset = "last30") {
  const [dateRangePreset, setDateRangePreset] = useState(initialPreset);

  const dateFilter = useMemo(
    () => computePhilippineDateRange(dateRangePreset),
    [dateRangePreset]
  );

  return {
    dateRangePreset,
    setDateRangePreset,
    dateFilter,
  };
}

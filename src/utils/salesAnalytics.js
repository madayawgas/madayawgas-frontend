import {
  getPhilippineTodayString,
  parsePhilippineDate,
  PHILIPPINE_TIMEZONE,
} from "./date.js";

export const SALES_PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export const SALES_PERIOD_LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  annually: "Yearly",
};

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatHourLabel(hour24) {
  const h = ((hour24 % 24) + 24) % 24;
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function getPhtParts(dateInput) {
  const parsed = parsePhilippineDate(dateInput);
  if (!parsed) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PHILIPPINE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(parsed);
  const map = parts.reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  const hourNum = Number(map.hour) === 24 ? 0 : Number(map.hour);
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    dateKey: `${map.year}-${map.month}-${map.day}`,
    hour: Number.isFinite(hourNum) ? hourNum : 0,
  };
}

function extractRowRevenue(row) {
  const raw =
    row?.totalRevenue ??
    row?.totalSales ??
    row?.grossSales ??
    row?.revenue ??
    row?.totalAmount ??
    row?.amount;
  return raw !== undefined && raw !== null ? Number(raw) || 0 : null;
}

/**
 * Compute Philippine Standard Time (Asia/Manila) date bounds and API timeframe
 * for the selected sales period ("daily" | "weekly" | "monthly" | "yearly").
 *
 * @param {string} period
 * @param {string} [todayStrOverride] - Optional YYYY-MM-DD override for testing
 * @returns {{ startDate: string | null, endDate: string | null, timeframe: string }}
 */
export function computeSalesPeriodRange(period, todayStrOverride) {
  const normalizedPeriod = period === "annually" ? "yearly" : period;
  const todayStr = todayStrOverride || getPhilippineTodayString();
  if (!todayStr || normalizedPeriod === "yearly") {
    return { startDate: null, endDate: null, timeframe: "annually" };
  }

  const endOfTodayPht = new Date(`${todayStr}T23:59:59.999+08:00`);
  if (normalizedPeriod === "daily") {
    const startOfTodayPht = new Date(`${todayStr}T00:00:00.000+08:00`);
    return {
      startDate: startOfTodayPht.toISOString(),
      endDate: endOfTodayPht.toISOString(),
      timeframe: "daily",
    };
  }

  if (normalizedPeriod === "weekly") {
    const startPht = new Date(`${todayStr}T00:00:00.000+08:00`);
    startPht.setUTCDate(startPht.getUTCDate() - 6);
    return {
      startDate: startPht.toISOString(),
      endDate: endOfTodayPht.toISOString(),
      timeframe: "weekly",
    };
  }

  // monthly: full current year so all months with data render per month
  const [year] = todayStr.split("-");
  const startOfYearPht = new Date(`${year}-01-01T00:00:00.000+08:00`);
  return {
    startDate: startOfYearPht.toISOString(),
    endDate: endOfTodayPht.toISOString(),
    timeframe: "monthly",
  };
}

/**
 * Normalize sales overview / analytics API response into consistent chart buckets
 * for Hourly (daily), 7-Day PHT (weekly), Jan–Dec (monthly), or Per-Year (yearly).
 *
 * @param {object} analyticsData
 * @param {string} period
 * @param {string} [todayStrOverride] - Optional YYYY-MM-DD override for testing
 * @returns {Array<{ name: string, canisters: number, cylinders: number, totalRevenue: number }>}
 */
export function buildSalesChartData(analyticsData, period, todayStrOverride) {
  const normalizedPeriod = period === "annually" ? "yearly" : period;
  const legacySeries =
    normalizedPeriod === "weekly"
      ? analyticsData?.weekly
      : normalizedPeriod === "monthly"
      ? analyticsData?.monthly
      : normalizedPeriod === "yearly"
      ? analyticsData?.annually
      : null;

  const rawTrends =
    Array.isArray(analyticsData?.salesTrends) && analyticsData.salesTrends.length > 0
      ? analyticsData.salesTrends
      : Array.isArray(legacySeries)
      ? legacySeries
      : [];

  if (normalizedPeriod === "daily") {
    const buckets = Array.from({ length: 24 }, (_, h) => ({
      name: formatHourLabel(h),
      canisters: 0,
      cylinders: 0,
      totalRevenue: 0,
    }));

    rawTrends.forEach((row) => {
      const label = String(row.name ?? row.hour ?? "").trim();
      let hourIdx = -1;
      const ampmMatch = label.match(/^(\d{1,2})(?::\d{2})?\s*(AM|PM)$/i);
      if (ampmMatch) {
        let h = parseInt(ampmMatch[1], 10) % 12;
        if (ampmMatch[2].toUpperCase() === "PM") h += 12;
        hourIdx = h;
      } else {
        const numMatch = label.match(/^(\d{1,2})(?::\d{2})?$/);
        if (numMatch) {
          const h = parseInt(numMatch[1], 10);
          if (h >= 0 && h < 24) hourIdx = h;
        }
      }
      if (hourIdx >= 0 && hourIdx < 24) {
        const canisters = Number(row.canisters ?? row.butane ?? 0);
        const cylinders = Number(
          row.cylinders ?? (Number(row.lpg11kg || 0) + Number(row.lpg50kg || 0))
        );
        const rev = extractRowRevenue(row);
        buckets[hourIdx].canisters += canisters;
        buckets[hourIdx].cylinders += cylinders;
        if (rev !== null) {
          buckets[hourIdx].totalRevenue += rev;
        }
      }
    });

    return buckets;
  }

  if (normalizedPeriod === "weekly") {
    const todayStr = todayStrOverride || getPhilippineTodayString();
    const buckets = [];
    const bucketByKey = new Map();
    const bucketByLabel = new Map();

    if (todayStr) {
      const base = new Date(`${todayStr}T00:00:00.000+08:00`);
      for (let offset = 6; offset >= 0; offset -= 1) {
        const d = new Date(base);
        d.setUTCDate(d.getUTCDate() - offset);
        const pht = getPhtParts(d);
        const label = new Intl.DateTimeFormat("en-US", {
          timeZone: PHILIPPINE_TIMEZONE,
          month: "short",
          day: "numeric",
        }).format(d);
        const entry = {
          name: label,
          dateKey: pht?.dateKey,
          canisters: 0,
          cylinders: 0,
          totalRevenue: 0,
        };
        buckets.push(entry);
        if (pht?.dateKey) bucketByKey.set(pht.dateKey, entry);
        bucketByLabel.set(label.toLowerCase(), entry);
      }
    }

    rawTrends.forEach((row) => {
      const rawKey = String(row.date || row.name || "").trim();
      let target =
        bucketByKey.get(rawKey) || bucketByLabel.get(rawKey.toLowerCase());
      if (!target && rawKey) {
        const parsed = parsePhilippineDate(rawKey);
        const pht = parsed ? getPhtParts(parsed) : null;
        if (pht?.dateKey) target = bucketByKey.get(pht.dateKey);
      }
      if (target) {
        const canisters = Number(row.canisters ?? row.butane ?? 0);
        const cylinders = Number(
          row.cylinders ?? (Number(row.lpg11kg || 0) + Number(row.lpg50kg || 0))
        );
        const rev = extractRowRevenue(row);
        target.canisters += canisters;
        target.cylinders += cylinders;
        if (rev !== null) {
          target.totalRevenue += rev;
        }
      }
    });

    return buckets.map(({ name, canisters, cylinders, totalRevenue }) => ({
      name,
      canisters,
      cylinders,
      totalRevenue,
    }));
  }

  if (normalizedPeriod === "monthly") {
    const buckets = MONTH_LABELS.map((label) => ({
      name: label,
      canisters: 0,
      cylinders: 0,
      totalRevenue: 0,
    }));

    rawTrends.forEach((row) => {
      const label = String(row.name ?? row.month ?? "").trim();
      let monthIdx = MONTH_LABELS.findIndex((m) =>
        label.toLowerCase().startsWith(m.toLowerCase())
      );
      if (monthIdx === -1) {
        const isoMatch = label.match(/^\d{4}-(\d{2})/);
        if (isoMatch) monthIdx = parseInt(isoMatch[1], 10) - 1;
      }
      if (monthIdx >= 0 && monthIdx < 12) {
        const canisters = Number(row.canisters ?? row.butane ?? 0);
        const cylinders = Number(
          row.cylinders ?? (Number(row.lpg11kg || 0) + Number(row.lpg50kg || 0))
        );
        const rev = extractRowRevenue(row);
        buckets[monthIdx].canisters += canisters;
        buckets[monthIdx].cylinders += cylinders;
        if (rev !== null) {
          buckets[monthIdx].totalRevenue += rev;
        }
      }
    });

    return buckets;
  }

  // yearly: each year with data
  const yearMap = new Map();
  rawTrends.forEach((row) => {
    const label = String(row.name ?? row.year ?? "").trim();
    const yearMatch = label.match(/\b(\d{4})\b/);
    const yearKey = yearMatch ? yearMatch[1] : label;
    if (!yearKey) return;
    const canisters = Number(row.canisters ?? row.butane ?? 0);
    const cylinders = Number(
      row.cylinders ?? (Number(row.lpg11kg || 0) + Number(row.lpg50kg || 0))
    );
    const rev = extractRowRevenue(row);
    const entry = yearMap.get(yearKey) || {
      name: yearKey,
      canisters: 0,
      cylinders: 0,
      totalRevenue: 0,
    };
    entry.canisters += canisters;
    entry.cylinders += cylinders;
    if (rev !== null) {
      entry.totalRevenue += rev;
    }
    yearMap.set(yearKey, entry);
  });

  return Array.from(yearMap.values())
    .filter((y) => y.canisters > 0 || y.cylinders > 0 || y.totalRevenue > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

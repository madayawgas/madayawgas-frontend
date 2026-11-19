// src/pages/SalesAndDelivery/SalesOverviewPage.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Banknote,
  ShoppingCart,
  Package,
  Layers,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { salesApi } from "../../api/sales.js";
import {
  SALES_PERIOD_OPTIONS,
  computeSalesPeriodRange,
  buildSalesChartData,
} from "../../utils/salesAnalytics.js";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh.js";
import SalesPageHeader from "../../components/sales/SalesPageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import InfoTooltip from "../../components/ui/InfoTooltip";

const getAnalyticsCacheKey = (period) => `app_sales_analytics_cache_${period}`;

function readAnalyticsCache(period) {
  try {
    const cached = localStorage.getItem(getAnalyticsCacheKey(period));
    if (cached) return JSON.parse(cached);
  } catch {
    // ignore
  }
  return null;
}

export default function SalesOverviewPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("monthly");
  const dateFilter = useMemo(() => computeSalesPeriodRange(period), [period]);

  const [chartMode, setChartMode] = useState("containerType"); // "containerType" | "total"
  const [analyticsData, setAnalyticsData] = useState(() => readAnalyticsCache("monthly") || {});
  const [isLoading, setIsLoading] = useState(() => !readAnalyticsCache("monthly"));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const handlePeriodChange = useCallback((nextPeriod) => {
    setPeriod(nextPeriod);
    const cached = readAnalyticsCache(nextPeriod);
    if (cached) {
      setAnalyticsData(cached);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, []);

  const fetchOverview = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setIsRefreshing(true);
      setFetchError("");
      try {
        const res = await salesApi.getSalesAnalytics({
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate,
          timeframe: dateFilter.timeframe,
        });

        if (res) {
          setAnalyticsData(res);
          try {
            localStorage.setItem(getAnalyticsCacheKey(period), JSON.stringify(res));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error("Failed to fetch sales overview:", err);
        setFetchError(
          err?.message || "Unable to load sales analytics. Showing cached data."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [dateFilter.startDate, dateFilter.endDate, dateFilter.timeframe, period]
  );

  useEffect(() => {
    fetchOverview(false);
  }, [fetchOverview]);

  useRealtimeRefresh({
    events: ["SALES_BATCH_SYNCED", "SALES_INVOICE_VERIFIED"],
    onRefresh: () => fetchOverview(false),
  });

  const summary = analyticsData?.summary || {};
  const paymentBreakdown = analyticsData?.paymentBreakdown || {
    cash: {},
    gcash: {},
  };

  // Transform SKU series into Hourly (daily), 7-Day (weekly), Per-Month (monthly), or Per-Year (yearly) buckets
  const chartData = useMemo(
    () => buildSalesChartData(analyticsData, period),
    [analyticsData, period]
  );

  const totalGrossSales = Number(summary.totalGrossSales) || 0;
  const completedOrders = summary.completedTransactions || 0;
  const cancelledOrders = summary.cancelledTransactions || 0;
  const avgOrderValue = Number(summary.averageOrderValue) || 0;
  const totalUnitsSold = summary.totalUnitsSold || 0;
  const canisterUnitsSold = summary.canisterUnitsSold || 0;
  const cylinderUnitsSold = summary.cylinderUnitsSold || 0;
  const netCanisterDebt = summary.netCanisterDebtCreated || 0;

  const cashAmount = Number(paymentBreakdown.cash?.totalAmount) || 0;
  const cashCount = paymentBreakdown.cash?.count || 0;
  const gcashAmount = Number(paymentBreakdown.gcash?.totalAmount) || 0;
  const gcashCount = paymentBreakdown.gcash?.count || 0;
  const gcashUnverified = paymentBreakdown.gcash?.unverifiedCount || 0;
  const gcashVerified = paymentBreakdown.gcash?.verifiedCount || 0;

  const activeProducts = useMemo(() => {
    const productBreakdown = analyticsData?.productBreakdown || [];
    return productBreakdown.filter((p) => p.unitsSold > 0);
  }, [analyticsData?.productBreakdown]);

  // Horizontal scroll guard for dense daily/weekly intervals
  const chartMinWidth =
    chartData.length > 12 ? `${chartData.length * 56}px` : "100%";

  const headerPills = [
    {
      icon: Banknote,
      label: `₱${totalGrossSales.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} Gross Sales`,
      tone: "info",
    },
    ...(gcashUnverified > 0
      ? [
          {
            icon: Clock,
            label: `${gcashUnverified} Pending GCash`,
            tone: "warning",
            onClick: () =>
              navigate("/sales/transactions?paymentStatus=PAID_UNVERIFIED"),
          },
        ]
      : []),
  ];

  return (
    <div className="h-[calc(100vh-112px)] md:h-[calc(100vh-128px)] overflow-hidden flex flex-col">
      <SalesPageHeader
        pills={headerPills}
        dateRangePreset={period}
        onDateRangeChange={handlePeriodChange}
        dateRangeOptions={SALES_PERIOD_OPTIONS}
        onRefresh={() => fetchOverview(true)}
        isRefreshing={isRefreshing}
      />

      {fetchError && (
        <div className="shrink-0 mb-3 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-[#C93B32] flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-medium">
            <AlertCircle size={15} />
            <span>{fetchError}</span>
          </span>
          <button
            type="button"
            onClick={() => fetchOverview(true)}
            className="font-bold underline cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-5 pb-4">
        {/* 1. 4 Focused KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Gross Sales */}
          <div className="bg-white rounded-2xl p-4 border border-[#BCE1F1]/60 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#6D8AA2] mb-1">
              <span className="text-xs font-semibold flex items-center gap-1">
                <span>Gross Sales</span>
                <InfoTooltip
                  align="left"
                  position="bottom"
                  text="Total completed mobile delivery revenue within the selected date range."
                  label="About gross sales"
                />
              </span>
              <div className="p-1.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E]">
                <Banknote size={15} />
              </div>
            </div>
            <p className="text-xl font-bold text-[#0A4B6E] tracking-tight tabular-nums">
              ₱
              {totalGrossSales.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-[#6D8AA2] mt-1 font-medium">
              Mobile delivery revenue
            </p>
          </div>

          {/* Completed Orders + Avg Order Value */}
          <div className="bg-white rounded-2xl p-4 border border-[#BCE1F1]/60 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#6D8AA2] mb-1">
              <span className="text-xs font-semibold flex items-center gap-1">
                <span>Completed Orders</span>
                {cancelledOrders > 0 && (
                  <InfoTooltip
                    position="bottom"
                    text={`${cancelledOrders} cancelled or voided orders excluded from gross sales.`}
                    label="Cancelled orders info"
                  />
                )}
              </span>
              <div className="p-1.5 rounded-full bg-sky-50 text-[#0F7AB2]">
                <ShoppingCart size={15} />
              </div>
            </div>
            <p className="text-xl font-bold text-[#0A4B6E] tracking-tight tabular-nums">
              {completedOrders}{" "}
              <span className="text-xs font-medium text-slate-500">Orders</span>
            </p>
            <p className="text-xs text-[#6D8AA2] mt-1 font-medium tabular-nums">
              Avg. ₱
              {avgOrderValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              / order
            </p>
          </div>

          {/* Units Sold */}
          <div className="bg-white rounded-2xl p-4 border border-[#BCE1F1]/60 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#6D8AA2] mb-1">
              <span className="text-xs font-semibold">Units Sold</span>
              <div className="p-1.5 rounded-full bg-amber-50 text-amber-700">
                <Package size={15} />
              </div>
            </div>
            <p className="text-xl font-bold text-[#0A4B6E] tracking-tight tabular-nums">
              {totalUnitsSold.toLocaleString()}{" "}
              <span className="text-xs font-medium text-slate-500">Units</span>
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Badge variant="info">{canisterUnitsSold} Canisters</Badge>
              <Badge variant="warning">{cylinderUnitsSold} Cylinders</Badge>
            </div>
          </div>

          {/* Net Canister Debt */}
          <div className="bg-white rounded-2xl p-4 border border-[#BCE1F1]/60 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#6D8AA2] mb-1">
              <span className="text-xs font-semibold flex items-center gap-1">
                <span>Canister Debt</span>
                <InfoTooltip
                  align="right"
                  position="bottom"
                  text="Net change in customer-held shells (full units loaned minus empty shells returned)."
                  label="About canister debt"
                />
              </span>
              <div
                className={`p-1.5 rounded-full ${
                  netCanisterDebt > 0
                    ? "bg-amber-50 text-amber-700"
                    : "bg-[#E8F3F8] text-[#0A4B6E]"
                }`}
              >
                <Layers size={15} />
              </div>
            </div>
            <p
              className={`text-xl font-bold tracking-tight tabular-nums ${
                netCanisterDebt > 0 ? "text-amber-700" : "text-[#0A4B6E]"
              }`}
            >
              {netCanisterDebt > 0 ? `+${netCanisterDebt}` : netCanisterDebt}{" "}
              <span className="text-xs font-medium text-slate-500">
                Canisters
              </span>
            </p>
            <p className="text-xs text-[#6D8AA2] mt-1 font-medium">
              {netCanisterDebt > 0 ? "Net shells out" : "Balanced / returned"}
            </p>
          </div>
        </div>

        {/* 2. Scalable Sales Trend Chart */}
        <Card className="p-4 md:p-5 flex flex-col">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#0A4B6E]">
                Sales Trend
              </h3>
              <InfoTooltip
                align="left"
                position="bottom"
                text="Grouped by container category so the chart stays readable as new products are added. See the table below for individual SKUs."
                label="About sales trend chart"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Metric Mode Toggle */}
              <div
                className="flex items-center gap-1 bg-[#F3F5F7] p-1 rounded-full border border-slate-200"
                role="group"
                aria-label="Chart metric view"
              >
                <button
                  type="button"
                  onClick={() => setChartMode("containerType")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    chartMode === "containerType"
                      ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs"
                      : "text-[#486581] hover:text-[#0A4B6E]"
                  }`}
                >
                  By Container Type
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("total")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    chartMode === "total"
                      ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs"
                      : "text-[#486581] hover:text-[#0A4B6E]"
                  }`}
                >
                  Total Sales
                </button>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-5 mb-3 text-xs font-semibold text-[#0A4B6E]">
            {chartMode === "containerType" ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-2 bg-[#0F7AB2] rounded-full" />
                  <span>Cylinders (11kg / 50kg)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-2 bg-[#93B5D0] rounded-full" />
                  <span>Canisters (Butane)</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-2 bg-[#0A4B6E] rounded-full" />
                <span>Total Gross Sales (₱)</span>
              </div>
            )}
          </div>

          {/* Chart Container with Horizontal Scroll Guard */}
          <div
            className={`w-full border border-slate-200 rounded-xl h-[260px] overflow-x-auto custom-scrollbar p-2 flex items-center ${
              isLoading || chartData.length === 0 ? "justify-center" : "justify-start"
            }`}
          >
            {isLoading ? (
              <p className="text-xs text-slate-500 font-medium">
                Loading sales analytics...
              </p>
            ) : chartData.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium">
                No sales records for this date range
              </p>
            ) : (
              <div
                className="shrink-0"
                style={{ minWidth: chartMinWidth, width: "100%", height: "100%" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 4, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E5E7EB"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
                      dy={6}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={chartMode === "total"}
                      tick={{ fill: "#475569", fontSize: 12 }}
                      tickFormatter={(val) =>
                        chartMode === "total"
                          ? `₱${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                          : `${val >= 1000 ? `${Math.round(val / 1000)}k` : Math.round(val)}`
                      }
                    />
                    <Tooltip
                      formatter={(val, name) => [
                        chartMode === "total"
                          ? `₱${Number(val || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : Math.round(Number(val || 0)).toLocaleString("en-US"),
                        name,
                      ]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #D5E3EC",
                        boxShadow: "0 4px 12px rgba(10, 75, 110, 0.08)",
                        fontSize: "12px",
                      }}
                    />
                    {chartMode === "containerType" ? (
                      <>
                        <Bar
                          dataKey="cylinders"
                          name="Cylinders"
                          stackId="sales"
                          fill="#0F7AB2"
                          barSize={26}
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="canisters"
                          name="Canisters"
                          stackId="sales"
                          fill="#93B5D0"
                          barSize={26}
                          radius={[4, 4, 0, 0]}
                        />
                      </>
                    ) : (
                      <Bar
                        dataKey="totalRevenue"
                        name="Total Sales"
                        fill="#0A4B6E"
                        barSize={28}
                        radius={[4, 4, 0, 0]}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>

        {/* 3. Product Breakdown & Payment Settlement */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Full Product SKU Breakdown */}
          <Card className="lg:col-span-2 p-4 md:p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-bold text-[#0A4B6E]">
                  Product Sales Breakdown
                </h3>
                <InfoTooltip
                  align="left"
                  text="All active product SKUs sold in this period, including empty shell returns and revenue share."
                  label="About product breakdown"
                />
              </div>
              <span className="text-xs font-semibold text-[#6D8AA2]">
                {activeProducts.length} SKUs
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar border border-[#0A4B6E]/30 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#0D4B6E] text-white font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3 text-right">Sold</th>
                    <th className="py-3 px-3 text-right">Gross Sales</th>
                    <th className="py-3 px-3 text-right">Empties</th>
                    <th className="py-3 px-3 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-slate-700 bg-white">
                  {activeProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-slate-500"
                      >
                        No product sales recorded
                      </td>
                    </tr>
                  ) : (
                    activeProducts.map((item) => (
                      <tr
                        key={item.productId}
                        className="hover:bg-[#F4F9FC] transition-colors"
                      >
                        <td className="py-3 px-3 font-semibold text-[#0A4B6E]">
                          {item.productName}
                        </td>
                        <td className="py-3 px-3 text-slate-600 capitalize">
                          {(item.containerType || "").toLowerCase()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold tabular-nums">
                          {item.unitsSold.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#0A4B6E] tabular-nums">
                          ₱
                          {Number(item.totalRevenue).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600 tabular-nums">
                          {item.emptiesReturned.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800 tabular-nums">
                          {item.percentageRevenue}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Right: Payment Settlement Summary */}
          <Card className="p-4 md:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm md:text-base font-bold text-[#0A4B6E]">
                    Payment Settlement
                  </h3>
                  <InfoTooltip
                    align="right"
                    text="Cash remittances vs. GCash transfers. Customer cylinder loans are tracked separately in the Canister Ledger."
                    label="About payment settlement"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* Cash */}
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Banknote size={15} className="text-emerald-600" />
                      <span>Cash on Delivery</span>
                    </span>
                    <span className="font-bold text-emerald-700 tabular-nums">
                      {paymentBreakdown.cash?.percentage || 0}%
                    </span>
                  </div>
                  <p className="text-base font-bold text-[#0A4B6E] tabular-nums">
                    ₱
                    {cashAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {cashCount} cash orders
                  </p>
                </div>

                {/* GCash */}
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <CreditCard size={15} className="text-[#0F7AB2]" />
                      <span>GCash Transfers</span>
                    </span>
                    <span className="font-bold text-[#0F7AB2] tabular-nums">
                      {paymentBreakdown.gcash?.percentage || 0}%
                    </span>
                  </div>
                  <p className="text-base font-bold text-[#0A4B6E] tabular-nums">
                    ₱
                    {gcashAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {gcashCount} GCash orders
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 size={14} />
                      <span>{gcashVerified} Verified</span>
                    </span>
                    {gcashUnverified > 0 ? (
                      <Badge variant="warning">{gcashUnverified} Pending</Badge>
                    ) : (
                      <span className="text-slate-500 font-medium">
                        All verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {gcashUnverified > 0 && (
              <button
                type="button"
                onClick={() =>
                  navigate("/sales/transactions?paymentStatus=PAID_UNVERIFIED")
                }
                className="mt-4 w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider shadow-2xs transition-all cursor-pointer"
              >
                <span>Review Pending GCash</span>
                <ArrowRight size={14} />
              </button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

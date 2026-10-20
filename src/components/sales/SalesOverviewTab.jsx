// src/components/sales/SalesOverviewTab.jsx
import { useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Layers,
  ArrowUpRight,
  CreditCard,
  Banknote,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Card from "../ui/Card";

export default function SalesOverviewTab({
  analyticsData = {},
  isLoading = false,
  timeframe = "monthly",
  onTimeframeChange,
}) {
  const summary = analyticsData?.summary || {};
  const productBreakdown = analyticsData?.productBreakdown || [];
  const paymentBreakdown = analyticsData?.paymentBreakdown || { cash: {}, gcash: {} };
  const salesTrends = analyticsData?.salesTrends || [];

  const totalGrossSales = Number(summary.totalGrossSales) || 0;
  const completedOrders = summary.completedTransactions || 0;
  const totalOrders = summary.totalTransactions || 0;
  const cancelledOrders = summary.cancelledTransactions || 0;
  const totalUnitsSold = summary.totalUnitsSold || 0;
  const canisterUnitsSold = summary.canisterUnitsSold || 0;
  const cylinderUnitsSold = summary.cylinderUnitsSold || 0;
  const avgOrderValue = Number(summary.averageOrderValue) || 0;
  const netCanisterDebt = summary.netCanisterDebtCreated || 0;

  const cashAmount = Number(paymentBreakdown.cash?.totalAmount) || 0;
  const cashCount = paymentBreakdown.cash?.count || 0;
  const gcashAmount = Number(paymentBreakdown.gcash?.totalAmount) || 0;
  const gcashCount = paymentBreakdown.gcash?.count || 0;
  const gcashUnverified = paymentBreakdown.gcash?.unverifiedCount || 0;
  const gcashVerified = paymentBreakdown.gcash?.verifiedCount || 0;

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* 1. TOP STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Gross Sales */}
        <div className="bg-white rounded-2xl p-4 border border-[#BCE1F1]/50 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6D8AA2] mb-1">
            <span className="text-xs font-semibold">Total Gross Sales</span>
            <div className="p-1.5 rounded-full bg-emerald-50 text-emerald-600">
              <DollarSign size={15} />
            </div>
          </div>
          <p className="text-xl font-bold text-[#0A4B6E] tracking-tight">
            ₱{totalGrossSales.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#6D8AA2] mt-1 font-medium">
            Recorded mobile delivery sales
          </p>
        </div>

        {/* Card 2: Completed Transactions */}
        <div className="bg-white rounded-2xl p-4 border border-[#BCE1F1]/50 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6D8AA2] mb-1">
            <span className="text-xs font-semibold">Completed Orders</span>
            <div className="p-1.5 rounded-full bg-sky-50 text-[#0F7AB2]">
              <ShoppingCart size={15} />
            </div>
          </div>
          <p className="text-xl font-bold text-[#0A4B6E] tracking-tight">
            {completedOrders}{" "}
            <span className="text-xs font-medium text-slate-500">Orders</span>
          </p>
          <p className="text-[11px] text-[#6D8AA2] mt-1 font-medium">
            {cancelledOrders > 0 ? `${cancelledOrders} cancelled / voided` : "100% completion rate"}
          </p>
        </div>

        {/* Card 3: Total Units Sold */}
        <div className="bg-white rounded-2xl p-4 border border-[#BCE1F1]/50 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6D8AA2] mb-1">
            <span className="text-xs font-semibold">Units Sold</span>
            <div className="p-1.5 rounded-full bg-amber-50 text-amber-600">
              <Package size={15} />
            </div>
          </div>
          <p className="text-xl font-bold text-[#0A4B6E] tracking-tight">
            {totalUnitsSold.toLocaleString()}{" "}
            <span className="text-xs font-medium text-slate-500">Units</span>
          </p>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#0A4B6E] mt-1">
            <span className="bg-[#E8F3F8] px-1.5 py-0.5 rounded-full border border-[#BCE1F1]">
              {canisterUnitsSold} Canisters
            </span>
            <span className="bg-[#E8F3F8] px-1.5 py-0.5 rounded-full border border-[#BCE1F1]">
              {cylinderUnitsSold} Cylinders
            </span>
          </div>
        </div>

        {/* Card 4: Average Order Value */}
        <div className="bg-white rounded-2xl p-4 border border-[#BCE1F1]/50 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6D8AA2] mb-1">
            <span className="text-xs font-semibold">Avg. Order Value</span>
            <div className="p-1.5 rounded-full bg-indigo-50 text-indigo-600">
              <ArrowUpRight size={15} />
            </div>
          </div>
          <p className="text-xl font-bold text-[#0A4B6E] tracking-tight">
            ₱{avgOrderValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#6D8AA2] mt-1 font-medium">
            Per completed delivery stop
          </p>
        </div>

        {/* Card 5: Canister Cylinder Receivables */}
        <div className="bg-white rounded-2xl p-4 border border-[#BCE1F1]/50 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6D8AA2] mb-1">
            <span className="text-xs font-semibold">Canister Debt Created</span>
            <div className="p-1.5 rounded-full bg-emerald-50 text-emerald-700">
              <Layers size={15} />
            </div>
          </div>
          <p className="text-xl font-bold text-[#0A4B6E] tracking-tight">
            {netCanisterDebt > 0 ? `+${netCanisterDebt}` : netCanisterDebt}{" "}
            <span className="text-xs font-medium text-slate-500">Canisters</span>
          </p>
          <p className="text-[11px] text-[#6D8AA2] mt-1 font-medium">
            Loaned minus empties returned
          </p>
        </div>
      </div>

      {/* 2. SALES PERFORMANCE TRENDS CHART */}
      <Card className="p-4 md:p-5 flex flex-col">
        {/* Header & Timeframe Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div>
            <h3 className="text-base font-bold text-[#0A4B6E]">
              Sales Performance Over Time
            </h3>
            <p className="text-xs text-[#6D8AA2]">
              Gross sales and unit distribution across delivery reporting intervals
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F3F5F7] p-1 rounded-full border border-slate-200">
            {["daily", "weekly", "monthly", "annually"].map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange && onTimeframeChange(tf)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all capitalize cursor-pointer ${
                  timeframe === tf
                    ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-2xs"
                    : "text-[#486581] hover:text-[#0A4B6E]"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-4 text-xs font-semibold text-[#0F7AB2]">
          <div className="flex items-center gap-2">
            <span className="w-4 h-1.5 bg-[#93B5D0] rounded-full" />
            <span>Butane Canisters</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1.5 bg-[#0F7AB2] rounded-full" />
            <span>11 kg LPG</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1.5 bg-[#FFDF2C] rounded-full" />
            <span>50 kg LPG</span>
          </div>
        </div>

        {/* Chart View */}
        <div className="w-full border border-gray-200 rounded-xl h-[260px] flex items-center justify-center p-2">
          {isLoading ? (
            <p className="text-xs text-gray-400 font-medium">Loading sales analytics...</p>
          ) : salesTrends.length === 0 ? (
            <p className="text-xs text-gray-400 font-medium">
              No sales records recorded for this timeframe
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesTrends}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 11, fontWeight: 500 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 11 }}
                  tickFormatter={(val) => `₱${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val, name) => [
                    typeof val === "number" ? val.toLocaleString() : val,
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #D5E3EC",
                    boxShadow: "0 4px 12px rgba(10, 75, 110, 0.08)",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="butane"
                  name="Butane Canisters"
                  fill="#93B5D0"
                  barSize={18}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="lpg11kg"
                  name="11 kg LPG"
                  fill="#0F7AB2"
                  barSize={18}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="lpg50kg"
                  name="50 kg LPG"
                  fill="#FFDF2C"
                  barSize={18}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* 3. DUAL SECTION: PRODUCT SKU BREAKDOWN & PAYMENT SETTLEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Product SKU Breakdown (2 cols) */}
        <Card className="lg:col-span-2 p-4 md:p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm md:text-base font-bold text-[#0A4B6E]">
                Product Sales & Return Contribution
              </h3>
              <p className="text-xs text-[#6D8AA2]">
                Breakdown by product SKU, units sold, gross sales, and empty shell returns
              </p>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E8F3F8]/50 text-[#0A4B6E] font-bold border-b border-[#BCE1F1]">
                <tr>
                  <th className="py-2.5 px-3">Product SKU</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Units Sold</th>
                  <th className="py-2.5 px-3 text-right">Gross Sales</th>
                  <th className="py-2.5 px-3 text-right">Empties Returned</th>
                  <th className="py-2.5 px-3 text-right">% Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {productBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No product sales recorded
                    </td>
                  </tr>
                ) : (
                  productBreakdown
                    .filter((p) => p.unitsSold > 0)
                    .map((item) => (
                      <tr key={item.productId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#0A4B6E]">
                          {item.productName}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.containerType === "CANISTER"
                                ? "bg-sky-50 text-sky-800 border border-sky-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {item.containerType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          {item.unitsSold.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#0A4B6E]">
                          ₱{Number(item.totalRevenue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {item.emptiesReturned.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="font-bold text-slate-800">{item.percentageRevenue}%</span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right: Payment Settlement Distribution (1 col) */}
        <Card className="p-4 md:p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm md:text-base font-bold text-[#0A4B6E] mb-1">
              Payment Settlement Distribution
            </h3>
            <p className="text-xs text-[#6D8AA2] mb-4">
              Cash collections vs verified digital payments
            </p>

            <div className="flex flex-col gap-3">
              {/* Cash Box */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Banknote size={15} className="text-emerald-600" />
                    <span>Cash on Delivery</span>
                  </span>
                  <span className="font-bold text-emerald-700">
                    {paymentBreakdown.cash?.percentage || 0}%
                  </span>
                </div>
                <p className="text-base font-bold text-[#0A4B6E]">
                  ₱{cashAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-500">
                  {cashCount} Cash transactions remitted in shift
                </p>
              </div>

              {/* GCash Box */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <CreditCard size={15} className="text-sky-600" />
                    <span>GCash Transfers</span>
                  </span>
                  <span className="font-bold text-sky-700">
                    {paymentBreakdown.gcash?.percentage || 0}%
                  </span>
                </div>
                <p className="text-base font-bold text-[#0A4B6E]">
                  ₱{gcashAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-500">
                  {gcashCount} GCash transactions
                </p>

                {/* Verification sub-status */}
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 size={13} />
                    <span>{gcashVerified} Verified</span>
                  </span>
                  {gcashUnverified > 0 ? (
                    <span className="flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                      <Clock size={12} />
                      <span>{gcashUnverified} Pending Review</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">All verified</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Business Note */}
          <div className="mt-4 p-2.5 rounded-lg bg-[#E8F3F8]/40 border border-[#BCE1F1]/50 text-[11px] text-[#0A4B6E] flex items-start gap-1.5">
            <Sparkles size={13} className="shrink-0 mt-0.5 text-[#0F7AB2]" />
            <span>
              Customer cylinder loans are accounted separately through the physical Canister Ledger.
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}

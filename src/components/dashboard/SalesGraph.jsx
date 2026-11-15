// src/components/dashboard/SalesGraph.jsx
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Card from "../ui/Card";
import InfoTooltip from "../ui/InfoTooltip";

const TIMEFRAME_LABELS = {
  weekly: "Weekly",
  monthly: "Monthly",
  annually: "Annually",
};

export default function SalesGraph({
  salesData,
  timeframe = "monthly",
  isLoading = false,
}) {
  const chartData = useMemo(() => {
    const legacySeries =
      timeframe === "weekly"
        ? salesData?.weekly
        : timeframe === "monthly"
        ? salesData?.monthly
        : salesData?.annually;

    const rawTrends =
      Array.isArray(salesData?.salesTrends) && salesData.salesTrends.length > 0
        ? salesData.salesTrends
        : Array.isArray(legacySeries)
        ? legacySeries
        : [];

    return rawTrends.map((row) => {
      const canisters = Number(row.canisters ?? row.butane ?? 0);
      const cylinders = Number(
        row.cylinders ?? (Number(row.lpg11kg || 0) + Number(row.lpg50kg || 0))
      );
      return {
        name: row.name,
        cylinders,
        canisters,
      };
    });
  }, [salesData, timeframe]);

  const chartMinWidth =
    chartData.length > 12 ? `${chartData.length * 56}px` : "100%";

  return (
    <Card className="flex-1 flex p-4 md:p-5 flex-col min-h-[300px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-[#0A4B6E]">Sales Trend</h3>
          <InfoTooltip
            align="left"
            position="bottom"
            text="Stacked by container category (Cylinders vs. Canisters) so the chart stays readable as new products are added."
            label="About sales trend chart"
          />
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1]">
          {TIMEFRAME_LABELS[timeframe] || "Monthly"}
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 mb-3 text-xs font-semibold text-[#0A4B6E] shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-2 bg-[#0F7AB2] rounded-full"
            aria-hidden="true"
          />
          <span>Cylinders (11kg / 50kg)</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-2 bg-[#93B5D0] rounded-full"
            aria-hidden="true"
          />
          <span>Canisters (Butane)</span>
        </div>
      </div>

      {/* Chart Area with Horizontal Scroll Guard */}
      <div className="w-full flex-1 min-h-[210px] border border-slate-200 rounded-xl overflow-x-auto custom-scrollbar p-2 flex items-center justify-center">
        {isLoading && chartData.length === 0 ? (
          <p className="text-xs text-slate-500 font-medium">
            Loading sales data...
          </p>
        ) : chartData.length === 0 ? (
          <p className="text-xs text-slate-500 font-medium">
            No sales data available for this timeframe
          </p>
        ) : (
          <div style={{ minWidth: chartMinWidth, width: "100%", height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                key={timeframe}
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
                  tick={{ fill: "#475569", fontSize: 12 }}
                  tickFormatter={(val) =>
                    `₱${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                  }
                />
                <Tooltip
                  cursor={{ fill: "#E8F3F8", opacity: 0.45 }}
                  formatter={(val, name) => [
                    `₱${Number(val || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
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
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}

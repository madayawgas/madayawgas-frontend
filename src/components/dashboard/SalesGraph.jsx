// src/components/dashboard/SalesGraph.jsx
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
  const weeklySales = salesData?.weekly || [];
  const monthlySales = salesData?.monthly || [];
  const annualSales = salesData?.annually || [];

  const activeData =
    timeframe === "weekly"
      ? weeklySales
      : timeframe === "monthly"
      ? monthlySales
      : annualSales;

  return (
    <Card className="flex-1 flex p-4 md:p-5 flex-col min-h-[280px]">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-6 gap-4 shrink-0">
        <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-800">
          Sales Overview
        </h3>

        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F8FAFC] text-[#0A4B6E] border border-[#CBD5E1]">
          {TIMEFRAME_LABELS[timeframe] || "Monthly"}
        </span>
      </div>

      {/* Custom HTML Legend */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 text-xs text-[#0A4B6E] font-medium shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#93B5D0] rounded-xs" aria-hidden="true" />
          <span>Butane Canister</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#0F7AB2] rounded-xs" aria-hidden="true" />
          <span>11 kg LPG</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#FFDF2C] rounded-xs" aria-hidden="true" />
          <span>50 kg LPG</span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="w-full flex-1 min-h-[190px] border border-gray-300 rounded-xl flex items-center justify-center">
        {isLoading && activeData.length === 0 ? (
          <p className="text-xs text-gray-400 font-medium">Loading sales data...</p>
        ) : activeData.length === 0 ? (
          <p className="text-xs text-gray-400 font-medium">
            No sales data available for this timeframe
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              key={timeframe}
              data={activeData}
              margin={{ top: 10, right: 20, left: -40, bottom: 0 }}
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
                tick={{ fill: "#6B7280", fontSize: 12 }}
                dy={10}
              />

              <YAxis axisLine={false} tickLine={false} tick={false} />

              <Tooltip
                cursor={{ fill: "#E8F3F8", opacity: 0.5 }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />

              <Bar
                dataKey="butane"
                name="Butane Canister"
                fill="#93B5D0"
                barSize={16}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="lpg11kg"
                name="11 kg LPG"
                fill="#0F7AB2"
                barSize={16}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="lpg50kg"
                name="50 kg LPG"
                fill="#FFDF2C"
                barSize={16}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

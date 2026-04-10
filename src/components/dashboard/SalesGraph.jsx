import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// --- MOCK DATA ---
const monthlyData = [
  { name: "Jan", param1: 4000, param2: 2400 },
  { name: "Feb", param1: 3000, param2: 1398 },
  { name: "Mar", param1: 2000, param2: 9800 },
  { name: "Apr", param1: 2780, param2: 3908 },
  { name: "May", param1: 1890, param2: 4800 },
  { name: "Jun", param1: 2390, param2: 3800 },
  { name: "Jul", param1: 3490, param2: 4300 },
];

const annualData = [
  { name: "2018", param1: 24000, param2: 14000 },
  { name: "2019", param1: 13000, param2: 23000 },
  { name: "2020", param1: 38000, param2: 18000 },
  { name: "2021", param1: 39000, param2: 42000 },
  { name: "2022", param1: 48000, param2: 38000 },
  { name: "2023", param1: 38000, param2: 43000 },
  { name: "2024", param1: 43000, param2: 55000 },
];

export default function SalesGraph() {
  // State to toggle between Monthly and Annually data
  const [timeframe, setTimeframe] = useState("monthly");

  const activeData = timeframe === "monthly" ? monthlyData : annualData;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex-1 flex flex-col min-h-[350px]">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-800">
          Sales Overview
        </h3>
        
        {/* Toggle Pills */}
        <div className="flex items-center gap-2 text-sm font-semibold">
          <button
            onClick={() => setTimeframe("monthly")}
            className={`px-4 py-1.5 rounded-full transition ${
              timeframe === "monthly"
                ? "bg-[#D8E6F0] text-[#0F7AB2]"
                : "text-[#0F7AB2] hover:bg-gray-50"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimeframe("annually")}
            className={`px-4 py-1.5 rounded-full transition ${
              timeframe === "annually"
                ? "bg-[#D8E6F0] text-[#0F7AB2]"
                : "text-[#0F7AB2] hover:bg-gray-50"
            }`}
          >
            Annually
          </button>
        </div>
      </div>

      {/* Custom HTML Legend */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2 text-sm text-[#0F7AB2] font-medium">
          <span className="w-6 h-1.5 bg-[#7CB3D1] rounded-full"></span>
          Parameter 1
        </div>
        <div className="flex items-center gap-2 text-sm text-[#0F7AB2] font-medium">
          <span className="w-6 h-1.5 bg-[#B8D4E5] rounded-full"></span>
          Parameter 2
        </div>
      </div>

      {/* Chart Area */}
      <div className="w-full h-[250px] md:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            key={timeframe}
            data={activeData}
            margin={{ top: 10, right: 20, left: -40, bottom: 0 }}
          >
            {/* Horizontal grid lines only */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            
            {/* X Axis without tick lines to keep it clean */}
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              dy={10}
            />
            
            {/* Y Axis hidden */}
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={false}
            />
            
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />

            {/* Graph Lines */}
            <Line
              type="monotone"
              dataKey="param1"
              stroke="#7CB3D1"
              strokeWidth={2}
              dot={{ r: 3, fill: "#7CB3D1", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="param2"
              stroke="#B8D4E5"
              strokeWidth={2}
              dot={{ r: 3, fill: "#B8D4E5", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
    </div>
  );
}
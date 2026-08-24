// src/components/dashboard/SalesGraph.jsx
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Card from "../ui/Card";
import { useData } from "../../context/DataContext"; 

export default function SalesGraph() {
  const [timeframe, setTimeframe] = useState("monthly");
  const { weeklySales, monthlySales, annualSales } = useData();

  const activeData = 
    timeframe === "weekly" ? weeklySales :
    timeframe === "monthly" ? monthlySales : 
    annualSales;

  return (
    <Card className="flex-1 flex p-4 md:p-5 flex-col min-h-[280px]">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-800">
          Sales Overview
        </h3>
        
        {/* Toggle Pills */}
        <div className="flex items-center gap-2 text-sm font-semibold">
          {["weekly", "monthly", "annually"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-1.5 rounded-full transition capitalize ${
                timeframe === tf
                  ? "bg-[#0A4B6E] text-[#ffffff]"
                  : "bg-[#F3F4F6] text-[#0F7AB2] hover:bg-gray-50"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Custom HTML Legend */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6">
        <div className="flex items-center gap-2 text-sm text-[#0F7AB2] font-medium">
          <span className="w-6 h-1.5 bg-[#93B5D0] rounded-full"></span>
          Butane Canister
        </div>
        <div className="flex items-center gap-2 text-sm text-[#0F7AB2] font-medium">
          <span className="w-6 h-1.5 bg-[#0F7AB2] rounded-full"></span>
          11 kg LPG
        </div>
        <div className="flex items-center gap-2 text-sm text-[#0F7AB2] font-medium">
          <span className="w-6 h-1.5 bg-[#FFDF2C] rounded-full"></span>
          50 kg LPG
        </div>
      </div>

      {/* Chart Area */}
      <div className="w-full border border-gray-300 rounded-xl h-[200px] md:h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            key={timeframe}
            data={activeData}
            margin={{ top: 10, right: 20, left: -40, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              dy={10}
            />
            
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={false}
            />
            
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />

            <Bar 
              dataKey="butane" 
              name="Butane Canister"
              fill="#93B5D0" 
              barSize={14} 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="lpg11kg" 
              name="11 kg LPG"
              fill="#0F7AB2" 
              barSize={14} 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="lpg50kg" 
              name="50 kg LPG"
              fill="#FFDF2C" 
              barSize={14} 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
    </Card>
  );
}
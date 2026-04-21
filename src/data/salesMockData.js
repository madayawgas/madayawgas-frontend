// src/data/salesMockData.js

/**
 * Raw Daily Sales Records
 * Products: Butane Canisters, 11kg LPG, 50kg LPG
 */

const generateSalesData = () => {
  const records = [];
  const start = new Date("2025-01-01");
  const end = new Date("2026-04-13"); // Current date in context

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    
    // Random but somewhat realistic scaling
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const multiplier = isWeekend ? 0.6 : 1.0;

    // Units sold
    const butaneUnits = Math.floor((Math.random() * 200 + 300) * multiplier);
    const lpg11Units = Math.floor((Math.random() * 50 + 50) * multiplier);
    const lpg50Units = Math.floor((Math.random() * 10 + 10) * multiplier);

    // Pricing (Approximate)
    const butanePrice = 50;
    const lpg11Price = 900;
    const lpg50Price = 3500;

    const butaneRev = butaneUnits * butanePrice;
    const lpg11Rev = lpg11Units * lpg11Price;
    const lpg50Rev = lpg50Units * lpg50Price;

    const totalGrossSales = butaneRev + lpg11Rev + lpg50Rev;
    const fuelConsumption = Math.floor((Math.random() * 40 + 80) * multiplier);
    const operatingCost = Math.floor(totalGrossSales * 0.35); // Approx 35% operating cost

    records.push({
      date: dateStr,
      products: {
        butaneCanisters: { units: butaneUnits, revenue: butaneRev },
        lpg11kg: { units: lpg11Units, revenue: lpg11Rev },
        lpg50kg: { units: lpg50Units, revenue: lpg50Rev }
      },
      totalGrossSales,
      fuelConsumption,
      operatingCost,
      totalCans: butaneUnits // Specifically for "cost per can" logic
    });
  }
  return records;
};

export const allSalesRecords = generateSalesData();

// ==========================================================================
// MOCK SALES DATA (Moved from DataContext)
// ==========================================================================
export const weeklySales = [
  { name: "Mon", butane: 1200, lpg11kg: 800, lpg50kg: 400 },
  { name: "Tue", butane: 1300, lpg11kg: 850, lpg50kg: 420 },
  { name: "Wed", butane: 1100, lpg11kg: 900, lpg50kg: 380 },
  { name: "Thu", butane: 1500, lpg11kg: 950, lpg50kg: 450 },
  { name: "Fri", butane: 1700, lpg11kg: 1100, lpg50kg: 500 },
  { name: "Sat", butane: 2000, lpg11kg: 1300, lpg50kg: 600 },
  { name: "Sun", butane: 1800, lpg11kg: 1200, lpg50kg: 550 },
];

export const monthlySales = [
  { name: "Jan", butane: 24000, lpg11kg: 18000, lpg50kg: 8000 },
  { name: "Feb", butane: 22000, lpg11kg: 16000, lpg50kg: 7500 },
  { name: "Mar", butane: 26000, lpg11kg: 19000, lpg50kg: 8500 },
  { name: "Apr", butane: 28000, lpg11kg: 21000, lpg50kg: 9000 },
  { name: "May", butane: 25000, lpg11kg: 18500, lpg50kg: 8200 },
  { name: "Jun", butane: 27000, lpg11kg: 20000, lpg50kg: 8800 },
  { name: "Jul", butane: 30000, lpg11kg: 22000, lpg50kg: 9500 },
];

export const annualSales = [
  { name: "2020", butane: 250000, lpg11kg: 180000, lpg50kg: 80000 },
  { name: "2021", butane: 270000, lpg11kg: 195000, lpg50kg: 85000 },
  { name: "2022", butane: 290000, lpg11kg: 210000, lpg50kg: 92000 },
  { name: "2023", butane: 320000, lpg11kg: 230000, lpg50kg: 100000 },
  { name: "2024", butane: 350000, lpg11kg: 250000, lpg50kg: 110000 },
];

export const mockFuelConsumption = 125000;

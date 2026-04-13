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

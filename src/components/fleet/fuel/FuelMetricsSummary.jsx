// src/components/fleet/fuel/FuelMetricsSummary.jsx
import {
  Fuel,
  DollarSign,
  Gauge,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Truck,
  CheckCircle2,
} from "lucide-react";

function formatCurrency(val) {
  const num = Number(val) || 0;
  return `₱${num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(val, decimals = 2) {
  const num = Number(val) || 0;
  return num.toLocaleString("en-PH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function FuelMetricsSummary({
  fleetTotals = null,
  singleVehicleData = null,
  isSingleVehicle = false,
  period = null,
}) {
  const totals = isSingleVehicle && singleVehicleData ? singleVehicleData : fleetTotals;

  if (!totals) {
    return null;
  }

  const fuelUsed = totals.totalFuelUsedLiters ?? totals.fuelUsedLiters ?? 0;
  const fuelCost = totals.totalFuelCost ?? totals.fuelCost ?? 0;
  const avgPrice = totals.averagePricePerLiter ?? (fuelUsed > 0 ? fuelCost / fuelUsed : 0);
  const distanceKm = totals.totalDistanceTraveledKm ?? totals.distanceTraveledKm ?? 0;
  const kmPerLiter = totals.averageKmPerLiter ?? totals.kmPerLiter ?? null;
  const costPerKm = totals.averageCostPerKm ?? totals.costPerKm ?? null;
  const entriesCount = totals.totalFuelEntries ?? totals.fuelEntriesCount ?? 0;
  const activeCount = totals.activeVehiclesCount ?? (isSingleVehicle ? 1 : 0);
  const totalFleetCount = totals.totalFleetVehiclesCount ?? null;

  // Single vehicle ratings
  const efficiencyRating = singleVehicleData?.efficiencyRating;
  const variance = singleVehicleData?.varianceFromFleetAvgPercent;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
      {/* CARD 1: Total Fuel Consumed (Liters) */}
      <div className="bg-[#E8F3F8] rounded-2xl p-4 md:p-5 border border-[#9BCBE3] shadow-sm hover:shadow-md transition-all flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <span className="text-[11px] font-bold tracking-wider text-[#6D8AA2] uppercase">
            {isSingleVehicle ? "Vehicle Fuel Volume" : "Total Fuel Consumed"}
          </span>
          <p className="text-2xl md:text-[26px] font-bold text-[#1B4B75] mt-0.5">
            {formatNumber(fuelUsed)} <span className="text-sm font-semibold text-[#588094]">L</span>
          </p>
          <p className="text-xs text-[#588094] font-medium mt-0.5 truncate">
            <span className="font-bold text-[#1B4B75]">{entriesCount}</span> fill-up {entriesCount === 1 ? "entry" : "entries"} recorded
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-xs">
          <Fuel size={24} className="text-[#FFDF2C]" />
        </div>
      </div>

      {/* CARD 2: Total Fuel Cost (PHP) */}
      <div className="bg-[#E8F3F8] rounded-2xl p-4 md:p-5 border border-[#9BCBE3] shadow-sm hover:shadow-md transition-all flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <span className="text-[11px] font-bold tracking-wider text-[#6D8AA2] uppercase">
            {isSingleVehicle ? "Fuel Expenditure" : "Total Fuel Cost"}
          </span>
          <p className="text-2xl md:text-[26px] font-bold text-[#1B4B75] mt-0.5">
            {formatCurrency(fuelCost)}
          </p>
          <p className="text-xs text-[#588094] font-medium mt-0.5 truncate">
            Avg: <span className="font-bold text-[#1B4B75]">₱{formatNumber(avgPrice, 2)}</span> / Liter
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-xs">
          <DollarSign size={24} className="text-[#FFDF2C]" />
        </div>
      </div>

      {/* CARD 3: Distance Traveled (km) */}
      <div className="bg-[#E8F3F8] rounded-2xl p-4 md:p-5 border border-[#9BCBE3] shadow-sm hover:shadow-md transition-all flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <span className="text-[11px] font-bold tracking-wider text-[#6D8AA2] uppercase">
            {isSingleVehicle ? "Odometer Distance" : "Distance Traveled"}
          </span>
          <p className="text-2xl md:text-[26px] font-bold text-[#1B4B75] mt-0.5">
            {formatNumber(distanceKm, 0)} <span className="text-sm font-semibold text-[#588094]">km</span>
          </p>
          <p className="text-xs text-[#588094] font-medium mt-0.5 truncate">
            {isSingleVehicle ? (
              <span>Odo: {singleVehicleData?.startOdometer || 0} → {singleVehicleData?.endOdometer || 0} km</span>
            ) : (
              <span><span className="font-bold text-[#1B4B75]">{activeCount}</span> active {activeCount === 1 ? "truck" : "trucks"} {totalFleetCount !== null ? `(${totalFleetCount} total)` : ""}</span>
            )}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-xs">
          <Gauge size={24} className="text-[#FFDF2C]" />
        </div>
      </div>

      {/* CARD 4: Fuel Efficiency (km/L) */}
      <div className="bg-[#E8F3F8] rounded-2xl p-4 md:p-5 border border-[#9BCBE3] shadow-sm hover:shadow-md transition-all flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <span className="text-[11px] font-bold tracking-wider text-[#6D8AA2] uppercase">
            {isSingleVehicle ? "Vehicle Efficiency" : "Fleet Fuel Efficiency"}
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <p className="text-2xl md:text-[26px] font-bold text-[#1B4B75]">
              {kmPerLiter !== null ? formatNumber(kmPerLiter, 2) : "—"}
              {kmPerLiter !== null && <span className="text-sm font-semibold text-[#588094] ml-1">km/L</span>}
            </p>
            {isSingleVehicle && efficiencyRating && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  efficiencyRating === "ABOVE_AVERAGE"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : efficiencyRating === "BELOW_AVERAGE"
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                }`}
              >
                {efficiencyRating === "ABOVE_AVERAGE"
                  ? `+${variance}%`
                  : efficiencyRating === "BELOW_AVERAGE"
                  ? `${variance}%`
                  : "Avg"}
              </span>
            )}
          </div>
          <p className="text-xs text-[#588094] font-medium mt-0.5 truncate">
            Operating: <span className="font-bold text-[#1B4B75]">{costPerKm !== null ? `₱${formatNumber(costPerKm, 2)}/km` : "—"}</span>
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-xs">
          <Activity size={24} className="text-[#FFDF2C]" />
        </div>
      </div>
    </div>
  );

}

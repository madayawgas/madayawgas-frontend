// src/components/fleet/fuel/FuelMonitoringTab.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import FuelControls from "./FuelControls.jsx";
import FuelMetricsSummary from "./FuelMetricsSummary.jsx";
import FuelVehiclesTable from "./FuelVehiclesTable.jsx";
import FuelLogsTable from "./FuelLogsTable.jsx";
import DocumentViewerModal from "../../ui/DocumentViewerModal.jsx";
import { fuelApi } from "../../../api/fuel.js";
import { useRealtimeRefresh } from "../../../hooks/useRealtimeRefresh.js";

const FUEL_CACHE_KEY = "app_fuel_cache";
const FUEL_LOGS_CACHE_KEY = "app_fuel_logs_cache";

export default function FuelMonitoringTab({
  trucks = [],
}) {
  const [period, setPeriod] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("logs"); // 'logs' (default) | 'analytics'

  // Data States with instant local cache bootstrap
  const [analysisData, setAnalysisData] = useState(() => {
    try {
      const cached = localStorage.getItem(FUEL_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.fleetTotals) return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [fuelLogs, setFuelLogs] = useState(() => {
    try {
      const cached = localStorage.getItem(FUEL_LOGS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(!analysisData && fuelLogs.length === 0);
  const [previewReceipt, setPreviewReceipt] = useState(null);

  // Fetch telemetry
  const fetchFuelData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {};

      if (period === "custom" || period === "6_months") {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      } else {
        params.period = period;
      }

      if (selectedVehicleId) {
        params.vehicleId = selectedVehicleId;
      }

      const [analysisRes, logsRes] = await Promise.all([
        fuelApi.getFleetFuelAnalysis(params),
        fuelApi.getFuelLogs(params),
      ]);

      if (analysisRes) {
        setAnalysisData(analysisRes);
        try {
          localStorage.setItem(FUEL_CACHE_KEY, JSON.stringify(analysisRes));
        } catch (e) {
          console.error("Failed to write fuel cache:", e);
        }
      }

      if (logsRes?.logs) {
        setFuelLogs(logsRes.logs);
        try {
          localStorage.setItem(FUEL_LOGS_CACHE_KEY, JSON.stringify(logsRes.logs));
        } catch (e) {
          console.error("Failed to write fuel logs cache:", e);
        }
      }
    } catch (err) {
      console.error("Failed to load fuel telemetry:", err);
    } finally {
      setIsLoading(false);
    }
  }, [period, startDate, endDate, selectedVehicleId]);

  // Initial & Dependency Fetch
  useEffect(() => {
    fetchFuelData();
  }, [fetchFuelData]);

  // Real-time Socket.IO Sync on FUEL_LOGGED
  useRealtimeRefresh({
    events: ["FUEL_LOGGED"],
    onRefresh: fetchFuelData,
    cacheKeysToInvalidate: [FUEL_CACHE_KEY, FUEL_LOGS_CACHE_KEY],
  });

  // Client-side search filtering across vehicles
  const filteredVehicles = useMemo(() => {
    const list = analysisData?.vehicles || [];
    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter((v) => {
      const plate = (v.plateNumber || "").toLowerCase();
      const model = (v.model || "").toLowerCase();
      const driver = (v.driver?.fullName || v.driver?.username || "").toLowerCase();
      return plate.includes(query) || model.includes(query) || driver.includes(query);
    });
  }, [analysisData?.vehicles, searchQuery]);

  // Client-side search filtering across individual logs
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return fuelLogs;

    const query = searchQuery.toLowerCase().trim();
    return fuelLogs.filter((log) => {
      const plate = (log.vehicle?.plateNumber || "").toLowerCase();
      const model = (log.vehicle?.model || "").toLowerCase();
      const driver = (log.driver?.fullName || log.driver?.username || "").toLowerCase();
      const station = (log.fuelStation || "").toLowerCase();
      return (
        plate.includes(query) ||
        model.includes(query) ||
        driver.includes(query) ||
        station.includes(query)
      );
    });
  }, [fuelLogs, searchQuery]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== "custom" && newPeriod !== "6_months") {
      setStartDate("");
      setEndDate("");
    }
  };

  const handleDateRangeChange = (start, end, presetLabel) => {
    setStartDate(start);
    setEndDate(end);
    setPeriod(presetLabel || "custom");
  };

  const handleViewLogsForVehicle = (vehicleId) => {
    setSelectedVehicleId(vehicleId);
    setViewMode("logs");
  };

  // Find active single vehicle data if filtered
  const singleVehicleData = useMemo(() => {
    if (!selectedVehicleId || !analysisData?.vehicles) return null;
    return (
      analysisData.vehicles.find(
        (v) => v.vehicleId === selectedVehicleId || v.id === selectedVehicleId
      ) || null
    );
  }, [selectedVehicleId, analysisData?.vehicles]);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden min-w-0 space-y-4 pb-2">
      {/* 1. TOP CONTROLS & RANGE SELECTOR */}
      <div className="shrink-0">
        <FuelControls
          period={period}
          onPeriodChange={handlePeriodChange}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={handleDateRangeChange}
          selectedVehicleId={selectedVehicleId}
          onVehicleChange={setSelectedVehicleId}
          trucks={trucks}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onRefresh={fetchFuelData}
          isLoading={isLoading}
        />
      </div>

      {/* 2. SUMMARY METRICS CARDS */}
      <div className="shrink-0">
        <FuelMetricsSummary
          fleetTotals={analysisData?.fleetTotals}
          singleVehicleData={singleVehicleData}
          isSingleVehicle={Boolean(selectedVehicleId)}
          period={analysisData?.period}
        />
      </div>

      {/* 3. MAIN CONTENT: VEHICLE BREAKDOWN OR INTAKE LOGS */}
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        {viewMode === "analytics" ? (
          <FuelVehiclesTable
            vehicles={filteredVehicles}
            isLoading={isLoading}
            onSelectVehicle={setSelectedVehicleId}
            onViewLogsForVehicle={handleViewLogsForVehicle}
          />
        ) : (
          <FuelLogsTable
            logs={filteredLogs}
            isLoading={isLoading}
            onPreviewReceipt={(item) => setPreviewReceipt(item)}
          />
        )}
      </div>

      {/* 4. SHARED DOCUMENT VIEWER FOR FUEL PURCHASE RECEIPTS */}
      <DocumentViewerModal
        isOpen={Boolean(previewReceipt)}
        onClose={() => setPreviewReceipt(null)}
        item={previewReceipt}
        title={previewReceipt?.title || "Fuel Purchase Receipt"}
      />
    </div>
  );
}

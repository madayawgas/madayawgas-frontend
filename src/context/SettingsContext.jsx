// src/context/SettingsContext.jsx
/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext.jsx";
import { settingsApi } from "../api/settings.js";
import { getSocket } from "../services/socket.js";
import {
  BUSINESS_SETTING_DEFAULTS,
  SYSTEM_CONFIG,
} from "../config/systemConfig.js";

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [businessSettings, setBusinessSettings] = useState(
    () => ({ ...BUSINESS_SETTING_DEFAULTS })
  );
  const [systemBounds, setSystemBounds] = useState(() => ({ ...SYSTEM_CONFIG }));
  const [loaded, setLoaded] = useState(false);

  const refreshSettings = useCallback(async () => {
    if (!isAuthenticated) return null;
    try {
      const data = await settingsApi.getEffectiveConfig();
      if (data?.settings && typeof data.settings === "object") {
        setBusinessSettings((prev) => ({
          ...BUSINESS_SETTING_DEFAULTS,
          ...prev,
          ...data.settings,
        }));
      }
      if (data?.system && typeof data.system === "object") {
        setSystemBounds((prev) => ({
          ...prev,
          fleet: {
            ...SYSTEM_CONFIG.fleet,
            ...(data.system.fleet || {}),
          },
          media: {
            ...SYSTEM_CONFIG.media,
            ...(data.system.maxUploadFileSizeBytes
              ? { maxUploadFileSizeBytes: data.system.maxUploadFileSizeBytes }
              : {}),
          },
        }));
      }
      setLoaded(true);
      return data;
    } catch {
      // Keep fallback defaults if settings fetch fails
      return null;
    }
  }, [isAuthenticated]);

  const applySettingUpdate = useCallback((key, value) => {
    if (!key) return;
    setBusinessSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Load effective config on login / auth bootstrap
  useEffect(() => {
    if (isAuthenticated) {
      refreshSettings();
    } else {
      setBusinessSettings({ ...BUSINESS_SETTING_DEFAULTS });
      setSystemBounds({ ...SYSTEM_CONFIG });
      setLoaded(false);
    }
  }, [isAuthenticated, refreshSettings]);

  // Subscribe to real-time setting updates from backend socket
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    if (!socket) return;

    const handleSettingsUpdated = (payload) => {
      if (payload?.key !== undefined && payload?.value !== undefined) {
        applySettingUpdate(payload.key, payload.value);
        if (String(payload.key).startsWith("fleet.")) {
          try {
            localStorage.removeItem("app_fleet_cache");
          } catch {
            // ignore storage errors
          }
        }
      } else {
        refreshSettings();
      }
    };

    socket.on("settings:updated", handleSettingsUpdated);
    return () => {
      socket.off("settings:updated", handleSettingsUpdated);
    };
  }, [isAuthenticated, applySettingUpdate, refreshSettings]);

  const value = useMemo(() => {
    const pmThresholdKm =
      Number(businessSettings["fleet.pm_odometer_threshold_km"]) ||
      BUSINESS_SETTING_DEFAULTS["fleet.pm_odometer_threshold_km"];

    const workOrderApprovalThreshold = Number.isFinite(
      Number(businessSettings["fleet.work_order_approval_threshold"])
    )
      ? Number(businessSettings["fleet.work_order_approval_threshold"])
      : BUSINESS_SETTING_DEFAULTS["fleet.work_order_approval_threshold"];

    const canistersPerCrate =
      Number(businessSettings["inventory.canisters_per_crate"]) ||
      BUSINESS_SETTING_DEFAULTS["inventory.canisters_per_crate"];

    const fuelVariancePercent =
      Number(businessSettings["operations.fuel_efficiency_variance_percent"]) ||
      BUSINESS_SETTING_DEFAULTS["operations.fuel_efficiency_variance_percent"];

    const sosDedupWindowSeconds =
      Number(businessSettings["operations.sos_dedup_window_seconds"]) ||
      BUSINESS_SETTING_DEFAULTS["operations.sos_dedup_window_seconds"];

    const maxScheduleGenerationDays =
      Number(businessSettings["schedules.max_generation_days"]) ||
      BUSINESS_SETTING_DEFAULTS["schedules.max_generation_days"];

    const pmApproachingRatio =
      Number(systemBounds.fleet?.pmApproachingRatio) ||
      SYSTEM_CONFIG.fleet.pmApproachingRatio;

    const maxOdometerKm =
      Number(systemBounds.fleet?.maxOdometerKm) ||
      SYSTEM_CONFIG.fleet.maxOdometerKm;

    const maxUploadFileSizeBytes =
      Number(systemBounds.media?.maxUploadFileSizeBytes) ||
      SYSTEM_CONFIG.media.maxUploadFileSizeBytes;

    return {
      loaded,
      businessSettings,
      systemBounds,
      pmThresholdKm,
      pmApproachingRatio,
      maxOdometerKm,
      workOrderApprovalThreshold,
      canistersPerCrate,
      fuelVariancePercent,
      sosDedupWindowSeconds,
      maxScheduleGenerationDays,
      maxUploadFileSizeBytes,
      refreshSettings,
      applySettingUpdate,
    };
  }, [loaded, businessSettings, systemBounds, refreshSettings, applySettingUpdate]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    return {
      loaded: false,
      businessSettings: BUSINESS_SETTING_DEFAULTS,
      systemBounds: SYSTEM_CONFIG,
      pmThresholdKm: BUSINESS_SETTING_DEFAULTS["fleet.pm_odometer_threshold_km"],
      pmApproachingRatio: SYSTEM_CONFIG.fleet.pmApproachingRatio,
      maxOdometerKm: SYSTEM_CONFIG.fleet.maxOdometerKm,
      workOrderApprovalThreshold:
        BUSINESS_SETTING_DEFAULTS["fleet.work_order_approval_threshold"],
      canistersPerCrate: BUSINESS_SETTING_DEFAULTS["inventory.canisters_per_crate"],
      fuelVariancePercent:
        BUSINESS_SETTING_DEFAULTS["operations.fuel_efficiency_variance_percent"],
      sosDedupWindowSeconds:
        BUSINESS_SETTING_DEFAULTS["operations.sos_dedup_window_seconds"],
      maxScheduleGenerationDays:
        BUSINESS_SETTING_DEFAULTS["schedules.max_generation_days"],
      maxUploadFileSizeBytes: SYSTEM_CONFIG.media.maxUploadFileSizeBytes,
      refreshSettings: async () => null,
      applySettingUpdate: () => {},
    };
  }
  return ctx;
};

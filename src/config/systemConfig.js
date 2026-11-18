/**
 * Central Non-Secret Frontend System Configuration
 *
 * Holds:
 * 1. `BUSINESS_SETTING_DEFAULTS`: Fallback defaults matching the backend's 6
 *    DB-backed `system_settings` variables (editable in the System Settings UI).
 * 2. `SYSTEM_CONFIG`: System-wide non-secret operational constants (fleet bounds,
 *    PM approaching ratio, upload limits, socket reconnection parameters).
 *
 * NOTE: Environment URLs and build-time flags belong in `.env` (`VITE_*`), NOT here.
 */

export const BUSINESS_SETTING_DEFAULTS = {
  "fleet.pm_odometer_threshold_km": 5000,
  "fleet.work_order_approval_threshold": 5000,
  "operations.fuel_efficiency_variance_percent": 5,
  "operations.sos_dedup_window_seconds": 60,
  "inventory.canisters_per_crate": 24,
  "schedules.max_generation_days": 31,
};

export const SYSTEM_CONFIG = {
  fleet: {
    maxOdometerKm: 999999,
    pmApproachingRatio: 0.8,
  },
  media: {
    maxUploadFileSizeBytes: 5 * 1024 * 1024, // 5 MB
  },
  socket: {
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  },
  appDownload: {
    url:
      import.meta.env?.VITE_MOBILE_APP_DOWNLOAD_URL ||
      "https://drive.google.com/drive/folders/1a1Zg527mdE0z6lz6P_zBycrNa_YRb9xl?usp=sharing",
    appName: "MadayawGas Mobile",
    platformLabel: "Android APK",
    version: "v1.0.0",
    fileName: "MadayawGas-Mobile.apk",
  },
};

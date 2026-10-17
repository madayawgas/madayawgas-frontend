/**
 * Storage Sanitizer Utility
 * Ensures stale legacy data or malformed UUID caches do not contaminate
 * live API environments.
 */
const SANITIZE_VERSION = "mg_storage_v3_pure_live";

const LIVE_CACHE_KEYS = [
  "app_users_cache",
  "app_templates_cache",
  "app_schedules_cache",
  "app_fleet_cache",
  "app_zones_cache",
  "app_trips_cache",
  "app_inspections_cache",
  "app_odometer_cache",
  "app_work_orders_cache",
  "app_maintenance_logs_cache",
  "app_items_cache",
  "app_plant_stock_cache",
  "app_customers_cache",
];

const MOCK_SIGNATURES = [
  "q1w2e3r4-t5y6-u7i8-o9p0-a1s2d3f4g5h6",
  "e9b21f37-142c-4f76-96f3-a3d8b02e7b91",
  "sch-11111111",
  "tpl-11111111",
  "trk-11111111",
  "log-1001-1",
  "insp-1001-1",
];

export function sanitizeAppCaches() {
  if (typeof window === "undefined" || !window.localStorage) return;

  const isAlreadySanitized = localStorage.getItem(SANITIZE_VERSION);

    LIVE_CACHE_KEYS.forEach((key) => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return;

        // If the item contains any known mock signatures or if version changed
        const hasMockData = MOCK_SIGNATURES.some((sig) => item.includes(sig));
        if (hasMockData || !isAlreadySanitized) {
          localStorage.removeItem(key);
          console.info(`[Sanitizer] Cleared stale cache for key '${key}'`);
        }
      } catch (err) {
        console.warn(`[Sanitizer] Failed to inspect key '${key}':`, err);
      }
    });

    try {
      localStorage.setItem(SANITIZE_VERSION, new Date().toISOString());
    } catch {
      // Ignore quota errors
    }
}

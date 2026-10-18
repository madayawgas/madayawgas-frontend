// src/hooks/useRealtimeRefresh.js
import { useEffect, useRef } from "react";
import { getSocket, subscribeToReconnect } from "../services/socket.js";

/**
 * Custom React hook connecting real-time Socket.IO events to existing component fetch/refresh logic.
 *
 * Automatically:
 * 1. Subscribes to documented uppercase event names (e.g. 'FLEET_VEHICLE_GROUNDED').
 * 2. Invalidates target localStorage cache keys (e.g. 'app_fleet_cache').
 * 3. Debounces rapid burst events (e.g. bulk sales transactions or multi-vehicle dispatches).
 * 4. Reconciles authoritative state on socket reconnection.
 * 5. Cleans up all listeners on component unmount to prevent duplicate calls and leaks.
 *
 * @param {object} options
 * @param {string[]} options.events - Array of event names to listen for
 * @param {Function} options.onRefresh - Component's authoritative REST fetch callback
 * @param {string[]} [options.cacheKeysToInvalidate=[]] - localStorage cache keys to clear
 * @param {number} [options.debounceMs=250] - Debounce grace window in milliseconds
 */
export function useRealtimeRefresh({
  events = [],
  onRefresh,
  cacheKeysToInvalidate = [],
  debounceMs = 250,
}) {
  const timerRef = useRef(null);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const eventsKey = Array.isArray(events) ? events.join(",") : "";
  const cacheKeysKey = Array.isArray(cacheKeysToInvalidate) ? cacheKeysToInvalidate.join(",") : "";

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !eventsKey) return;

    const eventList = eventsKey.split(",").filter(Boolean);
    const cacheList = cacheKeysKey.split(",").filter(Boolean);

    const triggerRefresh = (envelope) => {
      // 1. Invalidate specified localStorage caches immediately
      if (typeof window !== "undefined" && cacheList.length > 0) {
        cacheList.forEach((key) => {
          try {
            localStorage.removeItem(key);
          } catch {
            // ignore localStorage quota/access exceptions
          }
        });
      }

      // 2. Debounce invocation to prevent UI thrashing from event bursts
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        if (typeof onRefreshRef.current === "function") {
          onRefreshRef.current(envelope);
        }
      }, debounceMs);
    };

    // 3. Register listeners on the shared socket instance
    eventList.forEach((eventName) => {
      socket.on(eventName, triggerRefresh);
    });

    // 4. Subscribe to reconnection recovery
    const unsubReconnect = subscribeToReconnect(() => {
      triggerRefresh({ type: "RECONNECT" });
    });

    // 5. Cleanup on unmount or dependency change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      eventList.forEach((eventName) => {
        socket.off(eventName, triggerRefresh);
      });
      unsubReconnect();
    };
  }, [eventsKey, cacheKeysKey, debounceMs]);
}

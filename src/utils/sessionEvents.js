/**
 * Session Lifecycle & Invalidation Event Dispatcher
 *
 * Provides a decoupled pub/sub mechanism to notify the application
 * (AuthContext, Router, SocketContext) when an authenticated session
 * has expired or been revoked on the backend, without introducing circular dependencies.
 */

const sessionExpiredListeners = new Set();
let isNotifyingSessionExpired = false;
let debounceTimer = null;

const STORAGE_SESSION_EXPIRED_KEY = "mg_session_expired_event";
const STORAGE_LOGOUT_KEY = "mg_logout_event";

/**
 * Resets the debounce lock (primarily for automated test environments and clean resets).
 */
export function _resetSessionExpirationLock() {
  isNotifyingSessionExpired = false;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

/**
 * Register a listener to be called whenever a session expiration occurs.
 *
 * @param {Function} callback - Callback function receiving event details: ({ message, endpoint }) => void
 * @returns {Function} Unsubscribe cleanup function
 */
export function onSessionExpired(callback) {
  if (typeof callback !== "function") return () => {};
  sessionExpiredListeners.add(callback);
  return () => {
    sessionExpiredListeners.delete(callback);
  };
}

/**
 * Dispatches a session expiration event to all registered listeners.
 * Debounces concurrent 401 responses within a 1.5-second window to prevent notification storms.
 * Also synchronizes the expiration across other open browser tabs via localStorage.
 *
 * @param {object} detail - Event metadata (e.g. { message, endpoint })
 */
export function notifySessionExpired(detail = {}) {
  // Prevent duplicate execution during concurrent API calls (e.g., Dashboard loading 4 widgets at once)
  if (isNotifyingSessionExpired) {
    return;
  }
  isNotifyingSessionExpired = true;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    isNotifyingSessionExpired = false;
  }, 1500);

  // 1. Wipe local fallback token
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("mg_token");
      // Broadcast to other open browser tabs
      localStorage.setItem(
        STORAGE_SESSION_EXPIRED_KEY,
        JSON.stringify({ timestamp: Date.now(), ...detail })
      );
    } catch {
      // Ignore localStorage exceptions in private browsing or quota limits
    }
  }

  // 2. Dispatch custom DOM event for decoupled window-level consumers
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    try {
      window.dispatchEvent(
        new CustomEvent("mg:session_expired", { detail })
      );
    } catch (err) {
      console.warn("[SessionEvents] Failed to dispatch CustomEvent:", err);
    }
  }

  // 3. Notify all direct in-memory subscribers (e.g. AuthContext, Router)
  sessionExpiredListeners.forEach((listener) => {
    try {
      listener(detail);
    } catch (err) {
      console.error("[SessionEvents] Error in session expiration listener:", err);
    }
  });
}

/**
 * Broadcasts an explicit manual user logout across all open browser tabs.
 */
export function broadcastLogout() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("mg_token");
    localStorage.setItem(STORAGE_LOGOUT_KEY, Date.now().toString());
  } catch {
    // Ignore storage errors
  }
}

/**
 * Listens for cross-tab storage events and notifies callbacks when a logout
 * or session expiration is initiated from another browser tab.
 *
 * @param {object} callbacks
 * @param {Function} callbacks.onExpired - Invoked when another tab detects session expiration
 * @param {Function} callbacks.onLogout - Invoked when another tab performs manual logout
 * @returns {Function} Unsubscribe cleanup function
 */
export function setupCrossTabSessionSync({ onExpired, onLogout } = {}) {
  if (typeof window === "undefined" || !window.addEventListener) {
    return () => {};
  }

  const handleStorageChange = (e) => {
    if (e.key === STORAGE_SESSION_EXPIRED_KEY && e.newValue) {
      try {
        const detail = JSON.parse(e.newValue);
        if (typeof onExpired === "function") {
          onExpired(detail);
        }
      } catch {
        if (typeof onExpired === "function") onExpired({});
      }
    } else if (e.key === STORAGE_LOGOUT_KEY && e.newValue) {
      if (typeof onLogout === "function") {
        onLogout();
      }
    }
  };

  window.addEventListener("storage", handleStorageChange);
  return () => {
    window.removeEventListener("storage", handleStorageChange);
  };
}

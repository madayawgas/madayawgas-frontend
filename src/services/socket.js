// src/services/socket.js
import { io } from "socket.io-client";
import { API_BASE_URL } from "../api/client.js";

let socket = null;
let wasDisconnected = false;
const reconnectSubscribers = new Set();

/**
 * Resolves the Socket.IO base URL by stripping the '/api' prefix from the configured API URL.
 *
 * @param {string} [apiUrl] - Optional override API URL for testing
 * @returns {string} Backend root URL (e.g. 'http://localhost:5000' or 'https://madayawgas-backend.onrender.com')
 */
export function getSocketUrl(apiUrl = null) {
  const base = (apiUrl || API_BASE_URL || "http://localhost:5000/api").replace(/\/+$/, "");
  return base.replace(/\/api\/?$/, "");
}

/**
 * Initializes and connects the singleton Socket.IO client instance.
 * Supports cookie credentials ('mg_sid') and session token authentication payload.
 *
 * @param {string|null} [explicitToken] - Optional explicit session token
 * @returns {import('socket.io-client').Socket} Active Socket.IO instance
 */
export function connectSocket(explicitToken = null) {
  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.connect();
    return socket;
  }

  const socketUrl = getSocketUrl();
  const token = explicitToken || (typeof window !== "undefined" ? localStorage.getItem("mg_token") : null);

  socket = io(socketUrl, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    auth: (cb) => {
      const activeToken = explicitToken || (typeof window !== "undefined" ? localStorage.getItem("mg_token") : null);
      cb(activeToken ? { token: activeToken } : {});
    },
    ...(token ? { extraHeaders: { Authorization: `Bearer ${token}` } } : {}),
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    autoConnect: true,
  });

  socket.on("connect", () => {
    if (wasDisconnected) {
      // Reconnected after temporary outage: trigger authoritative REST recovery
      reconnectSubscribers.forEach((cb) => {
        try {
          cb();
        } catch (err) {
          console.error("[Socket.IO] Reconnect subscriber failed:", err);
        }
      });
    }
    wasDisconnected = false;
  });

  socket.on("disconnect", (reason) => {
    wasDisconnected = true;
    if (reason === "io server disconnect") {
      // Server explicitly disconnected the socket (e.g. session invalidated)
      socket = null;
    }
  });

  socket.on("connect_error", (err) => {
    // Graceful error logging - do not crash application
    if (err.message && err.message.includes("Unauthorized")) {
      console.warn("[Socket.IO] Authentication handshake rejected:", err.message);
    }
  });

  return socket;
}

/**
 * Retrieves the current active Socket.IO client instance.
 *
 * @returns {import('socket.io-client').Socket|null}
 */
export function getSocket() {
  return socket;
}

/**
 * Explicitly terminates the Socket.IO connection and clears active references.
 * Called on user logout or session expiration.
 */
export function disconnectSocket() {
  if (socket) {
    try {
      socket.disconnect();
    } catch {
      // ignore
    }
    socket = null;
  }
  wasDisconnected = false;
}

/**
 * Subscribes a callback to be executed whenever the socket recovers from a disconnect.
 *
 * @param {() => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function subscribeToReconnect(callback) {
  if (typeof callback !== "function") return () => {};
  reconnectSubscribers.add(callback);
  return () => {
    reconnectSubscribers.delete(callback);
  };
}

/**
 * Subscribes to a specific Socket.IO domain event name.
 *
 * @param {string} eventName - e.g. 'FLEET_VEHICLE_GROUNDED'
 * @param {(envelope: object) => void} handler - Standardized envelope receiver
 * @returns {() => void} Unsubscribe function
 */
export function subscribeToEvent(eventName, handler) {
  if (!eventName || typeof handler !== "function") return () => {};
  const currentSocket = getSocket() || connectSocket();
  currentSocket.on(eventName, handler);
  return () => {
    currentSocket.off(eventName, handler);
  };
}

// src/context/SocketContext.jsx
/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext.jsx";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  subscribeToReconnect,
} from "../services/socket.js";
import { alertsApi } from "../api/alerts.js";
import { PERMISSIONS } from "../utils/permissions.js";
import { startEmergencyChime, stopEmergencyChime } from "../utils/audioAlert.js";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, can } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const canViewAlerts = can
    ? can(PERMISSIONS.ALERTS_VIEW) || can(PERMISSIONS.ALERTS_MANAGE)
    : false;

  const canViewAlertsRef = useRef(canViewAlerts);
  canViewAlertsRef.current = canViewAlerts;

  // Authoritative REST fetch for active alerts
  const refreshAlerts = useCallback(async () => {
    if (!canViewAlertsRef.current) return [];
    try {
      setIsLoadingAlerts(true);
      const alerts = await alertsApi.getActiveAlerts();
      const list = Array.isArray(alerts) ? alerts : [];
      setActiveAlerts(list);

      // Check if any ongoing alerts are in unacknowledged ACTIVE state
      const hasUnacknowledged = list.some(
        (a) => (a.status || "").toUpperCase() === "ACTIVE"
      );
      if (hasUnacknowledged) {
        startEmergencyChime();
      } else {
        stopEmergencyChime();
      }

      return list;
    } catch (err) {
      console.warn("[SocketContext] Failed to fetch active alerts:", err);
      return [];
    } finally {
      setIsLoadingAlerts(false);
    }
  }, []);

  // Supervisor Acknowledge action
  const acknowledgeAlert = async (alertId) => {
    const updated = await alertsApi.acknowledgeAlert(alertId);
    stopEmergencyChime();
    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "ACKNOWLEDGED", ...updated } : a))
    );
    return updated;
  };

  // Supervisor Resolve action
  const resolveAlert = async (alertId, resolutionNotes = "") => {
    const updated = await alertsApi.resolveAlert(alertId, resolutionNotes);
    stopEmergencyChime();
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
    return updated;
  };

  // Toggle Mute Audio
  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        stopEmergencyChime();
      }
      return next;
    });
  };

  // Connection Lifecycle bound to Authentication
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      stopEmergencyChime();
      setActiveAlerts([]);
      setIsConnected(false);
      return;
    }

    const socket = connectSocket();

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    // Incoming Emergency SOS Event
    const handleAlertTriggered = (envelope) => {
      const alertData = envelope?.data || envelope;
      if (!alertData || !alertData.id) return;

      setActiveAlerts((prev) => [
        alertData,
        ...prev.filter((a) => a.id !== alertData.id),
      ]);

      if (!isMuted) {
        startEmergencyChime();
      }
    };

    // Incoming Alert Status Update (Acknowledged / Resolved)
    const handleAlertStatusUpdated = (envelope) => {
      const alertData = envelope?.data || envelope;
      if (!alertData || !alertData.id) return;

      const newStatus = (alertData.status || "").toUpperCase();

      if (newStatus === "RESOLVED" || newStatus === "FALSE_ALARM") {
        setActiveAlerts((prev) => prev.filter((a) => a.id !== alertData.id));
      } else {
        setActiveAlerts((prev) =>
          prev.map((a) => (a.id === alertData.id ? { ...a, ...alertData } : a))
        );
      }

      // If no more unacknowledged ACTIVE alerts remain, stop chime
      setActiveAlerts((current) => {
        const stillActive = current.some(
          (a) => a.id !== alertData.id && (a.status || "").toUpperCase() === "ACTIVE"
        );
        if (!stillActive) {
          stopEmergencyChime();
        }
        return current;
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("EMERGENCY_ALERT_TRIGGERED", handleAlertTriggered);
    socket.on("EMERGENCY_ALERT_STATUS_UPDATED", handleAlertStatusUpdated);

    // Reconnection Recovery
    const unsubReconnect = subscribeToReconnect(() => {
      refreshAlerts();
    });

    // Initial fetch of active alerts on mount
    refreshAlerts();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("EMERGENCY_ALERT_TRIGGERED", handleAlertTriggered);
      socket.off("EMERGENCY_ALERT_STATUS_UPDATED", handleAlertStatusUpdated);
      unsubReconnect();
      stopEmergencyChime();
    };
  }, [isAuthenticated, isMuted, refreshAlerts]);

  const value = {
    socket: getSocket(),
    isConnected,
    activeAlerts,
    isLoadingAlerts,
    isMuted,
    toggleMute,
    acknowledgeAlert,
    resolveAlert,
    refreshAlerts,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

// src/context/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { authApi } from "../api/auth.js";
import {
  can as canHelper,
  canAll as canAllHelper,
  canAny as canAnyHelper,
} from "../utils/permissions.js";
import {
  onSessionExpired,
  broadcastLogout,
  setupCrossTabSessionSync,
} from "../utils/sessionEvents.js";

const AuthContext = createContext(null);

/**
 * Authentication and Session Provider component.
 * Verifies active session on startup and provides login, logout, and permission evaluation.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const wasAuthenticatedRef = useRef(false);

  useEffect(() => {
    if (user) {
      wasAuthenticatedRef.current = true;
    }
  }, [user]);

  // Check active session on initial load / refresh
  const checkSession = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Listen for session expiration events and cross-tab session events
  useEffect(() => {
    const unsubExpired = onSessionExpired(() => {
      setUser(null);
    });

    const unsubSync = setupCrossTabSessionSync({
      onExpired: () => {
        setUser(null);
      },
      onLogout: () => {
        setUser(null);
      },
    });

    return () => {
      unsubExpired();
      unsubSync();
    };
  }, []);

  // Proactively check session when user switches back to an inactive tab after a period of time
  useEffect(() => {
    if (!user) return;

    let lastCheckTime = Date.now();
    const MIN_CHECK_INTERVAL_MS = 60 * 1000; // Check at most once every 60 seconds

    const handleTabActive = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      const now = Date.now();
      if (now - lastCheckTime < MIN_CHECK_INTERVAL_MS) {
        return;
      }
      lastCheckTime = now;

      try {
        // Silent check: verifies session cookie without showing full-page loading spinner
        const me = await authApi.getMe();
        if (me) {
          setUser((prev) => (prev ? { ...prev, ...me } : me));
        }
      } catch {
        // Genuine 401s will trigger notifySessionExpired via apiClient.
        // Network/offline blips will be safely caught without logging user out.
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleTabActive);
      document.addEventListener("visibilitychange", handleTabActive);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleTabActive);
        document.removeEventListener("visibilitychange", handleTabActive);
      }
    };
  }, [user]);

  // Login handler
  const login = async (username, password) => {
    const loggedInUser = await authApi.login(username, password);
    setUser(loggedInUser);
    return loggedInUser;
  };

  // Logout handler
  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      broadcastLogout();
      setUser(null);
    }
  };

  // Change password handler
  const changePassword = async (payload) => {
    const result = await authApi.changePassword(payload);
    // After password change, backend invalidates session
    broadcastLogout();
    setUser(null);
    return result;
  };

  // Update user profile in state
  const updateUser = (updatedUserData) => {
    setUser((prev) => {
      return { ...prev, ...updatedUserData };
    });
  };

  // Bound permission helpers
  const can = (permission) => canHelper(user, permission);
  const canAll = (permissionsList) => canAllHelper(user, permissionsList);
  const canAny = (permissionsList) => canAnyHelper(user, permissionsList);

  const value = {
    user,
    currentUser: user, // Alias for convenient transition
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    changePassword,
    checkSession,
    updateUser,
    can,
    canAll,
    canAny,
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to consume authentication context.
 * @returns {{
 *   user: object|null,
 *   currentUser: object|null,
 *   loading: boolean,
 *   isAuthenticated: boolean,
 *   login: (username: string, password: string) => Promise<object>,
 *   logout: () => Promise<void>,
 *   changePassword: (payload: object) => Promise<object>,
 *   checkSession: () => Promise<object|null>,
 *   can: (permission: string) => boolean,
 *   canAll: (permissions: string[]) => boolean,
 *   canAny: (permissions: string[]) => boolean
 * }}
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

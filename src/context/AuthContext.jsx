// src/context/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authApi } from "../api/auth.js";
import {
  can as canHelper,
  canAll as canAllHelper,
  canAny as canAnyHelper,
} from "../utils/permissions.js";

const AuthContext = createContext(null);

/**
 * Authentication and Session Provider component.
 * Verifies active session on startup and provides login, logout, and permission evaluation.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setUser(null);
    }
  };

  // Change password handler
  const changePassword = async (payload) => {
    const result = await authApi.changePassword(payload);
    // After password change, backend/mock invalidates session
    setUser(null);
    return result;
  };

  // Update user profile in state & session storage
  const updateUser = (updatedUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData };
      if (typeof window !== "undefined") {
        sessionStorage.setItem("mg_mock_session_user", JSON.stringify(merged));
      }
      return merged;
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

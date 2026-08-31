import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import { PERMISSIONS } from "./utils/permissions.js";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import DynamicHomeRedirect from "./components/auth/DynamicHomeRedirect.jsx";

import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Login/Login";
import Fleet from "./pages/Fleet/Fleet";
import Users from "./pages/Users/Users";
import RouteDispatch from "./pages/RouteDispatch/RouteDispatch";
import Inventory from "./pages/Inventory/Inventory";
import SalesAndDelivery from "./pages/SalesAndDelivery/SalesAndDelivery";
import HistoryLog from "./pages/HistoryLog/HistoryLog";
import Profile from "./pages/Profile/Profile";
import Customers from "./pages/Customers/Customers";

// 1. Configure Protected Routes
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DynamicHomeRedirect />,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute permission={PERMISSIONS.DASHBOARD_VIEW}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "fleet",
        element: (
          <ProtectedRoute permission={PERMISSIONS.FLEET_VIEW}>
            <Fleet />
          </ProtectedRoute>
        ),
      },
      {
        path: "route-dispatch",
        element: (
          <ProtectedRoute
            permission={[PERMISSIONS.ROUTE_VIEW, PERMISSIONS.ROUTE_VIEW_OWN]}
          >
            <RouteDispatch />
          </ProtectedRoute>
        ),
      },
      {
        path: "inventory",
        element: (
          <ProtectedRoute permission={PERMISSIONS.INVENTORY_VIEW}>
            <Inventory />
          </ProtectedRoute>
        ),
      },
      {
        path: "sales-delivery",
        element: (
          <ProtectedRoute
            permission={[PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_VIEW_OWN]}
          >
            <SalesAndDelivery />
          </ProtectedRoute>
        ),
      },
      {
        path: "customers",
        element: (
          <ProtectedRoute
            permission={[PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_VIEW_OWN]}
          >
            <Customers />
          </ProtectedRoute>
        ),
      },
      {
        path: "customer",
        element: <Navigate to="/customers" replace />,
      },
      {
        path: "users",
        element: (
          <ProtectedRoute permission={PERMISSIONS.USERS_VIEW}>
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: "history-log",
        element: (
          <ProtectedRoute permission={PERMISSIONS.HISTORY_VIEW}>
            <HistoryLog />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute permission={PERMISSIONS.PROFILE_VIEW}>
            <Profile />
          </ProtectedRoute>
        ),
      }
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

// 2. Wrap router with AuthProvider
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
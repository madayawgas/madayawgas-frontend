import "./index.css";
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { Analytics } from "@vercel/analytics/react";
import { PERMISSIONS } from "./utils/permissions.js";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import DynamicHomeRedirect from "./components/auth/DynamicHomeRedirect.jsx";

import { sanitizeAppCaches } from "./utils/storageSanitizer.js";
import { onSessionExpired } from "./utils/sessionEvents.js";

import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Login/Login";
// eslint-disable-next-line react-refresh/only-export-components
const DownloadApp = lazy(() => import("./pages/Login/DownloadApp"));
import Fleet from "./pages/Fleet/Fleet";
import Users from "./pages/Users/Users";
import RoutePlanner from "./pages/RoutePlanner/RoutePlanner";
import RouteDispatch from "./pages/RouteDispatch/RouteDispatch";
import StockCheckInPage from "./pages/RouteDispatch/StockCheckInPage";
import PlantWarehouse from "./pages/Inventory/PlantWarehouse";
import TransferRecords from "./pages/Inventory/TransferRecords";
import ProductsCatalog from "./pages/Inventory/ProductsCatalog";
import ServiceZones from "./pages/ServiceZones/ServiceZones";
import SalesOverviewPage from "./pages/SalesAndDelivery/SalesOverviewPage";
import TripRemittancesPage from "./pages/SalesAndDelivery/TripRemittancesPage";
import TransactionsInvoicesPage from "./pages/SalesAndDelivery/TransactionsInvoicesPage";
import HistoryLog from "./pages/HistoryLog/HistoryLog";
import Profile from "./pages/Profile/Profile";
import SystemSettings from "./pages/SystemSettings/SystemSettings";
import Customers from "./pages/Customers/Customers";
import FAQs from "./pages/FAQs/FAQs";

// 1. Configure Protected Routes
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/download-app",
    element: (
      <Suspense fallback={<div className="min-h-screen bg-[#0A4B6E]/10" />}>
        <DownloadApp />
      </Suspense>
    ),
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
          <ProtectedRoute
            permission={[PERMISSIONS.FLEET_VIEW, PERMISSIONS.FLEET_MANAGE]}
          >
            <Fleet />
          </ProtectedRoute>
        ),
      },
      {
        path: "fleet/fuel",
        element: <Navigate to="/fleet?tab=fuel" replace />,
      },
      {
        path: "fleet/apprehensions",
        element: <Navigate to="/fleet?tab=apprehensions" replace />,
      },
      {
        path: "fuel",
        element: <Navigate to="/fleet?tab=fuel" replace />,
      },
      {
        path: "apprehensions",
        element: <Navigate to="/fleet?tab=apprehensions" replace />,
      },
      {
        path: "route-planner",
        element: (
          <ProtectedRoute
            permission={[
              PERMISSIONS.ROUTE_VIEW,
              PERMISSIONS.ROUTE_MANAGE,
              PERMISSIONS.ROUTE_VIEW_OWN,
            ]}
          >
            <RoutePlanner />
          </ProtectedRoute>
        ),
      },
      {
        path: "route-dispatch",
        element: (
          <ProtectedRoute
            permission={[
              PERMISSIONS.ROUTE_VIEW,
              PERMISSIONS.ROUTE_MANAGE,
              PERMISSIONS.ROUTE_VIEW_OWN,
            ]}
          >
            <RouteDispatch />
          </ProtectedRoute>
        ),
      },
      {
        path: "return-checkin",
        element: (
          <ProtectedRoute
            permission={[
              PERMISSIONS.ROUTE_VIEW,
              PERMISSIONS.ROUTE_MANAGE,
              PERMISSIONS.ROUTE_VIEW_OWN,
            ]}
          >
            <StockCheckInPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "route-dispatch/check-in",
        element: <Navigate to="/return-checkin" replace />,
      },
      {
        path: "reconciliation",
        element: <Navigate to="/return-checkin" replace />,
      },
      {
        path: "inventory/plant",
        element: (
          <ProtectedRoute permission={PERMISSIONS.INVENTORY_VIEW}>
            <PlantWarehouse />
          </ProtectedRoute>
        ),
      },
      {
        path: "inventory/transfers",
        element: (
          <ProtectedRoute permission={PERMISSIONS.INVENTORY_VIEW}>
            <TransferRecords />
          </ProtectedRoute>
        ),
      },
      {
        path: "inventory/products",
        element: (
          <ProtectedRoute permission={PERMISSIONS.INVENTORY_VIEW}>
            <ProductsCatalog />
          </ProtectedRoute>
        ),
      },
      {
        path: "settings/zones",
        element: (
          <ProtectedRoute
            permission={[PERMISSIONS.ROUTE_VIEW, PERMISSIONS.ROUTE_MANAGE]}
          >
            <ServiceZones />
          </ProtectedRoute>
        ),
      },
      {
        path: "item-profile",
        element: <Navigate to="/inventory/products" replace />,
      },
      {
        path: "inventory",
        element: <Navigate to="/inventory/plant" replace />,
      },
      {
        path: "service-zones",
        element: <Navigate to="/settings/zones" replace />,
      },
      {
        path: "sales/overview",
        element: (
          <ProtectedRoute
            permission={[PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_VIEW_OWN]}
          >
            <SalesOverviewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "sales/trips",
        element: (
          <ProtectedRoute
            permission={[PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_VIEW_OWN]}
          >
            <TripRemittancesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "sales/transactions",
        element: (
          <ProtectedRoute
            permission={[PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_VIEW_OWN]}
          >
            <TransactionsInvoicesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "sales-delivery",
        element: <Navigate to="/sales/overview" replace />,
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
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "system-settings",
        element: (
          <ProtectedRoute permission={[PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_MANAGE]}>
            <SystemSettings />
          </ProtectedRoute>
        ),
      },
      {
        path: "faqs",
        element: <FAQs />,
      }
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

// 2. Clear any stale caches before rendering
sanitizeAppCaches();

// 3. Listen for session expiration events and immediately navigate to /login
onSessionExpired(() => {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    router.navigate("/login", {
      replace: true,
      state: {
        sessionExpired: true,
        from: {
          pathname: window.location.pathname,
          search: window.location.search,
        },
        message: "Your session has expired. Please log in again to continue.",
      },
    });
  }
});

// 4. Wrap router with AuthProvider and SocketProvider
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <SocketProvider>
        <SettingsProvider>
          <RouterProvider router={router} />
          <Analytics />
        </SettingsProvider>
      </SocketProvider>
    </AuthProvider>
  </StrictMode>
);
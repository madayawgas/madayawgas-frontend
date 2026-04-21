import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import { DataProvider } from "./context/DataContext";

import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Login/Login";
import Fleet from "./pages/Fleet/Fleet";
import Users from "./pages/Users/Users";
import RouteDispatch from "./pages/RouteDispatch/RouteDispatch";
import Inventory from "./pages/Inventory/Inventory";
import SalesAndDelivery from "./pages/SalesAndDelivery/SalesAndDelivery";
import TestPage from "./pages/TestPage/TestPage";

// 1. Configure the Routes
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <Layout />, // Layout handles the security!
    children: [
      {
        index: true, // If they go to exactly "localhost:5173/", redirect to dashboard
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "fleet",
        element: <Fleet />,
      },
      {
        path: "route-dispatch",
        element: <RouteDispatch />,
      },
      {
        path: "inventory",
        element: <Inventory />,
      },
      {
        path: "sales-delivery",
        element: <SalesAndDelivery />,
      },
      {
        path: "users",
        element: <Users />,
      },
      {
        path: "test",
        element: <TestPage />,
      },
    ],
  },
  {
    // Catch-all route: If they type a URL that doesn't exist, kick to login
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

// 2. WRAP THE ROUTER WITH YOUR DATA PROVIDER
createRoot(document.getElementById("root")).render(
  <DataProvider>
    <RouterProvider router={router} />
  </DataProvider>
);
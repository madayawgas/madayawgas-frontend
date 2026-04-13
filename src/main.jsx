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

// Configure the Routes
const router = createBrowserRouter([
  // {
  //   path: "/login",
  //   element: <Login />,
  // },
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
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
    ],
  },
]);

// 2. WRAP THE ROUTER WITH YOUR DATA PROVIDER
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DataProvider>
      <RouterProvider router={router} />
    </DataProvider>
  </StrictMode>,
);

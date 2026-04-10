import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

// import { DataProvider } from "./context/DataContext";  


import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Login/Login";
import Fleet from "./pages/Fleet/Fleet";
import Users from "./pages/Users/Users";

// 2. Configure the Routes
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
        path: "users",
        element: <Users />
      }
    ],
  },
]);


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

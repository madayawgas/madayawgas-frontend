import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";

// Authentication & Layout
import Login from "./pages/Login/Login"; 
import Layout from "./pages/Layout";

// Feature Pages
import Dashboard from "./pages/Dashboard"; 

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 1. Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* 2. Protected Application Routes */}
          <Route path="/app" element={<Layout />}>
            {/* Default redirect: if they just type /app, go to dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
            
            {/* The actual pages that inject into your Layout's <Outlet /> */}
            <Route path="dashboard" element={<Dashboard />} />
          </Route>

          {/* 3. Fallback - Catch any random URLs and send to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
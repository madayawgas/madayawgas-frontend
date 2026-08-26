import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { getDefaultRoute } from "../../utils/permissions.js";

/**
 * Dynamic Home Route redirect based on active user permissions.
 */
export default function DynamicHomeRedirect() {
  const { currentUser, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultRoute(currentUser)} replace />;
}

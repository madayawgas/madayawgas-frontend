import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { can, canAny, getDefaultRoute } from "../../utils/permissions.js";

/**
 * Route guard component enforcing authentication and granular permissions.
 */
export default function ProtectedRoute({ permission, children }) {
  const { isAuthenticated, currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <p className="text-sm font-semibold text-[#0F7AB2]">
          Verifying access...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If the user must change their password, block rendering child pages
  if (currentUser?.mustChangePassword) {
    return null;
  }

  if (permission) {
    const hasAccess = Array.isArray(permission)
      ? canAny(currentUser, permission)
      : can(currentUser, permission);

    if (!hasAccess) {
      const fallback = getDefaultRoute(currentUser);
      const target = fallback === location.pathname ? "/dashboard" : fallback;
      return <Navigate to={target} replace />;
    }
  }

  return children;
}

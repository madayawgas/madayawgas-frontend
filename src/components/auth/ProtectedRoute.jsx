import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { can, canAny } from "../../utils/permissions.js";

/**
 * Route guard component enforcing authentication and granular permissions.
 */
export default function ProtectedRoute({ permission, children }) {
  const { isAuthenticated, currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F2F2F2]">
        <p className="text-sm font-semibold text-[#0F7AB2]">
          Verifying access...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission) {
    const hasAccess = Array.isArray(permission)
      ? canAny(currentUser, permission)
      : can(currentUser, permission);

    if (!hasAccess) {
      return (
        <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 shadow-sm max-w-xl mx-auto mt-10">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            You do not have the required permissions to view this section.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-5 py-2 bg-[#0F7AB2] text-white text-sm font-semibold rounded-lg hover:bg-[#0B6594] transition"
          >
            Go Back
          </button>
        </div>
      );
    }
  }

  return children;
}

import { Navigate } from "react-router-dom";
import { useData } from "../../context/DataContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useData();

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
}
// src/pages/StockReconciliation/StockReconciliation.jsx
import { Navigate } from "react-router-dom";

/**
 * StockReconciliation has been streamlined into StockCheckInModal directly inside Today's Dispatches.
 * Redirecting for backwards compatibility.
 */
export default function StockReconciliation() {
  return <Navigate to="/route-dispatch" replace />;
}

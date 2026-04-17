import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute - Wrapper component for routes that require authentication.
 * Redirects unauthenticated users to the login page.
 * 
 * Usage:
 * <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} />}>
 *   <Route path="/dashboard" element={<Dashboard />} />
 * </Route>
 */
function ProtectedRoute({ children, isLoggedIn, isAdminOnly = false, isAdmin = false }) {
  const token = localStorage.getItem("token");

  // Check if user is authenticated
  if (!isLoggedIn && !token) {
    return <Navigate to="/login" replace />;
  }

  // Check if admin-only route and user is not admin
  if (isAdminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;

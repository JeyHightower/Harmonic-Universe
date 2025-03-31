import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../utils/routes";
import { AUTH_CONFIG } from "../../utils/config";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  console.debug("ProtectedRoute check:", {
    isAuthenticated,
    loading,
    path: location.pathname,
    hasAccessToken: !!localStorage.getItem(AUTH_CONFIG.TOKEN_KEY),
    hasRefreshToken: !!localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY),
  });

  // If still loading, show loading state
  if (loading) {
    console.debug("Auth state is loading, showing loading state");
    return <div>Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.debug("User is not authenticated, redirecting to login");
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // If authenticated, render children
  console.debug("User is authenticated, rendering protected content");
  return children;
}

export default ProtectedRoute;

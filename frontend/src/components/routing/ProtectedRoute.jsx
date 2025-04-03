import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../utils/routes";
import { AUTH_CONFIG } from "../../utils/config";
import { Suspense, useTransition, useState, useEffect } from "react";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState(null);

  // Get tokens directly from localStorage for comparison
  const hasAccessToken = !!localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  const hasRefreshToken = !!localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  const hasStoredUser = !!localStorage.getItem(AUTH_CONFIG.USER_KEY);

  console.debug("ProtectedRoute check:", {
    isAuthenticated,
    loading,
    path: location.pathname,
    query: location.search,
    hasAccessToken,
    hasRefreshToken,
    hasStoredUser,
    hasUser: !!user,
    userId: user?.id,
  });

  // Update content with startTransition when authentication state changes
  useEffect(() => {
    if (!loading && isAuthenticated) {
      startTransition(() => {
        setContent(children);
      });
    }
  }, [loading, isAuthenticated, children]);

  // If still loading, show loading state
  if (loading) {
    console.debug("Auth state is loading, showing loading state");
    return <div>Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.debug("User is not authenticated, redirecting to login");

    // Try to log more debug info
    try {
      const storedToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const storedUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);
      console.debug("Auth failed details:", {
        tokenLength: storedToken ? storedToken.length : 0,
        userDataExists: !!storedUser,
        currentPath: location.pathname,
        searchParams: location.search,
      });
    } catch (e) {
      console.error("Error logging auth details:", e);
    }

    // Save the current location they're trying to access
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // If authenticated, render children with Suspense boundary to handle lazy loading
  console.debug("User is authenticated, rendering protected content");
  return (
    <Suspense fallback={<div>Loading content...</div>}>
      {isPending ? <div>Loading content...</div> : content}
    </Suspense>
  );
}

export default ProtectedRoute;

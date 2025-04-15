import React, { useState, useEffect, Suspense, useTransition, lazy } from "react";
import { Routes, Route, Navigate, useRoutes } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import store, { persistor } from "./store";
import { Navigation } from "./components";
import ModalProvider from "./components/modals/ModalProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import NetworkErrorHandler from "./components/NetworkErrorHandler";
import routes from "./routes/index.jsx";
import { checkAuthState, logout } from "./store/slices/authSlice";
import { authService } from "./services/auth.service.mjs";
import { AUTH_CONFIG } from "./utils";
import "./styles"; // Import all styles

// Loading component for Suspense fallback
const LoadingPage = () => (
  <div className="loading-page">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

// Define a fallback component in case of errors
const ErrorFallback = () => (
  <div className="error-fallback">
    <h1>Something went wrong</h1>
    <p>We&apos;re having trouble loading the application. Please try again later.</p>
  </div>
);

// Not Found component for invalid routes or missing components
const NotFoundPage = () => (
  <div className="not-found-page">
    <h1>Page Not Found</h1>
    <p>The requested page or component could not be found.</p>
    <button onClick={() => window.history.back()}>Go Back</button>
  </div>
);

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

// A component to handle the root path with query parameters
const RootPathHandler = () => {
  const Home = lazy(() => import("./features/home/pages/Home"));
  return (
    <Suspense fallback={<LoadingPage />}>
      <Home />
    </Suspense>
  );
};

// Create a component to properly render lazy-loaded Dashboard
const DashboardComponent = () => (
  <Suspense fallback={<LoadingPage />}>
    {React.createElement(
      lazy(() => import("./features/dashboard/pages/Dashboard"))
    )}
  </Suspense>
);

// Create a separate component for the main app content
const AppContent = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const [isPending, startTransition] = useTransition();
  const [authChecked, setAuthChecked] = useState(false);

  // Use React Router's useRoutes hook to render routes directly
  const element = useRoutes(routes);

  // Check auth state on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Only check auth if we have a token
        const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        
        if (!token) {
          // If no token, nothing to check
          setAuthChecked(true);
          return;
        }
        
        // Check for token validation failure flag
        const tokenFailed = localStorage.getItem("token_verification_failed");
        if (tokenFailed === "true") {
          console.warn("Token previously failed verification, cleaning up");
          // Use centralized auth cleanup
          authService.clearAuthData();
          setAuthChecked(true);
          return;
        }
        
        // Check auth state with a state transition to avoid blocking UI
        startTransition(() => {
          dispatch(checkAuthState());
        });
        
        // Mark as checked regardless of success/failure
        setAuthChecked(true);
      } catch (e) {
        console.error("Auth check error:", e);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [dispatch]);

  // Show loading when checking initial auth state
  if (loading && !authChecked) {
    return <LoadingPage />;
  }

  // Show error if there was an auth check problem - ensure we don't render an object directly
  if (error && !loading) {
    return (
      <div className="auth-error">
        <h2>Authentication Error</h2>
        <p>{typeof error === 'string' ? error : 'Failed to authenticate'}</p>
        <button onClick={() => {
          // Use centralized auth cleanup
          authService.clearAuthData();
          dispatch(logout());
        }}>Return to Login</button>
      </div>
    );
  }

  // Render the routes using useRoutes
  return element;
};

// The main App component
function App() {
  return (
    <ErrorBoundary>
      <NetworkErrorHandler>
        <Provider store={store}>
          <PersistGate loading={<LoadingPage />} persistor={persistor}>
            <ErrorBoundary>
              <ModalProvider>
                <ErrorBoundary>
                  <AppContent />
                </ErrorBoundary>
              </ModalProvider>
            </ErrorBoundary>
          </PersistGate>
        </Provider>
      </NetworkErrorHandler>
    </ErrorBoundary>
  );
}

export default App;

import React, { useState, useEffect, Suspense, useTransition, lazy } from "react";
import { Routes, Route, Navigate, useRoutes } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { useSelector, useDispatch } from "react-redux";
import store, { persistor } from "./store";
import { Navigation, ErrorBoundary, NetworkErrorHandler } from "./components";
import { ModalProvider } from "./contexts/ModalContext";
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

// Inside App.jsx, add a debugging panel component for CORS issues
const DebugPanel = () => {
  const [visible, setVisible] = useState(false);
  const [useProxy, setUseProxy] = useState(
    localStorage.getItem('use_proxy_for_auth') === 'true'
  );
  
  const toggleProxy = () => {
    const newValue = !useProxy;
    setUseProxy(newValue);
    localStorage.setItem('use_proxy_for_auth', String(newValue));
    console.log(`CORS proxy for auth ${newValue ? 'enabled' : 'disabled'}`);
  };
  
  // Secret key combo to show/hide debug panel: Shift+Alt+D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && e.altKey && e.key === 'D') {
        setVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  if (!visible) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      padding: '10px',
      borderRadius: '5px',
      color: 'white',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <h4 style={{ margin: '0 0 8px 0' }}>Debug Tools</h4>
      <div>
        <label>
          <input 
            type="checkbox" 
            checked={useProxy} 
            onChange={toggleProxy} 
          />
          Use CORS proxy for auth
        </label>
      </div>
      <button 
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        style={{
          marginTop: '8px',
          padding: '4px 8px',
          background: '#d9534f',
          border: 'none',
          borderRadius: '3px',
          color: 'white',
          cursor: 'pointer'
        }}
      >
        Clear All & Reload
      </button>
    </div>
  );
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
      
      {/* Add DebugPanel at the end */}
      <DebugPanel />
    </ErrorBoundary>
  );
}

export default App;

import React, { lazy, Suspense, useEffect, useState, useTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AudioProvider, ErrorBoundary, NetworkErrorHandler } from './components';
import { authService } from './services/auth.service.mjs';
import { checkAuthState, logoutThunk } from './store/thunks/authThunks';
import './styles'; // Import all styles
import { AUTH_CONFIG } from './utils';
import { fixModalZIndex, resetModalSystem } from './utils/modalUtils.mjs';
import { cleanupAllPortals, ensurePortalRoot } from './utils/portalUtils.mjs';
// Import modal debugging utilities in development
import { setupModalDebugging } from './utils/modalDebug.mjs';
// Import the safer interaction fixes
import { applyEssentialFixes, setupAutoFix } from './utils/interactionFixes.mjs';

const ModalManager = lazy(() => import('./components/modals/ModalManager.jsx'));

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

// Modal system initialization - ensures the modal system is in a clean state
const initModalSystem = () => {
  // Clean up any lingering modals from previous sessions
  cleanupAllPortals();
  // Make sure portal root exists
  ensurePortalRoot();
  // Fix any z-index issues
  fixModalZIndex();

  // Only apply basic fixes to document.body
  document.body.style.pointerEvents = 'auto';

  // Ensure the portal root has pointer events
  setTimeout(() => {
    const portalRoot = document.getElementById('portal-root');
    if (portalRoot) {
      portalRoot.style.pointerEvents = 'none'; // Changed to none to allow clicks to pass through
    }
  }, 500);

  // Apply essential fixes immediately
  applyEssentialFixes();

  // Add a listener for modal system cleanup on page unload
  window.addEventListener('beforeunload', () => {
    resetModalSystem();
  });

  // Setup debug utilities in development
  if (process.env.NODE_ENV !== 'production') {
    setupModalDebugging();
  }

  // Expose modal utils for debugging in console
  window.__modalSystem = {
    resetModalSystem,
    fixModalZIndex,
    cleanupAllPortals,
    fixInteractions: () => {
      applyEssentialFixes();
      return true;
    },
  };
};

// Initialize modal system on app load
initModalSystem();

// A component to handle the root path with query parameters
const RootPathHandler = () => {
  const Home = lazy(() => import('./features/home/pages/Home'));
  return (
    <Suspense fallback={<LoadingPage />}>
      <Home />
    </Suspense>
  );
};

// Create a component to properly render lazy-loaded Dashboard
const DashboardComponent = () => (
  <Suspense fallback={<LoadingPage />}>
    {React.createElement(lazy(() => import('./features/dashboard/pages/Dashboard')))}
  </Suspense>
);

// Create a separate component for the main app content
const AppContent = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const [isPending, startTransition] = useTransition();
  const [authChecked, setAuthChecked] = useState(false);
  const [logoutDispatched, setLogoutDispatched] = useState(false);

  // Import AppRoutes instead of trying to use routes directly
  const AppRoutes = React.lazy(() => import('./routes/index'));

  // Apply interaction fixes after React has fully initialized
  useEffect(() => {
    // Reset any lingering modal state
    resetModalSystem();

    // Wait for React to fully initialize before applying fixes
    const timeoutId = setTimeout(() => {
      // Apply safe fixes that won't break React's event system
      applyEssentialFixes();

      // Set up auto-fix to periodically check and fix issues
      const cleanupAutoFix = setupAutoFix();

      return () => {
        clearTimeout(timeoutId);
        cleanupAutoFix();
      };
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

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
        const tokenFailed = localStorage.getItem('token_verification_failed');
        if (tokenFailed === 'true') {
          console.warn('Token previously failed verification, cleaning up');
          // Use centralized auth cleanup
          authService.clearAuthData();
          setAuthChecked(true);
          return;
        }

        // Check if token is valid locally first
        if (!authService.isTokenValid(token)) {
          console.warn('Token failed local validation');
          authService.clearAuthData();
          localStorage.setItem('token_verification_failed', 'true');
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
        console.error('Auth check error:', e);
        localStorage.setItem('token_verification_failed', 'true');
        authService.clearAuthData();
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
        <button
          onClick={() => {
            // Use centralized auth cleanup
            authService.clearAuthData();
            localStorage.setItem('token_verification_failed', 'true');
            if (!logoutDispatched) {
              dispatch(logoutThunk());
              setLogoutDispatched(true);
            }
          }}
        >
          Return to Login
        </button>
      </div>
    );
  }

  // Render the routes using AppRoutes component
  return (
    <Suspense fallback={<LoadingPage />}>
      <AppRoutes />
    </Suspense>
  );
};

// Inside App.jsx, add a debugging panel component for CORS issues
const DebugPanel = () => {
  const [visible, setVisible] = useState(false);
  const [useProxy, setUseProxy] = useState(localStorage.getItem('use_proxy_for_auth') === 'true');

  const toggleProxy = () => {
    const newValue = !useProxy;
    setUseProxy(newValue);
    localStorage.setItem('use_proxy_for_auth', String(newValue));
  };

  // Secret key combo to show/hide debug panel: Shift+Alt+D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && e.altKey && e.key === 'D') {
        setVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        padding: '10px',
        borderRadius: '5px',
        color: 'white',
        zIndex: 9999,
        fontSize: '12px',
      }}
    >
      <h4 style={{ margin: '0 0 8px 0' }}>Debug Tools</h4>
      <div>
        <label>
          <input type="checkbox" checked={useProxy} onChange={toggleProxy} />
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
          cursor: 'pointer',
        }}
      >
        Clear All & Reload
      </button>
      <button
        onClick={() => {
          applyEssentialFixes();
        }}
        style={{
          marginTop: '8px',
          padding: '4px 8px',
          background: '#5cb85c',
          border: 'none',
          borderRadius: '3px',
          color: 'white',
          cursor: 'pointer',
          display: 'block',
          width: '100%',
        }}
      >
        Fix Interactions
      </button>
    </div>
  );
};

// The main App component
const App = () => {
  // Setup auto-fix on mount
  useEffect(() => {
    const cleanup = setupAutoFix();
    return () => cleanup();
  }, []);

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <NetworkErrorHandler>
        <Suspense fallback={<LoadingPage />}>
          <AudioProvider>
            <AppContent />
            <Suspense fallback={<div>Loading modal manager...</div>}>
              <ModalManager />
            </Suspense>
          </AudioProvider>
        </Suspense>
      </NetworkErrorHandler>
    </ErrorBoundary>
  );
};

export default App;

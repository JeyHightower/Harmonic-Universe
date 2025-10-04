import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout.jsx';
import ProtectedRoute from '../components/routing/ProtectedRoute.jsx';
import { ROUTES } from '../utils/routes.jsx';

// Import hooks from barrel (directory path resolves to ./src/hooks/index.mjs)
import {
  useApiError,
  useAuthError,
  useAuthInit,
  useModalFixes,
  useNetworkError
} from '../hooks';

/**
 * Shared loading fallback component for Suspense during lazy loading.
 * Displays a spinner and custom message for better UX.
 */
const LoadingFallback = ({ message = 'Loading...' }) => (
  <div
    className="loading-container"
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
      minHeight: '200px',
    }}
  >
    <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '16px' }}></div>
    <p style={{ margin: 0, fontSize: '16px', color: '#666' }}>{message}</p>
  </div>
);

/**
 * Utility function to validate universeId param.
 * Prevents invalid IDs from loading protected pages.
 * Could be extracted to a hook (e.g., useUniverseValidator) if reused elsewhere.
 */
const validateUniverseId = (universeId) => {
  return (
    universeId &&
    universeId !== 'undefined' &&
    universeId !== 'null' &&
    !isNaN(parseInt(universeId, 10)) &&
    parseInt(universeId, 10) > 0
  );
};

// Lazy-loaded page and component imports (unchanged for performance)
const CharactersPage = lazy(() => import('../features/character/pages/CharactersPage'));
const NotesPage = lazy(() => import('../features/note/pages/NotesPage'));
const CharacterDetail = lazy(() => import('../features/character/pages/CharacterDetail'));
const NoteDetail = lazy(() => import('../features/note/pages/NoteDetail'));
const SettingsPage = lazy(() => import('../features/settings/pages/SettingsPage'));
const Dashboard = lazy(() => import('../features/dashboard/pages/Dashboard.jsx'));
const Home = lazy(() => import('../features/home/pages/Home'));
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const UniverseDetail = lazy(() => import('../features/universe/pages/UniverseDetail'));
const ScenesPage = lazy(() => import('../features/scene/pages/ScenesPage'));
const SceneDetail = lazy(() => import('../features/scene/pages/SceneDetail'));
const SceneEditPage = lazy(() => import('../features/scene/pages/SceneEditPage'));
const SceneEditRedirect = lazy(() => import('../components/routing/SceneEditRedirect'));
const PhysicsPage = lazy(() => import('../features/physics/pages/PhysicsPage'));
const SceneModal = lazy(() => import('../features/scene/modals/SceneModal'));

/**
 * Route wrapper for creating a new scene via modal.
 * Validates universeId implicitly via params; uses useModalFixes for reliability.
 */
const SceneCreateRoute = () => {
  const { universeId } = useParams();
  const navigate = useNavigate();
  const { fixModals } = useModalFixes();  // Hook: Fixes modal z-index, overflow, escape key issues

  useEffect(() => {
    fixModals();  // Apply modal fixes on route mount
  }, [fixModals]);

  if (!validateUniverseId(universeId)) {
    // Early redirect with error log (integrate useApiError if needed)
    navigate('/dashboard', { replace: true });
    return null;
  }

  return (
    <SceneModal
      isOpen={true}
      onClose={() => navigate(`/universes/${universeId}/scenes`)}
      modalType="create"
      universeId={universeId}
      onSuccess={(actionType, scene) => {
        if (scene && scene.id) {
          navigate(`/universes/${universeId}/scenes/${scene.id}`);
        } else {
          navigate(`/universes/${universeId}/scenes`);
        }
      }}
    />
  );
};

/**
 * Route handler for characters pages (with universeId validation).
 * Logs invalid IDs via useApiError; wraps in Suspense.
 */
const CharactersRouteHandler = () => {
  const { universeId } = useParams();
  const { handleError } = useApiError({ context: 'characters-route' });

  if (!validateUniverseId(universeId)) {
    const invalidError = new Error('Invalid universe ID for characters page');
    handleError(invalidError);  // Standardized logging via errorService
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Suspense fallback={<LoadingFallback message="Loading characters..." />}>
      <CharactersPage />
    </Suspense>
  );
};

/**
 * Route handler for notes pages (similar to characters).
 */
const NotesRouteHandler = () => {
  const { universeId } = useParams();
  const { handleError } = useApiError({ context: 'notes-route' });

  if (!validateUniverseId(universeId)) {
    const invalidError = new Error('Invalid universe ID for notes page');
    handleError(invalidError);
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Suspense fallback={<LoadingFallback message="Loading notes..." />}>
      <NotesPage />
    </Suspense>
  );
};

/**
 * Wrapped Layout component with global hook initialization.
 * Runs auth init and modal fixes on every layout render (e.g., route changes).
 */
const WrappedLayout = () => {
  const { initAuth } = useAuthInit();  // Hook: Initializes auth state, tokens, etc.
  const { fixModals } = useModalFixes();

  useEffect(() => {
    initAuth();  // Ensure auth is ready (e.g., check session, redirect if unauthorized)
    fixModals();  // Global modal fixes (e.g., body overflow, z-index stacking)
  }, [initAuth, fixModals]);

  return <Layout />;
};

/**
 * Enhanced ProtectedRoute wrapper.
 * Integrates useAuthError for additional auth checks (e.g., session expired).
 * Props passed through to original ProtectedRoute.
 */
const EnhancedProtectedRoute = ({ children, ...props }) => {
  const { isAuthError, isSessionError } = useAuthError({
    context: 'protected-route',
    onUnauthorized: () => {},  // Optional: Custom handlers
    onSessionExpired: () => {},
  });

  // Example: Additional check (expand based on your ProtectedRoute logic)
  // if (isSessionError(someAuthStateError)) { return <Navigate to="/login" />; }

  return <ProtectedRoute {...props}>{children}</ProtectedRoute>;
};

/**
 * Login redirect component with error handling.
 * Navigates to modal-based login; catches any navigation errors.
 */
const LoginRedirect = () => {
  const navigate = useNavigate();
  const { handleError } = useAuthError({ context: 'login-redirect' });

  useEffect(() => {
    try {
      navigate('/?modal=login', { replace: true });
    } catch (error) {
      handleError(error);  // Log redirect failures (e.g., router issues)
    }
  }, [navigate, handleError]);

  return (
    <div className="redirect-loader" style={{ textAlign: 'center', padding: '50px' }}>
      <p>Redirecting to login...</p>
    </div>
  );
};

// Grouped route definitions for modularity
// Auth routes (public, top-level - outside layout)
const authRoutes = [
  { path: ROUTES.LOGIN, element: <LoginRedirect /> },
  { path: ROUTES.SIGNUP, element: <Navigate to="/?modal=signup" replace /> },
  { path: ROUTES.DEMO_LOGIN, element: <LoginPage /> },
];

// Dashboard and general app routes (under layout)
const dashboardRoutes = [
  { index: true, element: <Home /> },  // Home as index route
  {
    path: ROUTES.DASHBOARD,
    element: (
      <Suspense fallback={<LoadingFallback message="Loading dashboard..." />}>
        <EnhancedProtectedRoute>
          <Dashboard />
        </EnhancedProtectedRoute>
      </Suspense>
    )
  },
  {
    path: ROUTES.SETTINGS,
    element: (
      <Suspense fallback={<LoadingFallback message="Loading settings..." />}>
        <EnhancedProtectedRoute>
          <SettingsPage />
        </EnhancedProtectedRoute>
      </Suspense>
    )
  },
  {
    path: ROUTES.PHYSICS,
    element: (
      <Suspense fallback={<LoadingFallback message="Loading physics simulator..." />}>
        <EnhancedProtectedRoute>
          <PhysicsPage />
        </EnhancedProtectedRoute>
      </Suspense>
    )
  },
];

// Universe and feature-specific routes (under layout, protected)
const universeRoutes = [
  {
    path: ROUTES.UNIVERSE_DETAIL,
    element: (
      <Suspense fallback={<LoadingFallback message="Loading universe..." />}>
        <EnhancedProtectedRoute>
          <UniverseDetail />
        </EnhancedProtectedRoute>
      </Suspense>
    )
  },
  {
    path: ROUTES.UNIVERSE_EDIT,
    element: (
      <Suspense fallback={<LoadingFallback message="Loading universe editor..." />}>
        <EnhancedProtectedRoute>
          <UniverseDetail />
        </EnhancedProtectedRoute>
      </Suspense>
    )
  },
  {
    path: ROUTES.SCENES,
    element: (
      <Suspense fallback={<LoadingFallback message="Loading scenes..." />}>
        <EnhancedProtectedRoute>
          <ScenesPage />
        </EnhancedProtectedRoute>
      </Suspense>
    )
  },
  {
    path: ROUTES.SCENE_CREATE,
    element: (
      <EnhancedProtectedRoute>
        <SceneCreateRoute />
      </EnhancedProtectedRoute>
    )
  },
  {
    path: ROUTES.SCENE_DETAIL,
    element: (
      <Suspense fallback={<LoadingFallback message="Loading scene..." />}>
        <EnhancedProtectedRoute>
          <SceneDetail />
        </EnhancedProtectedRoute>
      </Suspense>
    )
  },
  {
    path: ROUTES.SCENE_EDIT,
    element: (
      <Suspense fallback={<LoadingFallback message="Loading scene editor..." />}>
        <EnhancedProtectedRoute>
          <SceneEditPage />
        </EnhancedProtectedRoute>
      </Suspense>
    )
  },
  {
    path: ROUTES.DIRECT_SCENE_EDIT,
    element: (
      <EnhancedProtectedRoute>
        <SceneEditRedirect />
      </EnhancedProtectedRoute>
    )
  },
  // Characters routes (with validation handler)
  {
    path: ROUTES.CHARACTERS,
    element: (
      <EnhancedProtectedRoute>
        <CharactersRouteHandler />
      </EnhancedProtectedRoute>
    )
  },
  {
    path: ROUTES.CHARACTERS_FOR_SCENE,
    element: (
      <EnhancedProtectedRoute>
        <CharactersRouteHandler />
      </EnhancedProtectedRoute>
    )
  },
  // Notes routes (with validation handler)
  {
    path: ROUTES.NOTES,
    element: (
      <EnhancedProtectedRoute>
        <NotesRouteHandler />
      </EnhancedProtectedRoute>
    )
  },
  {
    path: ROUTES.NOTES_FOR_SCENE,
    element: (
      <EnhancedProtectedRoute>
        <NotesRouteHandler />
      </EnhancedProtectedRoute>
    )
  },
  // Legacy routes for backward compatibility
  {
    path: ROUTES.CHARACTER_DETAIL,
    element: (
      <Suspense fallback={<LoadingFallback message="Loading character..." />}>
        <EnhancedProtectedRoute>
          <CharacterDetail />
        </EnhancedProtectedRoute>
      </Suspense>
    )
  },
  {
    path: ROUTES.NOTE_DETAIL,
    element: (
      <Suspense fallback={<LoadingFallback message="Loading note..." />}>
        <EnhancedProtectedRoute>
          <NoteDetail />
        </EnhancedProtectedRoute>
      </Suspense>
    )
  },
];

// Main AppRoutes component
// Renders all routes with global error handling via hooks.
const AppRoutes = () => {
  const { handleError: handleRouteError } = useApiError({ context: 'app-routes-global' });
  const { isNetworkError } = useNetworkError();

  // Global error listener for unhandled errors (e.g., lazy load failures, network issues)
  useEffect(() => {
    const handleGlobalError = (event) => {
      const error = event.error || event.reason;
      if (isNetworkError(error)) {
        handleRouteError(error);  // Log via errorService with retry logic if applicable
        // Optional: Show toast or redirect
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalError);  // For promises
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleGlobalError);
    };
  }, [handleRouteError, isNetworkError]);

  // Combined routes: Layout with children + top-level auth + 404
  const allRoutes = [
    {
      path: ROUTES.HOME,
      element: <WrappedLayout />,
      children: [...dashboardRoutes, ...universeRoutes],  // All protected/app routes as children
    },
    // Top-level auth routes (public)
    ...authRoutes.map((route) => ({ path: route.path, element: route.element })),
    // Catch-all 404: Redirect to home
    { path: '*', element: <Navigate to="/" replace /> },
  ];

  return (
    <Routes future={{ v7_startTransition: true }}>
      {allRoutes.map((route, index) => (
        <Route key={index} path={route.path} element={route.element}>
          {route.children?.map((child, childIndex) => (
            <Route
              key={`${index}-${childIndex}`}
              path={child.path}
              index={child.index}
              element={child.element}  // Already wrapped in Suspense where needed
            />
          ))}
        </Route>
      ))}
    </Routes>
  );
};

export default AppRoutes;

import { lazy, Suspense, useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/routing/ProtectedRoute';
import { ModalProvider } from '../contexts/ModalContext';
import { SceneModal } from '../features/scene/index.mjs';
import { ROUTES } from '../utils/routes';

// Shared loading component
const LoadingFallback = ({ message = 'Loading...' }) => (
  <div
    className="loading-container"
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
    }}
  >
    <div className="loading-spinner"></div>
    <p>{message}</p>
  </div>
);

// Shared validation utility for route handlers
const validateUniverseId = (universeId) => {
  return (
    universeId &&
    universeId !== 'undefined' &&
    universeId !== 'null' &&
    !isNaN(parseInt(universeId, 10)) &&
    parseInt(universeId, 10) > 0
  );
};

// Lazy load components
const CharactersPage = lazy(() => import('../features/character/pages/CharactersPage'));
const NotesPage = lazy(() => import('../features/note/pages/NotesPage'));
const CharacterDetail = lazy(() => import('../features/character/pages/CharacterDetail'));
const NoteDetail = lazy(() => import('../features/note/pages/NoteDetail'));
const SettingsPage = lazy(() => import('../features/settings/pages/SettingsPage'));
const Dashboard = lazy(() => import('../features/dashboard/pages/Dashboard'));
const Home = lazy(() => import('../features/home/pages/Home'));
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const UniverseDetail = lazy(() => import('../features/universe/pages/UniverseDetail'));
const ScenesPage = lazy(() => import('../features/scene/pages/ScenesPage'));
const SceneDetail = lazy(() => import('../features/scene/pages/SceneDetail'));
const SceneEditPage = lazy(() => import('../features/scene/pages/SceneEditPage'));
const SceneEditRedirect = lazy(() => import('../components/routing/SceneEditRedirect'));
const PhysicsPage = lazy(() => import('../features/physics/pages/PhysicsPage'));

// Create a wrapper component for SceneModal in routes
const SceneCreateRoute = () => {
  const { universeId } = useParams();
  const navigate = useNavigate();

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

// Create a special route handler for characters to validate the universeId
const CharactersRouteHandler = () => {
  const { universeId } = useParams();
  console.log(`CharactersRouteHandler: Received universeId=${universeId}`);

  if (!validateUniverseId(universeId)) {
    console.log(`Invalid universeId in route params (${universeId}), redirecting to dashboard`);
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Suspense fallback={<LoadingFallback message="Loading characters..." />}>
      <CharactersPage />
    </Suspense>
  );
};

// Create a special route handler for notes to validate the universeId
const NotesRouteHandler = () => {
  const { universeId } = useParams();
  console.log(`NotesRouteHandler: Received universeId=${universeId}`);

  if (!validateUniverseId(universeId)) {
    console.log(
      `Invalid universeId in route params (${universeId}) for notes, redirecting to dashboard`
    );
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Suspense fallback={<LoadingFallback message="Loading notes..." />}>
      <NotesPage />
    </Suspense>
  );
};

// Create a wrapped Layout component with ModalProvider
const WrappedLayout = () => (
  <ModalProvider>
    <Layout />
  </ModalProvider>
);

// Login redirect component
const LoginRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/?modal=login', { replace: true });
  }, [navigate]);

  return <div className="redirect-loader">Redirecting to login...</div>;
};

// Define routes
const routes = [
  {
    path: ROUTES.HOME,
    element: <WrappedLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: ROUTES.DASHBOARD,
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.UNIVERSE_DETAIL,
        element: (
          <ProtectedRoute>
            <UniverseDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.UNIVERSE_EDIT,
        element: (
          <ProtectedRoute>
            <UniverseDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SCENES,
        element: (
          <ProtectedRoute>
            <ScenesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SCENE_CREATE,
        element: (
          <ProtectedRoute>
            <SceneCreateRoute />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SCENE_DETAIL,
        element: (
          <ProtectedRoute>
            <SceneDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SCENE_EDIT,
        element: (
          <ProtectedRoute>
            <SceneEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.DIRECT_SCENE_EDIT,
        element: (
          <ProtectedRoute>
            <SceneEditRedirect />
          </ProtectedRoute>
        ),
      },
      // New character routes
      {
        path: ROUTES.CHARACTERS,
        element: (
          <ProtectedRoute>
            <CharactersRouteHandler />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.CHARACTERS_FOR_SCENE,
        element: (
          <ProtectedRoute>
            <CharactersRouteHandler />
          </ProtectedRoute>
        ),
      },
      // New note routes
      {
        path: ROUTES.NOTES,
        element: (
          <ProtectedRoute>
            <NotesRouteHandler />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.NOTES_FOR_SCENE,
        element: (
          <ProtectedRoute>
            <NotesRouteHandler />
          </ProtectedRoute>
        ),
      },
      // Legacy routes for backward compatibility
      {
        path: ROUTES.CHARACTER_DETAIL,
        element: (
          <ProtectedRoute>
            <CharacterDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.NOTE_DETAIL,
        element: (
          <ProtectedRoute>
            <NoteDetail />
          </ProtectedRoute>
        ),
      },
      // Settings route
      {
        path: ROUTES.SETTINGS,
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      // Physics route
      {
        path: ROUTES.PHYSICS,
        element: (
          <ProtectedRoute>
            <PhysicsPage />
          </ProtectedRoute>
        ),
      },
      // Login redirect route
      {
        path: ROUTES.LOGIN,
        element: <LoginRedirect />,
      },
      // Signup redirect route
      {
        path: ROUTES.SIGNUP,
        element: <Navigate to="/?modal=signup" replace />,
      },
      // Demo login route
      {
        path: ROUTES.DEMO_LOGIN,
        element: <LoginPage />,
      },
      // Catch-all route for 404
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
];

export default routes;

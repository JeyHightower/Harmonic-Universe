import { lazy, Suspense, useEffect } from "react";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../components/routing/ProtectedRoute";
import { ROUTES } from "../utils/routes";
import { SceneModal } from "../features/scene/index.mjs";

// Create a wrapper component for SceneModal in routes
export const SceneCreateRoute = () => {
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

// Lazy load components
const SettingsPage = lazy(() => import("../features/settings/pages/SettingsPage"));
const Dashboard = lazy(() => import("../features/dashboard/pages/Dashboard"));
const Home = lazy(() => import("../features/home/pages/Home"));
const LoginPage = lazy(() => import("../features/auth/pages/LoginPage"));
const UniverseDetail = lazy(() => import("../features/universe/pages/UniverseDetail"));
const ScenesPage = lazy(() => import("../features/scene/pages/ScenesPage"));
const SceneDetail = lazy(() => import("../features/scene/pages/SceneDetail"));
const SceneEditPage = lazy(() => import("../features/scene/pages/SceneEditPage"));
const SceneEditRedirect = lazy(() => import("../components/routing/SceneEditRedirect"));
const PhysicsPage = lazy(() => import("../features/physics/pages/PhysicsPage"));

// New character and note pages
const CharactersPage = lazy(() => import("../features/character/pages/CharactersPage"));
const NotesPage = lazy(() => import("../features/note/pages/NotesPage"));

// Create a special route handler for characters to validate the universeId
export const CharactersRouteHandler = () => {
  const { universeId } = useParams();
  console.log(`CharactersRouteHandler: Received universeId=${universeId}`);

  // Stricter validation to check for valid numeric ID
  const isValidId =
    universeId &&
    universeId !== "undefined" &&
    universeId !== "null" &&
    !isNaN(parseInt(universeId, 10)) &&
    parseInt(universeId, 10) > 0;

  if (!isValidId) {
    console.log(
      `Invalid universeId in route params (${universeId}), redirecting to dashboard`
    );
    return <Navigate to="/dashboard" replace />;
  }

  // Explicitly parse the ID to ensure it's numeric
  const parsedId = parseInt(universeId, 10);
  console.log(
    `CharactersRouteHandler: Rendering CharactersPage with universeId=${parsedId}`
  );

  // Only render if we have a valid ID
  return (
    <Suspense
      fallback={
        <div
          className="loading-container"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          <div className="loading-spinner"></div>
          <p>Loading characters...</p>
        </div>
      }
    >
      <CharactersPage />
    </Suspense>
  );
};

// Create a special route handler for notes to validate the universeId
export const NotesRouteHandler = () => {
  const { universeId } = useParams();
  console.log(`NotesRouteHandler: Received universeId=${universeId}`);

  // Stricter validation to check for valid numeric ID
  const isValidId =
    universeId &&
    universeId !== "undefined" &&
    universeId !== "null" &&
    !isNaN(parseInt(universeId, 10)) &&
    parseInt(universeId, 10) > 0;

  if (!isValidId) {
    console.log(
      `Invalid universeId in route params (${universeId}) for notes, redirecting to dashboard`
    );
    return <Navigate to="/dashboard" replace />;
  }

  // Explicitly parse the ID to ensure it's numeric
  const parsedId = parseInt(universeId, 10);
  console.log(
    `NotesRouteHandler: Rendering NotesPage with universeId=${parsedId}`
  );

  // Only render if we have a valid ID
  return (
    <Suspense
      fallback={
        <div
          className="loading-container"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          <div className="loading-spinner"></div>
          <p>Loading notes...</p>
        </div>
      }
    >
      <NotesPage />
    </Suspense>
  );
};

// Add a redirect route for /login to fix "No routes matched location /login" error
export const LoginRedirect = () => {
  const navigate = useNavigate();

  // Redirect to home page with login modal parameter
  useEffect(() => {
    navigate("/?modal=login", { replace: true });
  }, [navigate]);

  return <div className="redirect-loader">Redirecting to login...</div>;
};

// Legacy components that are currently used
const CharacterDetail = lazy(() =>
  import("../features/character/pages/CharacterDetail")
);
const NoteDetail = lazy(() => import("../features/note/pages/NoteDetail"));

// Create a wrapper component for SceneModal in routes
const routes = [
  {
    path: ROUTES.HOME,
    element: <Layout />,
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
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
];

export default routes;

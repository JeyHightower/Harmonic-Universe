import { lazy, Suspense, useEffect } from "react";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../components/routing/ProtectedRoute";
import { ROUTES } from "../utils/routes";
import ModalTest from "../components/test/ModalTest";

// Create a stub component instead of importing from missing path
const SceneModalHandler = ({ isOpen, onClose, modalType, universeId, onSuccess }) => {
  return (
    <div>
      <h2>Scene Modal Handler</h2>
      <p>This is a placeholder for the SceneModalHandler component.</p>
      <button onClick={() => onClose()}>Close</button>
    </div>
  );
};

// Create a wrapper component for SceneModalHandler in routes
const SceneCreateRoute = () => {
  const { universeId } = useParams();
  const navigate = useNavigate();

  return (
    <SceneModalHandler
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
const UniverseDetail = lazy(() => import("../features/universe/pages/UniverseDetailPage"));
const SceneList = lazy(() => import("../features/scene/pages/SceneList"));
const SceneDetail = lazy(() => import("../features/scene/pages/SceneDetail"));
const SceneEditPage = lazy(() => import("../features/scene/pages/SceneEditPage"));
const SceneEditRedirect = lazy(() => import("../components/routing/SceneEditRedirect"));

// New character and note pages
const CharactersPage = lazy(() => import("../features/character/pages/CharactersPage"));
const NotesPage = lazy(() => import("../features/note/pages/NotesPage"));

// Create a special route handler for characters to validate the universeId
const CharactersRouteHandler = () => {
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
const NotesRouteHandler = () => {
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
const LoginRedirect = () => {
  const navigate = useNavigate();

  // Redirect to home page with login modal parameter
  useEffect(() => {
    navigate("/?modal=login", { replace: true });
  }, [navigate]);

  return <div className="redirect-loader">Redirecting to login...</div>;
};

// Legacy components to be replaced
const CharacterList = lazy(() =>
  import("../features/character/components/CharacterList")
);
const CharacterDetail = lazy(() =>
  import("../features/character/pages/CharacterDetail")
);
const NoteList = lazy(() => import("../features/note/components/NoteList"));
const NoteDetail = lazy(() => import("../features/note/pages/NoteDetail"));

// Create a wrapper component for SceneModalHandler in routes
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
            <SceneList />
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
      {
        path: ROUTES.CHARACTER_DETAIL,
        element: (
          <ProtectedRoute>
            <CharacterDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.CHARACTER_EDIT,
        element: (
          <ProtectedRoute>
            <CharacterDetail />
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
      {
        path: ROUTES.NOTES_FOR_CHARACTER,
        element: (
          <ProtectedRoute>
            <NotesRouteHandler />
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
      {
        path: ROUTES.NOTE_EDIT,
        element: (
          <ProtectedRoute>
            <NoteDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SETTINGS,
        element: <SettingsPage />,
      },
      {
        path: ROUTES.MODAL_TEST,
        element: <ModalTest />,
      },
      {
        path: ROUTES.LOGIN,
        element: <LoginRedirect />,
      },
      {
        path: ROUTES.SIGNUP,
        element: <Navigate to="/?modal=signup" replace />,
      },
      {
        path: "/demo",
        element: <Navigate to="/login" replace />,
      },
      // Add route for /demo-login that loads the LoginPage component
      {
        path: "demo-login",
        element: <LoginPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={ROUTES.HOME} replace />,
  },
];

// Log all route paths for debugging
console.log(
  "Defined routes in routes/index.jsx:",
  routes.flatMap((route) =>
    route.children
      ? [
          `Parent: ${route.path}`,
          ...route.children.map((child) => `  Child: ${child.path || "index"}`),
        ]
      : [route.path]
  )
);

// Log specific character routes for debugging
const characterRoutes = routes[0].children.filter(
  (route) =>
    route.path &&
    (route.path.includes("characters") || route.path.includes("character"))
);

console.log(
  "Character routes:",
  characterRoutes.map((r) => r.path)
);

export default routes;

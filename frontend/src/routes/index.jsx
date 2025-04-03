import { lazy } from "react";
import { Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../components/routing/ProtectedRoute";
import { ROUTES } from "../utils/routes";
import ModalTest from "../components/test/ModalTest";

// Lazy load components
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const Dashboard = lazy(() => import("../features/Dashboard"));
const Home = lazy(() => import("../pages/Home"));
const UniverseDetail = lazy(() => import("../features/UniverseDetail"));
const SceneList = lazy(() => import("../features/SceneList"));
const SceneDetail = lazy(() =>
  import("../components/consolidated/SceneDetail")
);
const SceneEditPage = lazy(() =>
  import("../components/consolidated/SceneEditPage")
);
const SceneEditRedirect = lazy(() =>
  import("../components/routing/SceneEditRedirect")
);

// New character and note pages
const CharactersPage = lazy(() => import("../pages/CharactersPage"));
const NotesPage = lazy(() => import("../pages/NotesPage"));

// Legacy components to be replaced
const CharacterList = lazy(() =>
  import("../components/character/CharacterList")
);
const CharacterDetail = lazy(() =>
  import("../components/character/CharacterDetail")
);
const NoteList = lazy(() => import("../components/note/NoteList"));
const NoteDetail = lazy(() => import("../components/note/NoteDetail"));

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
            <CharactersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.CHARACTERS_FOR_SCENE,
        element: (
          <ProtectedRoute>
            <CharactersPage />
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
            <NotesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.NOTES_FOR_SCENE,
        element: (
          <ProtectedRoute>
            <NotesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.NOTES_FOR_CHARACTER,
        element: (
          <ProtectedRoute>
            <NotesPage />
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
        element: <Navigate to="/?modal=login" replace />,
      },
      {
        path: ROUTES.SIGNUP,
        element: <Navigate to="/?modal=signup" replace />,
      },
      {
        path: "/demo",
        element: <Navigate to="/?demo=true" replace />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={ROUTES.HOME} replace />,
  },
];

export default routes;

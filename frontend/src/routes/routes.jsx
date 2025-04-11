import React, { lazy } from "react";
import { ROUTES } from "../utils/routes";
import { ProtectedRoute } from "../components/routing/ProtectedRoute";

// Lazy load components for better performance
const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../components/auth/Login"));
const Signup = lazy(() => import("../components/auth/Signup"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const PersonalUniverse = lazy(() =>
  import("../components/universe/PersonalUniverse")
);
const UniverseDetail = lazy(() =>
  import("../components/universe/UniverseDetail")
);
const CharacterDetail = lazy(() =>
  import("../components/features/character/pages/CharacterDetail")
);
const NoteDetail = lazy(() => import("../components/features/note/pages/NoteDetail"));
const CharacterManagement = lazy(() =>
  import("../features/CharacterManagement")
);
const SceneManagement = lazy(() => import("../features/SceneManagement"));
const SceneEditPage = lazy(() =>
  import("../components/features/scene/pages/SceneEditPage")
);
const NotFound = lazy(() => import("../pages/NotFound"));
const SceneEditRedirect = lazy(() =>
  import("../components/routing/SceneEditRedirect")
);

export const routes = [
  {
    path: ROUTES.HOME,
    element: <Home />,
  },
  {
    path: ROUTES.LOGIN,
    element: <Login />,
  },
  {
    path: ROUTES.SIGNUP,
    element: <Signup />,
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
    path: ROUTES.CHARACTER_DETAIL,
    element: (
      <ProtectedRoute>
        <CharacterDetail />
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
  {
    path: ROUTES.UNIVERSE_CHARACTERS,
    element: (
      <ProtectedRoute>
        <CharacterManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.UNIVERSE_SCENES,
    element: (
      <ProtectedRoute>
        <SceneManagement />
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
    path: ROUTES.PERSONAL_UNIVERSE,
    element: (
      <ProtectedRoute>
        <PersonalUniverse />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

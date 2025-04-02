import React, { lazy } from "react";
import { ROUTES } from "../utils/routes";
import { ProtectedRoute } from "../components/ProtectedRoute";

// Lazy load components for better performance
const Home = lazy(() => import("../components/Home"));
const Login = lazy(() => import("../components/Login"));
const Signup = lazy(() => import("../components/Signup"));
const Dashboard = lazy(() => import("../components/Dashboard"));
const PersonalUniverse = lazy(() => import("../components/PersonalUniverse"));
const UniverseDetail = lazy(() => import("../components/UniverseDetail"));
const CharacterDetail = lazy(() => import("../components/CharacterDetail"));
const NoteDetail = lazy(() => import("../components/consolidated/NoteDetail"));
const CharacterManagement = lazy(() =>
  import("../features/CharacterManagement")
);
const SceneManagement = lazy(() => import("../features/SceneManagement"));
const SceneEditPage = lazy(() =>
  import("../components/consolidated/SceneEditPage")
);
const NotFound = lazy(() => import("../components/NotFound"));
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

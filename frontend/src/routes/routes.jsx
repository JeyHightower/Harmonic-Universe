import React, { lazy } from "react";
import { ROUTES } from "../utils/routes";
import ProtectedRoute from "../components/routing/ProtectedRoute";

// Lazy load components for better performance
const Home = lazy(() => import("../features/home/pages/Home"));
const Login = lazy(() => import("../features/auth/pages/LoginPage"));
const Signup = lazy(() => import("../features/auth/modals/SignupModal"));
const Dashboard = lazy(() => import("../features/dashboard/pages/Dashboard"));
const PersonalUniverse = lazy(() => {
  console.warn("PersonalUniversePage not found, using Dashboard as fallback");
  return import("../features/dashboard/pages/Dashboard");
});
const UniverseDetail = lazy(() => import("../features/universe/pages/UniverseDetail"));
const CharacterDetail = lazy(() => import("../features/character/pages/CharacterDetail"));
const NoteDetail = lazy(() => import("../features/note/pages/NoteDetail"));
const CharacterManagement = lazy(() => import("../features/character/pages/CharactersPage"));
const SceneManagement = lazy(() => import("../features/scene/pages/ScenesPage"));
const SceneEditPage = lazy(() => import("../features/scene/pages/SceneEditPage"));
const SceneEditRedirect = lazy(() => import("../components/routing/SceneEditRedirect"));
const NotFound = lazy(() => 
  Promise.resolve({
    default: () => (
      <div>
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
      </div>
    )
  })
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

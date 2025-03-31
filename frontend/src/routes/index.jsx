import { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../components/routing/ProtectedRoute";
import { ROUTES } from "../utils/routes";
import ModalTest from "../components/test/ModalTest";

// Lazy load components
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const Dashboard = lazy(() => import("../features/Dashboard"));
const Home = lazy(() => import("../pages/Home"));
const UniverseDetail = lazy(() => import("../features/UniverseDetail"));
const SceneList = lazy(() => import("../components/scene/SceneList"));
const SceneDetail = lazy(() => import("../components/scene/SceneDetail"));
const CharacterList = lazy(() =>
  import("../components/character/CharacterList")
);
const CharacterDetail = lazy(() =>
  import("../components/character/CharacterDetail")
);
const NoteList = lazy(() => import("../components/note/NoteList"));
const NoteDetail = lazy(() => import("../components/note/NoteDetail"));

const AppRoutes = () => {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Layout />}>
        <Route index element={<Home />} />
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.UNIVERSE_DETAIL}
          element={
            <ProtectedRoute>
              <UniverseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.UNIVERSE_EDIT}
          element={
            <ProtectedRoute>
              <UniverseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SCENES}
          element={
            <ProtectedRoute>
              <SceneList />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SCENE_DETAIL}
          element={
            <ProtectedRoute>
              <SceneDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SCENE_EDIT}
          element={
            <ProtectedRoute>
              <SceneDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CHARACTERS}
          element={
            <ProtectedRoute>
              <CharacterList />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CHARACTER_DETAIL}
          element={
            <ProtectedRoute>
              <CharacterDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CHARACTER_EDIT}
          element={
            <ProtectedRoute>
              <CharacterDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.NOTES}
          element={
            <ProtectedRoute>
              <NoteList />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.NOTE_DETAIL}
          element={
            <ProtectedRoute>
              <NoteDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.NOTE_EDIT}
          element={
            <ProtectedRoute>
              <NoteDetail />
            </ProtectedRoute>
          }
        />
        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        <Route path={ROUTES.MODAL_TEST} element={<ModalTest />} />
        <Route
          path={ROUTES.LOGIN}
          element={<Navigate to="/?modal=login" replace />}
        />
        <Route
          path={ROUTES.SIGNUP}
          element={<Navigate to="/?modal=signup" replace />}
        />
        <Route path="/demo" element={<Navigate to="/?demo=true" replace />} />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
};

export default AppRoutes;

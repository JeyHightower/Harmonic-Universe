import React from "react";
import { Routes, Route, HashRouter, BrowserRouter } from "react-router-dom";
import { useSelector } from "react-redux";

// Import pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import UniverseDetail from "./pages/universe/UniverseDetail";
import SceneDetail from "./pages/scenes/SceneDetail";
import SceneEditPage from "./pages/scenes/SceneEditPage";
import SceneEditRedirect from "./pages/scenes/SceneEditRedirect";
import NotFound from "./pages/NotFound";
import Debug from "./pages/Debug";
import SettingsPage from "./pages/settings/SettingsPage";
import CharactersPage from "./pages/characters/CharactersPage";
import CharacterDetail from "./pages/characters/CharacterDetail";
import NotesPage from "./pages/notes/NotesPage";
import NoteDetail from "./pages/notes/NoteDetail";

// Determine which router to use based on environment
const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;

const AppRouter = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/universes/:universeId" element={<UniverseDetail />} />
        <Route path="/scenes/:sceneId" element={<SceneDetail />} />
        <Route path="/scenes/:sceneId/edit" element={<SceneEditPage />} />
        <Route path="/scenes/edit/:sceneId" element={<SceneEditRedirect />} />
        <Route path="/debug" element={<Debug />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/characters" element={<CharactersPage />} />
        <Route path="/characters/:characterId" element={<CharacterDetail />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/notes/:noteId" element={<NoteDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;

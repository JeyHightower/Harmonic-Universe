import React from "react";
import { Routes, Route, HashRouter, BrowserRouter } from "react-router-dom";
import { useSelector } from "react-redux";

// Import pages
import Home from "./pages/Home";
import Dashboard from "./features/Dashboard";
import LoginPage from "./pages/LoginPage";
// Import components from features or components directory
import UniverseDetail from "./features/UniverseDetail";
import SceneDetail from "./components/consolidated/SceneDetail";
import SceneEditPage from "./components/consolidated/SceneEditPage";
import SceneEditRedirect from "./components/routing/SceneEditRedirect";
import NotFound from "./pages/NotFound";
import Debug from "./pages/Debug";
import SettingsPage from "./pages/SettingsPage";
import CharactersPage from "./pages/CharactersPage";
import CharacterDetail from "./components/character/CharacterDetail";
import NotesPage from "./pages/NotesPage";
import NoteDetail from "./components/consolidated/NoteDetail";

// Determine which router to use based on environment
const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;

const AppRouter = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />
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

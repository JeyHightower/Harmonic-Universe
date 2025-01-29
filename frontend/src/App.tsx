import { CssBaseline, ThemeProvider } from '@mui/material';
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';
import { ScenePage } from './pages/ScenePage';
import { StoryboardPage } from './pages/StoryboardPage';
import { UniverseDetailsPage } from './pages/UniverseDetailsPage';
import { UniverseListPage } from './pages/UniverseListPage';
import { theme } from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/universes"
              element={
                <ProtectedRoute>
                  <UniverseListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/universes/:universeId"
              element={
                <ProtectedRoute>
                  <UniverseDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/universes/:universeId/storyboards/:storyboardId"
              element={
                <ProtectedRoute>
                  <StoryboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/universes/:universeId/storyboards/:storyboardId/scenes/:sceneId"
              element={
                <ProtectedRoute>
                  <ScenePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

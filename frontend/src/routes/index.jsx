import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { AuthProvider } from '../contexts/AuthContext';
import { theme } from '../theme';
import PrivateRoute from './PrivateRoute';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Profile from '../pages/Profile';
import Register from '../pages/Register';
import StoryboardDetail from '../pages/Storyboard/StoryboardDetail';
import StoryboardEdit from '../pages/Storyboard/StoryboardEdit';
import StoryboardList from '../pages/Storyboard/StoryboardList';
import UniverseDetail from '../pages/UniverseDetail';
import UniverseEdit from '../pages/UniverseEdit';
import UniverseList from '../pages/UniverseList';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />

            {/* Universe routes */}
            <Route
              path="/universes"
              element={
                <PrivateRoute>
                  <UniverseList />
                </PrivateRoute>
              }
            />
            <Route
              path="/universes/:id"
              element={
                <PrivateRoute>
                  <UniverseDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/universes/:id/edit"
              element={
                <PrivateRoute>
                  <UniverseEdit />
                </PrivateRoute>
              }
            />

            {/* Storyboard routes */}
            <Route
              path="/universes/:universeId/storyboards"
              element={
                <PrivateRoute>
                  <StoryboardList />
                </PrivateRoute>
              }
            />
            <Route
              path="/universes/:universeId/storyboards/:storyboardId"
              element={
                <PrivateRoute>
                  <StoryboardDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/universes/:universeId/storyboards/:storyboardId/edit"
              element={
                <PrivateRoute>
                  <StoryboardEdit />
                </PrivateRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

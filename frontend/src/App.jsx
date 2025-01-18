// App.jsx
import React from 'react';
import { Provider } from 'react-redux';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';
import LoginPage from './components/Auth/LoginPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import SignupPage from './components/Auth/SignupPage';
import ConnectionTest from './components/ConnectionTest';
import DashboardPage from './components/Dashboard/DashboardPage';
import Navigation from './components/Navigation/Navigation';
import ProfilePage from './components/Profile/ProfilePage';
import UniverseBuilderPage from './components/Universe/UniverseBuilderPage';
import UniversePage from './components/Universe/UniversePage';
import store from './redux/store';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="app">
          <Navigation />
          <ConnectionTest />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/universe/create"
              element={
                <ProtectedRoute>
                  <UniverseBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/universe/:id"
              element={
                <ProtectedRoute>
                  <UniversePage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;

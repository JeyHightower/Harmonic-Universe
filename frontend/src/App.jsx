// App.jsx
import React, { Suspense, lazy } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import LoginForm from './components/Auth/LoginForm';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import SignupForm from './components/Auth/SignupForm';
import GlobalErrorBoundary from './components/Common/GlobalErrorBoundary';
import LoadingSpinner from './components/Common/LoadingSpinner';
import Navigation from './components/Navigation';
import DashboardPage from './pages/DashboardPage';

// Lazy load components
const UniverseList = lazy(() => import('./components/Universe/UniverseList'));
const UniverseDetail = lazy(() =>
  import('./components/Universe/UniverseDetail')
);
const UniverseCreate = lazy(() =>
  import('./components/Universe/UniverseCreate')
);
const UniverseEdit = lazy(() => import('./components/Universe/UniverseEdit'));
const Storyboard = lazy(() => import('./components/Storyboard/Storyboard'));
const Settings = lazy(() => import('./components/Settings/Settings'));
const Profile = lazy(() => import('./components/Profile/Profile'));

function App() {
  return (
    <Router>
      <GlobalErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <div className="app">
            <Navigation />
            <main className="main">
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/signup" element={<SignupForm />} />
                <Route path="/" element={<ProtectedRoute />}>
                  <Route index element={<UniverseList />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route
                    path="/universes/:universeId"
                    element={<UniverseDetail />}
                  />
                  <Route path="/universe/create" element={<UniverseCreate />} />
                  <Route
                    path="/universes/:id/edit"
                    element={<UniverseEdit />}
                  />
                  <Route
                    path="/universes/:id/storyboard"
                    element={<Storyboard />}
                  />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Routes>
            </main>
          </div>
        </Suspense>
      </GlobalErrorBoundary>
    </Router>
  );
}

export default App;

// App.jsx
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import LoginForm from './components/Auth/LoginForm';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import SignupForm from './components/Auth/SignupForm';
import Navigation from './components/Navigation';
import UniverseDetail from './components/Universe/UniverseDetail';
import UniverseList from './components/Universe/UniverseList';
import AudioControlsPage from './pages/AudioControlsPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import UniverseBuilderPage from './pages/UniverseBuilderPage';

function App() {
  return (
    <div className="app">
      <Navigation />
      <main className="main">
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<UniverseList />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/universes/:universeId" element={<UniverseDetail />} />
            <Route path="/universe/create" element={<UniverseBuilderPage />} />
            <Route path="/audio" element={<AudioControlsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;

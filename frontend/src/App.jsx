// App.jsx
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import LoginForm from './components/Auth/LoginForm';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import SignupForm from './components/Auth/SignupForm';
import Navigation from './components/Navigation';
import UniverseDetail from './components/Universe/UniverseDetail';
import UniverseList from './components/Universe/UniverseList';

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
            <Route path="/universes/:universeId" element={<UniverseDetail />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;

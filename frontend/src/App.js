import React from 'react';
import { Route, Routes, useParams } from 'react-router-dom';
import './App.css';
import LoginForm from './components/Auth/LoginForm';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Navigation from './components/Navigation';
import UniverseDetail from './components/Universe/UniverseDetail';
import UniverseList from './components/Universe/UniverseList';

// Wrapper component to get universeId from URL params
const UniverseDetailWrapper = () => {
  const { universeId } = useParams();
  return <UniverseDetail universeId={universeId} />;
};

function App() {
  return (
    <div className="app">
      <Navigation />
      <main className="main">
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<UniverseList />} />
            <Route
              path="/universes/:universeId"
              element={<UniverseDetailWrapper />}
            />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;

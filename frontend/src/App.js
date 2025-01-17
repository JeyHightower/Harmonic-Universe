import React from 'react';
import { Route, Routes } from 'react-router-dom';
import styles from './App.module.css';
import LoginForm from './components/Auth/LoginForm';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import RegisterForm from './components/Auth/RegisterForm';
import Navigation from './components/Navigation/Navigation';
import TemplatesPage from './components/Templates/TemplatesPage';
import UniverseDetail from './components/Universe/UniverseDetail';
import UniverseList from './components/Universe/UniverseList';

const App = () => {
  return (
    <div className={styles.app}>
      <Navigation />
      <main className={styles.main}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route
            path="/universes"
            element={
              <ProtectedRoute>
                <UniverseList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/universes/:id"
            element={
              <ProtectedRoute>
                <UniverseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <TemplatesPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<UniverseList />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;

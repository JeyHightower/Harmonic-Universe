// App.jsx
import React, { Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import styles from './App.module.css';
import GlobalErrorBoundary from './components/Common/GlobalErrorBoundary';
import LoadingSpinner from './components/Common/LoadingSpinner';
import NotificationContainer from './components/Common/NotificationContainer';
import Navigation from './components/Navigation/Navigation';
import { NotificationProvider } from './contexts/NotificationContext';

// Lazy load components
const Login = React.lazy(() => {
  console.log('Loading Login component');
  return import('./components/Auth/Login');
});
const Register = React.lazy(() => {
  console.log('Loading Register component');
  return import('./components/Auth/Register');
});
const ResetPassword = React.lazy(() => {
  console.log('Loading ResetPassword component');
  return import('./components/Auth/ResetPassword');
});
const UniverseList = React.lazy(() => {
  console.log('Loading UniverseList component');
  return import('./components/Universe/UniverseList');
});
const UniverseDetail = React.lazy(() => {
  console.log('Loading UniverseDetail component');
  return import('./components/Universe/UniverseDetail');
});
const UniverseCreate = React.lazy(() => {
  console.log('Loading UniverseCreate component');
  return import('./components/Universe/UniverseCreate');
});
const UniverseEdit = React.lazy(() => {
  console.log('Loading UniverseEdit component');
  return import('./components/Universe/UniverseEdit');
});
const Storyboard = React.lazy(() => {
  console.log('Loading Storyboard component');
  return import('./components/Storyboard/Storyboard');
});
const Settings = React.lazy(() => {
  console.log('Loading Settings component');
  return import('./components/Settings/Settings');
});
const Profile = React.lazy(() => {
  console.log('Loading Profile component');
  return import('./components/Profile/Profile');
});
const Analytics = React.lazy(() => {
  console.log('Loading Analytics component');
  return import('./components/Analytics/Dashboard');
});

const AppRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    console.log('Current route:', location.pathname);
  }, [location]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<UniverseList />} />
        <Route path="/universes/new" element={<UniverseCreate />} />
        <Route path="/universes/:id" element={<UniverseDetail />} />
        <Route path="/universes/:id/edit" element={<UniverseEdit />} />
        <Route path="/universes/:id/storyboard" element={<Storyboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  console.log('App component rendering');

  return (
    <NotificationProvider>
      <GlobalErrorBoundary>
        <div className={styles.app}>
          <Navigation />
          <main className={styles.main}>
            <AppRoutes />
          </main>
          <NotificationContainer />
        </div>
      </GlobalErrorBoundary>
    </NotificationProvider>
  );
}

export default App;

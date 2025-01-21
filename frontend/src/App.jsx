// App.jsx
import React, { Suspense } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import styles from './App.module.css';
import GlobalErrorBoundary from './components/Common/GlobalErrorBoundary';
import LoadingSpinner from './components/Common/LoadingSpinner';
import NotificationContainer from './components/Common/NotificationContainer';
import Navigation from './components/Navigation/Navigation';
import { NotificationProvider } from './contexts/NotificationContext';

// Lazy load components
const UniverseList = React.lazy(() =>
  import('./components/Universe/UniverseList')
);
const UniverseDetail = React.lazy(() =>
  import('./components/Universe/UniverseDetail')
);
const UniverseCreate = React.lazy(() =>
  import('./components/Universe/UniverseCreate')
);
const UniverseEdit = React.lazy(() =>
  import('./components/Universe/UniverseEdit')
);
const Storyboard = React.lazy(() =>
  import('./components/Storyboard/Storyboard')
);
const Settings = React.lazy(() => import('./components/Settings/Settings'));
const Profile = React.lazy(() => import('./components/Profile/Profile'));
const Analytics = React.lazy(() => import('./components/Analytics/Dashboard'));

function App() {
  return (
    <Router>
      <NotificationProvider>
        <GlobalErrorBoundary>
          <div className={styles.app}>
            <Navigation />
            <main className={styles.main}>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<UniverseList />} />
                  <Route path="/universes/new" element={<UniverseCreate />} />
                  <Route path="/universes/:id" element={<UniverseDetail />} />
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
                  <Route path="/analytics" element={<Analytics />} />
                </Routes>
              </Suspense>
            </main>
            <NotificationContainer />
          </div>
        </GlobalErrorBoundary>
      </NotificationProvider>
    </Router>
  );
}

export default App;

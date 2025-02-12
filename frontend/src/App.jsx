import { SnackbarProvider } from 'notistack';
import React from 'react';
import { Provider } from 'react-redux';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import store from './store';
import './styles/global.css';

// Import components
import Modal from './components/common/Modal';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Simulation from './pages/Simulation';
import UniverseEditor from './pages/UniverseEditor';

function App() {
  return (
    <Provider store={store}>
      <SnackbarProvider maxSnack={3}>
        <Router>
          <Layout>
            <Modal /> {/* Global modal component */}
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/universe/:id/edit"
                element={
                  <ProtectedRoute>
                    <UniverseEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/universe/:id/simulate"
                element={
                  <ProtectedRoute>
                    <Simulation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
      </SnackbarProvider>
    </Provider>
  );
}

export default App;

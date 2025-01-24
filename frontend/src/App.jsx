// App.jsx
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { useSelector } from 'react-redux';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import PrivateRoute from './components/common/PrivateRoute';
import AppLayout from './components/layout/AppLayout';
import theme from './theme';

// Pages
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Register from './pages/Register';
import UniverseDetails from './pages/UniverseDetails';
import UniverseForm from './pages/UniverseForm';

const App = () => {
  const { theme: userTheme } = useSelector((state) => state.profile.settings);

  return (
    <ThemeProvider theme={theme(userTheme)}>
      <CssBaseline />
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/explore" element={
              <PrivateRoute>
                <Explore />
              </PrivateRoute>
            } />
            <Route path="/universes/new" element={
              <PrivateRoute>
                <UniverseForm />
              </PrivateRoute>
            } />
            <Route path="/universes/:id" element={
              <PrivateRoute>
                <UniverseDetails />
              </PrivateRoute>
            } />
            <Route path="/universes/:id/edit" element={
              <PrivateRoute>
                <UniverseForm />
              </PrivateRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </Router>
    </ThemeProvider>
  );
};

export default App;

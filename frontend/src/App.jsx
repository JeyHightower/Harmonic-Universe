// App.jsx
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import React from 'react';
import { Provider } from 'react-redux';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import HomePage from './components/Home/HomePage';
import Layout from './components/Navigation/Layout';
import store from './store';

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

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const App = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route
                path="/login"
                element={
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <Login />
                  </React.Suspense>
                }
              />
              <Route
                path="/register"
                element={
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <Register />
                  </React.Suspense>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <ResetPassword />
                  </React.Suspense>
                }
              />
              <Route
                path="/universes"
                element={
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <UniverseList />
                  </React.Suspense>
                }
              />
              <Route
                path="/universes/:id"
                element={
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <UniverseDetail />
                  </React.Suspense>
                }
              />
              <Route
                path="/universes/create"
                element={
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <UniverseCreate />
                  </React.Suspense>
                }
              />
              <Route
                path="/universes/:id/edit"
                element={
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <UniverseEdit />
                  </React.Suspense>
                }
              />
              <Route
                path="/universes/:id/storyboard"
                element={
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <Storyboard />
                  </React.Suspense>
                }
              />
              <Route
                path="/settings"
                element={
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <Settings />
                  </React.Suspense>
                }
              />
              <Route
                path="/profile"
                element={
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <Profile />
                  </React.Suspense>
                }
              />
              <Route
                path="/analytics"
                element={
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <Analytics />
                  </React.Suspense>
                }
              />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;

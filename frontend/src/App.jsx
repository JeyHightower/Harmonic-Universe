// App.jsx
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import React from 'react';
import { Provider } from 'react-redux';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Layout from './components/Navigation/Layout';
import UserPreferences from './components/Settings/UserPreferences';
import store from './redux/store';

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
              <Route index element={<div>Home Page</div>} />
              <Route path="/settings" element={<UserPreferences />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;

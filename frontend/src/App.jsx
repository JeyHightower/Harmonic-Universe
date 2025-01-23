// App.jsx
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import store from './store';
import theme from './theme';

// Pages
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Register from './pages/Register';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import FavoritesList from './components/Universe/FavoritesList';
import UniverseDetails from './components/Universe/UniverseDetails';
import UniverseForm from './components/Universe/UniverseForm';
import UniverseList from './components/Universe/UniverseList';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/universes"
                element={
                  <PrivateRoute>
                    <UniverseList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/universes/favorites"
                element={
                  <PrivateRoute>
                    <FavoritesList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/universes/new"
                element={
                  <PrivateRoute>
                    <UniverseForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/universes/:id"
                element={
                  <PrivateRoute>
                    <UniverseDetails />
                  </PrivateRoute>
                }
              />
              <Route
                path="/universes/:id/edit"
                element={
                  <PrivateRoute>
                    <UniverseForm isEdit={true} />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;

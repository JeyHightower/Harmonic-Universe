import React from 'react';
import { Provider } from 'react-redux';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import PrivateRoute from './components/common/PrivateRoute';
import Layout from './components/layout/Layout';
import { store } from './store';

// Pages
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Home from './features/home/Home';
import Profile from './features/profile/Profile';
import SceneEditor from './features/scenes/SceneEditor';
import UniverseDetail from './features/universe/UniverseDetail';
import UniverseList from './features/universe/UniverseList';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
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
              path="/universes/:id"
              element={
                <PrivateRoute>
                  <UniverseDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/scenes/:id"
              element={
                <PrivateRoute>
                  <SceneEditor />
                </PrivateRoute>
              }
            />
          </Routes>
        </Layout>
      </Router>
    </Provider>
  );
};

export default App;

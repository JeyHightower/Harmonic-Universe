import React from 'react';
import { Provider } from 'react-redux';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import PrivateRoute from './components/Auth/PrivateRoute';
import Navbar from './components/Navigation/Navbar';
import CreateUniverse from './pages/CreateUniverse';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Register from './pages/Register';
import UniverseDetail from './pages/UniverseDetail';
import { store } from './store';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/universe/create"
                element={
                  <PrivateRoute>
                    <CreateUniverse />
                  </PrivateRoute>
                }
              />
              <Route
                path="/universe/:id"
                element={
                  <PrivateRoute>
                    <UniverseDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  );
}

export default App;

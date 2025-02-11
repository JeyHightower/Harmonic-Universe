import { Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import Profile from '../pages/Profile';
import Register from '../pages/Register';
import Simulation from '../pages/Simulation';
import UniverseEditor from '../pages/UniverseEditor';

const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/universe/:id/edit',
        element: (
          <ProtectedRoute>
            <UniverseEditor />
          </ProtectedRoute>
        ),
      },
      {
        path: '/universe/:id/simulate',
        element: (
          <ProtectedRoute>
            <Simulation />
          </ProtectedRoute>
        ),
      },
      {
        path: '/profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

export default routes;

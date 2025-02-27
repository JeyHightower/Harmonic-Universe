import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from './ProtectedRoute';

// Lazy-loaded components
const Home = lazy(() => import('../components/features/home/Home'));
const Login = lazy(() => import('../components/features/auth/Login'));
const Register = lazy(() => import('../components/features/auth/Register'));
const Dashboard = lazy(() =>
  import('../components/features/dashboard/Dashboard')
);
const UniverseList = lazy(() =>
  import('../components/features/universe/UniverseList')
);
const UniverseDetail = lazy(() =>
  import('../components/features/universe/UniverseDetail')
);
const UniverseCreate = lazy(() =>
  import('../components/features/universe/UniverseCreate')
);
const UniverseEdit = lazy(() =>
  import('../components/features/universe/UniverseEdit')
);

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  UNIVERSES: '/universes',
  UNIVERSE_CREATE: '/universes/create',
  UNIVERSE_DETAIL: '/universes/:id',
  UNIVERSE_EDIT: '/universes/:id/edit',
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: ROUTES.HOME,
        element: <Home />,
      },
      {
        path: ROUTES.LOGIN,
        element: <Login />,
      },
      {
        path: ROUTES.REGISTER,
        element: <Register />,
      },
      {
        path: ROUTES.DASHBOARD,
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.UNIVERSES,
        element: (
          <ProtectedRoute>
            <UniverseList />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.UNIVERSE_CREATE,
        element: (
          <ProtectedRoute>
            <UniverseCreate />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.UNIVERSE_DETAIL,
        element: (
          <ProtectedRoute>
            <UniverseDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.UNIVERSE_EDIT,
        element: (
          <ProtectedRoute>
            <UniverseEdit />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

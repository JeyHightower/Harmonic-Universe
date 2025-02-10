import ErrorBoundary from '@/components/common/ErrorBoundary';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import { Suspense, lazy } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Lazy-loaded components
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const UniverseWorkspace = lazy(() => import('@/components/universe/UniverseWorkspace'));
const VisualizationWorkspace = lazy(() => import('@/components/visualization/VisualizationWorkspace'));
const AudioWorkspace = lazy(() => import('@/components/audio/AudioWorkspace'));
const Settings = lazy(() => import('@/pages/Settings'));
const Profile = lazy(() => import('@/pages/Profile'));

// Wrap lazy components with Suspense and ErrorBoundary
const withSuspense = (Component) => (
  <ErrorBoundary>
    <Suspense fallback={<div>Loading...</div>}>
      {Component}
    </Suspense>
  </ErrorBoundary>
);

// Wrap protected components with both ProtectedRoute and Suspense
const withProtection = (Component) => (
  <ProtectedRoute>
    {withSuspense(Component)}
  </ProtectedRoute>
);

const routes = [
  {
    element: <Layout><Outlet /></Layout>,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/register',
        element: <Register />,
      },
      {
        path: '/verify-email',
        element: withSuspense(<VerifyEmail />),
      },
      {
        path: '/reset-password',
        element: withSuspense(<ResetPassword />),
      },
      {
        path: '/dashboard',
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
        children: [
          {
            path: '',
            element: <Navigate to="universes" replace />,
          },
          {
            path: 'universes',
            children: [
              {
                path: '',
                element: withProtection(<UniverseWorkspace />),
              },
              {
                path: ':id',
                element: withProtection(<UniverseWorkspace />),
              },
            ],
          },
          {
            path: 'visualizations',
            children: [
              {
                path: '',
                element: withProtection(<VisualizationWorkspace />),
              },
              {
                path: ':id',
                element: withProtection(<VisualizationWorkspace />),
              },
            ],
          },
          {
            path: 'audio',
            children: [
              {
                path: '',
                element: withProtection(<AudioWorkspace />),
              },
              {
                path: ':id',
                element: withProtection(<AudioWorkspace />),
              },
            ],
          },
          {
            path: 'settings',
            element: withProtection(<Settings />),
          },
          {
            path: 'profile',
            element: withProtection(<Profile />),
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
];

export default routes;

import Dashboard from '@/pages/Dashboard';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// Lazy-loaded components
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const UniverseWorkspace = lazy(() => import('@/components/universe/UniverseWorkspace'));
const VisualizationWorkspace = lazy(() => import('@/components/visualization/VisualizationWorkspace'));
const AudioWorkspace = lazy(() => import('@/components/audio/AudioWorkspace'));
const Settings = lazy(() => import('@/pages/Settings'));
const Profile = lazy(() => import('@/pages/Profile'));

const routes = [
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
    element: <VerifyEmail />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
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
            element: <UniverseWorkspace />,
          },
          {
            path: ':id',
            element: <UniverseWorkspace />,
          },
        ],
      },
      {
        path: 'visualizations',
        children: [
          {
            path: '',
            element: <VisualizationWorkspace />,
          },
          {
            path: ':id',
            element: <VisualizationWorkspace />,
          },
        ],
      },
      {
        path: 'audio',
        children: [
          {
            path: '',
            element: <AudioWorkspace />,
          },
          {
            path: ':id',
            element: <AudioWorkspace />,
          },
        ],
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];

export default routes;

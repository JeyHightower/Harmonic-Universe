import AudioWorkspace from '@/components/audio/AudioWorkspace';
import UniverseWorkspace from '@/components/universe/UniverseWorkspace';
import VisualizationWorkspace from '@/components/visualization/VisualizationWorkspace';
import Dashboard from '@/pages/Dashboard';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import Register from '@/pages/Register';
import Settings from '@/pages/Settings';
import { Navigate } from 'react-router-dom';

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
    path: '/dashboard',
    element: <Dashboard />,
    children: [
      {
        path: '',
        element: <Navigate to="universes" replace />,
      },
      {
        path: 'universes',
        element: <UniverseWorkspace />,
      },
      {
        path: 'universes/:id',
        element: <UniverseWorkspace />,
      },
      {
        path: 'visualizations',
        element: <VisualizationWorkspace />,
      },
      {
        path: 'visualizations/:id',
        element: <VisualizationWorkspace />,
      },
      {
        path: 'audio',
        element: <AudioWorkspace />,
      },
      {
        path: 'audio/:id',
        element: <AudioWorkspace />,
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

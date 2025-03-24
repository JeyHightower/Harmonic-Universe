import { Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Settings from './components/Settings.jsx';
import Dashboard from './features/dashboard/Dashboard';
import Home from './features/home/Home';

export const ROUTES = {
    HOME: '/',
    DASHBOARD: '/dashboard',
    SETTINGS: '/settings',
    LOGIN: '/login',
    REGISTER: '/signup',
    DEMO: '/demo',
    // Other existing routes
};

const routes = [
    {
        path: '/',
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            { path: 'dashboard', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
            { path: 'settings', element: <Settings /> },
            // Add new route handlers that redirect to home with appropriate query params
            { path: 'login', element: <Navigate to="/?modal=login" replace /> },
            { path: 'signup', element: <Navigate to="/?modal=register" replace /> },
            { path: 'demo', element: <Navigate to="/?demo=true" replace /> },
            // Other existing routes
        ],
    },
];

export default routes;

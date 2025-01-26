import { createBrowserRouter } from 'react-router-dom';
import { MainLayout, PrivateRoute } from '../components';
import {
    Dashboard,
    Home,
    Login,
    NotFound,
    Profile,
    Register,
    Settings,
    Universe,
    UniverseCreate,
    UniverseDetails,
    UniverseMusic,
    UniversePhysics,
    UniverseVisualization
} from '../pages';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <Home />
            },
            {
                path: 'login',
                element: <Login />
            },
            {
                path: 'register',
                element: <Register />
            },
            {
                path: 'dashboard',
                element: <PrivateRoute><Dashboard /></PrivateRoute>
            },
            {
                path: 'profile',
                element: <PrivateRoute><Profile /></PrivateRoute>
            },
            {
                path: 'settings',
                element: <PrivateRoute><Settings /></PrivateRoute>
            },
            {
                path: 'universe',
                element: <PrivateRoute><Universe /></PrivateRoute>,
                children: [
                    {
                        path: 'create',
                        element: <UniverseCreate />
                    },
                    {
                        path: ':id',
                        element: <UniverseDetails />,
                        children: [
                            {
                                path: 'physics',
                                element: <UniversePhysics />
                            },
                            {
                                path: 'music',
                                element: <UniverseMusic />
                            },
                            {
                                path: 'visualization',
                                element: <UniverseVisualization />
                            }
                        ]
                    }
                ]
            },
            {
                path: '*',
                element: <NotFound />
            }
        ]
    }
]);


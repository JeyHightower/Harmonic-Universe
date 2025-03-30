import { Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../components/routing/ProtectedRoute";
import SettingsPage from "../pages/SettingsPage";
import Dashboard from "../features/Dashboard";
import Home from "../pages/Home";
import { ROUTES } from "../utils/routes";

const routes = [
  {
    path: ROUTES.HOME,
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      {
        path: ROUTES.DASHBOARD,
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      { path: ROUTES.SETTINGS, element: <SettingsPage /> },
      // Add new route handlers that redirect to home with appropriate query params
      { path: ROUTES.LOGIN, element: <Navigate to="/?modal=login" replace /> },
      {
        path: ROUTES.REGISTER,
        element: <Navigate to="/?modal=register" replace />,
      },
      { path: "/demo", element: <Navigate to="/?demo=true" replace /> },
      // Other existing routes
    ],
  },
];

export default routes;

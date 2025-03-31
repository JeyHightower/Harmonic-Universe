import { lazy } from "react";
import { Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../components/routing/ProtectedRoute";
import { ROUTES } from "../utils/routes";
import ModalTest from "../components/test/ModalTest";

// Lazy load components
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const Dashboard = lazy(() => import("../features/Dashboard"));
const Home = lazy(() => import("../pages/Home"));
const UniverseDetail = lazy(() => import("../features/UniverseDetail"));

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
            <UniverseDetail />
          </ProtectedRoute>
        ),
      },
      { path: ROUTES.SETTINGS, element: <SettingsPage /> },
      { path: ROUTES.MODAL_TEST, element: <ModalTest /> },
      // Add new route handlers that redirect to home with appropriate query params
      { path: ROUTES.LOGIN, element: <Navigate to="/?modal=login" replace /> },
      {
        path: ROUTES.SIGNUP,
        element: <Navigate to="/?modal=signup" replace />,
      },
      { path: "/demo", element: <Navigate to="/?demo=true" replace /> },
      // Other existing routes
    ],
  },
];

export default routes;

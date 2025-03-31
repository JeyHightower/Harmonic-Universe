import { lazy } from "react";
import { Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../components/routing/ProtectedRoute";
import { ROUTES } from "../utils/routes";

// Import the SceneEditPage component
const SceneEditPage = lazy(() =>
  import("../components/consolidated/SceneEditPage")
);

const routes = [
  {
    path: ROUTES.HOME,
    element: <Layout />,
    children: [
      // Other routes...
      {
        path: ROUTES.SCENE_EDIT,
        element: (
          <ProtectedRoute>
            <SceneEditPage />
          </ProtectedRoute>
        ),
      },
      // Other routes...
    ],
  },
];

export default routes;

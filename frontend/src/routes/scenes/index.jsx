import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useUniverse } from '../../context/UniverseContext';

const ScenesPage = lazy(() => import('../features/scene/pages/ScenesPage'));

export default function SceneRoutes() {
  const { universeId } = useUniverse();

  if (!universeId) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <ScenesPage />
  );
} 
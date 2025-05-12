import { Suspense, useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { SceneModal } from '../features/scene/index.mjs';

// Shared loading component
export function LoadingFallback({ message = 'Loading...' }) {
  return (
    <div
      className="loading-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
      }}
    >
      <div className="loading-spinner"></div>
      <p>{message}</p>
    </div>
  );
}

// Shared validation utility for route handlers
export function validateUniverseId(universeId) {
  return (
    universeId &&
    universeId !== 'undefined' &&
    universeId !== 'null' &&
    !isNaN(parseInt(universeId, 10)) &&
    parseInt(universeId, 10) > 0
  );
}

// Route Handlers
export function SceneCreateRoute() {
  const { universeId } = useParams();
  const navigate = useNavigate();

  return (
    <SceneModal
      isOpen={true}
      onClose={() => navigate(`/universes/${universeId}/scenes`)}
      modalType="create"
      universeId={universeId}
      onSuccess={(actionType, scene) => {
        if (scene && scene.id) {
          navigate(`/universes/${universeId}/scenes/${scene.id}`);
        } else {
          navigate(`/universes/${universeId}/scenes`);
        }
      }}
    />
  );
}

export function CharactersRouteHandler({ CharactersPage }) {
  const { universeId } = useParams();
  console.log(`CharactersRouteHandler: Received universeId=${universeId}`);

  if (!validateUniverseId(universeId)) {
    console.log(`Invalid universeId in route params (${universeId}), redirecting to dashboard`);
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Suspense fallback={<LoadingFallback message="Loading characters..." />}>
      <CharactersPage />
    </Suspense>
  );
}

export function NotesRouteHandler({ NotesPage }) {
  const { universeId } = useParams();
  console.log(`NotesRouteHandler: Received universeId=${universeId}`);

  if (!validateUniverseId(universeId)) {
    console.log(
      `Invalid universeId in route params (${universeId}) for notes, redirecting to dashboard`
    );
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Suspense fallback={<LoadingFallback message="Loading notes..." />}>
      <NotesPage />
    </Suspense>
  );
}

export function LoginRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/?modal=login', { replace: true });
  }, [navigate]);

  return <div className="redirect-loader">Redirecting to login...</div>;
}

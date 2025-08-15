import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../../../components/common/Button';
import { demoService } from '../../../services/demo.service.mjs';
import {
  createSceneAndRefresh,
  deleteSceneAndRefresh,
  fetchScenesForUniverse,
} from '../../../store/thunks/scenesThunks';
import { fetchUniverseById } from '../../../store/thunks/universeThunks';
import { AUTH_CONFIG } from '../../../utils/config.mjs';
import '../styles/Universe.css';

const UniverseModal = lazy(() => import('../modals/UniverseModal'));
const UniverseDeleteModal = lazy(() => import('../modals/UniverseDeleteModal.jsx'));
const SceneModal = lazy(() => import('../../scene/modals/SceneModal.jsx'));
const SceneCard = lazy(() => import('../../scene/components/SceneCard.jsx'));

const UniverseDetail = () => {
  console.log(createSceneAndRefresh);
  console.log(deleteSceneAndRefresh);
  console.log(fetchScenesForUniverse);

  const { id } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUniverse, loading, error } = useSelector((state) => state.universes);
  const { scenes, loading: scenesLoading } = useSelector((state) => state.scenes);

  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'details');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateSceneModalOpen, setIsCreateSceneModalOpen] = useState(false);
  const [isEditSceneModalOpen, setIsEditSceneModalOpen] = useState(false);
  const [sceneToEdit, setSceneToEdit] = useState(null);
  const [isViewSceneModalOpen, setIsViewSceneModalOpen] = useState(false);
  const [sceneToView, setSceneToView] = useState(null);

  // Utility function to clear all auth data
  const clearAuthData = async () => {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    console.log('UniverseDetail - Auth data cleared');
    await new Promise((resolve) => setTimeout(resolve, 50));
  };

  const testDemoLogin = async () => {
    try {
      console.log('Testing demo login...');
      const response = await fetch('http://localhost:5001/api/auth/demo-login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Demo login successful:', data);
        return data;
      } else {
        console.error('Demo login failed:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Demo login error:', error);
      return null;
    }
  };

  const testCorsPreflight = async (universeId = 1) => {
    try {
      console.log(`Testing CORS preflight for universe endpoint (ID: ${universeId})...`);
      const response = await fetch(`http://localhost:5001/api/universes/${universeId}/`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:5173',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Authorization',
        },
      });

      console.log('CORS preflight response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      return response.ok;
    } catch (error) {
      console.error('CORS preflight error:', error);
      return false;
    }
  };

  const checkAuthAndFetch = useCallback(async () => {
    try {
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
      const user = userStr ? JSON.parse(userStr) : null;

      const isValidToken = token && token.split('.').length === 3;
      if (token && !isValidToken) {
        console.log('UniverseDetail - Invalid token format detected, clearing auth data');
        await clearAuthData();
        return;
      }

      const isDemoSession = demoService.isValidDemoSession();

      if ((!localStorage.getItem(AUTH_CONFIG.TOKEN_KEY) || !isValidToken) && !isDemoSession) {
        console.log('UniverseDetail - No valid session, attempting demo login');
        try {
          const demoResponse = await demoService.setupDemoSession();
          console.log('UniverseDetail - Demo session setup result:', demoResponse);
        } catch (demoError) {
          console.error('UniverseDetail - Demo session setup failed:', demoError);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const finalToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const finalUserStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
      const finalUser = finalUserStr ? JSON.parse(finalUserStr) : null;

      console.log('UniverseDetail - Final auth state before requests:', {
        hasToken: !!finalToken,
        hasUser: !!finalUser,
        userEmail: finalUser?.email,
        tokenLength: finalToken?.length || 0,
        tokenPreview: finalToken ? `${finalToken.substring(0, 20)}...` : 'none',
      });

      console.log('UniverseDetail - Making universe requests for ID:', id);
      dispatch(fetchUniverseById({ id }));
      dispatch(fetchScenesForUniverse(id));
    } catch (error) {
      console.error('UniverseDetail - Error in auth check:', error);
      dispatch(fetchUniverseById({ id }));
      dispatch(fetchScenesForUniverse(id));
    }
  }, [dispatch, id]);

  const debugAuthFlow = async () => {
    console.log('--- DEBUG AUTH FLOW START ---');
    await checkAuthAndFetch();
    console.log('--- DEBUG AUTH FLOW END ---');
  };

  useEffect(() => {
    if (id) {
      checkAuthAndFetch();
    }
  }, [id, checkAuthAndFetch]);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    if (location.pathname.endsWith('/edit') && currentUniverse) {
      setIsEditModalOpen(true);
    }
  }, [location.pathname, currentUniverse]);

  const handleEditClick = () => setIsEditModalOpen(true);
  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    if (location.pathname.endsWith('/edit')) {
      navigate(`/universes/${id}`);
    } else {
      dispatch(fetchUniverseById({ id }));
    }
  };

  const handleDeleteClick = () => setIsDeleteModalOpen(true);
  const handleDeleteSuccess = () => {
    setIsDeleteModalOpen(false);
    navigate('/universes');
  };

  const handleCreateSceneClick = () => {
    console.log('Button clicked! Current state: ' + isCreateSceneModalOpen);
    setIsCreateSceneModalOpen(true);
    console.log('State set to true. New state should be: true');
  };

  const handleCreateSceneSuccess = (newScene) => {
    console.log(
      'handleCreateSceneSuccess called with: ' + JSON.stringify(newScene).substring(0, 100)
    );
    setIsCreateSceneModalOpen(false);
    const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    console.log('UniverseDetail - Before createSceneAndRefresh dispatch, localStorage user:', user);
    dispatch(
      createSceneAndRefresh({
        ...newScene,
        universe_id: id,
      })
    );
  };

  const handleEditScene = (scene) => {
    console.log(`Opening edit modal for scene ${scene.id} in universe ${id}`);
    setSceneToEdit(scene.id);
    setIsEditSceneModalOpen(true);
  };

  const handleViewScene = (scene) => {
    console.log(`Opening view modal for scene ${scene.id} in universe ${id}`);
    try {
      setSceneToView(scene);
      setIsViewSceneModalOpen(true);
    } catch (error) {
      console.error('Error opening view scene modal:', error);
    }
  };

  const handleEditSceneSuccess = () => {
    setIsEditSceneModalOpen(false);
    setSceneToEdit(null);

    console.log('Scene edited successfully, refreshing scenes list for universe:', id);

    dispatch(fetchScenesForUniverse(id));
  };

  const handleViewSceneClose = () => {
    setIsViewSceneModalOpen(false);
    setSceneToView(null);
  };

  const handleEditSceneClose = () => {
    setIsEditSceneModalOpen(false);
    setSceneToEdit(null);
  };

  const handleDeleteScene = (scene) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${scene.title || scene.name}"? This cannot be undone.`
      )
    ) {
      const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
      const user = userStr ? JSON.parse(userStr) : null;
      console.log(
        'UniverseDetail - Before deleteSceneAndRefresh dispatch, localStorage user:',
        user
      );
      dispatch(
        deleteSceneAndRefresh({
          sceneId: scene.id,
          universeId: id,
        })
      ).catch((error) => {
        console.error('Error deleting scene:', error);
      });
    }
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    if (location.pathname.endsWith('/edit')) {
      navigate(`/universes/${id}`);
    }
  };

  const filteredScenes = scenes.filter(
    (scene) => scene.universe_id === parseInt(id, 10) && !scene.is_deleted
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (loading && !currentUniverse) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading universe...</p>
      </div>
    );
  }

  if (error) {
    let errorMessage = 'Unknown error occurred';

    if (typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object') {
      errorMessage =
        error.message ||
        error.error ||
        (error.data ? error.data.message || error.data.error : null) ||
        JSON.stringify(error);
    }

    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{errorMessage}</p>
        <div style={{ marginTop: '20px' }}>
          <Button onClick={() => navigate('/universes')} style={{ marginRight: '10px' }}>
            Back to Universes
          </Button>
          <Button onClick={clearAuthData} style={{ marginRight: '10px' }}>
            Clear Auth Data
          </Button>
          <Button onClick={debugAuthFlow} style={{ marginRight: '10px' }}>
            Debug Auth Flow
          </Button>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  if (!currentUniverse) {
    return (
      <div className="not-found-container">
        <h2>Universe Not Found</h2>
        <p>
          The universe you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission
          to view it.
        </p>
        <Button onClick={() => navigate('/universes')}>Back to Universes</Button>
      </div>
    );
  }

  return (
    <div className="universe-detail-container">
      <div className="universe-detail-header">
        <div className="universe-info">
          <h1>{currentUniverse.name}</h1>
          <div className="universe-meta">
            <span
              className={`universe-visibility ${currentUniverse.is_public ? 'public' : 'private'}`}
            >
              {currentUniverse.is_public ? 'Public' : 'Private'}
            </span>
            {currentUniverse.theme && (
              <span className="universe-theme">{currentUniverse.theme}</span>
            )}
            {currentUniverse.genre && (
              <span className="universe-genre">{currentUniverse.genre}</span>
            )}
          </div>
        </div>
        <div className="universe-actions">
          <Button onClick={handleEditClick} variant="secondary">
            Edit Universe
          </Button>
          <Button onClick={handleDeleteClick} variant="danger">
            Delete Universe
          </Button>
        </div>
      </div>

      {currentUniverse.description && (
        <div className="universe-description">
          <p>{currentUniverse.description}</p>
        </div>
      )}

      <div className="universe-tabs">
        <button
          className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={`tab-button ${activeTab === 'scenes' ? 'active' : ''}`}
          onClick={() => setActiveTab('scenes')}
        >
          Scenes
        </button>
        <button
          className={`tab-button ${activeTab === 'characters' ? 'active' : ''}`}
          onClick={() => setActiveTab('characters')}
        >
          Characters
        </button>
        <button
          className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>
      </div>

      <div className="universe-content">
        {activeTab === 'details' && (
          <div className="universe-details-tab">
            <h2>Universe Details</h2>
          </div>
        )}

        {activeTab === 'scenes' && (
          <>
            <div className="universe-scenes-header">
              <h2>Scenes</h2>
              <button
                onClick={handleCreateSceneClick}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Create Scene
              </button>
            </div>

            {scenesLoading ? (
              <div className="loading-container small">
                <div className="spinner"></div>
                <p>Loading scenes...</p>
              </div>
            ) : filteredScenes.length > 0 ? (
              <div className="scene-grid">
                {filteredScenes.map((scene) => (
                  <Suspense key={scene.id} fallback={<div>Loading scene card...</div>}>
                    <SceneCard
                      scene={scene}
                      onEdit={handleEditScene}
                      onDelete={handleDeleteScene}
                      onView={handleViewScene}
                    />
                  </Suspense>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No scenes found in this universe</p>
                <button
                  onClick={handleCreateSceneClick}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#1890ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Create Your First Scene
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'characters' && (
          <div className="universe-characters-tab">
            <h2>Characters</h2>
            <p>Character management will be implemented soon.</p>
          </div>
        )}
        {activeTab === 'notes' && (
          <div className="universe-notes-tab">
            <h2>Notes</h2>
            <p>Note management will be implemented soon.</p>
          </div>
        )}
      </div>

      {isEditModalOpen && currentUniverse && (
        <Suspense fallback={<div>Loading Universe Modal...</div>}>
          <UniverseModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            universe={currentUniverse}
            isEdit={true}
          />
        </Suspense>
      )}

      {isDeleteModalOpen && currentUniverse && (
        <Suspense fallback={<div>Loading Delete Modal...</div>}>
          <UniverseDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onSuccess={handleDeleteSuccess}
            universe={currentUniverse}
          />
        </Suspense>
      )}

      <Suspense fallback={<div>Loading Scene Modal...</div>}>
        <SceneModal
          open={isCreateSceneModalOpen}
          onClose={() => setIsCreateSceneModalOpen(false)}
          onSuccess={handleCreateSceneSuccess}
          mode="create"
          universeId={id}
        />
      </Suspense>

      {isEditSceneModalOpen && sceneToEdit && (
        <Suspense fallback={<div>Loading Scene Modal...</div>}>
          <SceneModal
            open={isEditSceneModalOpen}
            onClose={handleEditSceneClose}
            onSuccess={handleEditSceneSuccess}
            universeId={id}
            sceneId={sceneToEdit}
            mode="edit"
          />
        </Suspense>
      )}

      {isViewSceneModalOpen && sceneToView && (
        <Suspense fallback={<div>Loading Scene Modal...</div>}>
          <SceneModal
            open={isViewSceneModalOpen}
            onClose={handleViewSceneClose}
            universeId={id}
            sceneId={typeof sceneToView === 'object' ? sceneToView.id : sceneToView}
            initialData={typeof sceneToView === 'object' ? sceneToView : null}
            mode="view"
          />
        </Suspense>
      )}
    </div>
  );
};

export default UniverseDetail;

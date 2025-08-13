import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
<<<<<<< HEAD
=======
import Button from '../../../components/common/Button.jsx';
>>>>>>> 64d26fb0450c4c235f1b7446371f5501f9bfb769
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

<<<<<<< HEAD
  // Utility function to clear all auth data
  const clearAuthData = () => {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    console.log('UniverseDetail - Auth data cleared');
  };

  // Global token cleanup function
  const globalTokenCleanup = () => {
    console.log('=== GLOBAL TOKEN CLEANUP START ===');

    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

    console.log('Before cleanup:', {
      hasToken: !!token,
      hasUser: !!userStr,
      hasRefreshToken: !!refreshToken,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
    });

    // Check if token is valid JWT format
    const isValidToken = token && token.split('.').length === 3;

    if (token && !isValidToken) {
      console.log('Invalid token detected, clearing all auth data');
      clearAuthData();

      // Verify cleanup
      setTimeout(() => {
        const afterToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        const afterUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);
        const afterRefresh = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

        console.log('After cleanup:', {
          hasToken: !!afterToken,
          hasUser: !!afterUser,
          hasRefreshToken: !!afterRefresh,
        });
        console.log('=== GLOBAL TOKEN CLEANUP END ===');
      }, 10);
    } else if (isValidToken) {
      console.log('Valid token found, no cleanup needed');
      console.log('=== GLOBAL TOKEN CLEANUP END ===');
    } else {
      console.log('No token found, no cleanup needed');
      console.log('=== GLOBAL TOKEN CLEANUP END ===');
    }
  };

  // Immediate token cleanup - runs before any other logic
  useEffect(() => {
    console.log('UniverseDetail - Running immediate token cleanup...');

    // Check for invalid tokens immediately
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);

    console.log('UniverseDetail - Current localStorage state:', {
      hasToken: !!token,
      hasUser: !!userStr,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
    });

    // Check if token is valid JWT format
    const isValidToken = token && token.split('.').length === 3;

    if (token && !isValidToken) {
      console.log(
        'UniverseDetail - Invalid token detected during immediate cleanup, clearing auth data'
      );
      clearAuthData();

      // Verify cleanup worked
      setTimeout(() => {
        const afterToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        const afterUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);
        console.log('UniverseDetail - After immediate cleanup:', {
          hasToken: !!afterToken,
          hasUser: !!afterUser,
        });
      }, 10);
    } else if (isValidToken) {
      console.log('UniverseDetail - Valid token found during immediate cleanup');
    } else {
      console.log('UniverseDetail - No token found during immediate cleanup');
    }
  }, []); // Empty dependency array - runs only once on mount

  // Test function to verify demo login
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

  // Test function to verify CORS preflight
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
      // First, aggressively check and clear any invalid tokens
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
      const user = userStr ? JSON.parse(userStr) : null;

      console.log('UniverseDetail - Initial auth check:', {
        hasToken: !!token,
        hasUser: !!user,
        userEmail: user?.email,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
      });

      // Check if token is valid JWT format
      const isValidToken = token && token.split('.').length === 3;
      if (token && !isValidToken) {
        console.log('UniverseDetail - Invalid token format detected, clearing auth data');
        // Clear invalid auth data
        clearAuthData();

        // Force a small delay to ensure localStorage is cleared
        await new Promise((resolve) => setTimeout(resolve, 50));

        console.log('UniverseDetail - Auth data cleared, localStorage state:', {
          token: localStorage.getItem(AUTH_CONFIG.TOKEN_KEY),
          user: localStorage.getItem(AUTH_CONFIG.USER_KEY),
          refreshToken: localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY),
        });
        // Early return: do not proceed with fetches if token was invalid
        return;
      }

      // Check if this is a demo session after cleanup
      const isDemoSession = demoService.isValidDemoSession();

      console.log('UniverseDetail - After cleanup:', {
        isDemoSession,
        hasToken: !!localStorage.getItem(AUTH_CONFIG.TOKEN_KEY),
        hasUser: !!localStorage.getItem(AUTH_CONFIG.USER_KEY),
      });

      // If no token and not a valid demo session, try to set up demo session
      if ((!localStorage.getItem(AUTH_CONFIG.TOKEN_KEY) || !isValidToken) && !isDemoSession) {
        console.log('UniverseDetail - No valid session, attempting demo login');
        try {
          const demoResponse = await demoService.setupDemoSession();
          console.log('UniverseDetail - Demo session setup result:', demoResponse);

          // Verify the session was established
          const newToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
          const newUserStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
          const newUser = newUserStr ? JSON.parse(newUserStr) : null;

          console.log('UniverseDetail - After demo setup:', {
            hasNewToken: !!newToken,
            hasNewUser: !!newUser,
            newUserEmail: newUser?.email,
            newTokenPreview: newToken ? `${newToken.substring(0, 20)}...` : 'none',
            newTokenLength: newToken?.length || 0,
          });
        } catch (demoError) {
          console.error('UniverseDetail - Demo session setup failed:', demoError);
          // Continue anyway, the request might still work
        }
      }

      // Add a small delay to ensure localStorage is updated
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Final check before making requests
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

      // Now make the requests
      console.log('UniverseDetail - Making universe requests for ID:', id);
      dispatch(fetchUniverseById({ id }));
      dispatch(fetchScenesForUniverse(id));
    } catch (error) {
      console.error('UniverseDetail - Error in auth check:', error);
      // Still try to make the requests
      dispatch(fetchUniverseById({ id }));
      dispatch(fetchScenesForUniverse(id));
    }
  }, [dispatch, id]);

  const debugAuthFlow = async () => {
    console.log('--- DEBUG AUTH FLOW START ---');
    await checkAuthAndFetch();
    console.log('--- DEBUG AUTH FLOW END ---');
  };

  // Fetch universe data when component mounts or id changes
  useEffect(() => {
    if (id) {
=======
  useEffect(() => {
    if (id) {
      const checkAuthAndFetch = async () => {
        try {
          const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
          const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
          const user = userStr ? JSON.parse(userStr) : null;

          const isValidToken = token && token.split('.').length === 3;
          if (token && !isValidToken) {
            localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
            localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
            localStorage.removeItem(AUTH_CONFIG.USER_KEY);
            return;
          }

          dispatch(fetchUniverseById({ id }));
          dispatch(fetchScenesForUniverse(id));
        } catch (error) {
          console.error('Error in auth check:', error);
          dispatch(fetchUniverseById({ id }));
          dispatch(fetchScenesForUniverse(id));
        }
      };

>>>>>>> 64d26fb0450c4c235f1b7446371f5501f9bfb769
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
    navigate(`/universes/${id}`);
  };

  const handleDeleteClick = () => setIsDeleteModalOpen(true);
  const handleDeleteSuccess = () => {
    setIsDeleteModalOpen(false);
    navigate('/universes');
  };

  const handleCreateSceneClick = () => {
<<<<<<< HEAD
    console.log('UniverseDetail - Create Scene button clicked');
=======
>>>>>>> 64d26fb0450c4c235f1b7446371f5501f9bfb769
    setIsCreateSceneModalOpen(true);
  };

  const handleCreateSceneSuccess = (newScene) => {
    setIsCreateSceneModalOpen(false);
    dispatch(createSceneAndRefresh({ ...newScene, universe_id: id }));
  };

  const handleEditScene = (scene) => {
    setSceneToEdit(scene.id);
    setIsEditSceneModalOpen(true);
  };

  const handleViewScene = (scene) => {
    setSceneToView(scene);
    setIsViewSceneModalOpen(true);
  };

  const handleEditSceneSuccess = () => {
    setIsEditSceneModalOpen(false);
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
    if (window.confirm(`Are you sure you want to delete "${scene.title || scene.name}"? This cannot be undone.`)) {
      dispatch(deleteSceneAndRefresh({ sceneId: scene.id, universeId: id }));
    }
  };

  const filteredScenes = scenes.filter((scene) => scene.universe_id === parseInt(id, 10) && !scene.is_deleted);

  if (loading && !currentUniverse) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading universe...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
<<<<<<< HEAD
        <p>{errorMessage}</p>
        <div style={{ marginTop: '20px' }}>
          <button
            as="button"
            onClick={() => navigate('/universes')}
            style={{ marginRight: '10px' }}
          >
            Back to Universes
          </button>
          <button
            as="button"
            onClick={clearAuthData}
            variant="secondary"
            style={{ marginRight: '10px' }}
          >
            Clear Auth Data
          </button>
          <button
            as="button"
            onClick={debugAuthFlow}
            variant="secondary"
            style={{ marginRight: '10px' }}
          >
            Debug Auth Flow
          </button>
          <button as="button" onClick={() => window.location.reload()} variant="secondary">
            Reload Page
          </button>
        </div>
=======
        <p>{error.message || 'Unknown error occurred'}</p>
        <Button onClick={() => navigate('/universes')}>Back to Universes</Button>
>>>>>>> 64d26fb0450c4c235f1b7446371f5501f9bfb769
      </div>
    );
  }

  if (!currentUniverse) {
    return (
      <div className="not-found-container">
        <h2>Universe Not Found</h2>
<<<<<<< HEAD
        <p>
          The universe you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission
          to view it.
        </p>
        <button onClick={() => navigate('/universes')}>Back to Universes</button>
=======
        <p>The universe you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
        <Button onClick={() => navigate('/universes')}>Back to Universes</Button>
>>>>>>> 64d26fb0450c4c235f1b7446371f5501f9bfb769
      </div>
    );
  }

  return (
    <div className="universe-detail-container">
      <div className="universe-detail-header">
        <div className="universe-info">
          <h1>{currentUniverse.name}</h1>
          <div className="universe-meta">
            <span className={`universe-visibility ${currentUniverse.is_public ? 'public' : 'private'}`}>
              {currentUniverse.is_public ? 'Public' : 'Private'}
            </span>
            {currentUniverse.theme && <span className="universe-theme">{currentUniverse.theme}</span>}
            {currentUniverse.genre && <span className="universe-genre">{currentUniverse.genre}</span>}
          </div>
        </div>
        <div className="universe-actions">
<<<<<<< HEAD
          <button onClick={handleEditClick}>Edit Universe</button>
          <button onClick={handleDeleteClick}>Delete Universe</button>
=======
          <Button onClick={handleEditClick} variant="secondary">Edit Universe</Button>
          <Button onClick={handleDeleteClick} variant="danger">Delete Universe</Button>
>>>>>>> 64d26fb0450c4c235f1b7446371f5501f9bfb769
        </div>
      </div>

      {currentUniverse.description && (
        <div className="universe-description">
          <p>{currentUniverse.description}</p>
        </div>
      )}

      <div className="universe-tabs">
        <button className={`tab-button ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
        <button className={`tab-button ${activeTab === 'scenes' ? 'active' : ''}`} onClick={() => setActiveTab('scenes')}>Scenes</button>
        <button className={`tab-button ${activeTab === 'characters' ? 'active' : ''}`} onClick={() => setActiveTab('characters')}>Characters</button>
        <button className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Notes</button>
      </div>

      <div className="universe-content">
        {activeTab === 'details' && <div className="universe-details-tab"><h2>Universe Details</h2></div>}

        {activeTab === 'scenes' && (
          <>
            <div className="universe-scenes-header">
              <h2>Scenes</h2>
<<<<<<< HEAD
              <button onClick={handleCreateSceneClick} variant="primary">
                Create Scene
              </button>
=======
              <Button onClick={handleCreateSceneClick} variant="primary">Create Scene</Button>
>>>>>>> 64d26fb0450c4c235f1b7446371f5501f9bfb769
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
<<<<<<< HEAD
                <button onClick={handleCreateSceneClick} variant="primary">
                  Create Your First Scene
                </button>
=======
                <Button onClick={handleCreateSceneClick} variant="primary">Create Your First Scene</Button>
>>>>>>> 64d26fb0450c4c235f1b7446371f5501f9bfb769
              </div>
            )}
          </>
        )}

        {activeTab === 'characters' && <div className="universe-characters-tab"><h2>Characters</h2><p>Character management will be implemented soon.</p></div>}
        {activeTab === 'notes' && <div className="universe-notes-tab"><h2>Notes</h2><p>Note management will be implemented soon.</p></div>}
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
        <UniverseDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onSuccess={handleDeleteSuccess}
          universe={currentUniverse}
        />
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

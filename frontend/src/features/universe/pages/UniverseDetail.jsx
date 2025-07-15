import { lazy, Suspense, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button as MyButton } from '../../../components/common/index.mjs';
import { demoService } from '../../../services/demo.service.mjs';
import {
  createSceneAndRefresh,
  deleteSceneAndRefresh,
  fetchScenesForUniverse,
} from '../../../store/thunks/scenesThunks';
import { fetchUniverseById } from '../../../store/thunks/universeThunks';
import { AUTH_CONFIG } from '../../../utils/config.mjs';
// import { SceneCard } from '../../scene/index.mjs';
import '../styles/Universe.css';
const UniverseModal = lazy(() => import('../modals/UniverseModal'));
const UniverseDeleteModal = lazy(() => import('../modals/UniverseDeleteModal.jsx'));
const SceneModal = lazy(() => import('../../scene/modals/SceneModal.jsx'));

const SceneCard = lazy(() => import('../../scene/components/SceneCard.jsx'));

const UniverseDetail = () => {
  console.log(createSceneAndRefresh);
  console.log(deleteSceneAndRefresh);
  console.log(fetchScenesForUniverse,);
  const { id } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUniverse, loading, error } = useSelector((state) => state.universes);
  const { scenes, loading: scenesLoading } = useSelector((state) => state.scenes);

  // Initialize activeTab from location state if available
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'details');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateSceneModalOpen, setIsCreateSceneModalOpen] = useState(false);

  // Add state for scene editing
  const [isEditSceneModalOpen, setIsEditSceneModalOpen] = useState(false);
  const [sceneToEdit, setSceneToEdit] = useState(null);

  // Add state for scene viewing
  const [isViewSceneModalOpen, setIsViewSceneModalOpen] = useState(false);
  const [sceneToView, setSceneToView] = useState(null);

  // Add state for triggering a re-render
  const [dummyState, setDummyState] = useState({});

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

  // Comprehensive debug function to test entire auth flow
  const debugAuthFlow = async (universeId = 1) => {
    console.log('=== DEBUG AUTH FLOW START ===');

    // Step 1: Clear all auth data
    console.log('Step 1: Clearing all auth data...');
    clearAuthData();

    // Step 2: Check initial state
    console.log('Step 2: Checking initial state...');
    const initialToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const initialUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    console.log('Initial state:', {
      hasToken: !!initialToken,
      hasUser: !!initialUser,
      token: initialToken,
      user: initialUser,
    });

    // Step 3: Test demo login
    console.log('Step 3: Testing demo login...');
    const demoResult = await testDemoLogin();

    // Step 4: Check state after demo login
    console.log('Step 4: Checking state after demo login...');
    const afterToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const afterUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    console.log('After demo login:', {
      hasToken: !!afterToken,
      hasUser: !!afterUser,
      tokenLength: afterToken?.length || 0,
      tokenPreview: afterToken ? `${afterToken.substring(0, 20)}...` : 'none',
      user: afterUser ? JSON.parse(afterUser) : null,
    });

    // Step 5: Test CORS preflight
    console.log('Step 5: Testing CORS preflight...');
    const corsResult = await testCorsPreflight(universeId);

    // Step 6: Test universe request
    console.log('Step 6: Testing universe request...');
    try {
      const response = await fetch(`http://localhost:5001/api/universes/${universeId}/`, {
        headers: {
          Authorization: `Bearer ${afterToken}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Universe request result:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });
    } catch (error) {
      console.error('Universe request error:', error);
    }

    console.log('=== DEBUG AUTH FLOW END ===');
    return { demoResult, corsResult };
  };

  // Expose test functions for debugging
  useEffect(() => {
    window.testDemoLogin = testDemoLogin;
    window.testCorsPreflight = testCorsPreflight;
    window.clearAuthData = clearAuthData;
    window.debugAuthFlow = debugAuthFlow;
    window.globalTokenCleanup = globalTokenCleanup;
    console.log(
      'Debug functions available: window.testDemoLogin(), window.testCorsPreflight(), window.clearAuthData(), window.debugAuthFlow(), window.globalTokenCleanup()'
    );

    // Run global token cleanup immediately
    globalTokenCleanup();
  }, []);

  // Fetch universe data when component mounts or id changes
  useEffect(() => {
    if (id) {
      // Check authentication state before making requests
      const checkAuthAndFetch = async () => {
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
            localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
            localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
            localStorage.removeItem(AUTH_CONFIG.USER_KEY);

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
      };

      checkAuthAndFetch();
    }
  }, [dispatch, id]);

  // Set active tab when location state changes
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Open edit modal automatically if accessed through the edit route
  useEffect(() => {
    if (location.pathname.endsWith('/edit') && currentUniverse) {
      setIsEditModalOpen(true);
    }
  }, [location.pathname, currentUniverse]);

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    // Redirect to the detail page if we're on the edit route
    if (location.pathname.endsWith('/edit')) {
      navigate(`/universes/${id}`);
    } else {
      // Refresh universe data
      dispatch(fetchUniverseById({ id }));
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    setIsDeleteModalOpen(false);
    // Navigate back to universes list after successful deletion
    navigate('/universes');
  };

  const handleCreateSceneClick = () => {
    console.log('UniverseDetail - BUTTON CLICKED - handleCreateSceneClick called');

    // Set a flag to force the modal to open
    setIsCreateSceneModalOpen(true);

    // Better logging to check state
    console.log('UniverseDetail - State before update:', { isCreateSceneModalOpen });

    // Force a re-render with the dummy state update
    setDummyState({ timestamp: Date.now() });

    // Add a timeout to check the state after the update
    setTimeout(() => {
      console.log('UniverseDetail - State after update (timeout):', {
        isCreateSceneModalOpen: isCreateSceneModalOpen,
        dummyState: dummyState,
      });
    }, 100);
  };

  const handleCreateSceneSuccess = (newScene) => {
    console.log('UniverseDetail - handleCreateSceneSuccess called with:', newScene);
    setIsCreateSceneModalOpen(false);
    // Log localStorage user/email before dispatch
    const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    console.log('UniverseDetail - Before createSceneAndRefresh dispatch, localStorage user:', user);
    // Dispatch action to create scene using Redux with auto-refresh
    dispatch(
      createSceneAndRefresh({
        ...newScene,
        universe_id: id,
      })
    );
  };

  const handleEditScene = (scene) => {
    // Open modal for editing, only pass the scene ID
    console.log(`Opening edit modal for scene ${scene.id} in universe ${id}`);
    setSceneToEdit(scene.id);
    setIsEditSceneModalOpen(true);
  };

  const handleViewScene = (scene) => {
    // Open modal for viewing
    console.log(`Opening view modal for scene ${scene.id} in universe ${id}`);

    try {
      // Store both the ID and full scene object if available
      setSceneToView(scene);
      setIsViewSceneModalOpen(true);
    } catch (error) {
      console.error('Error opening view scene modal:', error);
    }
  };

  const handleEditSceneSuccess = (editedScene) => {
    setIsEditSceneModalOpen(false);
    setSceneToEdit(null);

    // Make sure we refresh the scenes data from the server
    if (editedScene) {
      console.log('Scene edited successfully, refreshing scenes list for universe:', id);
    }

    // Always refresh to ensure we have the latest data
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
      // Log localStorage user/email before dispatch
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

  // Modal close handlers
  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    // Redirect to detail page if accessed via edit route
    if (location.pathname.endsWith('/edit')) {
      navigate(`/universes/${id}`);
    }
  };

  // Filter scenes for this universe using Redux store
  const filteredScenes = scenes.filter(
    (scene) => scene.universe_id === parseInt(id, 10) && !scene.is_deleted
  );

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Return early if universe is not loaded
  if (loading && !currentUniverse) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading universe...</p>
      </div>
    );
  }

  if (error) {
    // Format error message based on different possible error formats
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
          <MyButton
            as="button"
            onClick={() => navigate('/universes')}
            style={{ marginRight: '10px' }}
          >
            Back to Universes
          </MyButton>
          <MyButton
            as="button"
            onClick={clearAuthData}
            variant="secondary"
            style={{ marginRight: '10px' }}
          >
            Clear Auth Data
          </MyButton>
          <MyButton
            as="button"
            onClick={debugAuthFlow}
            variant="secondary"
            style={{ marginRight: '10px' }}
          >
            Debug Auth Flow
          </MyButton>
          <MyButton as="button" onClick={() => window.location.reload()} variant="secondary">
            Reload Page
          </MyButton>
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
        <MyButton onClick={() => navigate('/universes')}>Back to Universes</MyButton>
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
          <MyButton as="button" onClick={handleEditClick} variant="secondary">
            Edit Universe
          </MyButton>
          <MyButton as="button" onClick={handleDeleteClick} variant="danger">
            Delete Universe
          </MyButton>
          {/* Native test button for debugging event handling */}
          <button style={{ marginLeft: 8 }} onClick={() => alert('Native button works!')}>
            Native Test Button
          </button>
          <MyButton as="button" onClick={() => alert('Minimal Button works!')}>
            Minimal Test Button
          </MyButton>
        </div>
      </div>

      {currentUniverse.description && (
        <div className="universe-description">
          <p>{currentUniverse.description}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="universe-tabs">
        <button
          className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => handleTabChange('details')}
        >
          Details
        </button>
        <button
          className={`tab-button ${activeTab === 'scenes' ? 'active' : ''}`}
          onClick={() => handleTabChange('scenes')}
        >
          Scenes
        </button>
        <button
          className={`tab-button ${activeTab === 'characters' ? 'active' : ''}`}
          onClick={() => handleTabChange('characters')}
        >
          Characters
        </button>
        <button
          className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => handleTabChange('notes')}
        >
          Notes
        </button>
      </div>

      {/* Tab Content */}
      <div className="universe-content">
        {activeTab === 'details' && (
          <div className="universe-details-tab">
            <h2>Universe Details</h2>
            {/* Details content here */}
          </div>
        )}

        {activeTab === 'scenes' && (
          <>
            <div className="universe-scenes-header">
              <h2>Scenes</h2>
              <MyButton as="button" onClick={handleCreateSceneClick} variant="primary">
                Create Scene
              </MyButton>
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
                <MyButton as="button" onClick={handleCreateSceneClick} variant="primary">
                  Create Your First Scene
                </MyButton>
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

      {/* Edit Universe Modal */}
      {isEditModalOpen && currentUniverse && (
        <Suspense fallback={<div>Loading Universe Modal...</div>}>
          <UniverseModal
            isOpen={isEditModalOpen}
            onClose={handleEditModalClose}
            onSuccess={handleEditSuccess}
            universe={currentUniverse}
            isEdit={true}
          />
        </Suspense>
      )}

      {/* Delete Universe Modal */}
      {isDeleteModalOpen && currentUniverse && (
        <UniverseDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onSuccess={handleDeleteSuccess}
          universe={currentUniverse}
        />
      )}

      {/* Scene Create Modal */}
      <SceneModal
        isOpen={isCreateSceneModalOpen}
        open={isCreateSceneModalOpen}
        onClose={() => {
          console.log('UniverseDetail - SceneModal onClose called, closing modal');
          setIsCreateSceneModalOpen(false);
        }}
        onSuccess={(newScene) => {
          console.log('UniverseDetail - SceneModal onSuccess called with:', newScene);
          handleCreateSceneSuccess(newScene);
        }}
        universeId={id}
        mode="create"
        modalType="create"
      />

      {isEditSceneModalOpen && sceneToEdit && (
        <SceneModal
          isOpen={isEditSceneModalOpen}
          onClose={handleEditSceneClose}
          onSuccess={handleEditSceneSuccess}
          universeId={id}
          sceneId={sceneToEdit}
          mode="edit"
        />
      )}

      {isViewSceneModalOpen && sceneToView && (
        <SceneModal
          isOpen={isViewSceneModalOpen}
          onClose={handleViewSceneClose}
          universeId={id}
          sceneId={typeof sceneToView === 'object' ? sceneToView.id : sceneToView}
          initialData={typeof sceneToView === 'object' ? sceneToView : null}
          mode="view"
        />
      )}
    </div>
  );
};

export default UniverseDetail;

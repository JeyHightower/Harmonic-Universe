import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { UniverseDeleteModal, UniverseModal } from '../';
import Button from '../../../components/common/Button';
import {
    deleteScene,
    fetchScenesForUniverse,
} from '../../../store/thunks/consolidated/scenesThunks';
import { fetchUniverseById } from '../../../store/thunks/universeThunks';
import { SceneCard, SceneModal } from '../../scene/index.mjs';
import '../styles/Universe.css';

const UniverseDetail = () => {
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

  // Fetch universe data when component mounts or id changes
  useEffect(() => {
    if (id) {
      dispatch(fetchUniverseById({ id }));
      dispatch(fetchScenesForUniverse(id));
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
    setIsCreateSceneModalOpen(true);
  };

  const handleCreateSceneSuccess = () => {
    setIsCreateSceneModalOpen(false);
    dispatch(fetchScenesForUniverse(id));
  };

  const handleEditScene = (scene) => {
    // Open modal for editing instead of navigating
    console.log(`Opening edit modal for scene ${scene.id} in universe ${id}`);
    setSceneToEdit(scene);
    setIsEditSceneModalOpen(true);
  };

  const handleEditSceneSuccess = () => {
    setIsEditSceneModalOpen(false);
    setSceneToEdit(null);
    // Refresh scenes data
    dispatch(fetchScenesForUniverse(id));
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
      dispatch(deleteScene(scene.id))
        .then(() => {
          dispatch(fetchScenesForUniverse(id));
        })
        .catch((error) => {
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

  // Filter scenes for this universe
  const universeScenes = scenes.filter(
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
        <Button onClick={() => navigate('/universes')}>Back to Universes</Button>
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
              <Button onClick={handleCreateSceneClick} variant="primary">
                Create Scene
              </Button>
            </div>

            {scenesLoading ? (
              <div className="loading-container small">
                <div className="spinner"></div>
                <p>Loading scenes...</p>
              </div>
            ) : universeScenes.length > 0 ? (
              <div className="scene-grid">
                {universeScenes.map((scene) => (
                  <SceneCard
                    key={scene.id}
                    scene={scene}
                    onEdit={handleEditScene}
                    onDelete={handleDeleteScene}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No scenes found in this universe</p>
                <Button onClick={handleCreateSceneClick} variant="primary">
                  Create Your First Scene
                </Button>
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
        <UniverseModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          onSuccess={handleEditSuccess}
          universe={currentUniverse}
          isEdit={true}
        />
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

      {/* Modals for scene operations */}
      {isCreateSceneModalOpen && (
        <SceneModal
          isOpen={isCreateSceneModalOpen}
          onClose={() => setIsCreateSceneModalOpen(false)}
          onSuccess={handleCreateSceneSuccess}
          universeId={id}
          mode="create"
        />
      )}

      {isEditSceneModalOpen && sceneToEdit && (
        <SceneModal
          isOpen={isEditSceneModalOpen}
          onClose={() => setIsEditSceneModalOpen(false)}
          onSuccess={handleEditSceneSuccess}
          universeId={id}
          sceneId={sceneToEdit}
          mode="edit"
        />
      )}
    </div>
  );
};

export default UniverseDetail;

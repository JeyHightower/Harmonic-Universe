import { lazy, Suspense, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../../../components/common/Button.jsx';
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

      checkAuthAndFetch();
    }
  }, [dispatch, id]);

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
        <p>{error.message || 'Unknown error occurred'}</p>
        <Button onClick={() => navigate('/universes')}>Back to Universes</Button>
      </div>
    );
  }

  if (!currentUniverse) {
    return (
      <div className="not-found-container">
        <h2>Universe Not Found</h2>
        <p>The universe you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
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
            <span className={`universe-visibility ${currentUniverse.is_public ? 'public' : 'private'}`}>
              {currentUniverse.is_public ? 'Public' : 'Private'}
            </span>
            {currentUniverse.theme && <span className="universe-theme">{currentUniverse.theme}</span>}
            {currentUniverse.genre && <span className="universe-genre">{currentUniverse.genre}</span>}
          </div>
        </div>
        <div className="universe-actions">
          <Button onClick={handleEditClick} variant="secondary">Edit Universe</Button>
          <Button onClick={handleDeleteClick} variant="danger">Delete Universe</Button>
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
              <Button onClick={handleCreateSceneClick} variant="primary">Create Scene</Button>
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
                <Button onClick={handleCreateSceneClick} variant="primary">Create Your First Scene</Button>
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

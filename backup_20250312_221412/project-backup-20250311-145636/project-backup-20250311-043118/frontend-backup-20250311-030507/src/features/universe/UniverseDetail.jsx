import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchUniverseById, deleteUniverse } from '../../store/thunks/universeThunks';
import { fetchScenesForUniverse } from '../../store/thunks/universeThunks';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import UniverseFormModal from './UniverseFormModal';
import SceneCard from '../scenes/SceneCard';
import './Universe.css';

const UniverseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUniverse, loading, error } = useSelector(state => state.universe);
  const { universeScenes } = useSelector(state => state.scenes);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [scenesLoading, setScenesLoading] = useState(false);

  // Fetch universe data when component mounts
  useEffect(() => {
    if (id) {
      dispatch(fetchUniverseById({
        id,
        includeScenes: true
      }));

      // Also fetch scenes separately to ensure we have the complete data
      setScenesLoading(true);
      dispatch(fetchScenesForUniverse(id))
        .finally(() => setScenesLoading(false));
    }
  }, [dispatch, id]);

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await dispatch(deleteUniverse(id)).unwrap();
      // Navigate back to universes list after successful deletion
      navigate('/universes');
    } catch (err) {
      console.error('Failed to delete universe:', err);
      // Keep the modal open if there's an error
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    // Refresh universe data
    dispatch(fetchUniverseById({
      id,
      includeScenes: true
    }));
  };

  // Get scenes for this universe
  const scenes = universeScenes[id] || [];

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
        <p>{error}</p>
        <Button onClick={() => navigate('/universes')}>
          Back to Universes
        </Button>
      </div>
    );
  }

  if (!currentUniverse) {
    return (
      <div className="not-found-container">
        <h2>Universe Not Found</h2>
        <p>The universe you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => navigate('/universes')}>
          Back to Universes
        </Button>
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
            {currentUniverse.theme && (
              <span className="universe-theme">{currentUniverse.theme}</span>
            )}
            {currentUniverse.genre && (
              <span className="universe-genre">{currentUniverse.genre}</span>
            )}
          </div>
        </div>
        <div className="universe-actions">
          <Button
            onClick={handleEditClick}
            variant="secondary"
          >
            Edit Universe
          </Button>
          <Button
            onClick={handleDeleteClick}
            variant="danger"
          >
            Delete Universe
          </Button>
        </div>
      </div>

      {currentUniverse.description && (
        <div className="universe-description">
          <p>{currentUniverse.description}</p>
        </div>
      )}

      <div className="universe-content">
        <div className="universe-scenes-header">
          <h2>Scenes</h2>
          <Link to={`/universes/${id}/scenes/new`} className="button button-primary">
            Create Scene
          </Link>
        </div>

        {scenesLoading ? (
          <div className="loading-container small">
            <div className="spinner"></div>
            <p>Loading scenes...</p>
          </div>
        ) : scenes.length > 0 ? (
          <div className="scene-grid">
            {scenes.map(scene => (
              <SceneCard key={scene.id} scene={scene} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No scenes found in this universe</p>
            <Link to={`/universes/${id}/scenes/new`} className="button button-primary">
              Create Your First Scene
            </Link>
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <UniverseFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          initialData={currentUniverse}
        />
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Universe"
      >
        <div className="delete-confirmation">
          <p>
            Are you sure you want to delete the universe "{currentUniverse.name}"?
            This action cannot be undone and will delete all scenes and data associated with this universe.
          </p>
          <div className="modal-actions">
            <Button
              onClick={() => setIsDeleteModalOpen(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="danger"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Universe'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UniverseDetail;

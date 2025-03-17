import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchUniverses, deleteUniverse } from '../../store/slices/universeSlice';
import Modal from '../../components/Modal';
import UniverseForm from './UniverseForm';
import '../../styles/UniverseManager.css';

const UniverseManager = () => {
  const dispatch = useDispatch();
  const { universes, status, error } = useSelector(state => state.universes);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [universeToDelete, setUniverseToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchUniverses());
  }, [dispatch]);

  const handleCreateUniverse = () => {
    setIsCreateModalOpen(true);
  };

  const handleDeleteClick = (universe) => {
    setUniverseToDelete(universe);
  };

  const confirmDelete = () => {
    if (universeToDelete) {
      dispatch(deleteUniverse(universeToDelete.id));
      setUniverseToDelete(null);
    }
  };

  return (
    <div className="universe-manager">
      <div className="universe-manager-header">
        <h1>Universe Manager</h1>
        <button 
          className="create-button"
          onClick={handleCreateUniverse}
        >
          Create Universe
        </button>
      </div>

      {status === 'loading' && <div className="loading">Loading universes...</div>}
      {error && <div className="error">{error}</div>}

      <div className="universe-grid">
        {universes.map(universe => (
          <div key={universe.id} className="universe-card">
            <div className="universe-card-header">
              <h3>{universe.name}</h3>
            </div>
            <div className="universe-card-content">
              <p>{universe.description || 'No description available'}</p>
              {universe.thumbnail_url && (
                <img 
                  src={universe.thumbnail_url} 
                  alt={universe.name} 
                  className="universe-thumbnail"
                />
              )}
              <div className="universe-meta">
                <p>Scenes: {universe.scene_count || 0}</p>
                <p>Created: {new Date(universe.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="universe-card-actions">
              <Link to={`/universes/${universe.id}`} className="view-button">
                View Details
              </Link>
              <button 
                className="delete-button" 
                onClick={() => handleDeleteClick(universe)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Universe Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Universe"
      >
        <UniverseForm onClose={() => setIsCreateModalOpen(false)} />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!universeToDelete}
        onClose={() => setUniverseToDelete(null)}
        title="Confirm Delete"
      >
        <div className="delete-confirmation">
          <p>Are you sure you want to delete <strong>{universeToDelete?.name}</strong>?</p>
          <p>This action cannot be undone and will delete all associated scenes and physics objects.</p>
          <div className="modal-actions">
            <button className="cancel-button" onClick={() => setUniverseToDelete(null)}>
              Cancel
            </button>
            <button className="delete-button confirm" onClick={confirmDelete}>
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UniverseManager;

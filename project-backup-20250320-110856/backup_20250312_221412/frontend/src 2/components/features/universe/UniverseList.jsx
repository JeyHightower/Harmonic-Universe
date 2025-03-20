import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchUniverses } from '../../../store/thunks/universeThunks';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import Spinner from '../../common/Spinner';
import './Universe.css';
import UniverseCreate from './UniverseCreate';

function UniverseList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { universes, loading, error } = useSelector(state => state.universe);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    dispatch(fetchUniverses());
  }, [dispatch]);

  const handleCreateClick = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  const handleUniverseCreated = universeId => {
    setShowCreateModal(false);
    navigate(`/universes/${universeId}`);
  };

  if (loading && universes.length === 0) {
    return (
      <div className="universe-container">
        <div className="universe-loading">
          <Spinner size="large" />
          <p>Loading universes...</p>
        </div>
      </div>
    );
  }

  if (error && universes.length === 0) {
    return (
      <div className="universe-container">
        <div className="universe-error">
          <p>{error}</p>
          <Button onClick={() => dispatch(fetchUniverses())}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="universe-container">
      <div className="universe-list-header">
        <h1>Your Universes</h1>
        <Button onClick={handleCreateClick}>Create New Universe</Button>
      </div>

      {universes.length === 0 ? (
        <div className="universe-empty-state">
          <p>You haven't created any universes yet.</p>
          <Button onClick={handleCreateClick}>
            Create Your First Universe
          </Button>
        </div>
      ) : (
        <div className="universe-list">
          {universes.map(universe => (
            <Link
              to={`/universes/${universe.id}`}
              key={universe.id}
              className="universe-card card"
            >
              <div className="universe-card-content">
                <h2>{universe.name}</h2>
                <p className="universe-description">{universe.description}</p>
                <div className="universe-meta">
                  <span className="universe-date">
                    Created:{' '}
                    {new Date(universe.created_at).toLocaleDateString()}
                  </span>
                  <span
                    className={`universe-visibility ${
                      universe.is_public ? 'public' : 'private'
                    }`}
                  >
                    {universe.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        title="Create New Universe"
      >
        <UniverseCreate
          isModal
          onSuccess={handleUniverseCreated}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}

export default UniverseList;

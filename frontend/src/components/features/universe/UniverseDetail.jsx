import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { setCurrentUniverse } from '../../../store/slices/universeSlice';
import { deleteUniverse } from '../../../store/thunks/universeThunks';
import { api, endpoints } from '../../../utils/api';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import Spinner from '../../common/Spinner';
import PhysicsPanel from './PhysicsPanel';
import './Universe.css';

const UniverseDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUniverse } = useSelector(state => state.universe);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUniverse = async () => {
      try {
        setLoading(true);
        const response = await api.get(endpoints.universes.detail(id));

        // Only update if we have meaningful changes
        const hasChanges =
          !currentUniverse ||
          currentUniverse.id !== response.id ||
          JSON.stringify(currentUniverse.physics_params) !==
            JSON.stringify(response.physics_params);

        if (hasChanges) {
          dispatch(setCurrentUniverse(response));
        }

        setError(null);
      } catch (error) {
        console.error('Failed to fetch universe:', error);
        setError(error.response?.data?.message || 'Failed to load universe');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if ID changes
    if (id) {
      fetchUniverse();
    }
  }, [id]); // Remove dispatch from dependencies since it's stable

  // Check if user has permission to modify this universe
  const canModifyUniverse = currentUniverse?.user_role === 'owner';

  const handleEdit = () => {
    if (!canModifyUniverse) {
      setError('You do not have permission to edit this universe');
      return;
    }
    navigate(`/universes/${id}/edit`);
  };

  const handleDeleteClick = e => {
    e.preventDefault();
    e.stopPropagation();
    if (!canModifyUniverse) {
      setError('You do not have permission to delete this universe');
      return;
    }
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await dispatch(deleteUniverse(id)).unwrap();
      setShowDeleteModal(false);
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete universe';

      if (
        error.isAuthorizationError ||
        error.error_code === 'AUTHORIZATION_ERROR'
      ) {
        setError('You do not have permission to delete this universe');
        setShowDeleteModal(false);
        dispatch(
          setCurrentUniverse({
            ...currentUniverse,
            user_role: null,
          })
        );
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      } else if (error.status === 401) {
        setError('Your session has expired. Redirecting to login...');
        setShowDeleteModal(false);
        setTimeout(() => {
          navigate('/login', {
            state: {
              from: `/universes/${id}`,
              message: 'Please log in again to continue.',
            },
          });
        }, 2000);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = useCallback(
    e => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!isDeleting) {
        setShowDeleteModal(false);
        setError(null);
      }
    },
    [isDeleting]
  );

  // Update error display component
  const ErrorDisplay = ({ message }) => (
    <div className="universe-error" role="alert">
      <p>{message}</p>
      <div className="error-actions">
        <Button onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
        {message.includes('permission') && (
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="universe-container">
        <div className="universe-loading">
          <Spinner size="large" />
          <p>Loading universe details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="universe-container">
        <ErrorDisplay message={error} />
      </div>
    );
  }

  if (!currentUniverse) {
    return (
      <div className="universe-container">
        <div className="universe-error">
          <p>Universe not found</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="universe-container">
      <div className="universe-detail">
        <header className="universe-detail-header">
          <h1>{currentUniverse.name}</h1>
          {canModifyUniverse && (
            <div className="universe-detail-actions">
              <Button variant="secondary" onClick={handleEdit}>
                Edit
              </Button>
              <Button variant="danger" onClick={handleDeleteClick}>
                Delete
              </Button>
            </div>
          )}
        </header>

        <section className="universe-detail-info">
          <div className="universe-detail-field">
            <h2>Description</h2>
            <p>{currentUniverse.description}</p>
          </div>

          <div className="universe-detail-field">
            <h2>Created</h2>
            <p>{new Date(currentUniverse.created_at).toLocaleDateString()}</p>
          </div>

          <div className="universe-detail-field">
            <h2>Last Updated</h2>
            <p>{new Date(currentUniverse.updated_at).toLocaleDateString()}</p>
          </div>

          <div className="universe-detail-field">
            <h2>Visibility</h2>
            <p>{currentUniverse.is_public ? 'Public' : 'Private'}</p>
          </div>
        </section>

        <div className="universe-section">
          <PhysicsPanel
            universeId={id}
            initialPhysicsParams={currentUniverse.physics_params}
            readOnly={!canModifyUniverse}
          />
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={handleCloseModal}
        title="Delete Universe"
      >
        <div>
          <p>Are you sure you want to delete this universe?</p>
          <p>This action cannot be undone.</p>
          <div className="modal-actions">
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UniverseDetail;

import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteUniverse } from '../../../store/thunks/universeThunks';
import { api, endpoints } from '../../../utils/api';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import Spinner from '../../common/Spinner';
import './Universe.css';

const UniverseDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [universe, setUniverse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUniverse = async () => {
      try {
        setLoading(true);
        const response = await api.get(endpoints.universes.detail(id));
        setUniverse(response);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch universe:', error);
        setError(error.response?.data?.message || 'Failed to load universe');
      } finally {
        setLoading(false);
      }
    };

    fetchUniverse();
  }, [id]);

  // Check if user has permission to modify this universe
  const canModifyUniverse = universe?.user_role === 'owner';

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
      console.error('Delete failed:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
        // If it's an auth error, redirect to login
        if (error.response.status === 403 || error.response.status === 401) {
          setTimeout(() => {
            navigate('/login', {
              state: {
                from: `/universes/${id}`,
                message: 'Please log in again to continue.',
              },
            });
          }, 2000);
        }
      } else {
        setError('Failed to delete universe. Please try again.');
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
        <div className="universe-error">
          <p>{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!universe) {
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
          <h1>{universe.name}</h1>
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
            <p>{universe.description}</p>
          </div>

          <div className="universe-detail-field">
            <h2>Created</h2>
            <p>{new Date(universe.created_at).toLocaleDateString()}</p>
          </div>

          <div className="universe-detail-field">
            <h2>Last Updated</h2>
            <p>{new Date(universe.updated_at).toLocaleDateString()}</p>
          </div>

          <div className="universe-detail-field">
            <h2>Visibility</h2>
            <p>{universe.is_public ? 'Public' : 'Private'}</p>
          </div>
        </section>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={handleCloseModal}
        title="Delete Universe"
      >
        <div className="delete-modal-content">
          <p>
            Are you sure you want to delete this universe? This action cannot be
            undone.
          </p>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-actions">
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              loading={isDeleting}
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

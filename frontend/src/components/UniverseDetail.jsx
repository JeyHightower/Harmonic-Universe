import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useModal } from '../../../contexts/ModalContext';
import { setCurrentUniverse } from '../../../store/slices/universeSlice';
import { deleteUniverse } from '../../../store/thunks/universeThunks';
import { api, endpoints } from '../../../utils/api';
import { createConfirmModal } from '../../../utils/modalHelpers';
import Button from '../../common/Button';
import Icon from '../../common/Icon';
import Spinner from '../../common/Spinner';
import MusicPlayer from '../music/MusicPlayer';
import SceneManager from '../scenes/SceneManager';
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
  const { openModal } = useModal();

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
  }, [id, dispatch]);

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

    // Use the modern modal system with createConfirmModal
    openModal(
      createConfirmModal(
        `Are you sure you want to delete "${currentUniverse?.name}"? This action cannot be undone and will delete all associated data including scenes, physics objects, and generated music.`,
        handleDeleteConfirm,
        {
          title: 'Delete Universe',
          confirmText: 'Delete Universe',
          cancelText: 'Cancel',
          isDestructive: true,
          animation: 'zoom',
          size: 'medium',
        }
      )
    );
  };

  const handleUniverseInfo = () => {
    // Open a modal with universe details information
    openModal({
      component: UniverseInfoModal,
      props: {
        universe: currentUniverse,
      },
      modalProps: {
        title: 'Universe Details',
        size: 'medium',
        animation: 'fade',
      },
    });
  };

  const UniverseInfoModal = ({ universe, onClose }) => {
    if (!universe) return null;

    return (
      <div className="universe-info-modal">
        <div className="universe-info-section">
          <h3>Basic Information</h3>
          <div className="info-row">
            <span className="info-label">Name:</span>
            <span className="info-value">{universe.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Description:</span>
            <span className="info-value">{universe.description}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Visibility:</span>
            <span className="info-value">
              {universe.is_public ? 'Public' : 'Private'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Created:</span>
            <span className="info-value">
              {new Date(universe.created_at).toLocaleString()}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Last Updated:</span>
            <span className="info-value">
              {new Date(universe.updated_at).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="universe-info-section">
          <h3>Statistics</h3>
          <div className="info-row">
            <span className="info-label">Physics Objects:</span>
            <span className="info-value">
              {universe.physics_objects_count || 'N/A'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Scenes:</span>
            <span className="info-value">{universe.scenes_count || 'N/A'}</span>
          </div>
        </div>

        <div className="modal-footer">
          <Button onClick={onClose}>Close</Button>
          {canModifyUniverse && (
            <Button
              onClick={() => {
                onClose();
                handleEdit();
              }}
            >
              Edit Universe
            </Button>
          )}
        </div>
      </div>
    );
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await dispatch(deleteUniverse(id)).unwrap();
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete universe';

      if (
        error.isAuthorizationError ||
        error.error_code === 'AUTHORIZATION_ERROR'
      ) {
        setError('You do not have permission to delete this universe');
        dispatch(
          setCurrentUniverse({
            ...currentUniverse,
            user_role: null,
          })
        );
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsDeleting(false);
    }
  };

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
    <div className="universe-container universe-detail-container">
      <div className="universe-header">
        <div className="universe-title-section">
          <h1>{currentUniverse.name}</h1>
          <div className="universe-actions">
            <Button onClick={handleUniverseInfo} variant="icon">
              <Icon name="info" />
            </Button>
            {canModifyUniverse && (
              <>
                <Button onClick={handleEdit}>Edit</Button>
                <Button onClick={handleDeleteClick} variant="danger">
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="universe-description">{currentUniverse.description}</p>
      </div>

      <div className="universe-content">
        <div className="universe-panels">
          <PhysicsPanel />
          <div className="music-visualization-section">
            <MusicPlayer universeId={id} />
          </div>
        </div>
        <SceneManager universeId={id} />
      </div>
    </div>
  );
};

export default UniverseDetail;

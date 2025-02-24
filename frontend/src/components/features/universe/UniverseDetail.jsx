import React, { useEffect, useState } from 'react';
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

  const handleEdit = () => {
    navigate(`/universes/${id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteUniverse(id));
      setShowDeleteModal(false);
      navigate('/universes');
    } catch (error) {
      console.error('Failed to delete universe:', error);
    }
  };

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
          <Button onClick={() => navigate('/universes')}>
            Back to Universes
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
          <div className="universe-detail-actions">
            <Button variant="secondary" onClick={handleEdit}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              Delete
            </Button>
          </div>
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
        onClose={() => setShowDeleteModal(false)}
        title="Delete Universe"
      >
        <div className="delete-modal-content">
          <p>
            Are you sure you want to delete this universe? This action cannot be
            undone.
          </p>
          <div className="delete-modal-actions">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UniverseDetail;

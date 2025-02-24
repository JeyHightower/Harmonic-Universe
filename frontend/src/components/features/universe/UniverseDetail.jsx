import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { openModal } from '../../../store/slices/modalSlice';
import { api, endpoints } from '../../../utils/api';
import Button from '../../common/Button';
import Spinner from '../../common/Spinner';
import './Universe.css';

function UniverseDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [universe, setUniverse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUniverse = async () => {
      try {
        setLoading(true);
        const response = await api.get(endpoints.universes.detail(id));
        setUniverse(response);
      } catch (error) {
        console.error('Failed to fetch universe:', error);
        setError(
          error.response?.data?.message || 'Failed to load universe details'
        );
        dispatch(
          openModal({
            title: 'Error',
            content: 'Failed to load universe details. Please try again.',
            severity: 'error',
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUniverse();
  }, [id, dispatch]);

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
            <Button variant="secondary" onClick={() => {}}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => {}}>
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
    </div>
  );
}

export default UniverseDetail;

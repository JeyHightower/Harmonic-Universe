import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { openModal } from '../../../store/slices/modalSlice';
import { api } from '../../../utils/api';
import Button from '../../common/Button';
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
        const response = await api.get(`/universes/${id}`);
        setUniverse(response.data);
      } catch (error) {
        setError(error.message);
        dispatch(
          openModal({
            title: 'Error',
            content: 'Failed to load universe details. Please try again.',
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
        <div className="universe-loading">Loading universe details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="universe-container">
        <div className="universe-error">
          {error}
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!universe) {
    return (
      <div className="universe-container">
        <div className="universe-error">Universe not found</div>
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
            <p>{new Date(universe.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="universe-detail-field">
            <h2>Last Updated</h2>
            <p>{new Date(universe.updatedAt).toLocaleDateString()}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default UniverseDetail;

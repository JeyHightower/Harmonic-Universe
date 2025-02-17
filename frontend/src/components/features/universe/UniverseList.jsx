import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchUniversesFailure,
  fetchUniversesStart,
  fetchUniversesSuccess,
} from '../../../store/slices/universeSlice';
import { api } from '../../../utils/api';
import Button from '../../common/Button';
import './Universe.css';

function UniverseList() {
  const dispatch = useDispatch();
  const { universes, loading, error } = useSelector(state => state.universe);

  useEffect(() => {
    const fetchUniverses = async () => {
      try {
        dispatch(fetchUniversesStart());
        const response = await api.get('/universes');
        dispatch(fetchUniversesSuccess(response.data));
      } catch (error) {
        dispatch(fetchUniversesFailure(error.message));
      }
    };

    fetchUniverses();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="universe-container">
        <div className="universe-loading">Loading universes...</div>
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

  return (
    <div className="universe-container">
      <header className="universe-header">
        <h1>Your Universes</h1>
        <Button as={Link} to="/universes/create">
          Create Universe
        </Button>
      </header>

      {universes.length === 0 ? (
        <div className="universe-empty">
          <p>You haven't created any universes yet.</p>
          <Button as={Link} to="/universes/create">
            Create Your First Universe
          </Button>
        </div>
      ) : (
        <div className="universe-grid">
          {universes.map(universe => (
            <Link
              key={universe.id}
              to={`/universes/${universe.id}`}
              className="universe-card"
            >
              <h3>{universe.name}</h3>
              <p>{universe.description}</p>
              <div className="universe-card-footer">
                <span>
                  Created: {new Date(universe.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default UniverseList;

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
import './Dashboard.css';

function Dashboard() {
  const dispatch = useDispatch();
  const { universes, loading, error } = useSelector(state => state.universe);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchUniverses = async () => {
      try {
        dispatch(fetchUniversesStart());
        const response = await api.get('/universes');
        dispatch(fetchUniversesSuccess(response));
      } catch (error) {
        dispatch(fetchUniversesFailure(error.message));
      }
    };

    fetchUniverses();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          {error}
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome, {user?.username}</h1>
        <Button as={Link} to="/universes/create">
          Create Universe
        </Button>
      </header>

      <section className="dashboard-section">
        <h2>Your Universes</h2>
        {universes.length === 0 ? (
          <div className="dashboard-empty">
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
      </section>
    </div>
  );
}

export default Dashboard;

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../../components/common/Button.jsx';
import Spinner from '../../../components/common/Spinner.jsx';
import apiClient from '../../../services/api.adapter';
import { fetchUniverseById } from '../../../store/thunks/universeThunks.mjs';
import '../styles/Storyboard.css';

const StoryboardList = () => {
  const { universeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [storyboards, setStoryboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStoryboard, setNewStoryboard] = useState({
    name: '',
    description: '',
  });

  const universe = useSelector((state) => state.universes.currentUniverse);

  // Fetch universe if not already loaded
  useEffect(() => {
    if (!universe || universe.id !== universeId) {
      dispatch(fetchUniverseById(universeId));
    }
  }, [dispatch, universe, universeId]);

  // Fetch storyboards for this universe
  useEffect(() => {
    const fetchStoryboards = async () => {
      try {
        setLoading(true);

        // Check if the API endpoints are available
        if (!apiClient.endpoints.storyboards) {
          console.error('Storyboard endpoints not available');
          setError('Storyboard feature is not available yet. Please check back later.');
          setStoryboards([]);
          setLoading(false);
          return;
        }

        const response = await apiClient.get(apiClient.endpoints.storyboards.list(universeId));
        setStoryboards(response.storyboards || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching storyboards:', err);

        // Handle 404 errors (endpoint not found)
        if (err.response && err.response.status === 404) {
          setError('Storyboard feature is not available yet. Please check back later.');
        } else {
          setError('Failed to load storyboards. Please try again.');
        }

        // Set empty array to prevent null reference errors
        setStoryboards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStoryboards();
  }, [universeId]);

  const handleCreateStoryboard = async (e) => {
    e.preventDefault();

    if (!newStoryboard.name.trim()) {
      setError('Storyboard name is required');
      return;
    }

    try {
      setLoading(true);

      // Check if the API endpoints are available
      if (!apiClient.endpoints.storyboards || !apiClient.endpoints.storyboards.create) {
        setError('Storyboard creation is not available yet. Please check back later.');
        setLoading(false);
        return;
      }

      const response = await apiClient.post(
        apiClient.endpoints.storyboards.create(universeId),
        newStoryboard
      );

      // Add new storyboard to the list
      setStoryboards([...storyboards, response]);

      // Reset form
      setNewStoryboard({ name: '', description: '' });
      setShowCreateForm(false);
      setError(null);
    } catch (err) {
      console.error('Error creating storyboard:', err);

      // Handle 404 errors (endpoint not found)
      if (err.response && err.response.status === 404) {
        setError('Storyboard creation is not available yet. Please check back later.');
      } else {
        setError('Failed to create storyboard. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStoryboard = async (storyboardId) => {
    if (!window.confirm('Are you sure you want to delete this storyboard?')) {
      return;
    }

    try {
      setLoading(true);
      await apiClient.delete(apiClient.endpoints.storyboards.delete(universeId, storyboardId));

      // Remove deleted storyboard from the list
      setStoryboards(storyboards.filter((sb) => sb.id !== storyboardId));
    } catch (err) {
      console.error('Error deleting storyboard:', err);
      setError('Failed to delete storyboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStoryboard((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading && !storyboards.length) {
    return (
      <div className="storyboard-list-container loading">
        <Spinner size="large" />
        <p>Loading storyboards...</p>
      </div>
    );
  }

  return (
    <div className="storyboard-list-container">
      <div className="storyboard-list-header">
        <h1>Storyboards for {universe?.name || 'Universe'}</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} variant="primary">
          {showCreateForm ? 'Cancel' : 'Create Storyboard'}
        </Button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {showCreateForm && (
        <div className="storyboard-create-form">
          <h2>Create New Storyboard</h2>
          <form onSubmit={handleCreateStoryboard}>
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newStoryboard.name}
                onChange={handleInputChange}
                placeholder="Enter storyboard name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={newStoryboard.description}
                onChange={handleInputChange}
                placeholder="Enter storyboard description"
                rows={3}
              />
            </div>

            <div className="form-actions">
              <Button type="button" onClick={() => setShowCreateForm(false)} variant="secondary">
                Cancel
              </Button>
              <Button variant="primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Storyboard'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {storyboards.length === 0 ? (
        <div className="empty-state">
          <h2>No Storyboards Found</h2>
          <p>Create your first storyboard to start building your universe's story.</p>
          <Button onClick={() => setShowCreateForm(true)} variant="primary">
            Create Storyboard
          </Button>
        </div>
      ) : (
        <div className="storyboard-grid">
          {storyboards.map((storyboard) => (
            <div key={storyboard.id} className="storyboard-card">
              <h3>{storyboard.name}</h3>
              <p>{storyboard.description || 'No description'}</p>

              <div className="storyboard-card-footer">
                <span>Created: {new Date(storyboard.created_at).toLocaleDateString()}</span>
              </div>

              <div className="storyboard-card-actions">
                <Button
                  onClick={() => navigate(`/universes/${universeId}/storyboards/${storyboard.id}`)}
                  variant="primary"
                  size="small"
                >
                  Open
                </Button>
                <Button
                  onClick={() =>
                    navigate(`/universes/${universeId}/storyboards/${storyboard.id}/edit`)
                  }
                  variant="secondary"
                  size="small"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDeleteStoryboard(storyboard.id)}
                  variant="danger"
                  size="small"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoryboardList;

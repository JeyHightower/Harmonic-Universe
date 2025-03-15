import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Spinner from '../components/Spinner.jsx';
import { fetchUniverseById } from '../store/universeThunks.js';
import '../styles/Storyboard.css';
import { api, endpoints } from '../utils/api.js';

const StoryboardEditor = () => {
  const { universeId, storyboardId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const canvasRef = useRef(null);

  const [storyboard, setStoryboard] = useState(null);
  const [storyPoints, setStoryPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPoint, setDraggedPoint] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [showPointForm, setShowPointForm] = useState(false);
  const [newPoint, setNewPoint] = useState({
    title: '',
    content: '',
    position_x: 0,
    position_y: 0,
  });

  const universe = useSelector(state => state.universe.currentUniverse);

  // Fetch universe if not already loaded
  useEffect(() => {
    if (!universe || universe.id !== universeId) {
      dispatch(fetchUniverseById(universeId));
    }
  }, [dispatch, universe, universeId]);

  // Fetch storyboard and its story points
  useEffect(() => {
    const fetchStoryboardData = async () => {
      try {
        setLoading(true);

        // Check if the API endpoints are available
        if (!endpoints.storyboards) {
          console.error('Storyboard endpoints not available');
          setError(
            'Storyboard feature is not available yet. Please check back later.'
          );
          setLoading(false);
          return;
        }

        // Fetch storyboard details
        const storyboardResponse = await api.get(
          endpoints.storyboards.get(universeId, storyboardId)
        );
        setStoryboard(storyboardResponse);

        // Fetch story points
        const pointsResponse = await api.get(
          endpoints.storyboards.points.list(universeId, storyboardId)
        );
        setStoryPoints(pointsResponse.story_points || []);

        setError(null);
      } catch (err) {
        console.error('Error fetching storyboard data:', err);

        // Handle 404 errors (endpoint not found)
        if (err.response && err.response.status === 404) {
          setError(
            'Storyboard feature is not available yet. Please check back later.'
          );
        } else {
          setError('Failed to load storyboard. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStoryboardData();
  }, [universeId, storyboardId]);

  const handleCanvasClick = e => {
    if (isDragging) return;

    // Get canvas-relative coordinates
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    // Deselect any selected point
    setSelectedPoint(null);

    // Set position for new point
    setNewPoint(prev => ({
      ...prev,
      position_x: x,
      position_y: y,
    }));

    setShowPointForm(true);
  };

  const handlePointMouseDown = (e, point) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedPoint(point);
    setSelectedPoint(point);
  };

  const handleMouseMove = e => {
    if (!isDragging || !draggedPoint) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    // Update the dragged point's position
    setStoryPoints(points =>
      points.map(p =>
        p.id === draggedPoint.id ? { ...p, position_x: x, position_y: y } : p
      )
    );
  };

  const handleMouseUp = async () => {
    if (isDragging && draggedPoint) {
      try {
        // Get the updated point
        const updatedPoint = storyPoints.find(p => p.id === draggedPoint.id);

        // Save the new position to the backend
        await api.put(
          endpoints.storyboards.points.update(
            universeId,
            storyboardId,
            draggedPoint.id
          ),
          {
            position_x: updatedPoint.position_x,
            position_y: updatedPoint.position_y,
          }
        );
      } catch (err) {
        console.error('Error updating point position:', err);
        setError('Failed to update point position. Please try again.');
      }
    }

    setIsDragging(false);
    setDraggedPoint(null);
  };

  const handleCreatePoint = async e => {
    e.preventDefault();

    if (!newPoint.title.trim()) {
      setError('Point title is required');
      return;
    }

    try {
      setLoading(true);

      // Check if the API endpoints are available
      if (
        !endpoints.storyboards ||
        !endpoints.storyboards.points ||
        !endpoints.storyboards.points.create
      ) {
        setError(
          'Story point creation is not available yet. Please check back later.'
        );
        setLoading(false);
        return;
      }

      const response = await api.post(
        endpoints.storyboards.points.create(universeId, storyboardId),
        newPoint
      );

      // Add new point to the list
      setStoryPoints([...storyPoints, response]);

      // Reset form
      setNewPoint({
        title: '',
        content: '',
        position_x: 0,
        position_y: 0,
      });
      setShowPointForm(false);
      setError(null);
    } catch (err) {
      console.error('Error creating story point:', err);

      // Handle 404 errors (endpoint not found)
      if (err.response && err.response.status === 404) {
        setError(
          'Story point creation is not available yet. Please check back later.'
        );
      } else {
        setError('Failed to create story point. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePoint = async pointId => {
    if (!window.confirm('Are you sure you want to delete this story point?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(
        endpoints.storyboards.points.delete(universeId, storyboardId, pointId)
      );

      // Remove deleted point from the list
      setStoryPoints(storyPoints.filter(p => p.id !== pointId));

      // Deselect if this was the selected point
      if (selectedPoint && selectedPoint.id === pointId) {
        setSelectedPoint(null);
      }
    } catch (err) {
      console.error('Error deleting story point:', err);
      setError('Failed to delete story point. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setNewPoint(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleSaveStoryboard = async () => {
    try {
      setLoading(true);
      await api.put(endpoints.storyboards.update(universeId, storyboardId), {
        name: storyboard.name,
        description: storyboard.description,
      });
      setError(null);
    } catch (err) {
      console.error('Error saving storyboard:', err);
      setError('Failed to save storyboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !storyboard) {
    return (
      <div className="storyboard-editor loading">
        <Spinner size="large" />
        <p>Loading storyboard editor...</p>
      </div>
    );
  }

  return (
    <div className="storyboard-editor">
      <div className="storyboard-sidebar">
        <h2>{storyboard?.name || 'Storyboard'}</h2>
        <p>{storyboard?.description || 'No description'}</p>

        <div className="sidebar-actions">
          <Button
            onClick={handleSaveStoryboard}
            variant="primary"
            disabled={loading}
          >
            Save Storyboard
          </Button>
          <Button
            onClick={() => navigate(`/universes/${universeId}/storyboards`)}
            variant="secondary"
          >
            Back to List
          </Button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {selectedPoint && (
          <div className="point-details">
            <h3>Selected Point: {selectedPoint.title}</h3>
            <p>{selectedPoint.content || 'No content'}</p>
            <div className="point-actions">
              <Button
                onClick={() => handleDeletePoint(selectedPoint.id)}
                variant="danger"
                size="small"
              >
                Delete Point
              </Button>
            </div>
          </div>
        )}
      </div>

      <div
        className="storyboard-canvas"
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {storyPoints.map(point => (
          <div
            key={point.id}
            className={`story-point ${selectedPoint?.id === point.id ? 'selected' : ''
              }`}
            style={{
              left: `${point.position_x}px`,
              top: `${point.position_y}px`,
            }}
            onMouseDown={e => handlePointMouseDown(e, point)}
            onClick={e => e.stopPropagation()}
          >
            <h4>{point.title}</h4>
          </div>
        ))}

        <div className="storyboard-toolbar">
          <Button onClick={handleZoomIn} variant="icon" title="Zoom In">
            +
          </Button>
          <Button onClick={handleZoomOut} variant="icon" title="Zoom Out">
            -
          </Button>
        </div>
      </div>

      {showPointForm && (
        <div className="point-form-overlay">
          <div className="point-form">
            <h3>Create New Story Point</h3>
            <form onSubmit={handleCreatePoint}>
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newPoint.title}
                  onChange={handleInputChange}
                  placeholder="Enter point title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="content">Content</label>
                <textarea
                  id="content"
                  name="content"
                  value={newPoint.content}
                  onChange={handleInputChange}
                  placeholder="Enter point content"
                  rows={5}
                />
              </div>

              <div className="form-actions">
                <Button
                  type="button"
                  onClick={() => setShowPointForm(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Point'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryboardEditor;

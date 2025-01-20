import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import './StoryboardPanel.css';

const StoryboardPanel = ({ initialPoints = [], onChange }) => {
  const [plotPoints, setPlotPoints] = useState(initialPoints);
  const [newPoint, setNewPoint] = useState({
    title: '',
    description: '',
    harmony: 0.5,
    timestamp: '',
  });

  useEffect(() => {
    if (onChange) {
      onChange(plotPoints);
    }
  }, [plotPoints, onChange]);

  const handleAddPoint = e => {
    e.preventDefault();
    if (!newPoint.title || !newPoint.description) return;

    setPlotPoints(prev => [...prev, { ...newPoint, id: Date.now() }]);
    setNewPoint({
      title: '',
      description: '',
      harmony: 0.5,
      timestamp: '',
    });
  };

  const handleDeletePoint = id => {
    setPlotPoints(prev => prev.filter(point => point.id !== id));
  };

  const handleEditPoint = (id, field, value) => {
    setPlotPoints(prev =>
      prev.map(point =>
        point.id === id ? { ...point, [field]: value } : point
      )
    );
  };

  return (
    <div className="storyboard-panel">
      <div className="add-point-form">
        <h3>Add Plot Point</h3>
        <form onSubmit={handleAddPoint}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={newPoint.title}
              onChange={e =>
                setNewPoint(prev => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter plot point title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={newPoint.description}
              onChange={e =>
                setNewPoint(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe the plot point"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="harmony">Harmony Value</label>
            <input
              type="range"
              id="harmony"
              min="0"
              max="1"
              step="0.01"
              value={newPoint.harmony}
              onChange={e =>
                setNewPoint(prev => ({
                  ...prev,
                  harmony: parseFloat(e.target.value),
                }))
              }
            />
            <span className="value">{newPoint.harmony}</span>
          </div>

          <div className="form-group">
            <label htmlFor="timestamp">Timestamp</label>
            <input
              type="text"
              id="timestamp"
              value={newPoint.timestamp}
              onChange={e =>
                setNewPoint(prev => ({ ...prev, timestamp: e.target.value }))
              }
              placeholder="e.g., 00:00 or Chapter 1"
            />
          </div>

          <button type="submit" className="add-button">
            Add Plot Point
          </button>
        </form>
      </div>

      <div className="plot-points-list">
        <h3>Plot Points</h3>
        {plotPoints.length === 0 ? (
          <p className="empty-state">No plot points added yet</p>
        ) : (
          plotPoints.map(point => (
            <div key={point.id} className="plot-point-card">
              <div className="point-header">
                <input
                  type="text"
                  value={point.title}
                  onChange={e =>
                    handleEditPoint(point.id, 'title', e.target.value)
                  }
                  className="point-title"
                />
                <button
                  onClick={() => handleDeletePoint(point.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>

              <textarea
                value={point.description}
                onChange={e =>
                  handleEditPoint(point.id, 'description', e.target.value)
                }
                className="point-description"
              />

              <div className="point-footer">
                <div className="harmony-control">
                  <label>Harmony:</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={point.harmony}
                    onChange={e =>
                      handleEditPoint(
                        point.id,
                        'harmony',
                        parseFloat(e.target.value)
                      )
                    }
                  />
                  <span className="value">{point.harmony}</span>
                </div>

                <input
                  type="text"
                  value={point.timestamp}
                  onChange={e =>
                    handleEditPoint(point.id, 'timestamp', e.target.value)
                  }
                  className="point-timestamp"
                  placeholder="Timestamp"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

StoryboardPanel.propTypes = {
  initialPoints: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      title: PropTypes.string,
      description: PropTypes.string,
      harmony: PropTypes.number,
      timestamp: PropTypes.string,
    })
  ),
  onChange: PropTypes.func,
};

export default StoryboardPanel;

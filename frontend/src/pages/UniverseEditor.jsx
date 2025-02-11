import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';

function UniverseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [universe, setUniverse] = useState(null);
  const [activeTab, setActiveTab] = useState('physics');

  useEffect(() => {
    const fetchUniverse = async () => {
      try {
        const response = await fetch(`/api/universes/${id}`);
        const data = await response.json();
        setUniverse(data);
      } catch (error) {
        console.error('Failed to fetch universe:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUniverse();
  }, [id]);

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  if (!universe) {
    return <div>Universe not found</div>;
  }

  return (
    <div className="universe-editor">
      <header className="editor-header">
        <h1>{universe.name}</h1>
        <div className="header-actions">
          <button onClick={() => navigate(`/universe/${id}/simulate`)}>
            Start Simulation
          </button>
          <button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </header>

      <nav className="editor-tabs">
        <button
          className={`tab ${activeTab === 'physics' ? 'active' : ''}`}
          onClick={() => setActiveTab('physics')}
        >
          Physics
        </button>
        <button
          className={`tab ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio')}
        >
          Audio
        </button>
        <button
          className={`tab ${activeTab === 'visualization' ? 'active' : ''}`}
          onClick={() => setActiveTab('visualization')}
        >
          Visualization
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </nav>

      <main className="editor-content">
        {activeTab === 'physics' && (
          <div className="physics-editor">
            <h2>Physics Parameters</h2>
            <div className="parameter-grid">
              <div className="parameter">
                <label>Gravity</label>
                <input type="range" min="0" max="100" />
              </div>
              <div className="parameter">
                <label>Time Scale</label>
                <input type="range" min="0" max="100" />
              </div>
              <div className="parameter">
                <label>Collision Elasticity</label>
                <input type="range" min="0" max="100" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="audio-editor">
            <h2>Audio Configuration</h2>
            <div className="parameter-grid">
              <div className="parameter">
                <label>Base Frequency</label>
                <input type="range" min="20" max="2000" />
              </div>
              <div className="parameter">
                <label>Volume</label>
                <input type="range" min="0" max="100" />
              </div>
              <div className="parameter">
                <label>Reverb</label>
                <input type="range" min="0" max="100" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'visualization' && (
          <div className="visualization-editor">
            <h2>Visualization Settings</h2>
            <div className="parameter-grid">
              <div className="parameter">
                <label>Particle Density</label>
                <input type="range" min="0" max="100" />
              </div>
              <div className="parameter">
                <label>Color Scheme</label>
                <select>
                  <option>Classic</option>
                  <option>Neon</option>
                  <option>Monochrome</option>
                </select>
              </div>
              <div className="parameter">
                <label>Effect Intensity</label>
                <input type="range" min="0" max="100" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-editor">
            <h2>Universe Settings</h2>
            <form className="settings-form">
              <div className="form-group">
                <label>Universe Name</label>
                <input type="text" value={universe.name} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={universe.description} rows="4" />
              </div>
              <div className="form-group">
                <label>Visibility</label>
                <select value={universe.visibility}>
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                </select>
              </div>
            </form>
          </div>
        )}
      </main>

      <style jsx>{`
        .universe-editor {
          padding: 2rem;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .editor-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--border-color);
        }

        .tab {
          padding: 0.75rem 1.5rem;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 1rem;
          color: var(--text-color);
          border-bottom: 2px solid transparent;
          transition: all 0.3s;
        }

        .tab:hover {
          color: var(--primary-color);
        }

        .tab.active {
          color: var(--primary-color);
          border-bottom-color: var(--primary-color);
        }

        .editor-content {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .parameter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-top: 1.5rem;
        }

        .parameter {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .parameter label {
          font-weight: 500;
        }

        .parameter input[type='range'] {
          width: 100%;
        }

        .parameter select {
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 600px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group input,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 1rem;
        }

        .form-group textarea {
          resize: vertical;
        }
      `}</style>
    </div>
  );
}

export default UniverseEditor;

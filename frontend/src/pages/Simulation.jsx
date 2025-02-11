import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';

function Simulation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [universe, setUniverse] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeScale, setTimeScale] = useState(1);

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

  useEffect(() => {
    if (!universe) return;

    // Initialize WebGL context
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error('WebGL2 not supported');
      return;
    }

    // Initialize Audio Context
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();

    // Cleanup function
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [universe]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying && audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    // Reset simulation state
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  if (!universe) {
    return <div>Universe not found</div>;
  }

  return (
    <div className="simulation">
      <header className="simulation-header">
        <h1>{universe.name} Simulation</h1>
        <div className="header-actions">
          <button onClick={() => navigate(`/universe/${id}/edit`)}>
            Edit Universe
          </button>
          <button onClick={() => navigate('/dashboard')}>
            Exit Simulation
          </button>
        </div>
      </header>

      <main className="simulation-content">
        <div className="canvas-container">
          <canvas ref={canvasRef} />
        </div>

        <div className="controls">
          <div className="playback-controls">
            <button onClick={handlePlayPause}>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button onClick={handleReset}>Reset</button>
            <div className="time-scale">
              <label>Time Scale:</label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={timeScale}
                onChange={e => setTimeScale(parseFloat(e.target.value))}
              />
              <span>{timeScale}x</span>
            </div>
          </div>

          <div className="visualization-controls">
            <div className="control-group">
              <label>Audio Volume</label>
              <input type="range" min="0" max="100" />
            </div>
            <div className="control-group">
              <label>Particle Density</label>
              <input type="range" min="0" max="100" />
            </div>
            <div className="control-group">
              <label>Effect Intensity</label>
              <input type="range" min="0" max="100" />
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .simulation {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--background-color);
        }

        .simulation-header {
          padding: 1rem 2rem;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .simulation-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 2rem;
          gap: 2rem;
        }

        .canvas-container {
          flex: 1;
          background: black;
          border-radius: 8px;
          overflow: hidden;
        }

        canvas {
          width: 100%;
          height: 100%;
        }

        .controls {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .playback-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .time-scale {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .time-scale input {
          width: 150px;
        }

        .visualization-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .control-group label {
          font-weight: 500;
        }

        .control-group input {
          width: 100%;
        }
      `}</style>
    </div>
  );
}

export default Simulation;

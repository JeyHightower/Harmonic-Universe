import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import UniverseCard from '../components/universe/UniverseCard';
import { universeService } from '../services/universe';
import { openModal } from '../store/slices/modalSlice';

function CreateUniverseForm({ onSubmit }) {
  const handleSubmit = e => {
    e.preventDefault();
    const formData = new FormData(e.target);
    onSubmit({
      name: formData.get('name'),
      description: formData.get('description'),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Universe Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          required
          placeholder="Enter universe name"
        />
      </div>
      <div>
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          name="description"
          rows="3"
          placeholder="Describe your universe"
        />
      </div>
      <button type="submit">Create Universe</button>
    </form>
  );
}

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [universes, setUniverses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUniverses = async () => {
      try {
        const data = await universeService.getAll();
        setUniverses(data);
      } catch (error) {
        console.error('Failed to fetch universes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUniverses();
  }, []);

  const handleCreateUniverse = () => {
    dispatch(
      openModal({
        title: 'Create New Universe',
        content: (
          <CreateUniverseForm
            onSubmit={async data => {
              try {
                const newUniverse = await universeService.create(data);
                setUniverses(prev => [...prev, newUniverse]);
                navigate(`/universe/${newUniverse.id}/edit`);
              } catch (error) {
                console.error('Failed to create universe:', error);
              }
            }}
          />
        ),
        showCancel: true,
      })
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}!</h1>
        <button onClick={handleCreateUniverse} className="create-button">
          Create Universe
        </button>
      </div>

      <div className="dashboard-content">
        {universes.length === 0 ? (
          <div className="empty-state">
            <p>You haven't created any universes yet.</p>
            <p>Start by creating your first universe!</p>
          </div>
        ) : (
          <div className="universe-grid">
            {universes.map(universe => (
              <UniverseCard
                key={universe.id}
                universe={universe}
                onDelete={id => {
                  setUniverses(prev => prev.filter(u => u.id !== id));
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard {
          padding: 2rem;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .create-button {
          background-color: var(--primary-color);
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .create-button:hover {
          background-color: #357abd;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .universe-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .create-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;

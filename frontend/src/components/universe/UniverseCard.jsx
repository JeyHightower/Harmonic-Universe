import { useNavigate } from 'react-router-dom';
import { useModal } from '../common/Modal';

function UniverseCard({ universe }) {
  const { openModal } = useModal();
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/universe/${universe.id}/edit`);
  };

  const handleSimulate = () => {
    navigate(`/universe/${universe.id}/simulate`);
  };

  const handleDelete = () => {
    openModal(
      <div className="delete-confirmation">
        <h2>Delete Universe</h2>
        <p>Are you sure you want to delete {universe.name}?</p>
        <p>This action cannot be undone.</p>
        <div className="button-group">
          <button className="cancel-button" onClick={() => closeModal()}>
            Cancel
          </button>
          <button className="delete-button" onClick={confirmDelete}>
            Delete
          </button>
        </div>
      </div>
    );
  };

  const confirmDelete = async () => {
    try {
      await fetch(`/api/universes/${universe.id}`, {
        method: 'DELETE',
      });
      // Handle successful deletion (e.g., remove from list, show notification)
    } catch (error) {
      console.error('Failed to delete universe:', error);
    }
  };

  return (
    <div className="universe-card">
      <div className="universe-header">
        <h3>{universe.name}</h3>
        <span className="universe-date">
          Created: {new Date(universe.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="universe-body">
        <p>{universe.description}</p>
        <div className="universe-stats">
          <div className="stat">
            <span className="label">Objects:</span>
            <span className="value">{universe.objectCount}</span>
          </div>
          <div className="stat">
            <span className="label">Last Modified:</span>
            <span className="value">
              {new Date(universe.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="universe-actions">
        <button onClick={handleSimulate} className="simulate-button">
          Simulate
        </button>
        <button onClick={handleEdit} className="edit-button">
          Edit
        </button>
        <button onClick={handleDelete} className="delete-button">
          Delete
        </button>
      </div>

      <style jsx>{`
        .universe-card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .universe-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .universe-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .universe-date {
          font-size: 0.875rem;
          color: #666;
        }

        .universe-body {
          margin-bottom: 1.5rem;
        }

        .universe-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .stat {
          display: flex;
          flex-direction: column;
        }

        .label {
          font-size: 0.875rem;
          color: #666;
        }

        .value {
          font-weight: 500;
        }

        .universe-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }

        .simulate-button {
          background-color: var(--primary-color);
        }

        .edit-button {
          background-color: var(--secondary-color);
        }

        .delete-button {
          background-color: var(--error-color);
        }

        .delete-confirmation {
          text-align: center;
        }

        .button-group {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .cancel-button {
          background-color: var(--secondary-color);
        }
      `}</style>
    </div>
  );
}

export default UniverseCard;

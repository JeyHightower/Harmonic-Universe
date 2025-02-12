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
          background: var(--background-primary);
          border-radius: var(--border-radius);
          padding: 1.5rem;
          box-shadow: var(--box-shadow);
          border: 1px solid var(--border-color);
          transition: transform var(--transition-speed),
            box-shadow var(--transition-speed),
            background-color var(--transition-speed),
            border-color var(--transition-speed);
        }

        .universe-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .universe-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .universe-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          transition: color var(--transition-speed);
        }

        .universe-date {
          font-size: 0.875rem;
          color: var(--text-tertiary);
          transition: color var(--transition-speed);
        }

        .universe-body {
          margin-bottom: 1.5rem;
          color: var(--text-secondary);
          transition: color var(--transition-speed);
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
          gap: 0.25rem;
        }

        .label {
          font-size: 0.875rem;
          color: var(--text-tertiary);
          transition: color var(--transition-speed);
        }

        .value {
          font-weight: 500;
          color: var(--text-primary);
          transition: color var(--transition-speed);
        }

        .universe-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .action-button {
          padding: 0.5rem;
          border: none;
          border-radius: var(--border-radius);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-speed);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .simulate-button {
          background: linear-gradient(
            135deg,
            var(--primary-color),
            var(--secondary-color)
          );
          color: white;
        }

        .simulate-button:hover {
          transform: translateY(-1px);
          box-shadow: var(--box-shadow);
        }

        .edit-button {
          background-color: var(--background-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .edit-button:hover {
          background-color: var(--background-secondary);
        }

        .delete-button {
          background-color: var(--error-color);
          color: white;
          opacity: 0.9;
        }

        .delete-button:hover {
          opacity: 1;
          transform: translateY(-1px);
        }

        .delete-confirmation {
          text-align: center;
          color: var(--text-primary);
        }

        .delete-confirmation p {
          margin-bottom: 1.5rem;
          color: var(--text-secondary);
        }

        .button-group {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        @media (max-width: 640px) {
          .universe-actions {
            grid-template-columns: 1fr;
          }

          .action-button {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}

export default UniverseCard;

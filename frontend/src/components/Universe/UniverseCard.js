// UniverseCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { deleteUniverse } from '../../redux/slices/universeSlice';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa'; // Install react-icons if not already installed

const UniverseCard = ({ universe }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent card click when clicking delete
    if (window.confirm('Are you sure you want to delete this universe?')) {
      try {
        await dispatch(deleteUniverse(universe.id));
      } catch (error) {
        console.error('Failed to delete universe:', error);
      }
    }
  };

  return (
    <div className="universe-card" onClick={() => navigate(`/universe/${universe.id}`)}>
      <div className="universe-card-content">
        <h3>{universe.name}</h3>
        <p className="description">{universe.description}</p>

        <div className="universe-stats">
          <div className="stat-item">
            <span className="stat-label">Harmony</span>
            <div className="harmony-meter">
              <div
                className="harmony-fill"
                style={{ width: `${universe.environmentHarmony}%` }}
              />
            </div>
            <span className="stat-value">{universe.environmentHarmony}%</span>
          </div>

          {universe.gravityConstant && (
            <div className="stat-item">
              <span className="stat-label">Gravity</span>
              <span className="stat-value">{universe.gravityConstant} m/s²</span>
            </div>
          )}
        </div>

        <div className="created-at">
          Created: {new Date(universe.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="card-actions">
        <button
          className="action-btn view-btn"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/universe/${universe.id}`);
          }}
          title="View Universe"
        >
          <FaEye />
        </button>
        <button
          className="action-btn edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/universe/${universe.id}/edit`);
          }}
          title="Edit Universe"
        >
          <FaEdit />
        </button>
        <button
          className="action-btn delete-btn"
          onClick={handleDelete}
          title="Delete Universe"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

export default UniverseCard;

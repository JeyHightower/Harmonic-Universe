import React from 'react';
import Button from '../../components/common/Button';
import { useModal } from '../../contexts/ModalContext';
import { MODAL_TYPES } from '../../utils/modalRegistry';
import './UniverseInfoModal.css';

const UniverseInfoModal = ({ universe, onClose, isGlobalModal = true }) => {
  const { openModalByType } = useModal();

  if (!universe) return null;

  // Check if user has permission to modify this universe
  const canModifyUniverse = universe?.user_role === 'owner';

  const handleEdit = () => {
    if (!canModifyUniverse) return;

    // Close this modal and open the edit modal
    if (onClose) onClose();

    openModalByType(MODAL_TYPES.UNIVERSE_EDIT, {
      universeId: universe.id,
      initialData: universe,
    });
  };

  return (
    <div className="universe-info-modal">
      <div className="universe-info-section">
        <h3>Basic Information</h3>
        <div className="info-row">
          <span className="info-label">Name:</span>
          <span className="info-value">{universe.name}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Description:</span>
          <span className="info-value">{universe.description}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Visibility:</span>
          <span className="info-value">
            {universe.is_public ? 'Public' : 'Private'}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Created:</span>
          <span className="info-value">
            {new Date(universe.created_at).toLocaleString()}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Last Updated:</span>
          <span className="info-value">
            {new Date(universe.updated_at).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="universe-info-section">
        <h3>Statistics</h3>
        <div className="info-row">
          <span className="info-label">Physics Objects:</span>
          <span className="info-value">
            {universe.physics_objects_count || 'N/A'}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Scenes:</span>
          <span className="info-value">{universe.scenes_count || 'N/A'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Simulations Run:</span>
          <span className="info-value">
            {universe.simulations_count || 'N/A'}
          </span>
        </div>
      </div>

      <div className="universe-info-section">
        <h3>Physics Parameters</h3>
        {universe.physics_params ? (
          Object.entries(universe.physics_params).map(([key, value]) => (
            <div className="info-row" key={key}>
              <span className="info-label">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
              </span>
              <span className="info-value">
                {typeof value === 'object'
                  ? JSON.stringify(value)
                  : String(value)}
              </span>
            </div>
          ))
        ) : (
          <div className="info-row">
            <span className="info-value">No physics parameters defined</span>
          </div>
        )}
      </div>

      <div className="universe-info-section">
        <h3>Harmony Parameters</h3>
        {universe.harmony_params ? (
          Object.entries(universe.harmony_params).map(([key, value]) => (
            <div className="info-row" key={key}>
              <span className="info-label">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
              </span>
              <span className="info-value">{String(value)}</span>
            </div>
          ))
        ) : (
          <div className="info-row">
            <span className="info-value">No harmony parameters defined</span>
          </div>
        )}
      </div>

      {/* Add modal footer with buttons */}
      <div className="modal-footer">
        <Button onClick={onClose}>Close</Button>
        {canModifyUniverse && (
          <Button onClick={handleEdit} variant="primary">
            Edit Universe
          </Button>
        )}
      </div>
    </div>
  );
};

export default UniverseInfoModal;

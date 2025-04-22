import PropTypes from 'prop-types';
import React from 'react';
import { Button } from '../common';

/**
 * A reusable confirmation modal for delete operations
 */
const ConfirmDeleteModal = ({
  entityType = 'item',
  entityId,
  entityName = '',
  onConfirm,
  onClose,
  isGlobalModal = false,
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(entityId);
    }
    onClose();
  };

  const displayName = entityName || `this ${entityType}`;

  return (
    <div className="confirm-delete-modal">
      <div className="modal-content-wrapper">
        <p className="delete-warning">Are you sure you want to delete {displayName}?</p>
        <p className="delete-notice">
          This action cannot be undone. All associated data will be permanently removed.
        </p>
      </div>

      <div className="modal-actions">
        <Button type="secondary" onClick={onClose} className="cancel-button">
          Cancel
        </Button>
        <Button type="danger" onClick={handleConfirm} className="confirm-button">
          Delete
        </Button>
      </div>
    </div>
  );
};

ConfirmDeleteModal.propTypes = {
  entityType: PropTypes.string,
  entityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  entityName: PropTypes.string,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  isGlobalModal: PropTypes.bool,
};

export default ConfirmDeleteModal;

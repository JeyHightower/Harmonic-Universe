import PropTypes from 'prop-types';

/**
 * Confirmation modal for yes/no decisions
 */
const ConfirmationModal = ({
  message,
  onConfirm,
  onCancel,
  confirmText = 'Yes',
  cancelText = 'No',
  confirmVariant = 'primary',
  cancelVariant = 'secondary',
  dangerMode = false,
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="confirmation-modal">
      <p className="confirmation-message">{message}</p>

      <div className="confirmation-actions">
        <button type="button" className={`btn btn-${cancelVariant}`} onClick={handleCancel}>
          {cancelText}
        </button>

        <button
          type="button"
          className={`btn btn-${confirmVariant} ${dangerMode ? 'btn-danger' : ''}`}
          onClick={handleConfirm}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmVariant: PropTypes.string,
  cancelVariant: PropTypes.string,
  dangerMode: PropTypes.bool,
};

export default ConfirmationModal;

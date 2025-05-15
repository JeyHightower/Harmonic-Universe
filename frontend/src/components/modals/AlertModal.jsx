import PropTypes from 'prop-types';

/**
 * Alert modal for displaying messages
 */
const AlertModal = ({ message, onClose }) => {
  return (
    <div className="alert-modal">
      <p className="alert-message">{message}</p>

      <div className="alert-actions">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

AlertModal.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AlertModal;

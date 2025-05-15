import PropTypes from 'prop-types';

/**
 * Form modal for forms that need to be displayed in a modal
 */
const FormModal = ({ children, onSubmit, onCancel }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="form-modal">
      <form onSubmit={handleSubmit}>
        <div className="form-content">{children}</div>

        <div className="form-actions">
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}

          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

FormModal.propTypes = {
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
};

export default FormModal;

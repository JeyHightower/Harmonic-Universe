import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../store/slices/modalSlice';
import './Modal.css';

function Modal() {
  const dispatch = useDispatch();
  const {
    isOpen,
    title,
    content,
    onConfirm,
    showCancel = true,
  } = useSelector(state => state.modal);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    dispatch(closeModal());
  };

  const handleClose = () => {
    dispatch(closeModal());
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        <div className="modal-body">{content}</div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleConfirm}>
            Confirm
          </button>
          {showCancel && (
            <button className="btn btn-secondary" onClick={handleClose}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  title: PropTypes.string,
  content: PropTypes.node,
  onConfirm: PropTypes.func,
  showCancel: PropTypes.bool,
};

export default Modal;

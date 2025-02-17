import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from '../../store/slices/authSlice';
import { closeModal } from '../../store/slices/modalSlice';
import { api, endpoints } from '../../utils/api';
import './Modal.css';

function Modal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    isOpen,
    title,
    content,
    actionType,
    showCancel = true,
  } = useSelector(state => state.modal);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (actionType === 'RETRY_DEMO_LOGIN') {
      try {
        dispatch(loginStart());
        const response = await api.post(endpoints.auth.demoLogin);

        if (response && response.user) {
          if (response.access_token) {
            localStorage.setItem('accessToken', response.access_token);
          }
          if (response.refresh_token) {
            localStorage.setItem('refreshToken', response.refresh_token);
          }

          await dispatch(loginSuccess(response.user));
          dispatch(closeModal());
          navigate('/dashboard', { replace: true });
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        dispatch(loginFailure(error.message));
      }
    }
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
            {actionType === 'RETRY_DEMO_LOGIN' ? 'Retry' : 'Confirm'}
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
  actionType: PropTypes.string,
  showCancel: PropTypes.bool,
};

export default Modal;

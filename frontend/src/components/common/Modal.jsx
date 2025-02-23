import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  clearError,
  loginFailure,
  loginStart,
  loginSuccess,
} from '../../store/slices/authSlice';
import { closeModal } from '../../store/slices/modalSlice';
import { api } from '../../utils/api';
import Button from './Button';
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
        const response = await api.post('/api/auth/demo-login');

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
    dispatch(clearError());
    dispatch(closeModal());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{title}</h2>
        <p>{content}</p>
        <div className="modal-actions">
          <Button onClick={handleConfirm} variant="primary">
            {actionType === 'RETRY_DEMO_LOGIN' ? 'Retry' : 'OK'}
          </Button>
          {showCancel && (
            <Button onClick={handleClose} variant="secondary">
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  children: PropTypes.node,
};

export default Modal;

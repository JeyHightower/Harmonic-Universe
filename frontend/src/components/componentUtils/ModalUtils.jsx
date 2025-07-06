import PropTypes from 'prop-types';
import React from 'react';
import LoginModal from '../../features/auth/modals/LoginModal';
import SignupModal from '../../features/auth/modals/SignupModal';
import HarmonyParametersModal from '../../features/harmony/modals/HarmonyParametersModal.jsx';
import { MODAL_CONFIG } from '../../utils/config';
import { ModalSystem } from '../modals';

// Network Error Modal Content Component
const NetworkErrorModalContent = ({ message, onClose }) => {
  return (
    <div className="network-error-modal">
      <p>{message || 'A network error occurred. Please check your connection and try again.'}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

NetworkErrorModalContent.propTypes = {
  message: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

// Modal Components with PropTypes
const NetworkErrorModal = ({ onClose, message }) => (
  <ModalSystem
    isOpen={true}
    onClose={onClose}
    title="Connection Error"
    size={MODAL_CONFIG.SIZES.SMALL}
    type={MODAL_CONFIG.TYPES.ALERT}
    showCloseButton={MODAL_CONFIG.DEFAULT_SETTINGS.closeOnEscape}
    data-modal-type="network-error"
  >
    <NetworkErrorModalContent message={message} onClose={onClose} />
  </ModalSystem>
);

NetworkErrorModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  message: PropTypes.string,
};

const LoginModalWrapper = (props) => (
  <ModalSystem
    isOpen={true}
    onClose={props.onClose}
    title="Login"
    size={MODAL_CONFIG.SIZES.SMALL}
    type={MODAL_CONFIG.TYPES.FORM}
    showCloseButton={MODAL_CONFIG.DEFAULT_SETTINGS.closeOnEscape}
    data-modal-type="login"
  >
    <LoginModal {...props} />
  </ModalSystem>
);

LoginModalWrapper.propTypes = {
  onClose: PropTypes.func.isRequired,
};

const SignupModalWrapper = (props) => (
  <ModalSystem
    isOpen={true}
    onClose={props.onClose}
    title="Sign Up"
    size={MODAL_CONFIG.SIZES.SMALL}
    type={MODAL_CONFIG.TYPES.FORM}
    showCloseButton={MODAL_CONFIG.DEFAULT_SETTINGS.closeOnEscape}
    data-modal-type="signup"
  >
    <SignupModal {...props} />
  </ModalSystem>
);

SignupModalWrapper.propTypes = {
  onClose: PropTypes.func.isRequired,
};

const HarmonyParametersModalWrapper = (props) => (
  <ModalSystem
    isOpen={true}
    onClose={props.onClose}
    title={props.initialData ? 'Edit Harmony Parameter' : 'Create Harmony Parameter'}
    size={MODAL_CONFIG.SIZES.MEDIUM}
    type={MODAL_CONFIG.TYPES.FORM}
    showCloseButton={MODAL_CONFIG.DEFAULT_SETTINGS.closeOnEscape}
    data-modal-type="harmony-parameters"
  >
    <HarmonyParametersModal {...props} onClose={props.onClose} />
  </ModalSystem>
);

HarmonyParametersModalWrapper.propTypes = {
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object,
};

/**
 * Helper function to get the modal component by type
 * @param {string} modalType - The type of modal to retrieve
 * @returns {React.Component} The modal component or null if not found
 */
export const getModalComponent = (modalType) => {
  // Validate modal type
  if (!Object.values(MODAL_CONFIG.TYPES).includes(modalType)) {
    console.warn(`Invalid modal type: ${modalType}`);
  }

  // Return modal components based on type
  switch (modalType) {
    case 'NETWORK_ERROR':
      return NetworkErrorModal;
    case 'LOGIN':
      return LoginModalWrapper;
    case 'SIGNUP':
      return SignupModalWrapper;
    case 'HARMONY_PARAMETERS':
      return HarmonyParametersModalWrapper;
    default:
      console.warn(`No specific modal handler for type: ${modalType}, using default wrapper`);
      return DefaultModalWrapper;
  }
};

const DefaultModalWrapper = (props) => (
  <ModalSystem
    isOpen={true}
    onClose={props.onClose}
    title={props.title || 'Modal'}
    size={props.size || MODAL_CONFIG.SIZES.MEDIUM}
    type={props.type || MODAL_CONFIG.TYPES.DEFAULT}
    showCloseButton={MODAL_CONFIG.DEFAULT_SETTINGS.closeOnEscape}
    data-modal-type={props.modalType?.toLowerCase()}
  >
    <div className="default-modal-content">
      {props.children || <p>Modal content not provided</p>}
    </div>
  </ModalSystem>
);

DefaultModalWrapper.propTypes = {
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  size: PropTypes.string,
  type: PropTypes.string,
  modalType: PropTypes.string,
  children: PropTypes.node,
};

/**
 * Helper function to validate modal props
 * @param {Object} props - The modal props to validate
 * @returns {boolean} Whether the props are valid
 */
export const validateModalProps = (props) => {
  if (!props) {
    console.error('Modal props are required');
    return false;
  }

  if (props.type && !Object.values(MODAL_CONFIG.TYPES).includes(props.type)) {
    console.error(`Invalid modal type: ${props.type}`);
    return false;
  }

  if (props.size && !Object.values(MODAL_CONFIG.SIZES).includes(props.size)) {
    console.error(`Invalid modal size: ${props.size}`);
    return false;
  }

  if (props.animation && !Object.values(MODAL_CONFIG.ANIMATIONS).includes(props.animation)) {
    console.error(`Invalid modal animation: ${props.animation}`);
    return false;
  }

  if (props.position && !Object.values(MODAL_CONFIG.POSITIONS).includes(props.position)) {
    console.error(`Invalid modal position: ${props.position}`);
    return false;
  }

  return true;
};

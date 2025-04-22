import React from 'react';
import { ModalSystem } from '../modals';
import { MODAL_CONFIG } from '../../utils/config';
import AlertModal from '../modals/AlertModal';
import ConfirmationModal from '../modals/ConfirmationModal';
import FormModal from '../modals/FormModal';
import LoginModal from '../auth/LoginModal';
import SignupModal from '../auth/SignupModal';
import HarmonyParametersModal from '../harmony/HarmonyParametersModal';

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

  // Import modal components based on type
  switch (modalType) {
    case 'NETWORK_ERROR':
      return (props) => {
        return (
          <ModalSystem
            isOpen={true}
            onClose={props.onClose}
            title="Connection Error"
            size={MODAL_CONFIG.SIZES.SMALL}
            type={MODAL_CONFIG.TYPES.ALERT}
            showCloseButton={MODAL_CONFIG.DEFAULT_SETTINGS.closeOnEscape}
            data-modal-type="network-error"
          >
            <NetworkErrorModalContent message={props.message} onClose={props.onClose} />
          </ModalSystem>
        );
      };

    case 'LOGIN':
      return (props) => {
        return (
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
      };

    case 'SIGNUP':
      return (props) => {
        return (
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
      };

    case 'HARMONY_PARAMETERS':
      return (props) => {
        return (
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
      };

    default:
      console.warn(`No specific modal handler for type: ${modalType}, using default wrapper`);
      return (props) => (
        <ModalSystem
          isOpen={true}
          onClose={props.onClose}
          title={props.title || 'Modal'}
          size={props.size || MODAL_CONFIG.SIZES.MEDIUM}
          type={props.type || MODAL_CONFIG.TYPES.DEFAULT}
          showCloseButton={MODAL_CONFIG.DEFAULT_SETTINGS.closeOnEscape}
          data-modal-type={modalType.toLowerCase()}
        >
          <div className="default-modal-content">
            {props.children || <p>Modal content not provided</p>}
          </div>
        </ModalSystem>
      );
  }
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

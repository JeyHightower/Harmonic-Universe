import React, { lazy, Suspense } from 'react';
import Modal from './Modal';

// Import components at the top level
import NetworkErrorModalContent from './NetworkErrorModalContent';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import HarmonyParametersModal from '../features/HarmonyParametersModal';

/**
 * Helper function to get the modal component by type
 * @param {string} modalType - The type of modal to retrieve
 * @returns {React.Component} The modal component or null if not found
 */
export const getModalComponent = (modalType) => {
  // Import modal components based on type
  switch (modalType) {
    case 'NETWORK_ERROR_MODAL':
      // Use a wrapper component that renders the content in our Modal
      return (props) => {
        return (
          <Modal
            isOpen={true}
            onClose={props.onClose}
            title="Connection Error"
            size="small"
            type="alert"
            showCloseButton={true}
            data-modal-type="network-error"
          >
            <NetworkErrorModalContent
              message={props.message}
              onClose={props.onClose}
            />
          </Modal>
        );
      };

    case 'LOGIN':
      return (props) => {
        return (
          <Modal
            isOpen={true}
            onClose={props.onClose}
            title="Login"
            size="small"
            type="form"
            showCloseButton={true}
            data-modal-type="login"
          >
            <LoginModal {...props} />
          </Modal>
        );
      };

    case 'SIGNUP':
      return (props) => {
        return (
          <Modal
            isOpen={true}
            onClose={props.onClose}
            title="Sign Up"
            size="small"
            type="form"
            showCloseButton={true}
            data-modal-type="signup"
          >
            <SignupModal {...props} />
          </Modal>
        );
      };

    case 'harmony-parameters':
      return (props) => {
        return (
          <Modal
            isOpen={true}
            onClose={props.onClose}
            title={props.initialData ? "Edit Harmony Parameter" : "Create Harmony Parameter"}
            size="medium"
            type="form"
            showCloseButton={true}
            data-modal-type="harmony-parameters"
          >
            <HarmonyParametersModal {...props} onClose={props.onClose} />
          </Modal>
        );
      };

    default:
      console.warn(`No specific modal handler for type: ${modalType}, using default wrapper`);
      return (props) => (
        <Modal
          isOpen={true}
          onClose={props.onClose}
          title={props.title || "Modal"}
          size={props.size || "medium"}
          type={props.type || "default"}
          showCloseButton={true}
          data-modal-type={modalType.toLowerCase()}
        >
          <div className="default-modal-content">
            {props.children || <p>Modal content not provided</p>}
          </div>
        </Modal>
      );
  }
};

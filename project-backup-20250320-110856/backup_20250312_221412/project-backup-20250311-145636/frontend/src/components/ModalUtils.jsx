import React from 'react';
import Modal from './Modal';

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
        const NetworkErrorModalContent = require('./NetworkErrorModalContent').default;
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
    default:
      // For now just return the base Modal - this would be extended in a real implementation
      // to return different modal components based on the type
      return Modal;
  }
};

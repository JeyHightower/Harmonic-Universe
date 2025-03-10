import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import useModal from '../../hooks/useModal';
import StableModalWrapper from './StableModalWrapper';

const GlobalModal = () => {
  const { modals, closeModal } = useModal();
  const [portalContainer, setPortalContainer] = useState(null);

  // Create a portal container if it doesn't exist
  useEffect(() => {
    let container = document.getElementById('modal-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'modal-portal';
      document.body.appendChild(container);
      console.log('Created modal portal container');
    }
    setPortalContainer(container);

    return () => {
      // Clean up the portal container when the component unmounts
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

  // If there are no modals or no portal container, don't render anything
  if (!modals.length || !portalContainer) {
    return null;
  }

  console.log(
    `Rendering ${modals.length} modals:`,
    modals.map(m => m.id)
  );

  // Render each modal in the portal
  return createPortal(
    <>
      {modals.map(modal => {
        const { id, component: Component, props, modalProps = {} } = modal;

        if (!Component) {
          console.error(`No component found for modal with id ${id}`);
          return null;
        }

        const handleClose = () => {
          console.log(`Closing modal with id ${id}`);
          closeModal(id);
        };

        // Add additional debugging
        console.log(`Rendering modal ${id}:`, {
          component: Component,
          props,
          modalProps,
          modalType: modal.modalType,
        });

        return (
          <StableModalWrapper
            key={id}
            id={id}
            Component={Component}
            props={{ ...props, onClose: handleClose }}
            modalProps={{ ...modalProps, onClose: handleClose }}
            onClose={handleClose}
            data-modal-type={modal.modalType}
          />
        );
      })}
    </>,
    portalContainer
  );
};

export default GlobalModal;

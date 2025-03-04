import PropTypes from 'prop-types';
import React, { memo, useEffect, useState } from 'react';

// This component ensures that modal instances remain stable
// and don't re-render unnecessarily
const StableModalWrapper = memo(
  ({ id, Component, props, modalProps, onClose, ...restProps }) => {
    const [error, setError] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      console.log(`StableModalWrapper for modal ${id} mounted`, {
        Component,
        props,
        modalProps,
      });
      setMounted(true);

      return () => {
        console.log(`StableModalWrapper for modal ${id} unmounting`);
      };
    }, [id, Component, props, modalProps]);

    // Handle errors in modal rendering
    if (error) {
      return (
        <div className="modal-error">
          <h3>Error Rendering Modal</h3>
          <p>{error.message}</p>
          <button onClick={onClose}>Close</button>
        </div>
      );
    }

    // Render the modal component with error boundary
    try {
      // Check if Component is valid
      if (!Component) {
        console.error(`No component provided for modal ${id}`);
        return (
          <div className="modal-error">
            <h3>Error Rendering Modal</h3>
            <p>No component provided for this modal.</p>
            <button onClick={onClose}>Close</button>
          </div>
        );
      }

      return (
        <div
          className="modal-wrapper"
          data-modal-id={id}
          data-modal-type={props?.modalType || restProps['data-modal-type']}
        >
          {mounted && <Component {...props} modalProps={modalProps} />}
        </div>
      );
    } catch (err) {
      console.error(`Error rendering modal ${id}:`, err);
      setError(err);
      return null;
    }
  }
);

StableModalWrapper.propTypes = {
  id: PropTypes.string.isRequired,
  Component: PropTypes.elementType.isRequired,
  props: PropTypes.object,
  modalProps: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

StableModalWrapper.displayName = 'StableModalWrapper';

export default StableModalWrapper;

import PropTypes from 'prop-types';
import React, { memo, useEffect, useRef, useState } from 'react';

// This component ensures that modal instances remain stable
// and don't re-render unnecessarily
const StableModalWrapper = memo(
  ({ id, Component, props, modalProps, onClose, ...restProps }) => {
    const [error, setError] = useState(null);
    const [mounted, setMounted] = useState(false);
    const mountedTimeRef = useRef(Date.now());
    const stableRef = useRef({
      props,
      modalProps,
      Component
    });

    // Use stable references to prevent unnecessary re-renders
    const stableOnClose = useRef(onClose);
    stableOnClose.current = onClose;

    // Track mount state with a ref to avoid render cycles
    const isMountedRef = useRef(false);

    useEffect(() => {
      console.log(`StableModalWrapper for modal ${id} mounted`, {
        Component,
        props,
        modalProps,
      });

      // Set mounted after a short delay to ensure stability
      const mountTimer = setTimeout(() => {
        setMounted(true);
        isMountedRef.current = true;
      }, 50);

      mountedTimeRef.current = Date.now();

      // Update stable refs but don't cause re-renders
      stableRef.current = {
        props,
        modalProps,
        Component
      };

      return () => {
        clearTimeout(mountTimer);
        const unmountTime = Date.now();
        const mountDuration = unmountTime - mountedTimeRef.current;
        console.log(`StableModalWrapper for modal ${id} unmounting after ${mountDuration}ms`);
        isMountedRef.current = false;
      };
    }, [id]);  // Only depend on id to prevent unnecessary effect triggers

    // Handle errors in modal rendering
    if (error) {
      return (
        <div className="modal-error">
          <h3>Error Rendering Modal</h3>
          <p>{error.message}</p>
          <button onClick={() => stableOnClose.current()}>Close</button>
        </div>
      );
    }

    // Render the modal component with error boundary
    try {
      // Check if Component is valid
      const CurrentComponent = stableRef.current.Component || Component;

      if (!CurrentComponent) {
        console.error(`No component provided for modal ${id}`);
        return (
          <div className="modal-error">
            <h3>Error Rendering Modal</h3>
            <p>No component provided for this modal.</p>
            <button onClick={() => stableOnClose.current()}>Close</button>
          </div>
        );
      }

      // Extract the key prop from either modalProps or props to avoid warnings
      const currentProps = stableRef.current.props || props || {};
      const currentModalProps = stableRef.current.modalProps || modalProps || {};

      const { key: propsKey, ...propsWithoutKey } = currentProps;
      const { key: modalPropsKey, ...modalPropsWithoutKey } = currentModalProps;

      // Use a stable container that won't unmount
      return (
        <div
          className="modal-wrapper"
          data-modal-id={id}
          data-modal-type={currentProps?.modalType || restProps['data-modal-type']}
          style={{
            position: 'relative',
            zIndex: 1100,
            pointerEvents: 'auto'
          }}
        >
          {(mounted || isMountedRef.current) && (
            <CurrentComponent
              {...propsWithoutKey}
              onClose={() => {
                console.log(`StableModalWrapper: calling onClose for modal ${id}`);
                if (stableOnClose.current) {
                  stableOnClose.current();
                }
              }}
              isOpen={true}
              preventBackdropClick={true}
              modalProps={modalPropsWithoutKey}
              _uniqueModalId={id}
              _stableWrapperMountTime={mountedTimeRef.current}
            />
          )}
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

import PropTypes from 'prop-types';
import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

/**
 * Creates a portal for rendering modal content
 * This component ensures the portal element is properly created and managed
 */
const ModalPortal = ({ children, id }) => {
  // Generate unique ID if none provided
  const portalId = useMemo(
    () => id || `modal-portal-${Math.random().toString(36).substr(2, 9)}`,
    [id]
  );

  // Ensure portal root element exists
  useEffect(() => {
    let portalRoot = document.getElementById('portal-root');

    // Create portal root if it doesn't exist
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = 'portal-root';
      document.body.appendChild(portalRoot);
    }

    // Set critical styles
    portalRoot.style.position = 'fixed';
    portalRoot.style.top = '0';
    portalRoot.style.left = '0';
    portalRoot.style.width = '100%';
    portalRoot.style.height = '100%';
    portalRoot.style.zIndex = '1040';
    portalRoot.style.pointerEvents = 'none';

    // Cleanup function - no need to remove portal root on unmount
    // as other modals may still be using it
    return () => {};
  }, []);

  // Create/get the element for this specific modal
  useEffect(() => {
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return;

    // Look for existing portal element for this modal
    let portalElement = document.getElementById(portalId);

    // Create it if it doesn't exist
    if (!portalElement) {
      portalElement = document.createElement('div');
      portalElement.id = portalId;
      portalElement.className = 'modal-portal';
      portalElement.style.pointerEvents = 'auto';
      portalRoot.appendChild(portalElement);
    }

    // Clean up this specific portal element on unmount
    return () => {
      if (portalElement && portalElement.parentElement) {
        portalElement.parentElement.removeChild(portalElement);
      }
    };
  }, [portalId]);

  // Render children into the portal
  return createPortal(
    children,
    document.getElementById(portalId) || document.getElementById('portal-root') || document.body
  );
};

ModalPortal.propTypes = {
  children: PropTypes.node.isRequired,
  id: PropTypes.string,
};

export default ModalPortal;

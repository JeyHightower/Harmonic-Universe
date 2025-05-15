/**
 * Utility functions for the modal system
 */
import { resetModalState } from '../store/slices/modalSlice';
import store from '../store/store.mjs';

/**
 * Reset the entire modal system
 * This cleans up any lingering portals and resets body styles
 */
export const resetModalSystem = () => {
  try {
    // Clear any stuck transition timeouts
    if (window.__modalTransitionTimeouts) {
      window.__modalTransitionTimeouts.forEach((id) => clearTimeout(id));
      window.__modalTransitionTimeouts = [];
    }

    // Clean up any portal elements
    const portalRoot = document.getElementById('portal-root');
    if (portalRoot) {
      // Remove all children
      while (portalRoot.firstChild) {
        portalRoot.removeChild(portalRoot.firstChild);
      }
    }

    // If using Redux, dispatch reset action
    if (window.__REDUX_STORE) {
      const store = window.__REDUX_STORE;
      if (store && typeof store.dispatch === 'function') {
        // Check if resetModalState action is available
        if (typeof resetModalState === 'function') {
          store.dispatch(resetModalState());
        }
      }
    }

    // Reset body styles
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    document.body.classList.remove('modal-open');

    return true;
  } catch (error) {
    console.error('Error resetting modal system:', error);
    return false;
  }
};

/**
 * Debug function to log the current state of all modals and portals
 */
export const debugModalSystem = () => {
  // Check for portal elements
  const portalRoot = document.getElementById('portal-root');
  const portalContainers = portalRoot ? Array.from(portalRoot.children) : [];

  // Check for modal elements
  const antModals = document.querySelectorAll('.ant-modal');
  const modalOverlays = document.querySelectorAll('.modal-overlay');

  // Check body styles
  const bodyStyles = {
    hasModalOpenClass: document.body.classList.contains('modal-open'),
    position: document.body.style.position,
    top: document.body.style.top,
    width: document.body.style.width,
    overflow: document.body.style.overflow,
  };

  console.log('Modal System Debug:', {
    portalRoot: !!portalRoot,
    portalContainers: portalContainers.map((c) => c.id),
    antModals: antModals.length,
    modalOverlays: modalOverlays.length,
    bodyStyles,
    reduxState: store.getState().modal,
  });

  return {
    portalRoot: !!portalRoot,
    portalContainers: portalContainers.length,
    antModals: antModals.length,
    modalOverlays: modalOverlays.length,
    bodyStyles,
  };
};

/**
 * Utility to fix z-index for any modals that might have the wrong z-index
 */
export const fixModalZIndex = () => {
  try {
    // Ensure portal root has proper z-index
    const portalRoot = document.getElementById('portal-root');
    if (portalRoot) {
      portalRoot.style.zIndex = '1040';
    }

    // Fix z-index for all modals
    const modals = document.querySelectorAll('.modal, [role="dialog"]');
    modals.forEach((modal, index) => {
      // Offset z-index for stacking
      const zIndex = 1050 + index;
      modal.style.zIndex = String(zIndex);

      // Find modal content and increase its z-index
      const content = modal.querySelector('.modal-content, .modal-content-wrapper');
      if (content) {
        content.style.zIndex = String(zIndex + 1);
      }
    });

    // Fix z-index for backdrops
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach((backdrop, index) => {
      backdrop.style.zIndex = String(1040 + index);
    });

    return true;
  } catch (error) {
    console.error('Error fixing modal z-index:', error);
    return false;
  }
};

/**
 * Debug helper to force all modals to be visible
 * This is useful when modals are rendered but not visible
 */
export const forceShowAllModals = () => {
  try {
    console.log('Forcing all modals to be visible');

    // Find all modal elements
    const modalElements = document.querySelectorAll('.modal, [role="dialog"]');
    console.log(`Found ${modalElements.length} modal elements`);

    if (modalElements.length === 0) {
      // Check for portals and other containers
      const portals = document.querySelectorAll('.modal-portal, .portal');
      console.log(`Found ${portals.length} portal elements`);

      // Try to find hidden modals
      const hiddenModals = document.querySelectorAll('[class*="modal"]');
      console.log(`Found ${hiddenModals.length} elements with 'modal' in class name`);

      // Add all these to our list to force show
      const elementsToShow = [...portals, ...hiddenModals];

      elementsToShow.forEach((el, index) => {
        console.log(`Forcing element ${index} to be visible:`, el);
        el.style.display = 'block';
        el.style.visibility = 'visible';
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
        el.style.zIndex = String(9000 + index); // Very high z-index
      });

      return elementsToShow.length > 0;
    }

    // Force show all modals
    modalElements.forEach((modal, index) => {
      console.log(`Forcing modal ${index} to be visible:`, modal);

      // Apply extreme styling to ensure visibility
      modal.style.display = 'block !important';
      modal.style.visibility = 'visible !important';
      modal.style.opacity = '1 !important';
      modal.style.position = 'fixed !important';
      modal.style.pointerEvents = 'auto !important';
      modal.style.zIndex = String(9000 + index); // Very high z-index

      // Find backdrop and make it visible too
      const backdrop =
        modal.closest('.modal-backdrop') || modal.parentElement?.closest('.modal-backdrop');

      if (backdrop) {
        backdrop.style.display = 'flex !important';
        backdrop.style.visibility = 'visible !important';
        backdrop.style.opacity = '1 !important';
        backdrop.style.pointerEvents = 'auto !important';
        backdrop.style.zIndex = String(8999 + index);
      }

      // Make all content visible
      const content = modal.querySelectorAll('*');
      content.forEach((el) => {
        el.style.visibility = 'visible';
        el.style.display = el.tagName.toLowerCase() === 'div' ? 'block' : '';
      });
    });

    return modalElements.length > 0;
  } catch (error) {
    console.error('Error forcing modals to be visible:', error);
    return false;
  }
};

// Add a global accessor for debugging
if (typeof window !== 'undefined') {
  window.__modalUtils = {
    resetModalSystem,
    fixModalZIndex,
    forceShowAllModals,
  };

  // Add a keyboard shortcut for forcing modals: Alt+Shift+M
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && e.key === 'M') {
      console.log('Modal debug shortcut detected, forcing all modals to show');
      forceShowAllModals();
    }
  });
}

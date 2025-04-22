/**
 * Utility functions for the modal system
 */
import { resetModalState } from '../store/slices/modalSlice';
import store from '../store/store.mjs';
import { cleanupAllPortals } from './portalUtils';

/**
 * Reset the entire modal system
 * This cleans up any lingering portals and resets body styles
 */
export const resetModalSystem = () => {
  // Dispatch actions to reset modal state
  store.dispatch(resetModalState());

  // Clean up all portal containers
  cleanupAllPortals();

  // Reset body styles that might have been set by modals
  document.body.classList.remove('modal-open');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.overflow = '';

  console.log('Modal system reset complete');
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
    portalContainers: portalContainers.map(c => c.id),
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
  // Set correct z-index on portal root
  const portalRoot = document.getElementById('portal-root');
  if (portalRoot) {
    portalRoot.style.zIndex = '1050';
  }

  // Fix ant-modal z-index
  const antModals = document.querySelectorAll('.ant-modal');
  antModals.forEach(modal => {
    modal.style.zIndex = '1050';
  });

  // Fix ant-modal-root z-index
  const antModalRoots = document.querySelectorAll('.ant-modal-root');
  antModalRoots.forEach(root => {
    root.style.zIndex = '1050';
  });

  // Fix ant-modal-mask z-index
  const antModalMasks = document.querySelectorAll('.ant-modal-mask');
  antModalMasks.forEach(mask => {
    mask.style.zIndex = '1050';
  });

  // Fix modal-overlay z-index
  const modalOverlays = document.querySelectorAll('.modal-overlay');
  modalOverlays.forEach(overlay => {
    overlay.style.zIndex = '1050';
  });

  console.log('Modal z-index fixed');
};

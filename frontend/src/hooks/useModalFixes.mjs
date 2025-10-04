/**
 * useModalFixes.mjs - Custom React hook for fixing common modal issues.
 * Handles z-index stacking, body overflow, escape key closing, and focus trapping.
 *
 * @module useModalFixes
 * @exports {function} useModalFixes
 *
 * @description
 * This hook provides utilities to ensure modals work reliably in your app.
 * - Z-Index: Dynamically increments for nested modals.
 * - Overflow: Locks body scroll when open.
 * - Escape Key: Closes modal via callback.
 * - Focus Trap: Keeps focus inside modal (optional for accessibility).
 *
 * @example
 * import { useModalFixes } from './hooks';
 *
 * function MyModalComponent() {
 *   const { fixModals, openModal, closeModal } = useModalFixes({
 *     zIndexBase: 9999,
 *     onEscapeKey: () => closeModal(),
 *     enableFocusTrap: true
 *   });
 *
 *   useEffect(() => {
 *     fixModals();
 *     openModal();
 *     return () => closeModal();  // Cleanup
 *   }, []);
 *
 *   return <div className="modal" tabIndex="-1">Modal Content</div>;
 * }
 */

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Default options for the hook.
 */
const DEFAULT_OPTIONS = {
  zIndexBase: 9999,        // Starting z-index for modals
  enableFocusTrap: true,   // Trap focus within modal (accessibility)
  onEscapeKey: null,       // Callback for Escape key press
  modalSelector: '.modal', // CSS selector for modal elements (adjust if needed)
};

/**
 * Custom hook: useModalFixes
 *
 * @param {Object} [options] - Configuration options.
 * @param {number} [options.zIndexBase=9999] - Base z-index for stacking.
 * @param {boolean} [options.enableFocusTrap=true] - Enable focus trapping.
 * @param {Function} [options.onEscapeKey] - Handler for Escape key.
 * @param {string} [options.modalSelector='.modal'] - Selector for modal DOM elements.
 *
 * @returns {Object} Hook return value.
 * @returns {Function} fixModals - Applies all fixes (z-index, overflow, listeners).
 * @returns {Function} openModal - Opens modal (adds body class, sets z-index).
 * @returns {Function} closeModal - Closes modal (removes classes, cleans up).
 * @returns {boolean} isModalOpen - Tracks if a modal is currently open.
 */
export function useModalFixes(options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const modalRef = useRef(null);  // Ref to modal element (pass from component if needed)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalStackRef = useRef([]);  // Track nested modals for z-index

  // Apply z-index fix: Increment for each modal in stack
  const applyZIndexFix = useCallback(() => {
    if (typeof window === 'undefined') return;  // SSR safety

    const modals = document.querySelectorAll(config.modalSelector);
    let currentZ = config.zIndexBase;

    modals.forEach((modal) => {
      if (!modal.style.zIndex || parseInt(modal.style.zIndex) < currentZ) {
        modal.style.zIndex = currentZ.toString();
        currentZ += 10;  // Increment by 10 for nesting
      }
    });

    // Update stack for tracking
    modalStackRef.current = Array.from(modals).map(m => m);
  }, [config]);

  // Handle body overflow: Lock scroll when open
  const toggleBodyOverflow = useCallback((open) => {
    if (typeof window === 'undefined') return;

    const body = document.body;
    if (open) {
      // Save original scroll position and lock
      const scrollY = window.scrollY;
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.width = '100%';
      body.classList.add('overflow-hidden');
    } else {
      // Restore
      const scrollY = body.style.top;
      body.style.position = '';
      body.style.top = '';
      body.style.width = '';
      body.classList.remove('overflow-hidden');
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }, []);

  // Focus trap: Keep focus inside modal (simple implementation)
  const setupFocusTrap = useCallback((modal) => {
    if (!config.enableFocusTrap || !modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleKeyDown);
    firstFocusable?.focus();  // Auto-focus first element

    return () => modal.removeEventListener('keydown', handleKeyDown);
  }, [config.enableFocusTrap]);

  // Escape key handler
  const handleEscapeKey = useCallback((e) => {
    if (e.key === 'Escape' && config.onEscapeKey) {
      e.preventDefault();
      config.onEscapeKey();
    }
  }, [config.onEscapeKey]);

  // Main fix function: Applies all modal fixes
  const fixModals = useCallback(() => {
    if (typeof window === 'undefined') return;

    applyZIndexFix();
    toggleBodyOverflow(true);
    setIsModalOpen(true);

    // Setup listeners
    document.addEventListener('keydown', handleEscapeKey);

    // If modal ref provided, setup focus trap
    if (modalRef.current) {
      const cleanupFocus = setupFocusTrap(modalRef.current);
      return cleanupFocus;  // Return for manual cleanup if needed
    }
  }, [applyZIndexFix, toggleBodyOverflow, handleEscapeKey, setupFocusTrap]);

  // Open modal: Wrapper for fixModals + optional ref setup
  const openModal = useCallback((modalElement = null) => {
    if (modalElement) modalRef.current = modalElement;
    const cleanup = fixModals();
    return cleanup;  // Optional cleanup function
  }, [fixModals]);

  // Close modal: Cleanup everything
  const closeModal = useCallback(() => {
    if (typeof window === 'undefined') return;

    toggleBodyOverflow(false);
    setIsModalOpen(false);

    // Remove listeners
    document.removeEventListener('keydown', handleEscapeKey);

    // Reset z-index if needed (optional: remove inline styles)
    const modals = document.querySelectorAll(config.modalSelector);
    modals.forEach((modal) => {
      if (parseInt(modal.style.zIndex) >= config.zIndexBase) {
        modal.style.zIndex = '';  // Reset to CSS default
      }
    });

    modalStackRef.current = [];  // Clear stack
  }, [toggleBodyOverflow, handleEscapeKey, config]);

  // Global effect: Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (isModalOpen) {
        closeModal();
      }
    };
  }, [isModalOpen, closeModal]);

  // Expose public API
  return {
    fixModals,
    openModal,
    closeModal,
    isModalOpen,
    // Optional: Expose ref for manual assignment
    modalRef,
  };
}

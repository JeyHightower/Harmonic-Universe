/**
 * Simple utility to fix interaction issues that require hard refresh between clicks
 */

/**
 * Applies fixes to pointer events for modals and UI components
 * This is a more conservative approach that doesn't try to clone nodes or
 * aggressively manipulate the DOM, which can cause React to lose track of elements
 */
export const applyInteractionFixes = () => {
  console.log('Applying conservative interaction fixes');

  // Enable pointer events on the body
  document.body.style.pointerEvents = 'auto';

  // Fix portal root pointer events
  const portalRoot = document.getElementById('portal-root');
  if (portalRoot) {
    portalRoot.style.pointerEvents = 'auto';
  }

  // Fix modal elements without cloning or replacing them
  const modalElements = document.querySelectorAll(
    '.modal-content, .modal-overlay, .modal-backdrop, .modal-body'
  );
  modalElements.forEach((el) => {
    el.style.pointerEvents = 'auto';
  });

  // Fix any interactive elements that might have pointer-events: none
  const interactiveElements = document.querySelectorAll(
    'button, a, input, select, textarea, [role="button"]'
  );
  interactiveElements.forEach((el) => {
    el.style.pointerEvents = 'auto';
  });

  // Add debugging hook
  window.__fixInteractions = () => {
    console.log('Manually applying interaction fixes');
    applyInteractionFixes();
  };

  return true;
};

// Export the function but don't auto-apply it
// This prevents potential issues with React's rendering
export default applyInteractionFixes;

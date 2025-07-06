/**
 * Comprehensive utility to fix interaction issues for modals
 */

/**
 * Applies fixes to pointer events for modals and UI components
 * This is an aggressive approach to ensure modals work properly
 */
export const applyInteractionFixes = () => {
  console.log('Applying comprehensive modal interaction fixes');

  // Flag to track if fixes have been applied
  if (window.__interactionFixesApplied) {
    console.log('Interaction fixes already applied, refreshing...');
  }
  window.__interactionFixesApplied = true;

  // Enable pointer events on the body
  document.body.style.pointerEvents = 'auto';

  // Fix portal root pointer events - make it "none" to let clicks go through to content
  const portalRoot = document.getElementById('portal-root');
  if (portalRoot) {
    portalRoot.style.pointerEvents = 'none';

    // However, make all direct children of portal root have pointer-events: auto
    Array.from(portalRoot.children).forEach((child) => {
      child.style.pointerEvents = 'auto';
    });
  }

  // Fix for all forms, inputs and interactive elements
  const formElements = document.querySelectorAll('form, .form, .ant-form');
  formElements.forEach((form) => {
    form.style.pointerEvents = 'auto';
    form.style.zIndex = '10';
    form.style.position = 'relative';
    form.style.touchAction = 'auto';

    // Stop propagation on forms
    form.removeEventListener('click', form._clickHandler);
    form._clickHandler = (e) => {
      e.stopPropagation();
    };
    form.addEventListener('click', form._clickHandler);
  });

  // Fix all inputs directly
  const inputElements = document.querySelectorAll(
    'input, textarea, select, button, .ant-input, .ant-input-number, ' +
      '.ant-select, .ant-select-selector, .ant-checkbox, .ant-checkbox-wrapper, ' +
      '.ant-radio, .ant-radio-wrapper, .ant-switch'
  );

  inputElements.forEach((input) => {
    // Style fixes
    input.style.pointerEvents = 'auto';
    input.style.touchAction = 'auto';
    input.style.position = 'relative';
    input.style.zIndex = '15';

    // Set cursor style based on input type
    if (
      input.tagName === 'BUTTON' ||
      input.type === 'button' ||
      input.type === 'submit' ||
      input.type === 'reset'
    ) {
      input.style.cursor = 'pointer';
    } else if (input.tagName === 'SELECT') {
      input.style.cursor = 'pointer';
    } else {
      input.style.cursor = 'text';
    }

    // Remove existing handlers to prevent duplication
    input.removeEventListener('mousedown', input._mousedownHandler);
    input.removeEventListener('click', input._clickHandler);
    input.removeEventListener('focus', input._focusHandler);

    // Add aggressive click handling
    input._mousedownHandler = (e) => {
      e.stopPropagation();
      if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA' || input.tagName === 'SELECT') {
        // Only focus if not already focused, to avoid cursor position issues
        if (document.activeElement !== input) {
          input.focus();
        }
      }
    };

    input._clickHandler = (e) => {
      e.stopPropagation();
    };

    input._focusHandler = (e) => {
      e.stopPropagation();
    };

    // Add the handlers with capture phase to ensure they run first
    input.addEventListener('mousedown', input._mousedownHandler, true);
    input.addEventListener('click', input._clickHandler, true);
    input.addEventListener('focus', input._focusHandler, true);
  });

  // Fix specifically for modal containers and content
  const modalElements = document.querySelectorAll(
    '.modal-content, .modal-body, .ant-modal-content, .ant-modal-body, ' +
      '.MuiDialog-paper, .MuiDialogContent-root, .modal-container, ' +
      '.modal-inner-content, .stable-modal, .modal-interactive'
  );

  modalElements.forEach((modal) => {
    modal.style.pointerEvents = 'auto';
    modal.style.touchAction = 'auto';
    modal.style.position = 'relative';
    modal.style.zIndex = '1060';

    // Prevent clicks from propagating out of the modal
    modal.removeEventListener('click', modal._clickHandler);
    modal._clickHandler = (e) => {
      if (e.target === modal) {
        e.stopPropagation();
      }
    };
    modal.addEventListener('click', modal._clickHandler);

    // Ensure all modal content can receive clicks
    const allContent = modal.querySelectorAll('*');
    allContent.forEach((el) => {
      el.style.pointerEvents = 'auto';
    });
  });

  // Fix backdrops to prevent them from swallowing clicks meant for content
  const backdrops = document.querySelectorAll(
    '.modal-backdrop, .ant-modal-mask, .MuiBackdrop-root'
  );

  backdrops.forEach((backdrop) => {
    // Ensure backdrops have pointer-events set correctly
    backdrop.style.pointerEvents = 'auto';
  });

  // Add global handler for debugging
  window.__fixInteractions = () => {
    console.log('Manually reapplying interaction fixes');
    applyInteractionFixes();
  };

  // Add console message to help with debugging
  console.log(
    'Modal interaction fixes applied. If issues persist, call window.__fixInteractions() in the console.'
  );

  return true;
};

/**
 * Export a function to clean up the interaction fixes when needed
 */
export const cleanupInteractionFixes = () => {
  // Remove all event handlers added by applyInteractionFixes
  const elements = document.querySelectorAll(
    '*[_clickHandler], *[_mousedownHandler], *[_focusHandler]'
  );

  elements.forEach((el) => {
    if (el._clickHandler) {
      el.removeEventListener('click', el._clickHandler);
      delete el._clickHandler;
    }

    if (el._mousedownHandler) {
      el.removeEventListener('mousedown', el._mousedownHandler);
      delete el._mousedownHandler;
    }

    if (el._focusHandler) {
      el.removeEventListener('focus', el._focusHandler);
      delete el._focusHandler;
    }
  });

  window.__interactionFixesApplied = false;
  console.log('Interaction fixes cleaned up');

  return true;
};

/**
 * Apply fixes specifically to form inputs within modals
 */
export const fixModalFormInputs = () => {
  // Target inputs within modal contexts
  const modalInputs = document.querySelectorAll(
    '.modal-content input, .modal-content textarea, .modal-content select, ' +
      '.ant-modal-content input, .ant-modal-content textarea, .ant-modal-content select, ' +
      '.MuiDialog-paper input, .MuiDialog-paper textarea, .MuiDialog-paper select'
  );

  console.log(`Fixing ${modalInputs.length} modal inputs`);

  modalInputs.forEach((input) => {
    // Apply strongest possible input styling
    input.style.pointerEvents = 'auto !important';
    input.style.touchAction = 'auto !important';
    input.style.cursor =
      input.type === 'button' || input.type === 'submit' ? 'pointer !important' : 'text !important';
    input.style.zIndex = '1000 !important';
    input.style.position = 'relative !important';

    // Aggressive event handling approach
    const handleInteraction = (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Only focus if it's an input that should have focus
      if (
        (input.tagName === 'INPUT' &&
          input.type !== 'button' &&
          input.type !== 'submit' &&
          input.type !== 'reset') ||
        input.tagName === 'TEXTAREA' ||
        input.tagName === 'SELECT'
      ) {
        // Only focus if not already focused to avoid cursor issues
        if (document.activeElement !== input) {
          setTimeout(() => input.focus(), 0);
        }
      }

      return true;
    };

    // Remove previous handlers if any
    if (input._fixedHandler) {
      input.removeEventListener('mousedown', input._fixedHandler, true);
      input.removeEventListener('touchstart', input._fixedHandler, true);
      input.removeEventListener('click', input._fixedHandler, true);
    }

    // Store handler reference for cleanup
    input._fixedHandler = handleInteraction;

    // Add capturing phase handlers to catch events before they bubble
    input.addEventListener('mousedown', handleInteraction, true);
    input.addEventListener('touchstart', handleInteraction, true);
    input.addEventListener('click', handleInteraction, true);
  });

  return true;
};

// Export all utilities
export default {
  applyInteractionFixes,
  cleanupInteractionFixes,
  fixModalFormInputs,
};

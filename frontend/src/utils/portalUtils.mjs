/**
 * Ensures that the portal root element exists in the DOM.
 * If it doesn't exist, creates it and appends it to the body.
 *
 * @returns {HTMLElement} The portal root element
 */
export const ensurePortalRoot = () => {
  let portalRoot = document.getElementById('portal-root');

  if (!portalRoot) {
    console.log('Creating portal root element');
    portalRoot = document.createElement('div');
    portalRoot.id = 'portal-root';
    document.body.appendChild(portalRoot);
  }

  // Apply critical styles to ensure visibility
  portalRoot.style.position = 'fixed';
  portalRoot.style.top = '0';
  portalRoot.style.left = '0';
  portalRoot.style.width = '100%';
  portalRoot.style.height = '100%';
  portalRoot.style.zIndex = '1040'; // Base z-index for portal container
  portalRoot.style.pointerEvents = 'none'; // Allow clicks to pass through empty areas
  portalRoot.style.overflow = 'hidden';
  portalRoot.setAttribute('aria-hidden', 'false');
  portalRoot.setAttribute('data-portal', 'true');

  return portalRoot;
};

/**
 * Gets the portal root element.
 * If it doesn't exist, creates it.
 *
 * @returns {HTMLElement} The portal root element
 */
export const getPortalRoot = () => {
  return ensurePortalRoot();
};

// Helper function to detect form and interactive elements
const isInteractiveElement = (element) => {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const isFormElement =
    tagName === 'input' || tagName === 'textarea' || tagName === 'select' || tagName === 'button';

  const isButton =
    tagName === 'button' ||
    element.getAttribute('role') === 'button' ||
    element.classList.contains('btn') ||
    element.classList.contains('button') ||
    element.type === 'submit' ||
    element.type === 'button';

  const isAuthButton =
    element.classList.contains('logout-button') ||
    element.classList.contains('login-button') ||
    element.classList.contains('signup-button') ||
    element.getAttribute('data-action') === 'logout';

  return (
    isFormElement ||
    isButton ||
    isAuthButton ||
    element.closest('button, [role="button"], .btn, .button')
  );
};

// Helper function to make elements interactive
const makeElementInteractive = (element) => {
  if (!element) return;

  element.style.pointerEvents = 'auto';
  element.style.position = 'relative';
  element.style.zIndex = '10';

  const tagName = element.tagName.toLowerCase();
  if (
    tagName === 'button' ||
    element.getAttribute('role') === 'button' ||
    element.classList.contains('btn') ||
    element.classList.contains('button')
  ) {
    element.style.cursor = 'pointer';
    element.style.zIndex = '100';
  }

  // Special handling for auth buttons
  if (
    element.classList.contains('logout-button') ||
    element.classList.contains('login-button') ||
    element.classList.contains('signup-button') ||
    element.getAttribute('data-action') === 'logout'
  ) {
    element.style.zIndex = '1000';
    element.style.pointerEvents = 'auto !important';
  }

  // Make parent containers interactive too
  let parent = element.parentElement;
  let depth = 0; // Prevent infinite loops
  while (parent && depth < 10) {
    parent.style.pointerEvents = 'auto';
    parent = parent.parentElement;
    depth++;
  }
};

/**
 * Creates a new portal container within the portal root.
 * Useful for creating separate portals for different modal types.
 *
 * @param {string} id - The ID for the new portal container
 * @returns {HTMLElement} The new portal container
 */
export const createPortalContainer = (id) => {
  const portalRoot = ensurePortalRoot();
  let container = document.getElementById(id);

  if (!container) {
    container = document.createElement('div');
    container.id = id;
    container.className = 'portal-container';
    // Container MUST have pointer-events: auto to capture clicks
    container.style.pointerEvents = 'auto';
    container.style.position = 'relative';
    container.style.zIndex = '1';
    container.setAttribute('data-portal-container', 'true');

    // Improved click handler for the container with enhanced event handling
    container.addEventListener(
      'click',
      (e) => {
        // Get the actual target element
        const target = e.target;

        // Check if this is a form input or interactive element
        const isFormInput =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT';

        const isInteractiveElement =
          target.tagName === 'BUTTON' ||
          target.getAttribute('role') === 'button' ||
          target.classList.contains('btn') ||
          target.classList.contains('button') ||
          target.classList.contains('logout-button') ||
          target.classList.contains('login-button') ||
          target.classList.contains('signup-button');

        if (isFormInput) {
          // For form inputs, ensure they receive focus and prevent event bubbling
          e.stopPropagation();
          e.preventDefault();

          // Apply direct styling to ensure interactivity
          target.style.pointerEvents = 'auto';
          target.style.position = 'relative';
          target.style.zIndex = '10000';

          // Focus the input
          target.focus();

          console.log(`Form input interaction: ${target.tagName} ${target.name || target.id}`);
          return false;
        } else if (isInteractiveElement) {
          // For buttons and other interactive elements
          e.stopPropagation();

          // Apply direct styling
          target.style.pointerEvents = 'auto';
          target.style.cursor = 'pointer';
          target.style.zIndex = '10000';

          console.log(`Interactive element clicked: ${target.tagName} ${target.textContent}`);
        } else if (e.target === container) {
          // This is a backdrop click, let it propagate for backdrop close
          console.log('Backdrop click intercepted in portal container');
        } else {
          // For all other clicks inside content, stop propagation
          e.stopPropagation();
        }
      },
      true // Use capturing phase
    );

    // Add specific handlers for mousedown and focus events
    container.addEventListener(
      'mousedown',
      (e) => {
        const target = e.target;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT'
        ) {
          // Ensure clicks on form inputs work properly
          e.stopPropagation();
          setTimeout(() => target.focus(), 0);

          console.log(`Form field mousedown: ${target.tagName} ${target.name || target.id}`);
        }
      },
      true
    );

    // Add form field focus handler
    container.addEventListener(
      'focus',
      (e) => {
        const target = e.target;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT'
        ) {
          console.log(`Focus event on: ${target.tagName} ${target.name || target.id}`);

          // Ensure proper styling
          target.style.pointerEvents = 'auto';
          target.style.zIndex = '10000';
        }
      },
      true
    );

    portalRoot.appendChild(container);
    console.log(`Portal container ${id} created`);

    // Apply immediate fixes to all form elements in the container
    fixModalFormElements(container);
  }

  return container;
};

/**
 * Cleans up portal containers that are no longer needed.
 *
 * @param {string} id - The ID of the portal container to remove
 */
export const removePortalContainer = (id) => {
  const container = document.getElementById(id);
  if (container && container.parentElement) {
    console.log(`Removing portal container ${id}`);
    // Remove event listeners to prevent memory leaks
    const newContainer = container.cloneNode(true);
    if (container.parentElement) {
      container.parentElement.replaceChild(newContainer, container);
      newContainer.parentElement.removeChild(newContainer);
    }
  }
};

/**
 * Clean up all portal containers and reset the DOM state
 * Useful for complete modal system reset
 */
export const cleanupAllPortals = () => {
  try {
    const portalRoot = document.getElementById('portal-root');
    if (portalRoot) {
      // Remove all child nodes
      while (portalRoot.firstChild) {
        portalRoot.removeChild(portalRoot.firstChild);
      }

      // Reset portal root styling
      portalRoot.style.pointerEvents = 'none';

      console.log('Cleaned up all portals');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error cleaning up portals:', error);
    return false;
  }
};

/**
 * Applies fixes to form elements inside modals to make them interactive
 * This should be called when modals with forms are having click issues
 */
export const fixModalFormElements = (container = document) => {
  // Find all form elements inside modals
  const formElements = container.querySelectorAll(
    '.modal-body input, .modal-body textarea, .modal-body select, .modal-body button, ' +
      '.ant-modal-body input, .ant-modal-body textarea, .ant-modal-body select, .ant-modal-body button, ' +
      '.modal-content input, .modal-content textarea, .modal-content select, .modal-content button, ' +
      'form input, form textarea, form select, form button, ' +
      '.form-control, [role="button"], .btn, .button, ' +
      '.logout-button, .login-button, .signup-button, [data-action="logout"]'
  );

  formElements.forEach((el) => {
    // Ensure these elements can receive clicks
    el.style.pointerEvents = 'auto';
    el.style.position = 'relative';
    el.style.zIndex = '10';

    // If it's a button, make sure it's clickable
    if (
      el.tagName.toLowerCase() === 'button' ||
      el.getAttribute('role') === 'button' ||
      el.classList.contains('btn') ||
      el.classList.contains('button') ||
      el.type === 'submit' ||
      el.type === 'button'
    ) {
      el.style.cursor = 'pointer';
      el.style.zIndex = '100';
    }

    // Special handling for auth buttons
    if (
      el.classList.contains('logout-button') ||
      el.classList.contains('login-button') ||
      el.classList.contains('signup-button') ||
      el.getAttribute('data-action') === 'logout'
    ) {
      el.style.zIndex = '1000';
      el.style.pointerEvents = 'auto !important';
    }

    // Add mousedown handler to ensure focus
    const mousedownHandler = (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Make this element and its parents interactive
      makeElementInteractive(e.target);

      // Explicitly focus after a small delay
      setTimeout(() => {
        if (document.activeElement !== e.target) {
          e.target.focus();

          // Extra handling for input fields
          if (e.target.tagName.toLowerCase() === 'input') {
            const inputType = e.target.type.toLowerCase();
            if (inputType === 'text' || inputType === 'password' || inputType === 'email') {
              // For text inputs, move cursor to the end
              const val = e.target.value;
              e.target.value = '';
              e.target.value = val;
            }
          }
        }
      }, 10);
    };

    // Remove any existing handler to avoid duplicates
    el.removeEventListener('mousedown', el._mousedownHandler);
    el._mousedownHandler = mousedownHandler;
    el.addEventListener('mousedown', mousedownHandler, true);

    // Add click handler for buttons
    if (
      el.tagName.toLowerCase() === 'button' ||
      el.getAttribute('role') === 'button' ||
      el.classList.contains('btn') ||
      el.classList.contains('button') ||
      el.type === 'submit' ||
      el.type === 'button' ||
      el.classList.contains('logout-button') ||
      el.classList.contains('login-button') ||
      el.classList.contains('signup-button') ||
      el.getAttribute('data-action') === 'logout'
    ) {
      const clickHandler = (e) => {
        e.stopPropagation();
        makeElementInteractive(e.target);
      };

      el.removeEventListener('click', el._clickHandler);
      el._clickHandler = clickHandler;
      el.addEventListener('click', clickHandler, true);
    }
  });

  return formElements.length;
};

/**
 * Adds direct DOM interaction handlers to fix click and interaction issues
 * Call this in components that have interaction problems
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

  // Fix all modals in the DOM
  const modalElements = document.querySelectorAll(
    '.modal-content, .modal-body, .ant-modal-body, .modal-container, ' +
      '.modal-inner-content, .stable-modal, .modal-interactive, form'
  );

  modalElements.forEach((el) => {
    el.style.pointerEvents = 'auto';
    el.style.touchAction = 'auto';
    el.style.position = 'relative';
    el.style.zIndex = '100';

    // Prevent events from propagating outside the modal
    el.removeEventListener('click', el._clickHandler);
    el._clickHandler = (e) => {
      if (e.target === el) {
        e.stopPropagation();
      }
    };
    el.addEventListener('click', el._clickHandler, true);

    // Add direct event listeners for inputs
    const inputs = el.querySelectorAll(
      'input, textarea, select, button, [role="button"], .btn, .button'
    );
    inputs.forEach((input) => {
      input.style.pointerEvents = 'auto';
      input.style.touchAction = 'auto';
      input.style.cursor =
        input.tagName.toLowerCase() === 'button' ||
        input.type === 'button' ||
        input.type === 'submit'
          ? 'pointer'
          : 'text';
      input.style.zIndex = '10';
      input.style.position = 'relative';

      // Remove any existing handlers
      input.removeEventListener('mousedown', input._mousedownHandler);
      input.removeEventListener('click', input._clickHandler);
      input.removeEventListener('focus', input._focusHandler);

      // Add mousedown handler for focus management
      const mousedownHandler = (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Focus the element if it's a form field
        if (
          input.tagName.toLowerCase() === 'input' ||
          input.tagName.toLowerCase() === 'textarea' ||
          input.tagName.toLowerCase() === 'select'
        ) {
          if (document.activeElement !== input) {
            setTimeout(() => input.focus(), 0);
          }
        }
      };

      // Click handler to stop propagation
      const clickHandler = (e) => {
        e.stopPropagation();

        // Special handling for buttons
        if (
          input.tagName.toLowerCase() === 'button' ||
          input.type === 'button' ||
          input.type === 'submit' ||
          input.getAttribute('role') === 'button' ||
          input.classList.contains('btn') ||
          input.classList.contains('button')
        ) {
          // Let the default action happen, just stop propagation
          console.log('Button clicked:', input.textContent || input.value);
        }
      };

      // Focus handler
      const focusHandler = (e) => {
        e.stopPropagation();
      };

      input._mousedownHandler = mousedownHandler;
      input._clickHandler = clickHandler;
      input._focusHandler = focusHandler;

      input.addEventListener('mousedown', mousedownHandler, true);
      input.addEventListener('click', clickHandler, true);
      input.addEventListener('focus', focusHandler, true);

      // Also add touch events for mobile
      input.addEventListener('touchstart', mousedownHandler, true);
    });
  });

  // Fix the logout and action buttons specifically
  const actionButtons = document.querySelectorAll(
    '.logout-button, .login-button, .signup-button, .auth-button, ' +
      '.modal-footer button, .modal-actions button, .ant-modal-footer button, ' +
      '[data-action], [role="button"], .btn, .button'
  );

  actionButtons.forEach((button) => {
    button.style.pointerEvents = 'auto';
    button.style.cursor = 'pointer';
    button.style.zIndex = '100';
    button.style.position = 'relative';

    // Make sure click events work
    const clickHandler = (e) => {
      // Stop propagation but allow the default button action
      e.stopPropagation();
      console.log('Action button clicked:', button.textContent);
    };

    button.removeEventListener('click', button._clickHandler);
    button._clickHandler = clickHandler;
    button.addEventListener('click', clickHandler, true);

    // Also strengthen all parent elements
    let parent = button.parentElement;
    while (parent && parent.nodeType === Node.ELEMENT_NODE) {
      parent.style.pointerEvents = 'auto';
      parent = parent.parentElement;
    }
  });

  // Add global helper function for debugging
  window.__fixInteractions = () => {
    console.log('Manually reapplying interaction fixes');
    applyInteractionFixes();
    fixModalFormElements();
    createSpecializedHandlers();
  };

  return true;
};

/**
 * Creates specialized handlers for specific form elements that need extra attention
 * @param {Element} container - The container element to search within (defaults to document)
 */
export const createSpecializedHandlers = (container = document) => {
  // Fix logout button specifically
  const logoutButtons = container.querySelectorAll('.logout-button, [data-action="logout"]');
  logoutButtons.forEach((btn) => {
    // Apply aggressive styling
    btn.style.pointerEvents = 'auto !important';
    btn.style.cursor = 'pointer !important';
    btn.style.zIndex = '9999';

    // Add a very aggressive click handler
    const logoutHandler = (e) => {
      e.stopPropagation();
      console.log('Logout button clicked');
      // Allow the default action to proceed
      return true;
    };

    btn.removeEventListener('click', btn._logoutHandler);
    btn._logoutHandler = logoutHandler;
    btn.addEventListener('click', logoutHandler, true);
  });

  // Special fix for form inputs
  const formInputs = container.querySelectorAll(
    'input[type="text"], input[type="email"], input[type="password"], textarea'
  );
  formInputs.forEach((input) => {
    // Style fixes
    input.style.pointerEvents = 'auto';
    input.style.zIndex = '50';

    // Enhanced focus handler
    const focusHandler = (e) => {
      e.stopPropagation();
      setTimeout(() => input.focus(), 0);
    };

    input.removeEventListener('mousedown', input._focusHandler);
    input._focusHandler = focusHandler;
    input.addEventListener('mousedown', focusHandler, true);
  });

  return {
    logoutButtons: logoutButtons.length,
    formInputs: formInputs.length,
  };
};

/**
 * Export a function to clean up all interaction fixes
 */
export const cleanupInteractionFixes = () => {
  // Remove all event handlers added by applyInteractionFixes
  const elements = document.querySelectorAll(
    '*[_clickHandler], *[_mousedownHandler], *[_focusHandler], *[_logoutHandler], *[_fixedHandler]'
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

    if (el._logoutHandler) {
      el.removeEventListener('click', el._logoutHandler);
      delete el._logoutHandler;
    }

    if (el._fixedHandler) {
      el.removeEventListener('mousedown', el._fixedHandler, true);
      el.removeEventListener('touchstart', el._fixedHandler, true);
      el.removeEventListener('click', el._fixedHandler, true);
      delete el._fixedHandler;
    }
  });

  window.__interactionFixesApplied = false;
  console.log('Interaction fixes cleaned up');

  return true;
};

/**
 * EMERGENCY FIX - Force all form elements in modals to be interactive
 * This is a more aggressive approach that directly manipulates the DOM
 * Call this when other fixes aren't working
 */
export const forceModalInteractivity = () => {
  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) return false;

  // Ensure the portal has proper pointer events and visibility
  portalRoot.style.pointerEvents = 'none';

  // Process all modal portals
  const modalPortals = portalRoot.querySelectorAll('.modal-portal');
  modalPortals.forEach((portal) => {
    portal.style.pointerEvents = 'auto';

    // Apply interactivity fixes to modal dialogs
    const modalDialogs = portal.querySelectorAll('[role="dialog"]');
    modalDialogs.forEach((dialog) => {
      dialog.style.pointerEvents = 'auto';
      dialog.style.position = 'relative';
      dialog.style.zIndex = '1050';
      dialog.style.display = 'block';
      dialog.style.visibility = 'visible';
      dialog.style.opacity = '1';

      // Apply interactivity fixes to content within modals
      const modalContent = dialog.querySelector('.modal-content-wrapper');
      if (modalContent) {
        modalContent.style.pointerEvents = 'auto';
        modalContent.style.position = 'relative';
        modalContent.style.zIndex = '2';
      }

      // Ensure form elements are interactive
      applyElementModalFixes(dialog);
    });
  });

  return true;
};

/**
 * Apply necessary fixes to modal elements to ensure proper interaction
 * Enhanced with more explicit styling to guarantee visibility
 */
export const applyElementModalFixes = (element) => {
  if (!element) return false;

  // Ensure the element has proper styling for visibility and interaction
  element.style.pointerEvents = 'auto';
  element.style.zIndex = '1050';
  element.style.position = 'relative';
  element.style.display = 'block';
  element.style.visibility = 'visible';
  element.style.opacity = '1';

  // Apply fixes to all form elements to ensure they're interactive
  const formElements = element.querySelectorAll('input, button, select, textarea, a');
  formElements.forEach((el) => {
    el.style.pointerEvents = 'auto';
    el.style.position = 'relative';
    el.style.zIndex = '2';
  });

  return true;
};

/**
 * Force all modals to be visible - useful for debugging
 */
export const forceShowModals = () => {
  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) return false;

  const modals = portalRoot.querySelectorAll('.modal');
  console.log(`Found ${modals.length} modals to force show`);

  modals.forEach((modal, index) => {
    modal.style.display = 'block';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
    modal.style.zIndex = `${1050 + index}`; // Stack modals if there are multiple
    console.log(`Forced modal ${index + 1} to show`);

    // Force backdrop to show if it exists
    const backdrop = modal.closest('.modal-backdrop');
    if (backdrop) {
      backdrop.style.display = 'block';
      backdrop.style.visibility = 'visible';
      backdrop.style.opacity = '0.5';
      backdrop.style.pointerEvents = 'auto';
    }
  });

  return modals.length > 0;
};

// Add this function to the global window object for emergency fixes
if (typeof window !== 'undefined') {
  window.__fixModals = () => {
    console.log('Running emergency modal fixes');
    forceModalInteractivity();
    applyInteractionFixes();
    fixModalFormElements();
    createSpecializedHandlers();
  };
}

/**
 * Comprehensive utility function to apply all modal fixes in one go
 * Call this when opening a modal to ensure it's fully interactive
 */
export const applyModalFixes = () => {
  console.log('Applying comprehensive modal fixes');

  // First ensure portal root is set up correctly
  ensurePortalRoot();

  // Fix all form elements in modals
  fixModalFormElements();

  // Apply interaction fixes for event propagation
  applyInteractionFixes();

  // Add specialized handlers for specific elements like logout buttons
  createSpecializedHandlers();

  // Make sure the portal root has the correct pointer-events setting
  const portalRoot = document.getElementById('portal-root');
  if (portalRoot) {
    portalRoot.style.pointerEvents = 'none';

    // Direct children should have pointer-events: auto
    Array.from(portalRoot.children).forEach((child) => {
      child.style.pointerEvents = 'auto';
    });
  }

  // Force modal and dialog elements to have proper pointer events
  const modalElements = document.querySelectorAll(
    '.modal-overlay, .modal-content, .ant-modal, .ant-modal-root, .ant-modal-content, [role="dialog"], .modal-body, .modal-footer'
  );
  modalElements.forEach((element) => {
    element.style.pointerEvents = 'auto';
    element.style.zIndex = '9999';
  });

  // Fix for all modal backdrops to ensure they don't block interaction with modal content
  const backdrops = document.querySelectorAll('.modal-backdrop, .ant-modal-mask');
  backdrops.forEach((backdrop) => {
    // Allow clicking backdrop for closing, but make sure it doesn't interfere with content
    backdrop.addEventListener(
      'click',
      (e) => {
        if (e.target === backdrop) {
          // Only propagate if it's a direct click on the backdrop
          console.log('Backdrop clicked');
        } else {
          // Stop propagation for clicks on content
          e.stopPropagation();
        }
      },
      true
    );
  });

  // Super aggressive fix for form elements
  const formElements = document.querySelectorAll(
    '.modal-content input, .modal-content textarea, .modal-content select, .modal-content button, ' +
      '.modal-body input, .modal-body textarea, .modal-body select, .modal-body button, ' +
      '.ant-modal-body input, .ant-modal-body textarea, .ant-modal-body select, .ant-modal-body button, ' +
      '.universes-grid input, .universes-grid textarea, .universes-grid select, .universes-grid button, ' +
      'form input, form textarea, form select, form button, .universe-form input, .universe-form button, ' +
      '.form-control, [role="button"], .btn, .button'
  );

  formElements.forEach((el) => {
    // Make sure element is interactive
    el.style.pointerEvents = 'auto !important';
    el.style.position = 'relative';
    el.style.zIndex = '10000';
    el.style.cursor = el.tagName.toLowerCase() === 'button' ? 'pointer' : 'auto';

    // Remove existing handlers to avoid duplicates
    if (el._clickHandler) el.removeEventListener('click', el._clickHandler);
    if (el._mousedownHandler) el.removeEventListener('mousedown', el._mousedownHandler);

    // Add click handler to stop propagation
    const clickHandler = (e) => {
      e.stopPropagation();
      console.log(`${el.tagName} clicked`, el);

      // For inputs, focus them
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
        setTimeout(() => {
          if (document.activeElement !== el) {
            el.focus();
            console.log(`Focused ${el.tagName}`, el);
          }
        }, 0);
      }
    };

    // Add mousedown handler for better focus handling
    const mousedownHandler = (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();

      // For inputs, make sure they get focus
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
        setTimeout(() => {
          if (document.activeElement !== el) {
            el.focus();
          }
        }, 0);
      }
    };

    // Store handlers for future cleanup
    el._clickHandler = clickHandler;
    el._mousedownHandler = mousedownHandler;

    // Add event listeners with capture phase to ensure they run first
    el.addEventListener('click', clickHandler, true);
    el.addEventListener('mousedown', mousedownHandler, true);
  });

  // Fix for auth buttons (logout, login, signup)
  const authButtons = document.querySelectorAll(
    '.logout-button, .login-button, .signup-button, .auth-button, [data-action="logout"]'
  );
  authButtons.forEach((button) => {
    button.style.pointerEvents = 'auto';
    button.style.cursor = 'pointer';
    button.style.position = 'relative';
    button.style.zIndex = '1000';

    // Add special click handler
    const clickHandler = (e) => {
      e.stopPropagation();
      console.log('Auth button clicked:', button.textContent);
    };

    // Remove any existing handler to avoid duplicates
    button.removeEventListener('click', button._authClickHandler);
    button._authClickHandler = clickHandler;
    button.addEventListener('click', clickHandler, true);
  });

  // Add mutation observer to handle dynamically added elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        // Check if any modal elements were added
        const hasModalElements = Array.from(mutation.addedNodes).some((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            return (
              node.classList?.contains('modal-overlay') ||
              node.classList?.contains('modal-content') ||
              node.classList?.contains('ant-modal') ||
              node.querySelector('.modal-content, .modal-overlay, .ant-modal')
            );
          }
          return false;
        });

        if (hasModalElements) {
          console.log('New modal elements detected, applying fixes');
          setTimeout(() => {
            fixModalFormElements();
            applyInteractionFixes();
          }, 50);
        }
      }
    });
  });

  // Start observing the document
  observer.observe(document.body, { childList: true, subtree: true });

  return true;
};

// Add this utility to the window for emergency fix access
if (typeof window !== 'undefined') {
  window.__fixAllModals = applyModalFixes;
}

/**
 * Apply comprehensive modal interaction fixes across the entire application
 * This is useful as a last resort to fix interaction issues with modals
 */
export const applyModalInteractionFixes = () => {
  console.log('Applying comprehensive modal interaction fixes');

  // Fix the portal root
  const portalRoot = ensurePortalRoot();

  // Make sure all modals are properly set up
  const modalContainers = document.querySelectorAll('.ant-modal, .modal, .MuiDialog-paper');
  modalContainers.forEach((container) => {
    container.style.pointerEvents = 'auto';
    container.style.zIndex = '1050';
    container.style.position = 'relative';

    // Fix modal content
    const content = container.querySelector(
      '.ant-modal-content, .modal-content, .MuiDialogContent-root'
    );
    if (content) {
      content.style.pointerEvents = 'auto';
      content.style.zIndex = '1051';
      content.style.position = 'relative';
    }

    // Fix modal body
    const body = container.querySelector('.ant-modal-body, .modal-body, .MuiDialogContent-root');
    if (body) {
      body.style.pointerEvents = 'auto';
      body.style.zIndex = '1052';
      body.style.position = 'relative';
    }
  });

  // Fix all form elements
  const formElements = document.querySelectorAll(
    'input, textarea, select, button, [role="button"], .btn, .button'
  );
  formElements.forEach((el) => {
    el.style.pointerEvents = 'auto';
    el.style.position = 'relative';
    el.style.zIndex = '10';

    if (
      el.tagName.toLowerCase() === 'button' ||
      el.getAttribute('role') === 'button' ||
      el.classList.contains('btn') ||
      el.classList.contains('button') ||
      el.type === 'submit' ||
      el.type === 'button'
    ) {
      el.style.cursor = 'pointer';
      el.style.zIndex = '100';
    }
  });

  // Fix auth buttons specifically
  const authButtons = document.querySelectorAll(
    '.logout-button, .login-button, .signup-button, [data-action="logout"]'
  );
  authButtons.forEach((button) => {
    button.style.pointerEvents = 'auto';
    button.style.zIndex = '1000';
    button.style.cursor = 'pointer';

    // Add a click handler to ensure the button works
    button.addEventListener(
      'click',
      (e) => {
        e.stopPropagation();
        console.log('Auth button clicked:', button.textContent);
      },
      true
    );
  });

  // Return the number of elements fixed
  return {
    modals: modalContainers.length,
    formElements: formElements.length,
    authButtons: authButtons.length,
  };
};
